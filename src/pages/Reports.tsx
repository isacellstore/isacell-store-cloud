import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { formatCurrency, getCurrentDate } from '@/lib/utils';
import { BarChart2, Download, TrendingUp, TrendingDown, ShoppingCart, Wrench, Users, Truck } from 'lucide-react';

export default function Reports() {
  const { company } = useAuthStore();
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(getCurrentDate());
  const [sales, setSales] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => { if (company?.id) loadData(); }, [company?.id, dateFrom, dateTo]);

  const loadData = async () => {
    if (!company?.id) return;
    const { data: s } = await supabase.from('sales').select('*').eq('company_id', company.id).gte('date', dateFrom).lte('date', dateTo);
    setSales(s || []);
    const { data: r } = await supabase.from('repairs').select('*').eq('company_id', company.id).gte('date_in', dateFrom).lte('date_in', dateTo);
    setRepairs(r || []);
    const { data: e } = await supabase.from('expenses').select('*').eq('company_id', company.id).gte('date', dateFrom).lte('date', dateTo);
    setExpenses(e || []);
  };

  const totalSales = sales.reduce((s, v) => s + (v.total || 0), 0);
  const cashSales = sales.filter((s: any) => s.type === 'contado').reduce((s, v) => s + (v.total || 0), 0);
  const creditSales = sales.filter((s: any) => s.type === 'credito').reduce((s, v) => s + (v.total || 0), 0);
  const totalExpenses = expenses.reduce((s, v) => s + (v.amount || 0), 0);
  const totalRepairs = repairs.length;
  const repairIncome = repairs.reduce((s, v) => s + (v.deposit || 0) + (v.amount_paid_on_delivery || 0), 0);
  const profit = totalSales - totalExpenses;

  const productCounts: Record<string, { name: string; qty: number; total: number }> = {};
  sales.forEach((sale: any) => {
    (sale.items || []).forEach((item: any) => {
      if (!productCounts[item.id]) productCounts[item.id] = { name: item.name, qty: 0, total: 0 };
      productCounts[item.id].qty += item.qty;
      productCounts[item.id].total += (item.finalPrice || item.price || 0) * item.qty;
    });
  });
  const topProducts = Object.values(productCounts).sort((a, b) => b.qty - a.qty).slice(0, 10);

  const handleExport = () => {
    let csv = 'REPORTE ISACELL STORE\n';
    csv += `Periodo: ${dateFrom} a ${dateTo}\n\n`;
    csv += `Ventas Totales:,${totalSales}\nVentas Contado:,${cashSales}\nVentas Credito:,${creditSales}\nGastos Totales:,${totalExpenses}\nGanancia Neta:,${profit}\nReparaciones:,${totalRepairs}\n\n`;
    csv += 'PRODUCTOS MAS VENDIDOS\nProducto,Cantidad,Total\n';
    topProducts.forEach(p => { csv += `${p.name},${p.qty},${p.total}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `reporte-${dateFrom}-${dateTo}.csv`; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold flex items-center gap-2"><BarChart2 className="text-red-600" /> Reportes</h2>
        <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm"><Download size={18} /> Exportar CSV</button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm flex gap-3 items-center">
        <span className="text-gray-400 text-sm">Desde:</span><input type="date" className="border rounded-lg px-3 py-2" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <span className="text-gray-400 text-sm">Hasta:</span><input type="date" className="border rounded-lg px-3 py-2" value={dateTo} onChange={e => setDateTo(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3 mb-2"><TrendingUp size={18} className="text-green-600" /><span className="text-xs font-bold text-gray-500 uppercase">Ventas Totales</span></div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalSales)}</p><p className="text-xs text-gray-400 mt-1">{sales.length} transacciones</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3 mb-2"><ShoppingCart size={18} className="text-orange-600" /><span className="text-xs font-bold text-gray-500 uppercase">Ventas Contado</span></div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(cashSales)}</p><p className="text-xs text-gray-400 mt-1">{sales.filter((s: any) => s.type === 'contado').length} ventas</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3 mb-2"><Users size={18} className="text-blue-600" /><span className="text-xs font-bold text-gray-500 uppercase">Ventas Credito</span></div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(creditSales)}</p><p className="text-xs text-gray-400 mt-1">{sales.filter((s: any) => s.type === 'credito').length} ventas</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3 mb-2"><Wrench size={18} className="text-purple-600" /><span className="text-xs font-bold text-gray-500 uppercase">Reparaciones</span></div>
          <p className="text-2xl font-bold text-gray-800">{totalRepairs}</p><p className="text-xs text-gray-400 mt-1">{formatCurrency(repairIncome)} ingresos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3 mb-2"><TrendingDown size={18} className="text-red-600" /><span className="text-xs font-bold text-gray-500 uppercase">Gastos Totales</span></div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p><p className="text-xs text-gray-400 mt-1">{expenses.length} registros</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3 mb-2"><Truck size={18} className="text-green-600" /><span className="text-xs font-bold text-gray-500 uppercase">Ganancia Neta</span></div>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-bold text-gray-800">Productos Mas Vendidos</h3></div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase"><tr><th className="p-4">#</th><th className="p-4">Producto</th><th className="p-4 text-center">Cantidad</th><th className="p-4 text-right">Total</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {topProducts.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-gray-400">Sin datos</td></tr> :
              topProducts.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50"><td className="p-4 font-bold text-gray-400">{i + 1}</td><td className="p-4 font-medium">{p.name}</td><td className="p-4 text-center font-bold">{p.qty}</td><td className="p-4 text-right font-bold text-red-600">{formatCurrency(p.total)}</td></tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
