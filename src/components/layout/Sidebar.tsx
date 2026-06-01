import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { MODULES } from '@/lib/constants';
import {
  LayoutDashboard, LogOut, Smartphone,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, company, logout, hasPermission, isAdmin } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  const isActive = (path: string) => location.pathname === path;

  const handleNav = (path: string) => {
    navigate(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-gray-900 text-white z-50 transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
                <Smartphone size={18} />
              </div>
              <span className="font-bold text-sm truncate">ISACELL</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mx-auto">
              <Smartphone size={18} />
            </div>
          )}
          <button 
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {/* Dashboard */}
          <button
            onClick={() => handleNav('/')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm",
              isActive('/') 
                ? "bg-red-600 text-white" 
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
            title={!sidebarOpen ? 'Dashboard' : undefined}
          >
            <LayoutDashboard size={20} className="shrink-0" />
            {sidebarOpen && <span className="font-medium">Dashboard</span>}
          </button>

          {/* Module Links */}
          {MODULES.map(mod => {
            if (!isAdmin() && !hasPermission(mod.key)) return null;
            
            const Icon = mod.icon;
            const active = isActive(mod.path);
            
            return (
              <button
                key={mod.key}
                onClick={() => handleNav(mod.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm",
                  active 
                    ? "bg-red-600 text-white" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
                title={!sidebarOpen ? mod.label : undefined}
              >
                <Icon size={20} className="shrink-0" />
                {sidebarOpen && <span className="font-medium">{mod.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-3">
          {sidebarOpen && (
            <div className="mb-3 px-2">
              <p className="text-xs text-gray-500 truncate">{company?.name || 'Mi Empresa'}</p>
              <p className="text-xs text-gray-600 truncate">{user?.name || 'Usuario'}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 rounded-lg transition-all text-sm"
            title={!sidebarOpen ? 'Cerrar Sesion' : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            {sidebarOpen && <span className="font-medium">Cerrar Sesion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
