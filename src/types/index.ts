// ============================================================
// ISACELL STORE - TIPOS TYPESCRIPT
// ============================================================

export type UserRole = 'admin' | 'ventas' | 'tecnico' | 'supervisor';

export type PaymentType = 'contado' | 'credito';

export type ProductCategory = 'Telefono' | 'Accesorio';

export type RepairStatus = 'En Espera' | 'En Reparacion' | 'Reparado' | 'No Reparado' | 'Entregado';

export interface User {
  id: string;
  company_id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: ModulePermissions;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  rnc: string;
  phone: string;
  address: string;
  email: string;
  logo_url: string | null;
  tax_rate: number;
  max_discount_percent: number;
  sale_footer_message: string;
  repair_footer_message: string;
  seq_sale: number;
  seq_repair: number;
  seq_payment: number;
  seq_purchase: number;
  is_active: boolean;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: string;
  trial_ends_at: string | null;
}

export interface ModulePermissions {
  pos: boolean;
  inventory: boolean;
  purchases: boolean;
  workshop: boolean;
  accounts: boolean;
  suppliers: boolean;
  cash: boolean;
  reports: boolean;
  settings: boolean;
}

export interface Product {
  id: string;
  company_id: string;
  barcode: string;
  name: string;
  cost: number;
  price: number;
  category: ProductCategory;
  stock: number;
  imeis: string[];
  min_stock: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem extends Product {
  qty: number;
  finalPrice: number;
  imeiSold: string;
  note: string;
}

export interface Client {
  id: string;
  company_id: string;
  name: string;
  doc_id: string;
  phone: string;
  email: string;
  address: string;
  credit_limit: number;
  balance: number;
  transactions: ClientTransaction[];
  created_at: string;
  updated_at: string;
}

export interface ClientTransaction {
  id: string;
  date: string;
  type: 'FACTURA' | 'ABONO' | 'NOTA_CREDITO';
  amount: number;
  ref: string;
  notes: string;
}

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  doc_id: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
  transactions: SupplierTransaction[];
  created_at: string;
  updated_at: string;
}

export interface SupplierTransaction {
  id: string;
  date: string;
  type: 'FACTURA' | 'PAGO' | 'NOTA_CREDITO';
  amount: number;
  ref: string;
  notes: string;
}

export interface Sale {
  id: string;
  company_id: string;
  display_id: string;
  date: string;
  time: string;
  items: CartItem[];
  total: number;
  payment_amount: number;
  change: number;
  type: PaymentType;
  client_id: string;
  client_name: string;
  seller: string;
  is_quote: boolean;
  created_at: string;
}

export interface Repair {
  id: string;
  company_id: string;
  display_id: string;
  date_in: string;
  date_out: string | null;
  client_name: string;
  client_phone: string;
  model: string;
  imei: string;
  issue: string;
  solution: string;
  estimated_cost: number;
  final_cost: number;
  deposit: number;
  amount_paid_on_delivery: number;
  status: RepairStatus;
  technician: string;
  is_repaired: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  company_id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  created_by: string;
  created_at: string;
}

export interface CashOperation {
  id: string;
  type: 'VENTA' | 'TALLER' | 'COBRO' | 'PAGO' | 'GASTO' | 'COMPRA';
  desc: string;
  amount: number;
  isIncome: boolean;
  raw: any;
  date: string;
}

export interface DashboardStats {
  todaySales: number;
  todayRepairs: number;
  todayIncome: number;
  todayExpenses: number;
  lowStock: number;
  pendingRepairs: number;
  accountsReceivable: number;
  accountsPayable: number;
}

export interface ReceiptData {
  id: string;
  displayId: string;
  date: string;
  time?: string;
  items?: CartItem[];
  total: number;
  paymentAmount?: number;
  change?: number;
  type?: PaymentType;
  clientName?: string;
  seller?: string;
  isQuote?: boolean;
  // Repair fields
  clientPhone?: string;
  model?: string;
  imei?: string;
  issue?: string;
  solution?: string;
  estimatedCost?: number;
  finalCost?: number;
  deposit?: number;
  status?: RepairStatus;
  isRepaired?: boolean;
  technician?: string;
  // Payment fields
  entityName?: string;
  document?: string;
  previousBalance?: number;
  amountPaid?: number;
  remainingBalance?: number;
}
