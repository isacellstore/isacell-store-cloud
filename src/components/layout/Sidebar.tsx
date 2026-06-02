import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard, ShoppingCart, Package, Wrench,
  Users, Truck, DollarSign, BarChart3, Settings, LogOut,
  Store,
} from 'lucide-react';
import type { ModulePermissions } from '@/types';

const NAV_ITEMS: { to: string; label: string; icon: React.ReactNode; permission: keyof ModulePermissions }[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} />, permission: 'pos' },
  { to: '/pos', label: 'Punto de Venta', icon: <ShoppingCart size={20} />, permission: 'pos' },
  { to: '/inventory', label: 'Inventario', icon: <Package size={20} />, permission: 'inventory' },
  { to: '/workshop', label: 'Taller', icon: <Wrench size={20} />, permission: 'workshop' },
  { to: '/accounts', label: 'Cuentas x Cobrar', icon: <Users size={20} />, permission: 'accounts' },
  { to: '/suppliers', label: 'Cuentas x Pagar', icon: <Truck size={20} />, permission: 'suppliers' },
  { to: '/cash', label: 'Cuadre de Caja', icon: <DollarSign size={20} />, permission: 'cash' },
  { to: '/reports', label: 'Reportes', icon: <BarChart3 size={20} />, permission: 'reports' },
  { to: '/settings', label: 'Configuracion', icon: <Settings size={20} />, permission: 'settings' },
];

export default function Sidebar() {
  const { user, company, logout, hasPermission } = useAuthStore();

  return (
    <aside className="w-64 bg-white border-r h-screen flex flex-col sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <Store className="text-white" size={20} />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-gray-800 truncate text-sm">{company?.name || 'ISACELL'}</h1>
            <p className="text-[10px] text-gray-500 truncate">{user?.name || 'Usuario'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          if (!hasPermission(item.permission)) return null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors w-full px-3 py-2 rounded-lg hover:bg-red-50"
        >
          <LogOut size={18} />
          <span>Cerrar Sesion</span>
        </button>
        <p className="text-[10px] text-gray-400 mt-2 text-center">ISACELL STORE Cloud v1.0</p>
      </div>
    </aside>
  );
}
