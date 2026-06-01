import type { ModulePermissions } from '@/types';
import {
  ShoppingCart, Package, Wrench, Users, Banknote,
  BarChart2, Settings, Truck
} from 'lucide-react';

export const ROLES = {
  ADMIN: 'admin' as const,
  VENTAS: 'ventas' as const,
  TECNICO: 'tecnico' as const,
  SUPERVISOR: 'supervisor' as const,
};

export const MODULES: { key: keyof ModulePermissions; label: string; icon: any; path: string }[] = [
  { key: 'pos', label: 'Punto de Venta', icon: ShoppingCart, path: '/pos' },
  { key: 'inventory', label: 'Inventario', icon: Package, path: '/inventory' },
  { key: 'workshop', label: 'Taller', icon: Wrench, path: '/workshop' },
  { key: 'accounts', label: 'Cuentas x Cobrar', icon: Users, path: '/accounts' },
  { key: 'suppliers', label: 'Cuentas x Pagar', icon: Truck, path: '/suppliers' },
  { key: 'cash', label: 'Cuadre de Caja', icon: Banknote, path: '/cash' },
  { key: 'reports', label: 'Reportes', icon: BarChart2, path: '/reports' },
  { key: 'settings', label: 'Configuracion', icon: Settings, path: '/settings' },
];

export const CATEGORIES = ['Telefono', 'Accesorio'] as const;
export const REPAIR_STATUSES = ['En Espera', 'En Reparacion', 'Reparado', 'No Reparado', 'Entregado'] as const;
export const EXPENSE_CATEGORIES = ['Sueldos', 'Alquiler', 'Servicios', 'Materiales', 'Transporte', 'Otros'] as const;
