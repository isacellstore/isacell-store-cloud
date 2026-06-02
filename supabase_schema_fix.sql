-- ============================================================
-- ISACELL STORE CLOUD - FIX RLS POLICIES
-- Resuelve el problema: productos, clientes, reparaciones y
-- usuarios no se crean ni se muestran.
--
-- CAUSA: Las politicas usaban current_setting('app.current_company_id')
-- pero el cliente JS nunca establecia esta variable.
--
-- SOLUCION: Usar auth.uid() para obtener el company_id del usuario
-- autenticado directamente desde la tabla users.
-- ============================================================

-- ============================================================
-- 1. FUNCION PARA OBTENER COMPANY_ID DEL USUARIO AUTENTICADO
-- ============================================================

CREATE OR REPLACE FUNCTION get_auth_company_id()
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT company_id INTO v_company_id
  FROM users
  WHERE auth_id = auth.uid()::TEXT;
  RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario: SECURITY DEFINER permite que la funcion lea de users
-- aunque haya RLS, ya que se ejecuta con privilegios del owner.

-- ============================================================
-- 2. ELIMINAR POLITICAS VIEJAS (LAS QUE USAN current_setting)
-- ============================================================

DROP POLICY IF EXISTS company_isolation ON products;
DROP POLICY IF EXISTS company_isolation_clients ON clients;
DROP POLICY IF EXISTS company_isolation_suppliers ON suppliers;
DROP POLICY IF EXISTS company_isolation_sales ON sales;
DROP POLICY IF EXISTS company_isolation_repairs ON repairs;
DROP POLICY IF EXISTS company_isolation_expenses ON expenses;

-- ============================================================
-- 3. POLITICAS RLS CORREGIDAS - USAN get_auth_company_id()
-- ============================================================

-- Tabla: users
-- Los usuarios solo pueden ver registros de su propia empresa
DROP POLICY IF EXISTS company_isolation_users ON users;
CREATE POLICY company_isolation_users ON users
  FOR ALL
  USING (company_id = get_auth_company_id());

-- Tabla: products
CREATE POLICY company_isolation ON products
  FOR ALL
  USING (company_id = get_auth_company_id());

-- Tabla: clients
CREATE POLICY company_isolation_clients ON clients
  FOR ALL
  USING (company_id = get_auth_company_id());

-- Tabla: suppliers
CREATE POLICY company_isolation_suppliers ON suppliers
  FOR ALL
  USING (company_id = get_auth_company_id());

-- Tabla: sales
CREATE POLICY company_isolation_sales ON sales
  FOR ALL
  USING (company_id = get_auth_company_id());

-- Tabla: repairs
CREATE POLICY company_isolation_repairs ON repairs
  FOR ALL
  USING (company_id = get_auth_company_id());

-- Tabla: expenses
CREATE POLICY company_isolation_expenses ON expenses
  FOR ALL
  USING (company_id = get_auth_company_id());

-- ============================================================
-- 4. PERMISOS (GRANTS) - ESENCIAL PARA QUE FUNCIONE
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_auth_company_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_stock(UUID, INTEGER) TO anon, authenticated;

-- Asegurar que las funciones de stock tengan permisos
ALTER FUNCTION decrement_stock(UUID, INTEGER) OWNER TO postgres;
ALTER FUNCTION increment_stock(UUID, INTEGER) OWNER TO postgres;
ALTER FUNCTION get_auth_company_id() OWNER TO postgres;

-- ============================================================
-- 5. VERIFICACION: PROBAR QUE get_auth_company_id FUNCIONA
-- ============================================================

-- Nota: Esta consulta solo funciona cuando estas autenticado.
-- Despues de aplicar el fix, prueba:
-- SELECT get_auth_company_id();
-- Debe retornar el UUID de la empresa del usuario logueado.

-- ============================================================
-- 6. INDICES RECOMENDADOS PARA RENDIMIENTO
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON sales(company_id);
CREATE INDEX IF NOT EXISTS idx_repairs_company_id ON repairs(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_company_id ON expenses(company_id);

-- ============================================================
-- INSTRUCCIONES DE USO:
-- 1. Abrir Supabase → SQL Editor
-- 2. Copiar y pegar TODO este script
-- 3. Ejecutar (Run)
-- 4. Refrescar la aplicacion (F5)
-- 5. Probar crear un producto - debe funcionar!
-- ============================================================
