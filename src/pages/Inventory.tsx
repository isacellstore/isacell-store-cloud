import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { formatCurrency, validators } from '@/lib/utils';
import { Package, Plus, Search, Trash2, Edit, Minus, ChevronLeft } from 'lucide-react';

export default function Inventory() {
  const { user, company } = useAuthStore();
  const { showAlert, showConfirm } = useAppStore();
  const { products, loadProducts, addProduct, updateProduct, deleteProduct } = useInventoryStore();
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<any>({ id: null, barcode: '', name: '', cost: '', price: '', category: 'Accesorio', stock: 1, imeis: [''], min_stock: 2 });
  const [adjustMode, setAdjustMode] = useState<any>(null);

  useEffect(() => { if (company?.id) loadProducts(company.id); }, [company?.id]);

  const totalCost = products.reduce((s, p) => s + ((p.cost || 0) * (p.stock || 0)), 0);
  const totalPrice = products.reduce((s, p) => s + ((p.price || 0) * (p.stock || 0)), 0);
  const filtered = products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm));

  const resetForm = () => setForm({ id: null, barcode: '', name: '', cost: '', price: '', category: 'Accesorio', stock: 1, imeis: [''], min_stock: 2 });

  const handleSave = async () => {
    if (!form.name || !form.price) { showAlert('Nombre y precio requeridos', 'error'); return; }
    if (form.category === 'Telefono') {
      const validImeis = form.imeis.filter((i: string) => i);
      if (validImeis.some((i: string) => !validators.isIMEI(i))) { showAlert('IMEIs deben tener 15 digitos', 'error'); return; }
    }
    const data = {
      company_id: company?.id || '', name: form.name, barcode: form.barcode || '', cost: parseFloat(form.cost) || 0,
      price: parseFloat(form.price) || 0, category: form.category, stock: parseInt(form.stock) || 0,
      imeis: form.category === 'Telefono' ? form.imeis.filter((i: string) => i) : [], min_stock: parseInt(form.min_stock) || 2,
    };
    if (form.id) { await updateProduct(form.id, data); showAlert('Producto actualizado', 'success'); }
    else { await addProduct(data); showAlert('Producto creado', 'success'); }
    setMode('list'); resetForm();
  };

  const handleDelete = (id: string) => {
    if (user?.role !== 'admin') { showAlert('Solo admin puede eliminar', 'error'); return; }
    showConfirm('Eliminar producto permanentemente?', async () => { await deleteProduct(id); showAlert('Producto eliminado', 'success'); });
  };

  const handleQuickStock = async () => {
    if (!adjustMode) return;
    const { product, type, qty, imeis, selectedImeis } = adjustMode;
    const quantity = parseInt(qty);
    if (!quantity || quantity <= 0) return;
    let newStock = product.stock || 0;
    let newImeis = [...(product.imeis || [])];
    if (type === 'add') {
      newStock += quantity;
      if (product.category === 'Telefono' && imeis) {
        const valid = imeis.filter((i: string) => i);
        if (valid.some((i: string) => !validators.isIMEI(i))) { showAlert('IMEI invalido', 'error'); return; }
        newImeis = [...newImeis, ...valid];
      }
    } else {
      newStock -= quantity;
      if (newStock < 0) { showAlert('Stock insuficiente', 'error'); return; }
      if (product.category === 'Telefono') {
        if (!selectedImeis?.length) { showAlert('Seleccione IMEIs a retirar', 'error'); return; }
        newImeis = newImeis.filter((i: string) => !selectedImeis.includes(i));
      }
    }
    await updateProduct(product.id, { stock: newStock, imeis: newImeis });
    setAdjustMode(null); showAlert('Stock actualizado', 'success');
  };

  const setEdit = (p: any) => { setForm({ id: p.id, barcode: p.barcode || '', name: p.name, cost: p.cost || '', price: p.price || '', category: p.category, stock: p.stock || 0, imeis: p.imeis?.length ? p.imeis : [''], min_stock: p.min_stock || 2 }); setMode('edit'); };

  return (
    <div className="space-y-4">
      {mode === 'list' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between">
              <div><p className="text-xs font-bold text-gray-500 uppercase">Total Productos</p><p className="text-xl font-bold">{products.length}</p></div>
              <Package className="text-blue-500 opacity-50" size={28} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between">
              <div><p className="text-xs font-bold text-gray-500 uppercase">Valor Costo</p><p className="text-lg font-bold">{formatCurrency(totalCost)}</p></div>
              <Package className="text-orange-500 opacity-50" size={28} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between">
              <div><p className="text-xs font-bold text-gray-500 uppercase">Valor Venta</p><p className="text-lg font-bold text-green-600">{formatCurrency(totalPrice)}</p></div>
              <Package className="text-green-500 opacity-50" size={28} />
            </div>
          </div>

          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Package className="text-red-600" /> Inventario</h2>
            {user?.role === 'admin' && (
              <button onClick={() => { resetForm(); setMode('add'); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm"><Plus size={18} /> Nuevo Producto</button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="Buscar por nombre o codigo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr><th className="p-4">Codigo</th><th className="p-4">Producto</th><th className="p-4 text-center">Stock</th><th className="p-4 text-right">Costo</th><th className="p-4 text-right">Precio</th><th className="p-4 text-center">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-red-50 transition-colors">
                      <td className="p-4 font-mono text-gray-500">{p.barcode || '-'}</td>
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{p.name}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.category === 'Telefono' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{p.category}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setAdjustMode({ product: p, type: 'remove', qty: 1, imeis: [], selectedImeis: [] })} className="text-gray-400 hover:text-red-500"><Minus size={14} /></button>
                          <span className={`font-bold w-8 text-center ${(p.stock || 0) <= (p.min_stock || 2) ? 'text-red-600' : ''}`}>{p.stock || 0}</span>
                          <button onClick={() => setAdjustMode({ product: p, type: 'add', qty: 1, imeis: p.category === 'Telefono' ? [''] : [] })} className="text-gray-400 hover:text-green-500"><Plus size={14} /></button>
                        </div>
                      </td>
                      <td className="p-4 text-right text-gray-500">{user?.role === 'admin' ? formatCurrency(p.cost) : '***'}</td>
                      <td className="p-4 text-right font-bold text-red-600">{formatCurrency(p.price)}</td>
                      <td className="p-4 text-center">
                        {user?.role === 'admin' && (
                          <div className="flex justify-center gap-2">
                            <button onClick={() => setEdit(p)} className="text-blue-600 bg-blue-50 p-2 rounded hover:bg-blue-100"><Edit size={14} /></button>
                            <button onClick={() => handleDelete(p.id)} className="text-red-500 bg-red-50 p-2 rounded hover:bg-red-100"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {(mode === 'add' || mode === 'edit') && (
        <div className="bg-white p-6 rounded-xl shadow max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => { setMode('list'); resetForm(); }} className="text-gray-500 hover:text-gray-700"><ChevronLeft size={24} /></button>
            <h3 className="text-xl font-bold">{mode === 'edit' ? 'Editar' : 'Nuevo'} Producto</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Codigo Barra</label><input className="w-full border rounded-lg p-2.5 outline-none" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select className="w-full border rounded-lg p-2.5 bg-white" value={form.category} onChange={e => setForm({ ...form, category: e.target.value, imeis: [''] })}>
                <option value="Accesorio">Accesorio / Pieza</option>
                <option value="Telefono">Telefono / Equipo (IMEI)</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Costo</label><input type="number" className="w-full border rounded-lg p-2.5" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} /></div>
            <div><label className="block text-sm font-bold text-green-700 mb-1">Precio Venta *</label><input type="number" className="w-full border border-green-200 rounded-lg p-2.5 font-bold text-green-800" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Stock</label><input type="number" min="0" className="w-full border rounded-lg p-2.5" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Stock Minimo</label><input type="number" className="w-full border rounded-lg p-2.5" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })} /></div>
            {form.category === 'Telefono' && (
              <div className="col-span-2">
                <label className="block text-sm font-bold text-blue-600 mb-2">IMEIs ({form.stock || 0}):</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Array.from({ length: Math.max(parseInt(form.stock) || 0, form.imeis.length) }).map((_, idx) => (
                    idx < (parseInt(form.stock) || 0) && (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-6">#{idx + 1}</span>
                        <input className="flex-1 border border-blue-200 rounded p-2 text-sm" placeholder="15 Digitos" maxLength={15}
                          value={form.imeis[idx] || ''} onChange={e => { const newImeis = [...form.imeis]; newImeis[idx] = e.target.value.replace(/\D/g, ''); setForm({ ...form, imeis: newImeis }); }} />
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleSave} className="w-full bg-red-600 text-white mt-8 py-3 rounded-lg font-bold hover:bg-red-700 shadow-md">{mode === 'edit' ? 'Actualizar' : 'Guardar'} Producto</button>
        </div>
      )}

      {adjustMode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold mb-4">{adjustMode.type === 'add' ? 'Anadir' : 'Retirar'} Stock</h3>
            <p className="mb-2 text-sm text-gray-600 font-bold">{adjustMode.product.name}</p>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm font-bold">Cantidad:</label>
              <input type="number" className="border p-2 rounded w-24 font-bold text-center" value={adjustMode.qty} onChange={e => setAdjustMode({ ...adjustMode, qty: e.target.value })} />
            </div>
            {adjustMode.product.category === 'Telefono' && (
              <div className="mb-4 bg-gray-50 p-3 rounded border max-h-60 overflow-y-auto">
                {adjustMode.type === 'add' ? (
                  <>
                    <p className="text-xs font-bold text-blue-600 mb-2">Nuevos IMEIs:</p>
                    {Array.from({ length: parseInt(adjustMode.qty) || 0 }).map((_, i) => (
                      <input key={i} placeholder={`IMEI ${i + 1}`} className="w-full border p-1 rounded text-xs mb-1" maxLength={15}
                        onChange={e => { const imeis = [...(adjustMode.imeis || [])]; imeis[i] = e.target.value.replace(/\D/g, ''); setAdjustMode({ ...adjustMode, imeis }); }} />
                    ))}
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-red-600 mb-2">Seleccione IMEIs a retirar:</p>
                    {(adjustMode.product.imeis || []).map((imei: string, idx: number) => (
                      <label key={idx} className="flex items-center gap-2 p-1 hover:bg-gray-100 cursor-pointer">
                        <input type="checkbox" checked={adjustMode.selectedImeis?.includes(imei)}
                          onChange={e => { const curr = adjustMode.selectedImeis || []; const updated = e.target.checked ? [...curr, imei] : curr.filter((i: string) => i !== imei); setAdjustMode({ ...adjustMode, selectedImeis: updated }); }} />
                        <span className="text-sm font-mono">{imei}</span>
                      </label>
                    ))}
                  </>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setAdjustMode(null)} className="flex-1 bg-gray-200 py-2 rounded font-bold">Cancelar</button>
              <button onClick={handleQuickStock} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">Aplicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
