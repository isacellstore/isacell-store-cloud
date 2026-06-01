import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';

export default function MainLayout() {
  const { sidebarOpen, alert, confirmDialog, hideAlert, hideConfirm } = useAppStore();
  const { isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        sidebarOpen ? "ml-64" : "ml-16"
      )}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Alert Toast */}
      {alert && (
        <div className="fixed top-4 right-4 z-[300] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white min-w-[300px]",
            alert.type === 'success' ? "bg-green-600" :
            alert.type === 'error' ? "bg-red-600" : "bg-blue-600"
          )}>
            {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <p className="text-sm font-medium flex-1">{alert.message}</p>
            <button onClick={hideAlert}><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 uppercase">Confirmar</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{confirmDialog.message}</p>
            </div>
            <div className="p-4 bg-gray-50 flex gap-3 border-t">
              <button 
                onClick={hideConfirm}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => { confirmDialog.onConfirm(); hideConfirm(); }}
                className="flex-1 px-4 py-2.5 bg-red-600 rounded-xl font-bold text-white hover:bg-red-700 transition-all shadow-lg shadow-red-100"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
