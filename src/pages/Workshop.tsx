import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useWorkshopStore } from '@/stores/workshopStore';
import { formatCurrency, getCurrentDate, validators } from '@/lib/utils';
import { Wrench, Plus, Search, Trash2, Edit, CheckCircle, ChevronLeft, Phone } from 'lucide-react';

const STATUSES = ['En Espera', 'En Reparacion', 'Reparado', 'No Reparado', 'Entregado'];

export default function Workshop() {
  const { user, company } = useAuthStore();
  const { showAlert, showConfirm } = useAppStore();
  const { repairs, loadRepairs, addRepair, updateRepair, deleteRepair } = useWorkshopStore();
  const [mode, setMode] = useState<'list' | 'add' | 'view'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ client_name: '', client_phone: '', model: '', imei: '', issue: '', solution: '', estimated_cost: '', deposit: '', notes: '', technician: '' });
  const [selectedRepair, setSelectedRepair] = useState<any>(null);

  useEffect(() => { if (company?.id) loadRepairs(company.id); }, [company?.id]);

  const filtered = repairs.filter(r => {
    const matchSearch = !searchTerm || r.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || r.model?.toLowerCase().includes(searchTerm.toLowerCase()) || r.display_id?.includes(searchTerm);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = async () => {
    if (!form.client_name || !form.model || !form.issue) { showAlert('Nombre, modelo y falla son requeridos', 'error'); return; }
    if (form.imei && !validators.isIMEI(form.imei)) { showAlert('IMEI debe tener 15 digitos', 'error'); return; }
    const data = {
      company_id: company?.id || '', client_name: form.client_name, client_phone: form.client_phone || '', model: form.model,
      imei: form.imei ? form.imei.replace(/\D/g, '') : '', issue: form.issue, estimated_cost: parseFloat(form.estimated_cost) || 0,
      deposit: parseFloat(form.deposit) || 0, notes: form.notes || '', status: 'En Espera', is_repaired: false,
      date_in: getCurrentDate(), final_cost: 0, solution: '', date_out: null, amount_paid_on_delivery: 0,
      technician: form.technician || user?.name || '',
    };
    const seq = company?.seq_repair || 0;
    const result = await addRepair(data, seq);
    if (result.success) {
      await supabase?.from('companies')?.update({ seq_repair: seq + 1 })?.eq('id', company?.id || '');
      showAlert('Reparacion registrada', 'success'); setMode('list');
      setForm({ client_name: '', client_phone: '', model: '', imei: '', issue: '', solution: '', estimated_cost: '', deposit: '', notes: '', technician: '' });
    }
  };

  const handleUpdateStatus = async (repair: any, updates: any) => {
    await updateRepair(repair.id, updates); showAlert('Estado actualizado', 'success'); setSelectedRepair(null); setMode('list');
  };

  const handleDelete = (id: string) => {
    showConfirm('Eliminar esta reparacion?', async () => { await deleteRepair(id); showAlert('Reparacion eliminada', 'success'); });
  };

  const getStatusColor = (s: string) => {
    switch (s) { case 'En Espera': return 'bg-yellow-100 text-yellow-700'; case 'En Reparacion': return 'bg-blue-100 text-blue-700'; case 'Reparado': return 'bg-green-100 text-green-700'; case 'No Reparado': return 'bg-red-100 text-red-700'; case 'Entregado': return 'bg-gray-100 text-gray-700'; default: return 'bg-gray-100'; }
  };

  return (
    <div className="space-y-4">
      {mode === 'list' && (
        <>
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Wrench className="text-red-600" /> Taller</h2>
            <button onClick={() => setMode('add')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm"><Plus size={18} /> Nueva Orden</button>
          </div>
          <div className="flex gap-3 bg-white p-4 rounded-lg shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500" placeholder="Buscar cliente, modelo o orden..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select className="border rounded-lg px-3 py-2 bg-white" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Todos los estados</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr><th className="p-4">Orden</th><th className="p-4">Cliente</th><th className="p-4">Equipo</th><th className="p-4">Estado</th><th className="p-4 text-right">Costo</th><th className="p-4 text-center">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-4 font-mono text-xs font-bold">{r.display_id}</td>
                    <td className="p-4"><div className="font-bold text-sm">{r.client_name}</div><div className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} />{r.client_phone}</div></td>
                    <td className="p-4"><div className="font-bold text-sm">{r.model}</div>{r.imei && <div className="text-xs text-gray-500">IMEI: {r.imei}</div>}</td>
                    <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusColor(r.status)}`}>{r.status}</span></td>
                    <td className="p-4 text-right font-bold">{formatCurrency(r.estimated_cost || 0)}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => { setSelectedRepair(r); setMode('view'); }} className="text-blue-600 bg-blue-50 p-2 rounded hover:bg-blue-100"><Edit size={14} /></button>
                        {user?.role === 'admin' && <button onClick={() => handleDelete(r.id)} className="text-red-500 bg-red-50 p-2 rounded hover:bg-red-100"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="p-8 text-center text-gray-400">No se encontraron reparaciones</p>}
          </div>
        </>
      )}

      {mode === 'add' && (
        <div className="bg-white p-6 rounded-xl shadow max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => setMode('list')} className="text-gray-500 hover:text-gray-700"><ChevronLeft size={24} /></button>
            <h3 className="text-xl font-bold">Nueva Orden de Reparacion</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Nombre Cliente *</label><input className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Telefono</label><input className="w-full border rounded-lg p-2.5 outline-none" value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Modelo Equipo *</label><input className="w-full border rounded-lg p-2.5 outline-none" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">IMEI (Opcional)</label><input className="w-full border rounded-lg p-2.5 outline-none" maxLength={15} value={form.imei} onChange={e => setForm({ ...form, imei: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Tecnico</label><input className="w-full border rounded-lg p-2.5 outline-none" value={form.technician} onChange={e => setForm({ ...form, technician: e.target.value })} placeholder={user?.name} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Falla Reportada *</label><textarea className="w-full border rounded-lg p-2.5 outline-none" rows={3} value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Costo Estimado</label><input type="number" className="w-full border rounded-lg p-2.5 outline-none" value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Abono Inicial</label><input type="number" className="w-full border rounded-lg p-2.5 outline-none" value={form.deposit} onChange={e => setForm({ ...form, deposit: e.target.value })} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Notas</label><textarea className="w-full border rounded-lg p-2.5 outline-none" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <button onClick={handleSubmit} className="w-full bg-red-600 text-white mt-6 py-3 rounded-lg font-bold hover:bg-red-700 shadow-md">Registrar Orden</button>
        </div>
      )}

      {mode === 'view' && selectedRepair && (
        <div className="bg-white p-6 rounded-xl shadow max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => setMode('list')} className="text-gray-500 hover:text-gray-700"><ChevronLeft size={24} /></button>
            <h3 className="text-xl font-bold">Orden {selectedRepair.display_id}</h3>
            <span className={`ml-auto text-xs px-2 py-1 rounded-full font-bold ${getStatusColor(selectedRepair.status)}`}>{selectedRepair.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div><span className="text-gray-500">Cliente:</span> <span className="font-bold">{selectedRepair.client_name}</span></div>
            <div><span className="text-gray-500">Telefono:</span> {selectedRepair.client_phone}</div>
            <div><span className="text-gray-500">Equipo:</span> <span className="font-bold">{selectedRepair.model}</span></div>
            <div><span className="text-gray-500">IMEI:</span> {selectedRepair.imei || 'N/A'}</div>
            <div className="col-span-2"><span className="text-gray-500">Falla:</span> <span className="font-bold">{selectedRepair.issue}</span></div>
            <div><span className="text-gray-500">Costo Estimado:</span> <span className="font-bold text-red-600">{formatCurrency(selectedRepair.estimated_cost)}</span></div>
            <div><span className="text-gray-500">Abono:</span> <span className="font-bold text-green-600">{formatCurrency(selectedRepair.deposit)}</span></div>
          </div>

          {selectedRepair.status !== 'Entregado' && (
            <div className="space-y-4 border-t pt-4">
              {selectedRepair.status === 'En Espera' && (
                <button onClick={() => handleUpdateStatus(selectedRepair, { status: 'En Reparacion' })} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Iniciar Reparacion</button>
              )}
              {(selectedRepair.status === 'En Reparacion' || selectedRepair.status === 'Reparado' || selectedRepair.status === 'No Reparado') && (
                <div className="space-y-3">
                  <div><label className="block text-sm font-medium mb-1">Trabajo Realizado / Solucion</label><textarea className="w-full border rounded-lg p-2.5" rows={2} defaultValue={selectedRepair.solution || ''} id="solution-input" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium mb-1">Costo Final</label><input type="number" className="w-full border rounded-lg p-2.5" defaultValue={selectedRepair.final_cost || selectedRepair.estimated_cost || ''} id="final-cost-input" /></div>
                    <div><label className="block text-sm font-medium mb-1">Monto al Entregar</label><input type="number" className="w-full border rounded-lg p-2.5" defaultValue={selectedRepair.final_cost ? selectedRepair.final_cost - (selectedRepair.deposit || 0) : ''} id="amount-paid-input" /></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { const sol = (document.getElementById('solution-input') as HTMLTextAreaElement)?.value; const fc = parseFloat((document.getElementById('final-cost-input') as HTMLInputElement)?.value) || 0; handleUpdateStatus(selectedRepair, { status: 'Reparado', solution: sol, final_cost: fc, is_repaired: true }); }} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700"><CheckCircle size={16} className="inline mr-1" /> Reparado</button>
                    <button onClick={() => { const sol = (document.getElementById('solution-input') as HTMLTextAreaElement)?.value; handleUpdateStatus(selectedRepair, { status: 'No Reparado', solution: sol, is_repaired: false }); }} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700">No Reparado</button>
                  </div>
                </div>
              )}
              {(selectedRepair.status === 'Reparado' || selectedRepair.status === 'No Reparado') && (
                <button onClick={() => { const ap = parseFloat((document.getElementById('amount-paid-input') as HTMLInputElement)?.value) || 0; handleUpdateStatus(selectedRepair, { status: 'Entregado', date_out: getCurrentDate(), amount_paid_on_delivery: ap }); }} className="w-full bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700">Entregar al Cliente</button>
              )}
            </div>
          )}
          {selectedRepair.status === 'Entregado' && (
            <div className="border-t pt-4">
              <p className="text-sm"><span className="text-gray-500">Fecha Entrega:</span> {selectedRepair.date_out}</p>
              <p className="text-sm"><span className="text-gray-500">Solucion:</span> {selectedRepair.solution || 'N/A'}</p>
              <p className="text-sm"><span className="text-gray-500">Costo Final:</span> <span className="font-bold">{formatCurrency(selectedRepair.final_cost || 0)}</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Workaround for supabase in workshop
let supabase: any = null;
import('@/lib/supabase').then(m => { supabase = m.supabase; });
