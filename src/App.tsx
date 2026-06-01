import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import MainLayout from '@/components/layout/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import POS from '@/pages/POS';
import Inventory from '@/pages/Inventory';
import Workshop from '@/pages/Workshop';
import Accounts from '@/pages/Accounts';
import Suppliers from '@/pages/Suppliers';
import Cash from '@/pages/Cash';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';

function ProtectedRoute({ children, requiredPermission }: { children: React.ReactNode; requiredPermission?: string }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission as any)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const checkSession = useAuthStore(s => s.checkSession);

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<ProtectedRoute requiredPermission="pos"><POS /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute requiredPermission="inventory"><Inventory /></ProtectedRoute>} />
        <Route path="/workshop" element={<ProtectedRoute requiredPermission="workshop"><Workshop /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute requiredPermission="accounts"><Accounts /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute requiredPermission="suppliers"><Suppliers /></ProtectedRoute>} />
        <Route path="/cash" element={<ProtectedRoute requiredPermission="cash"><Cash /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute requiredPermission="reports"><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute requiredPermission="settings"><Settings /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
