import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { formatCurrency, getCurrentDate } from '@/lib/utils';
import type { DashboardStats } from '@/types';
import {
  ShoppingCart, Wrench, TrendingUp, TrendingDown,
  AlertTriangle, Clock, DollarSign,
  Truck, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, company } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0, todayRepairs: 0, todayIncome: 0, todayExpenses: 0,
    lowStock: 0, pendingRepairs: 0, accountsReceivable: 0, accountsPayable: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [pendingRepairsList, setPendingRepairsList] = useState<any[]>([]);

  useEffect(() => {
    if (!company?.id) return;
    loadDashboard();
  }, [company?.id]);

  const loadDashboard = async () => {
    if (!company?.id) return;
    const today = getCurrentDate();
    try {
      const { data: sales } = await supabase.from('sales').select('*').eq('company_id', company.id).eq('date', today);
      const totalSales = (sales || []).reduce((s: number, v: any) => s + (v.total || 0), 0);
      const totalIncome = (sales || []).reduce((s: number, v: any) => s + (v.type === 'contado' ? v.total : v.payment_amount || 0), 0);

      const { data: repairs } = await supabase.from('repairs').select('*').eq('company_id', company.id);
      const todayRepairs = (repairs || []).filter((r: any) => r.date_in === today).length;
      const pending = (repairs || []).filter((r: any) => r.status !== 'Entregado');

      const { data: expenses } = await supabase.from('expenses').select('*').eq('company_id', company.id).eq('date', today);
      const totalExpenses = (expenses || []).reduce((s: number, v: any) => s + (v.amount || 0), 0);

      const { data: products } = await supabase.from('products').select('*').eq('company_id', company.id);
      const lowStockCount = (products || []).filter((p: any) => (p.stock || 0) <= 2).length;

      const { data: clients } = await supabase.from('clients').select('balance').eq('company_id', company.id);
      const totalReceivable = (clients || []).reduce((s: number, c: any) => s + (c.balance || 0), 0);

      const { data: suppliers } = await supabase.from('suppliers').select('balance').eq('company_id', company.id);
      const totalPayable = (suppliers || []).reduce((s: number, s2: any) => s + (s2.balance || 0), 0);

      setStats({
        todaySales: totalSales, todayRepairs: todayRepairs, todayIncome: totalIncome,
        todayExpenses: totalExpenses, lowStock: lowStockCount, pendingRepairs: pending.length,
        accountsReceivable: totalReceivable, accountsPayable: totalPayable,
      });
      setRecentSales((sales || []).slice(0, 5));
      setPendingRepairsList(pending.slice(0, 5));
    } catch (e) { console.error('Dashboard error:', e); }
  };

  const statCards = [
    { label: 'Ventas Hoy', value: formatCurrency(stats.todaySales), icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50', path: '/cash' },
    { label: 'Ingresos Hoy', value: formatCurrency(stats.todayIncome), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', path: '/cash' },
    { label: 'Gastos Hoy', value: formatCurrency(stats.todayExpenses), icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50', path: '/cash' },
    { label: 'Taller Hoy', value: stats.todayRepairs, icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50', path: '/workshop' },
  ];

  const alertCards = [
    { label: 'Stock Bajo', value: stats.lowStock, icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', path: '/inventory' },
    { label: 'Pendientes Taller', value: stats.pendingRepairs, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50', path: '/workshop' },
    { label: 'Por Cobrar', value: formatCurrency(stats.accountsReceivable), icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/accounts' },
    { label: 'Por Pagar', value: formatCurrency(stats.accountsPayable), icon: Truck, color: 'text-pink-600', bg: 'bg-pink-50', path: '/suppliers' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-800">Dashboard</h1><p className="text-gray-500 text-sm mt-1">Bienvenido, {user?.name || 'Usuario'}</p></div>
        <div className="text-right"><p className="text-sm text-gray-500">{company?.name}</p><p className="text-xs text-gray-400">{getCurrentDate()}</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <button key={card.label} onClick={() => navigate(card.path)}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${card.bg}`}><card.icon size={22} className={card.color} /></div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.label}</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{card.value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {alertCards.map(card => (
          <button key={card.label} onClick={() => navigate(card.path)}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${card.bg}`}><card.icon size={18} className={card.color} /></div>
              <p className="text-xs font-bold text-gray-500 uppercase">{card.label}</p>
            </div>
            <p className="text-lg font-bold text-gray-800">{card.value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><ShoppingCart size={18} className="text-red-600" /> Ventas Recientes</h3>
            <button onClick={() => navigate('/cash')} className="text-xs text-red-600 font-bold hover:underline">Ver Todas</button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentSales.length === 0 ? <p className="p-6 text-gray-400 text-center text-sm">No hay ventas hoy</p> :
              recentSales.map((sale: any) => (
                <div key={sale.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div><p className="font-bold text-sm text-gray-800">{sale.display_id}</p><p className="text-xs text-gray-500">{sale.client_name}</p></div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(sale.total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sale.type === 'contado' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{sale.type?.toUpperCase()}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Wrench size={18} className="text-orange-600" /> Reparaciones Pendientes</h3>
            <button onClick={() => navigate('/workshop')} className="text-xs text-orange-600 font-bold hover:underline">Ver Todas</button>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingRepairsList.length === 0 ? <p className="p-6 text-gray-400 text-center text-sm">No hay reparaciones pendientes</p> :
              pendingRepairsList.map((repair: any) => (
                <div key={repair.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div><p className="font-bold text-sm text-gray-800">{repair.display_id}</p><p className="text-xs text-gray-500">{repair.client_name} - {repair.model}</p></div>
                  <div className="text-right"><p className="font-bold text-gray-700">{formatCurrency(repair.estimated_cost || 0)}</p><span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{repair.status}</span></div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
