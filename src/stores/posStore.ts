import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { CartItem, Product, Client } from '@/types';
import { generateSaleNumber, getCurrentDate, getCurrentTime } from '@/lib/utils';

interface POSState {
  cart: CartItem[];
  client: Client | null;
  manualClientName: string;
  paymentType: 'contado' | 'credito';
  amountPaid: string;
  pendingSales: any[];
  receiptData: any | null;
  showReceipt: boolean;
  addToCart: (product: Product, finalPrice: number, imeiSold: string, note: string) => boolean;
  removeFromCart: (index: number) => void;
  setClient: (client: Client | null) => void;
  setManualClientName: (name: string) => void;
  setPaymentType: (type: 'contado' | 'credito') => void;
  setAmountPaid: (amount: string) => void;
  getCartTotal: () => number;
  processSale: (companyId: string, seller: string, settingsSeq: number, updateSeq: (n: number) => void) => Promise<{ success: boolean; error?: string }>;
  holdSale: () => void;
  setShowReceipt: (show: boolean) => void;
  restoreHold: (hold: any) => void;
  removeHold: (id: string) => void;
}

export const usePosStore = create<POSState>((set, get) => ({
  cart: [],
  client: null,
  manualClientName: '',
  paymentType: 'contado',
  amountPaid: '',
  pendingSales: [],
  receiptData: null,
  showReceipt: false,

  addToCart: (product, finalPrice, imeiSold, note) => {
    const { cart } = get();
    if (product.category === 'Telefono' && imeiSold) {
      if (cart.some(item => item.imeiSold === imeiSold)) return false;
      if (product.stock <= 0) return false;
    }
    const existingIdx = cart.findIndex(
      item => item.id === product.id && item.finalPrice === finalPrice && product.category !== 'Telefono'
    );
    if (existingIdx >= 0 && product.category !== 'Telefono') {
      const newCart = [...cart];
      newCart[existingIdx].qty += 1;
      set({ cart: newCart });
    } else {
      set({ cart: [...cart, { ...product, qty: 1, finalPrice, imeiSold, note }] });
    }
    return true;
  },

  removeFromCart: (index) => set({ cart: get().cart.filter((_, i) => i !== index) }),
  setClient: (client) => set({ client }),
  setManualClientName: (name) => set({ manualClientName: name }),
  setPaymentType: (type) => set({ paymentType: type }),
  setAmountPaid: (amount) => set({ amountPaid: amount }),
  getCartTotal: () => get().cart.reduce((sum, item) => sum + item.finalPrice * item.qty, 0),
  setShowReceipt: (show) => set({ showReceipt: show }),
  restoreHold: (hold) => set({ cart: hold.items, client: hold.clientObj, pendingSales: get().pendingSales.filter((p: any) => p.id !== hold.id) }),
  removeHold: (id) => set({ pendingSales: get().pendingSales.filter((p: any) => p.id !== id) }),

  holdSale: () => {
    const { cart, client, manualClientName } = get();
    if (!cart.length) return;
    const hold = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleString('es-DO'),
      items: cart,
      clientName: manualClientName || client?.name || 'Cliente Casual',
      clientObj: client,
      total: get().getCartTotal(),
    };
    set({ pendingSales: [...get().pendingSales, hold], cart: [], client: null, manualClientName: '' });
  },

  processSale: async (companyId, seller, settingsSeq, updateSeq) => {
    const { cart, client, manualClientName, paymentType, amountPaid } = get();
    if (!cart.length) return { success: false, error: 'Carrito vacio' };
    
    const cartTotal = get().getCartTotal();
    let paid = parseFloat(amountPaid);
    if (isNaN(paid) || paid <= 0) paid = paymentType === 'contado' ? cartTotal : 0;
    if (paymentType === 'contado' && paid < cartTotal) return { success: false, error: `Monto insuficiente` };

    const nextSeq = settingsSeq + 1;
    const displayId = generateSaleNumber(nextSeq);
    const finalClientName = manualClientName || client?.name || 'Cliente Casual';

    const sale: any = {
      company_id: companyId,
      display_id: displayId,
      date: getCurrentDate(),
      time: getCurrentTime(),
      items: cart.map(item => ({
        id: item.id, name: item.name, qty: item.qty, finalPrice: item.finalPrice,
        imeiSold: item.imeiSold, note: item.note, category: item.category, cost: item.cost,
      })),
      total: cartTotal,
      payment_amount: paid,
      change: Math.max(0, paid - cartTotal),
      type: paymentType,
      client_id: client?.id || 'generic',
      client_name: finalClientName,
      seller,
      is_quote: false,
    };

    try {
      const { data: saleData, error: saleError } = await supabase.from('sales').insert(sale).select().single();
      if (saleError) throw saleError;

      for (const item of cart) {
        if (item.category === 'Telefono' && item.imeiSold) {
          const { data: prod } = await supabase.from('products').select('imeis, stock').eq('id', item.id).single();
          if (prod) {
            const newImeis = (prod.imeis || []).filter((i: string) => i !== item.imeiSold);
            await supabase.from('products').update({ imeis: newImeis, stock: Math.max(0, (prod.stock || 0) - item.qty) }).eq('id', item.id);
          }
        } else {
          await supabase.rpc('decrement_stock', { product_id: item.id, amount: item.qty });
        }
      }

      if (paymentType === 'credito' && client && client.id !== 'generic') {
        const pendingAmount = cartTotal - paid;
        if (pendingAmount > 0) {
          const newTransaction = { id: crypto.randomUUID(), date: getCurrentDate(), type: 'FACTURA', amount: pendingAmount, ref: displayId, notes: '' };
          const transactions = [...(client.transactions || []), newTransaction];
          await supabase.from('clients').update({ balance: (client.balance || 0) + pendingAmount, transactions }).eq('id', client.id);
        }
      }

      updateSeq(nextSeq);
      set({ receiptData: { ...sale, id: saleData?.id }, showReceipt: true, cart: [], client: null, manualClientName: '', amountPaid: '', paymentType: 'contado' });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
}));
