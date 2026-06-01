import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useAccountsStore } from '@/stores/accountsStore';
import { formatCurrency } from '@/lib/utils';
import { Truck, Plus, Search, Trash2, DollarSign, ChevronLeft, History } from 'lucide-react';

export default function Suppliers() {
  const { user, company } = useAuthStore();
  const { showAlert, showConfirm } = useAppStore();
  const { suppliers, loadSuppliers, addSupplier, deleteSupplier, addSupplierPayment, getTotalPayable } = useAccountsStore();
  const [mode, setMode] = useState<'list' | 'add' | 'view'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ name: '', doc_id: '', phone: '', email: '', address: '' });
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  useEffect(() => { if (company?.id) loadSuppliers(company.id); }, [company?.id]);

  const filtered = suppliers.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.doc_id?.includes(searchTerm));

  const handleAdd = async () => {
    if (!form.name) { showAlert('Nombre requerido', 'error'); return; }
    const result = await addSupplier({ company_id: company?.id || '', name: form.name, doc_id: form.doc_id || '', phone: form.phone || '', email: form.email || '', address: form.address || '', balance: 0, transactions: [] });
    if (result.success) { showAlert('Suplidor agregado', 'success'); setMode('list'); setForm({ name: '', doc_id: '', phone: '', email: '', address: '' }); }
  };

  const handlePayment = async () => {
    if (!selectedSupplier || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (amount <= 0) { showAlert('Monto invalido', 'error'); return; }
    const result = await addSupplierPayment(selectedSupplier.id, amount, paymentRef || 'PAGO');
    if (result.success) { showAlert('Pago registrado', 'success'); setPaymentAmount(''); setPaymentRef(''); setSelectedSupplier({ ...selectedSupplier, balance: Math.max(0, selectedSupplier.balance - amount) }); }
  };

  const handleDelete = (id: string) => {
    if (user?.role !== 'admin') { showAlert('Solo admin', 'error'); return; }
    showConfirm('Eliminar suplidor?', async () => { await deleteSupplier(id); showAlert('Suplidor eliminado', 'success'); });
  };

  return (
    <div className="space-y-4">
      {mode === 'list' && (
        <>
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
            <div><h2 className="text-2xl font-bold flex items-center gap-2"><Truck className="text-red-600" /> Cuentas por Pagar</h2><p className="text-sm text-gray-500 mt-1">Total por pagar: <span className="font-bold text-red-600">{formatCurrency(getTotalPayable())}</span></p></div>
            <button onClick={() => setMode('add')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm"><Plus size={18} /> Nuevo Suplidor</button>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500" placeholder="Buscar suplidor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase"><tr><th className="p-4">Suplidor</th><th className="p-4">Telefono</th><th className="p-4 text-right">Balance</th><th className="p-4 text-center">Acciones</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedSupplier(s); setMode('view'); }}>
                    <td className="p-4"><div className="font-bold">{s.name}</div><div className="text-xs text-gray-500">{s.doc_id}</div></td>
                    <td className="p-4 text-gray-500">{s.phone}</td>
                    <td className="p-4 text-right font-bold text-red-600">{formatCurrency(s.balance || 0)}</td>
                    <td className="p-4 text-center"><button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="p-8 text-center text-gray-400">No hay suplidores</p>}
          </div>
        </>
      )}
      {mode === 'add' && (
        <div className="bg-white p-6 rounded-xl shadow max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-6"><button onClick={() => setMode('list')} className="text-gray-500 hover:text-gray-700"><ChevronLeft size={24} /></button><h3 className="text-xl font-bold">Nuevo Suplidor</h3></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Nombre *</label><input className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-red-500" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Documento</label><input className="w-full border rounded-lg p-2.5" value={form.doc_id} onChange={e => setForm({ ...form, doc_id: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Telefono</label><input className="w-full border rounded-lg p-2.5" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Email</label><input className="w-full border rounded-lg p-2.5" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Direccion</label><input className="w-full border rounded-lg p-2.5" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <button onClick={handleAdd} className="w-full bg-red-600 text-white mt-6 py-3 rounded-lg font-bold hover:bg-red-700">Guardar Suplidor</button>
        </div>
      )}
      {mode === 'view' && selectedSupplier && (
        <div className="space-y-4">
          <div className="flex items-center gap-2"><button onClick={() => setMode('list')} className="text-gray-500 hover:text-gray-700"><ChevronLeft size={24} /></button><h3 className="text-xl font-bold">{selectedSupplier.name}</h3><span className="ml-auto font-bold text-red-600">{formatCurrency(selectedSupplier.balance || 0)}</span></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow">
              <h4 className="font-bold mb-4 flex items-center gap-2"><DollarSign size={18} className="text-green-600" /> Registrar Pago</h4>
              <div className="space-y-3">
                <div><label className="block text-sm font-medium mb-1">Monto</label><input type="number" className="w-full border rounded-lg p-2.5 font-bold" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Referencia</label><input className="w-full border rounded-lg p-2.5" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="No. Comprobante" /></div>
                <button onClick={handlePayment} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700">Registrar Pago</button>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow">
              <h4 className="font-bold mb-4 flex items-center gap-2"><History size={18} className="text-blue-600" /> Historial</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(selectedSupplier.transactions || []).length === 0 ? <p className="text-gray-400 text-sm">Sin transacciones</p> :
                  [...(selectedSupplier.transactions || [])].reverse().map((t: any) => (
                    <div key={t.id} className="flex justify-between p-3 border rounded hover:bg-gray-50">
                      <div><span className={`text-xs px-2 py-0.5 rounded-full font-bold ${t.type === 'FACTURA' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{t.type}</span><p className="text-xs text-gray-500 mt-1">{t.date} - {t.ref}</p></div>
                      <span className={`font-bold ${t.type === 'FACTURA' ? 'text-red-600' : 'text-green-600'}`}>{t.type === 'PAGO' ? '-' : '+'}{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
