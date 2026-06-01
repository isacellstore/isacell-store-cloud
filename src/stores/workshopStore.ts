import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Repair } from '@/types';
import { generateRepairNumber } from '@/lib/utils';

interface WorkshopState {
  repairs: Repair[];
  loadRepairs: (companyId: string) => Promise<void>;
  addRepair: (repair: any, seq: number) => Promise<{ success: boolean; data?: Repair; error?: string }>;
  updateRepair: (id: string, updates: any) => Promise<{ success: boolean; error?: string }>;
  deleteRepair: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export const useWorkshopStore = create<WorkshopState>((set, get) => ({
  repairs: [],

  loadRepairs: async (companyId: string) => {
    const { data } = await supabase.from('repairs').select('*').eq('company_id', companyId).order('date_in', { ascending: false });
    if (data) set({ repairs: data as unknown as Repair[] });
  },

  addRepair: async (repair: any, seq: number) => {
    const displayId = generateRepairNumber(seq + 1);
    const { data, error } = await supabase.from('repairs').insert({ ...repair, display_id: displayId }).select().single();
    if (error) return { success: false, error: error.message };
    set({ repairs: [data as unknown as Repair, ...get().repairs] });
    return { success: true, data: data as unknown as Repair };
  },

  updateRepair: async (id: string, updates: any) => {
    const { error } = await supabase.from('repairs').update(updates).eq('id', id);
    if (error) return { success: false, error: error.message };
    set({ repairs: get().repairs.map(r => r.id === id ? { ...r, ...updates } : r) });
    return { success: true };
  },

  deleteRepair: async (id: string) => {
    const { error } = await supabase.from('repairs').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    set({ repairs: get().repairs.filter(r => r.id !== id) });
    return { success: true };
  },
}));
