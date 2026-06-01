import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { CashOperation } from '@/types';

interface CashState {
  expenses: any[];
  loadExpenses: (companyId: string, date?: string) => Promise<void>;
  addExpense: (expense: any) => Promise<{ success: boolean; error?: string }>;
  deleteExpense: (id: string) => Promise<{ success: boolean; error?: string }>;
  getDailyOperations: (companyId: string, date: string, sales: any[], repairs: any[], clients: any[], suppliers: any[]) => Promise<CashOperation[]>;
}

export const useCashStore = create<CashState>((set, get) => ({
  expenses: [],

  loadExpenses: async (companyId: string, date?: string) => {
    let query = supabase.from('expenses').select('*').eq('company_id', companyId);
    if (date) query = query.eq('date', date);
    const { data } = await query.order('date', { ascending: false });
    if (data) set({ expenses: data });
  },

  addExpense: async (expense: any) => {
    const { data, error } = await supabase.from('expenses').insert(expense).select().single();
    if (error) return { success: false, error: error.message };
    set({ expenses: [data, ...get().expenses] });
    return { success: true };
  },

  deleteExpense: async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    set({ expenses: get().expenses.filter((e: any) => e.id !== id) });
    return { success: true };
  },

  getDailyOperations: async (companyId, date, sales, repairs, clients, suppliers) => {
    const ops: CashOperation[] = [];

    sales.forEach((s: any) => {
      if (s.date === date && (s.type === 'contado' || s.payment_amount > 0)) {
        ops.push({
          id: s.id, type: 'VENTA', desc: `Venta ${s.display_id} - ${s.client_name}`,
          amount: s.type === 'contado' ? s.total : s.payment_amount,
          isIncome: true, raw: s, date: s.date,
        });
      }
    });

    repairs.forEach((r: any) => {
      if (r.date_in === date && r.deposit > 0) {
        ops.push({ id: r.id + '-abono', type: 'TALLER', desc: `Taller ${r.display_id} - Abono (${r.client_name})`, amount: r.deposit, isIncome: true, raw: r, date: r.date_in });
      }
      if (r.date_out === date && r.status === 'Entregado') {
        const amount = r.amount_paid_on_delivery || ((r.final_cost || 0) - (r.deposit || 0));
        if (amount > 0) {
          ops.push({ id: r.id + '-saldo', type: 'TALLER', desc: `Taller ${r.display_id} - Saldo (${r.client_name})`, amount, isIncome: true, raw: r, date: r.date_out });
        }
      }
    });

    clients.forEach((c: any) => {
      (c.transactions || []).forEach((t: any) => {
        if (t.date === date && t.type === 'ABONO') {
          ops.push({ id: t.id, type: 'COBRO', desc: `Abono Cliente ${c.name}`, amount: t.amount, isIncome: true, raw: t, date: t.date });
        }
      });
    });

    suppliers.forEach((s: any) => {
      (s.transactions || []).forEach((t: any) => {
        if (t.date === date && t.type === 'PAGO') {
          ops.push({ id: t.id, type: 'PAGO', desc: `Pago Suplidor ${s.name}`, amount: t.amount, isIncome: false, raw: t, date: t.date });
        }
      });
    });

    const { data: expenseData } = await supabase.from('expenses').select('*').eq('company_id', companyId).eq('date', date);
    (expenseData || []).forEach((e: any) => {
      ops.push({ id: e.id, type: 'GASTO', desc: e.description, amount: e.amount, isIncome: false, raw: e, date: e.date });
    });

    return ops.sort((a, b) => a.type.localeCompare(b.type));
  },
}));
