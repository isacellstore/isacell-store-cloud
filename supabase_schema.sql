-- ============================================================
-- ISACELL STORE CLOUD - SCHEMA SQL PARA SUPABASE
-- Multi-empresa con aislamiento por company_id
-- ============================================================

-- Tabla de empresas (multi-tenant)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  rnc TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  email TEXT DEFAULT '',
  logo_url TEXT DEFAULT NULL,
  tax_rate INTEGER DEFAULT 18,
  max_discount_percent INTEGER DEFAULT 10,
  sale_footer_message TEXT DEFAULT 'Gracias por preferirnos! No se aceptan devoluciones pasadas 24h.',
  repair_footer_message TEXT DEFAULT 'Al firmar, el cliente acepta que la tienda no se hace responsable por equipos dejados por mas de 30 dias.',
  seq_sale INTEGER DEFAULT 0,
  seq_repair INTEGER DEFAULT 0,
  seq_payment INTEGER DEFAULT 0,
  seq_purchase INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now(),
  trial_ends_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de usuarios (vinculados a empresas)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id TEXT NOT NULL UNIQUE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'ventas',
  permissions JSONB DEFAULT '{"pos":false,"inventory":false,"purchases":false,"workshop":false,"accounts":false,"suppliers":false,"cash":false,"reports":false,"settings":false}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  barcode TEXT DEFAULT '',
  name TEXT NOT NULL,
  cost REAL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'Accesorio',
  stock INTEGER DEFAULT 0,
  imeis JSONB DEFAULT '[]',
  min_stock INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  doc_id TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  credit_limit REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  transactions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de suplidores
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  doc_id TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  balance REAL DEFAULT 0,
  transactions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  display_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT DEFAULT '',
  items JSONB DEFAULT '[]',
  total REAL DEFAULT 0,
  payment_amount REAL DEFAULT 0,
  change REAL DEFAULT 0,
  type TEXT DEFAULT 'contado',
  client_id TEXT DEFAULT 'generic',
  client_name TEXT DEFAULT 'Cliente Casual',
  seller TEXT DEFAULT '',
  is_quote BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de reparaciones
CREATE TABLE IF NOT EXISTS repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  display_id TEXT NOT NULL,
  date_in TEXT NOT NULL,
  date_out TEXT DEFAULT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT DEFAULT '',
  model TEXT NOT NULL,
  imei TEXT DEFAULT '',
  issue TEXT NOT NULL,
  solution TEXT DEFAULT '',
  estimated_cost REAL DEFAULT 0,
  final_cost REAL DEFAULT 0,
  deposit REAL DEFAULT 0,
  amount_paid_on_delivery REAL DEFAULT 0,
  status TEXT DEFAULT 'En Espera',
  technician TEXT DEFAULT '',
  is_repaired BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de gastos
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL DEFAULT 0,
  category TEXT DEFAULT 'Otros',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Funciones para manejar stock
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products SET stock = GREATEST(0, stock - amount) WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_stock(product_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products SET stock = stock + amount WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) - Cada empresa solo ve sus datos
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY company_isolation ON products FOR ALL USING (company_id::TEXT = current_setting('app.current_company_id', true));
CREATE POLICY company_isolation_clients ON clients FOR ALL USING (company_id::TEXT = current_setting('app.current_company_id', true));
CREATE POLICY company_isolation_suppliers ON suppliers FOR ALL USING (company_id::TEXT = current_setting('app.current_company_id', true));
CREATE POLICY company_isolation_sales ON sales FOR ALL USING (company_id::TEXT = current_setting('app.current_company_id', true));
CREATE POLICY company_isolation_repairs ON repairs FOR ALL USING (company_id::TEXT = current_setting('app.current_company_id', true));
CREATE POLICY company_isolation_expenses ON expenses FOR ALL USING (company_id::TEXT = current_setting('app.current_company_id', true));

-- Insertar empresa de ejemplo (opcional)
-- INSERT INTO companies (name, slug, phone) VALUES ('Mi Tienda', 'mi-tienda', '809-000-0000');
