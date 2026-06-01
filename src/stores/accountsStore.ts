import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Client, Supplier } from '@/types';

interface AccountsState {
  clients: Client[];
  suppliers: Supplier[];
  loadClients: (companyId: string) => Promise<void>;
  loadSuppliers: (companyId: string) => Promise<void>;
  addClient: (client: any) => Promise<{ success: boolean; error?: string }>;
  addSupplier: (supplier: any) => Promise<{ success: boolean; error?: string }>;
  deleteClient: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteSupplier: (id: string) => Promise<{ success: boolean; error?: string }>;
  addPayment: (clientId: string, amount: number, ref: string) => Promise<{ success: boolean; error?: string }>;
  addSupplierPayment: (supplierId: string, amount: number, ref: string) => Promise<{ success: boolean; error?: string }>;
  getTotalReceivable: () => number;
  getTotalPayable: () => number;
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  clients: [],
  suppliers: [],

  loadClients: async (companyId: string) => {
    const { data } = await supabase.from('clients').select('*').eq('company_id', companyId).order('name');
    if (data) set({ clients: data as unknown as Client[] });
  },

  loadSuppliers: async (companyId: string) => {
    const { data } = await supabase.from('suppliers').select('*').eq('company_id', companyId).order('name');
    if (data) set({ suppliers: data as unknown as Supplier[] });
  },

  addClient: async (client: any) => {
    const { data, error } = await supabase.from('clients').insert(client).select().single();
    if (error) return { success: false, error: error.message };
    set({ clients: [...get().clients, data as unknown as Client] });
    return { success: true };
  },

  addSupplier: async (supplier: any) => {
    const { data, error } = await supabase.from('suppliers').insert(supplier).select().single();
    if (error) return { success: false, error: error.message };
    set({ suppliers: [...get().suppliers, data as unknown as Supplier] });
    return { success: true };
  },

  deleteClient: async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    set({ clients: get().clients.filter(c => c.id !== id) });
    return { success: true };
  },

  deleteSupplier: async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    set({ suppliers: get().suppliers.filter(s => s.id !== id) });
    return { success: true };
  },

  addPayment: async (clientId: string, amount: number, ref: string) => {
    const client = get().clients.find(c => c.id === clientId);
    if (!client) return { success: false, error: 'Cliente no encontrado' };
    const newTransaction = { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], type: 'ABONO' as const, amount, ref, notes: '' };
    const transactions = [...(client.transactions || []), newTransaction];
    const balance = Math.max(0, (client.balance || 0) - amount);
    const { error } = await supabase.from('clients').update({ transactions, balance }).eq('id', clientId);
    if (error) return { success: false, error: error.message };
    set({ clients: get().clients.map(c => c.id === clientId ? { ...c, transactions, balance } : c) });
    return { success: true };
  },

  addSupplierPayment: async (supplierId: string, amount: number, ref: string) => {
    const supplier = get().suppliers.find(s => s.id === supplierId);
    if (!supplier) return { success: false, error: 'Suplidor no encontrado' };
    const newTransaction = { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], type: 'PAGO' as const, amount, ref, notes: '' };
    const transactions = [...(supplier.transactions || []), newTransaction];
    const balance = Math.max(0, (supplier.balance || 0) - amount);
    const { error } = await supabase.from('suppliers').update({ transactions, balance }).eq('id', supplierId);
    if (error) return { success: false, error: error.message };
    set({ suppliers: get().suppliers.map(s => s.id === supplierId ? { ...s, transactions, balance } : s) });
    return { success: true };
  },

  getTotalReceivable: () => get().clients.reduce((s, c) => s + (c.balance || 0), 0),
  getTotalPayable: () => get().suppliers.reduce((s, s2) => s + (s2.balance || 0), 0),
}));
