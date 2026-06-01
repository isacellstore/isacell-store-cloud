import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Company } from '@/types';

interface AppState {
  currentModule: string;
  sidebarOpen: boolean;
  settings: Company | null;
  alert: { message: string; type: 'success' | 'error' | 'info' } | null;
  confirmDialog: { message: string; onConfirm: () => void } | null;
  setCurrentModule: (module: string) => void;
  toggleSidebar: () => void;
  loadSettings: (companyId: string) => Promise<void>;
  updateSettings: (companyId: string, updates: any) => Promise<{ success: boolean; error?: string }>;
  showAlert: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideAlert: () => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
  hideConfirm: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentModule: 'dashboard',
  sidebarOpen: true,
  settings: null,
  alert: null,
  confirmDialog: null,

  setCurrentModule: (module) => set({ currentModule: module }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  loadSettings: async (companyId: string) => {
    const { data } = await supabase.from('companies').select('*').eq('id', companyId).single();
    if (data) set({ settings: data as unknown as Company });
  },

  updateSettings: async (companyId: string, updates: any) => {
    const { error } = await supabase.from('companies').update(updates).eq('id', companyId);
    if (error) return { success: false, error: error.message };
    set((s) => ({ settings: s.settings ? { ...s.settings, ...updates } : null }));
    return { success: true };
  },

  showAlert: (message, type = 'info') => {
    set({ alert: { message, type } });
    setTimeout(() => set({ alert: null }), 4000);
  },
  hideAlert: () => set({ alert: null }),
  showConfirm: (message, onConfirm) => set({ confirmDialog: { message, onConfirm } }),
  hideConfirm: () => set({ confirmDialog: null }),
}));
