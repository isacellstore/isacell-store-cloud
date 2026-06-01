import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { usePosStore } from '@/stores/posStore';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingCart, Search, Trash2, PauseCircle,
  FileText, DollarSign, UserCheck, X, Plus as PlusIcon
} from 'lucide-react';

export default function POS() {
  const { user, company } = useAuthStore();
  const { showAlert } = useAppStore();
  const cart = usePosStore(s => s.cart);
  const client = usePosStore(s => s.client);
  const manualClientName = usePosStore(s => s.manualClientName);
  const paymentType = usePosStore(s => s.paymentType);
  const amountPaid = usePosStore(s => s.amountPaid);
  const pendingSales = usePosStore(s => s.pendingSales);
  const showReceipt = usePosStore(s => s.showReceipt);
  const receiptData = usePosStore(s => s.receiptData);
  const addToCart = usePosStore(s => s.addToCart);
  const removeFromCart = usePosStore(s => s.removeFromCart);
  const setClient = usePosStore(s => s.setClient);
  const setManualClientName = usePosStore(s => s.setManualClientName);
  const setPaymentType = usePosStore(s => s.setPaymentType);
  const setAmountPaid = usePosStore(s => s.setAmountPaid);
  const processSale = usePosStore(s => s.processSale);
  const holdSale = usePosStore(s => s.holdSale);
  const setShowReceipt = usePosStore(s => s.setShowReceipt);
  const restoreHold = usePosStore(s => s.restoreHold);
  const removeHold = usePosStore(s => s.removeHold);
  const getCartTotal = usePosStore(s => s.getCartTotal);

  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [editPrice, setEditPrice] = useState('');
  const [selectedImei, setSelectedImei] = useState('');
  const [note, setNote] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [seqSale, setSeqSale] = useState(0);

  const cartTotal = getCartTotal();

  useEffect(() => { if (company?.id) { loadData(); if (company.seq_sale !== undefined) setSeqSale(company.seq_sale); } }, [company?.id]);

  const loadData = async () => {
    if (!company?.id) return;
    const { data: prods } = await supabase.from('products').select('*').eq('company_id', company.id);
    if (prods) setProducts(prods);
    const { data: clis } = await supabase.from('clients').select('*').eq('company_id', company.id);
    if (clis) setClients(clis);
  };

  const handleAddToCart = (product: any) => {
    if ((product.stock || 0) <= 0) { showAlert('Producto sin stock', 'error'); return; }
    setSelectedProduct(product);
    setEditPrice(String(product.price));
    setSelectedImei(product.imeis?.[0] || '');
    setNote('');
  };

  const confirmAdd = () => {
    if (!selectedProduct) return;
    const price = parseFloat(editPrice);
    if (isNaN(price) || price <= 0) { showAlert('Precio invalido', 'error'); return; }
    const maxDiscount = company?.max_discount_percent || 10;
    const minPrice = selectedProduct.price * (1 - maxDiscount / 100);
    if (user?.role !== 'admin' && price < minPrice) { showAlert(`Max descuento ${maxDiscount}%`, 'error'); return; }
    if (selectedProduct.category === 'Telefono' && !selectedImei) { showAlert('Seleccione un IMEI', 'error'); return; }
    const result = addToCart(selectedProduct, price, selectedImei, note);
    if (!result) { showAlert('Este IMEI ya esta en el carrito', 'error'); return; }
    setSelectedProduct(null);
  };

  const handleCheckout = async () => {
    if (!cart.length) { showAlert('Carrito vacio', 'error'); return; }
    if (!company?.id || !user?.name) return;
    const result = await processSale(company.id, user.name, seqSale, setSeqSale);
    if (result.success) { showAlert('Venta procesada!', 'success'); loadData(); }
    else { showAlert(result.error || 'Error', 'error'); }
  };

  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm));
  const filteredClients = clients.filter(c => c.name?.toLowerCase().includes(clientSearch.toLowerCase()));

  return (
    <div className="h-[calc(100vh-48px)] flex flex-col">
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-7/12 flex flex-col bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white border focus:border-red-500 rounded-lg outline-none transition-all"
                placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="bg-gray-50 p-2 flex font-bold text-xs text-gray-500 uppercase border-b">
            <div className="flex-1 pl-2">Producto</div><div className="w-16 text-center">Stock</div><div className="w-24 text-right pr-4">Precio</div><div className="w-10"></div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredProducts.map(p => (
              <div key={p.id} className="flex items-center p-3 border-b hover:bg-blue-50 transition-colors cursor-pointer group" onClick={() => handleAddToCart(p)}>
                <div className="flex-1"><div className="font-bold text-gray-800">{p.name}</div><div className="text-xs text-gray-400">{p.category}</div></div>
                <div className="w-16 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${(p.stock || 0) < 2 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{p.stock || 0}</span></div>
                <div className="w-24 text-right font-bold text-red-600 text-sm">{formatCurrency(p.price)}</div>
                <div className="w-10 flex justify-center text-gray-300 group-hover:text-blue-500"><PlusIcon size={18} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-5/12 flex flex-col bg-white rounded-xl shadow border border-gray-200 h-full">
          <div className="p-3 bg-red-600 text-white rounded-t-xl flex justify-between items-center">
            <span className="font-bold flex items-center gap-2"><ShoppingCart size={18} /> Venta Actual</span>
            <div className="flex gap-2 items-center">
              <button onClick={() => setShowHoldModal(true)} className="bg-red-800 hover:bg-red-900 text-xs px-2 py-1 rounded flex items-center gap-1 border border-red-700">
                <PauseCircle size={14} /> Espera ({pendingSales.length})
              </button>
              <span className="text-xs bg-red-700 px-2 py-1 rounded">{cart.length} items</span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 border-b space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input value={manualClientName} onChange={e => { setManualClientName(e.target.value); if (client) setClient(null); }}
                  placeholder={client?.name || "Cliente Casual"} className="w-full pl-8 pr-2 py-1.5 text-sm border rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none" />
                <UserCheck className="absolute left-2 top-2 text-gray-400" size={14} />
              </div>
              <button onClick={() => setShowClientModal(true)} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Search size={16} /></button>
            </div>
            {client?.id && (
              <div className="flex bg-white rounded border p-1">
                <button onClick={() => setPaymentType('contado')} className={`flex-1 text-xs font-bold py-1 rounded ${paymentType === 'contado' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}>CONTADO</button>
                <button onClick={() => setPaymentType('credito')} className={`flex-1 text-xs font-bold py-1 rounded ${paymentType === 'credito' ? 'bg-orange-100 text-orange-700' : 'text-gray-500'}`}>CREDITO</button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {cart.map((item, idx) => (
              <div key={idx} className="flex p-2 hover:bg-gray-50 rounded border-b border-gray-100 text-sm items-center">
                <div className="flex-1 pr-2">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-gray-500 text-xs flex gap-2"><span>{item.qty} x {formatCurrency(item.finalPrice)}</span>{item.imeiSold && <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">{item.imeiSold}</span>}</div>
                  {item.note && <div className="text-[10px] text-blue-500 italic">{item.note}</div>}
                </div>
                <div className="font-bold text-gray-700 w-20 text-right">{formatCurrency(item.finalPrice * item.qty)}</div>
                <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600 p-1 ml-2"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 rounded-b-xl border-t">
            <div className="flex justify-between text-3xl font-bold text-gray-800 mb-4 tracking-tight"><span>Total:</span><span>{formatCurrency(cartTotal)}</span></div>
            <div className="mb-4 relative">
              <DollarSign className="absolute left-3 top-3 text-green-600" size={18} />
              <input type="number" placeholder={paymentType === 'contado' ? "Monto Recibido" : "Abono Inicial"}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-lg font-bold outline-none focus:border-green-500"
                value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
              {paymentType === 'contado' && (parseFloat(amountPaid) - cartTotal) > 0 && (
                <div className="text-right text-green-600 font-bold mt-1 text-sm">Devuelta: {formatCurrency(parseFloat(amountPaid) - cartTotal)}</div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button onClick={holdSale} className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded font-bold text-xs flex items-center justify-center gap-1"><PauseCircle size={14} /> PONER EN ESPERA</button>
              <button onClick={() => showAlert('Cotizacion generada', 'info')} className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-bold text-xs flex items-center justify-center gap-1"><FileText size={14} /> COTIZAR</button>
            </div>
            <button onClick={handleCheckout} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold text-lg shadow-lg active:scale-95 transition-transform">COBRAR E IMPRIMIR</button>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg mb-4">{selectedProduct.name}</h3>
            <div className="space-y-3">
              <div><label className="text-xs font-bold text-gray-500">Precio Venta</label>
                <input type="number" className="w-full border p-2 rounded font-bold text-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={editPrice} onChange={e => setEditPrice(e.target.value)} /></div>
              {selectedProduct.category === 'Telefono' && (
                <div><label className="text-xs font-bold text-blue-600">Seleccionar IMEI *</label>
                  <select className="w-full border p-2 rounded text-sm bg-blue-50" value={selectedImei} onChange={e => setSelectedImei(e.target.value)}>
                    <option value="">-- Seleccione IMEI --</option>
                    {selectedProduct.imeis?.map((imei: string, i: number) => <option key={i} value={imei}>{imei}</option>)}
                  </select></div>
              )}
              <div><label className="text-xs font-bold text-gray-500">Nota (Opcional)</label>
                <input className="w-full border p-2 rounded text-sm" value={note} onChange={e => setNote(e.target.value)} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setSelectedProduct(null)} className="flex-1 bg-gray-100 py-3 rounded font-bold text-gray-600">Cancelar</button>
              <button onClick={confirmAdd} className="flex-1 bg-red-600 py-3 rounded font-bold text-white">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {showClientModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] flex flex-col">
            <h3 className="font-bold mb-4">Seleccionar Cliente</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input className="w-full border pl-9 p-2 rounded bg-gray-50" placeholder="Buscar cliente..."
                value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
            </div>
            <div className="overflow-y-auto flex-1 space-y-2 mb-4">
              {filteredClients.map(c => (
                <div key={c.id} onClick={() => { setClient(c); setManualClientName(''); setShowClientModal(false); }}
                  className="p-3 border rounded hover:bg-blue-50 cursor-pointer flex justify-between">
                  <div><p className="font-bold">{c.name}</p><p className="text-xs text-gray-500">{c.doc_id}</p></div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowClientModal(false)} className="w-full bg-gray-200 py-2 rounded font-bold">Cerrar</button>
          </div>
        </div>
      )}

      {showHoldModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] flex flex-col">
            <h3 className="font-bold mb-4 text-orange-600">Ventas en Espera</h3>
            {pendingSales.length === 0 ? <p className="text-gray-400 text-center py-8">No hay ventas en espera</p> : (
              <div className="overflow-y-auto flex-1 space-y-2 mb-4">
                {pendingSales.map((h: any) => (
                  <div key={h.id} className="p-3 border rounded hover:bg-orange-50 cursor-pointer flex justify-between items-center">
                    <div onClick={() => { restoreHold(h); setShowHoldModal(false); }} className="flex-1"><p className="font-bold">{h.clientName}</p><p className="text-xs text-gray-500">{h.items?.length} items</p></div>
                    <div className="flex items-center gap-4"><span className="font-bold">{formatCurrency(h.total)}</span>
                      <button onClick={() => removeHold(h.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowHoldModal(false)} className="w-full bg-gray-200 py-2 rounded font-bold">Cerrar</button>
          </div>
        </div>
      )}

      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4">
          <div className="bg-white w-[380px] max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button onClick={() => setShowReceipt(false)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={24} /></button>
            <div className="text-center mb-4">
              <h2 className="text-xl font-black uppercase">{company?.name || 'ISACELL STORE'}</h2>
              <p className="text-xs text-gray-500">{company?.phone}</p>
              <p className="text-xs font-bold border border-black inline-block px-3 py-1 mt-2 uppercase">FACTURA</p>
            </div>
            <div className="text-xs mb-4 space-y-1 border-b border-dashed pb-3">
              <div className="flex justify-between"><span>No: {receiptData.display_id}</span></div>
              <div className="flex justify-between"><span>Fecha: {receiptData.date}</span></div>
              <div>Cliente: {receiptData.client_name || 'CONTADO'}</div>
              <div>Vendedor: {receiptData.seller}</div>
            </div>
            <div className="space-y-2 mb-4">
              {(receiptData.items || []).map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm"><span>{item.qty} x {item.name}</span><span className="font-bold">{formatCurrency(item.finalPrice * item.qty)}</span></div>
              ))}
            </div>
            <div className="border-t border-dashed pt-3 space-y-1">
              <div className="flex justify-between font-black text-lg"><span>TOTAL:</span><span>{formatCurrency(receiptData.total)}</span></div>
              {receiptData.payment_amount > 0 && <div className="flex justify-between text-sm"><span>Recibido:</span><span>{formatCurrency(receiptData.payment_amount)}</span></div>}
              {(receiptData.change || 0) > 0 && <div className="flex justify-between text-sm font-bold text-green-600"><span>Cambio:</span><span>{formatCurrency(receiptData.change)}</span></div>}
            </div>
            <div className="mt-6 pt-3 border-t text-center text-[10px] text-gray-500">
              <p>{company?.sale_footer_message}</p><p className="mt-2 font-bold">GRACIAS POR SU COMPRA</p>
            </div>
            <button onClick={() => window.print()} className="w-full mt-4 bg-blue-600 text-white py-2 rounded font-bold print:hidden hover:bg-blue-700">Imprimir</button>
          </div>
        </div>
      )}
    </div>
  );
}
