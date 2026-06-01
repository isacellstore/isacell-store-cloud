import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useCashStore } from '@/stores/cashStore';
import { useAccountsStore } from '@/stores/accountsStore';
import { supabase } from '@/lib/supabase';
import { formatCurrency, getCurrentDate } from '@/lib/utils';
import { Banknote, Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function Cash() {
  const { user, company } = useAuthStore();
  const { showAlert, showConfirm } = useAppStore();
  const { loadExpenses, addExpense, getDailyOperations } = useCashStore();
  const { clients, suppliers, loadClients, loadSuppliers } = useAccountsStore();
  const [viewDate, setViewDate] = useState(getCurrentDate());
  const [operations, setOperations] = useState<any[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ desc: '', amount: '', category: 'Otros' });

  useEffect(() => { if (company?.id) loadAllData(); }, [company?.id, viewDate]);

  const loadAllData = async () => {
    if (!company?.id) return;
    const { data: salesData } = await supabase.from('sales').select('*').eq('company_id', company.id).eq('date', viewDate);
    const { data: repairsData } = await supabase.from('repairs').select('*').eq('company_id', company.id);
    await loadClients(company.id);
    await loadSuppliers(company.id);
    await loadExpenses(company.id, viewDate);
    const ops = await getDailyOperations(company.id, viewDate, salesData || [], repairsData || [], clients, suppliers);
    setOperations(ops);
  };

  const totalIncome = operations.filter(o => o.isIncome).reduce((s, o) => s + o.amount, 0);
  const totalExpense = operations.filter(o => !o.isIncome).reduce((s, o) => s + o.amount, 0);
  const netTotal = totalIncome - totalExpense;

  const handleAddExpense = async () => {
    if (!expenseForm.desc || !expenseForm.amount) { showAlert('Complete todos los campos', 'error'); return; }
    const result = await addExpense({ company_id: company?.id || '', date: viewDate, description: expenseForm.desc, amount: parseFloat(expenseForm.amount), category: expenseForm.category, created_by: user?.name || 'System' });
    if (result.success) { showAlert('Gasto registrado', 'success'); setExpenseForm({ desc: '', amount: '', category: 'Otros' }); setShowExpenseForm(false); loadAllData(); }
  };

  const handleDeleteSale = async (sale: any) => {
    showConfirm('Anular esta venta? Esto reversara el stock.', async () => {
      await supabase.from('sales').delete().eq('id', sale.id);
      for (const item of (sale.items || [])) {
        if (item.category === 'Telefono' && item.imeiSold) {
          const { data: prod } = await supabase.from('products').select('imeis, stock').eq('id', item.id).single();
          if (prod) await supabase.from('products').update({ imeis: [...(prod.imeis || []), item.imeiSold], stock: (prod.stock || 0) + item.qty }).eq('id', item.id);
        } else {
          await supabase.rpc('increment_stock', { product_id: item.id, amount: item.qty });
        }
      }
      showAlert('Venta anulada', 'success'); loadAllData();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Banknote className="text-red-600" /> Cuadre de Caja</h2>
        <div className="flex items-center gap-3">
          <input type="date" className="border rounded-lg px-3 py-2" value={viewDate} onChange={e => setViewDate(e.target.value)} />
          <button onClick={() => setShowExpenseForm(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm"><Plus size={18} /> Gasto</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border flex items-center justify-between">
          <div><p className="text-xs font-bold text-gray-500 uppercase">Ingresos</p><p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p></div>
          <TrendingUp className="text-green-500 opacity-50" size={28} />
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border flex items-center justify-between">
          <div><p className="text-xs font-bold text-gray-500 uppercase">Egresos</p><p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p></div>
          <TrendingDown className="text-red-500 opacity-50" size={28} />
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border flex items-center justify-between">
          <div><p className="text-xs font-bold text-gray-500 uppercase">Neto</p><p className={`text-2xl font-bold ${netTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(netTotal)}</p></div>
          <DollarSign className="text-blue-500 opacity-50" size={28} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr><th className="p-4">Tipo</th><th className="p-4">Descripcion</th><th className="p-4 text-right">Monto</th><th className="p-4 text-center">Accion</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {operations.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-gray-400">No hay operaciones para esta fecha</td></tr> :
              operations.map(op => (
                <tr key={op.id} className="hover:bg-gray-50">
                  <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full font-bold ${op.type === 'VENTA' ? 'bg-green-100 text-green-700' : op.type === 'TALLER' ? 'bg-orange-100 text-orange-700' : op.type === 'COBRO' ? 'bg-blue-100 text-blue-700' : op.type === 'GASTO' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{op.type}</span></td>
                  <td className="p-4 font-medium text-gray-800">{op.desc}</td>
                  <td className={`p-4 text-right font-bold ${op.isIncome ? 'text-green-600' : 'text-red-600'}`}>{op.isIncome ? '+' : '-'}{formatCurrency(op.amount)}</td>
                  <td className="p-4 text-center">{op.type === 'VENTA' && user?.role === 'admin' && <button onClick={() => handleDeleteSale(op.raw)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showExpenseForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg mb-4">Registrar Gasto</h3>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Descripcion</label><input className="w-full border rounded-lg p-2.5" value={expenseForm.desc} onChange={e => setExpenseForm({ ...expenseForm, desc: e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">Monto</label><input type="number" className="w-full border rounded-lg p-2.5 font-bold" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} /></div>
              <div><label className="block text-sm font-medium mb-1">Categoria</label>
                <select className="w-full border rounded-lg p-2.5 bg-white" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                  {['Sueldos', 'Alquiler', 'Servicios', 'Materiales', 'Transporte', 'Otros'].map(c => <option key={c} value={c}>{c}</option>)}
                </select></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowExpenseForm(false)} className="flex-1 bg-gray-200 py-2 rounded font-bold">Cancelar</button>
              <button onClick={handleAddExpense} className="flex-1 bg-red-600 text-white py-2 rounded font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
