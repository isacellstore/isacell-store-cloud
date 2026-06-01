import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';

interface InventoryState {
  products: Product[];
  loadProducts: (companyId: string) => Promise<void>;
  addProduct: (product: any) => Promise<{ success: boolean; error?: string }>;
  updateProduct: (id: string, updates: any) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],

  loadProducts: async (companyId: string) => {
    const { data } = await supabase.from('products').select('*').eq('company_id', companyId).order('name');
    if (data) set({ products: data as unknown as Product[] });
  },

  addProduct: async (product: any) => {
    const { data, error } = await supabase.from('products').insert(product).select().single();
    if (error) return { success: false, error: error.message };
    set({ products: [...get().products, data as unknown as Product] });
    return { success: true };
  },

  updateProduct: async (id: string, updates: any) => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) return { success: false, error: error.message };
    set({ products: get().products.map(p => p.id === id ? { ...p, ...updates } : p) });
    return { success: true };
  },

  deleteProduct: async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    set({ products: get().products.filter(p => p.id !== id) });
    return { success: true };
  },
}));
