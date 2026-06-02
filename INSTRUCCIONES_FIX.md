# FIX - Productos, Clientes, Taller y Usuarios no se crean

## Causa del Problema

Las politicas de seguridad RLS (Row Level Security) en Supabase usaban:
```sql
current_setting('app.current_company_id', true)
```

Pero el codigo JavaScript NUNCA establecia esta variable de sesion de PostgreSQL. 
Esto bloqueaba TODAS las operaciones (crear y leer) en TODAS las tablas.

## Solucion

Ejecutar el script `supabase_schema_fix.sql` en Supabase para:
1. Crear una funcion `get_auth_company_id()` que obtiene el company_id del usuario autenticado
2. Reemplazar las politicas RLS para que usen esta funcion
3. Otorgar los permisos necesarios

## Pasos para Aplicar el Fix

### Paso 1: Abrir SQL Editor en Supabase
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto `isacell-store`
3. En el menu lateral, haz clic en **SQL Editor**
4. Haz clic en **New query**

### Paso 2: Copiar el Script
1. Abre el archivo `supabase_schema_fix.sql`
2. Copia TODO el contenido
3. Pegalo en el editor de SQL de Supabase

### Paso 3: Ejecutar
1. Haz clic en el boton **Run** (o Ctrl+Enter)
2. Deberia aparecer "Success" en verde

### Paso 4: Probar
1. Abre la aplicacion: https://isacell-store-cloud-79tm.onrender.com
2. Inicia sesion con tus credenciales
3. Ve a **Inventario** y crea un producto de prueba
4. El producto DEBE aparecer en la lista inmediatamente

## Si Aun No Funciona

Verifica que el usuario tenga un `company_id` correcto:

```sql
-- Ver datos del usuario admin
SELECT u.id, u.auth_id, u.username, u.name, u.company_id, c.name as company_name
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.username = 'admin';
```

Si `company_id` es NULL, actualizalo:

```sql
-- Obtener el UUID de la empresa
SELECT id FROM companies WHERE slug = 'isacell-store';

-- Actualizar el usuario con el company_id correcto
UPDATE users 
SET company_id = 'EL_UUID_AQUI'
WHERE username = 'admin';
```

## Archivos Modificados en este Fix

| Archivo | Cambio |
|---------|--------|
| `supabase_schema_fix.sql` | Nuevo - Script para corregir RLS |
| `src/lib/supabase.ts` | Usa variables de entorno |
| `.env` | Credenciales correctas de Supabase |
| `src/components/layout/Sidebar.tsx` | Nuevo - Barra lateral de navegacion |
| `src/components/layout/MainLayout.tsx` | Nuevo - Layout principal |

## Estado del Despliegue

- **Aplicacion**: https://63bqwnd43vxdy.kimi.page (temporal para pruebas)
- **Produccion**: https://isacell-store-cloud-79tm.onrender.com

---
**IMPORTANTE**: El fix SQL debe aplicarse PRIMERO en Supabase antes de probar la aplicacion.
