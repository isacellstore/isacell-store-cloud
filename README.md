# ISACELL STORE Cloud

ERP Multi-Empresa para tiendas de celulares. Sistema cloud con Supabase como backend.

## Despliegue

**URL:** https://quhzsjd23xwks.kimi.page

## Configuracion de Supabase

### 1. Crear tablas en Supabase

1. Ve a tu proyecto Supabase: https://supabase.com/dashboard/project/bjfqtqwlstfhplozobar
2. Abre el SQL Editor
3. Crea una nueva query y pega el contenido del archivo `supabase_schema.sql`
4. Ejecuta el script

### 2. Configurar Autenticacion

1. Ve a Authentication > Settings
2. Asegurate que "Email confirmations" este DESACTIVADO (para pruebas)
3. En Site URL pon la URL de tu app desplegada

### 3. Crear primera empresa y usuario admin

Ejecuta este SQL en el SQL Editor:

```sql
-- Crear empresa
INSERT INTO companies (name, slug, phone, plan, is_active)
VALUES ('Mi Tienda', 'mi-tienda', '809-000-0000', 'pro', true)
RETURNING id;

-- El UUID retornado lo usaras para crear el usuario
```

### 4. Registrar usuario admin

Desde la app en el navegador:
1. Registrate con cualquier usuario
2. Luego actualiza la tabla users para asignarle la empresa:

```sql
UPDATE users 
SET company_id = 'EL_UUID_DE_TU_EMPRESA',
    role = 'admin',
    permissions = '{"pos":true,"inventory":true,"purchases":true,"workshop":true,"accounts":true,"suppliers":true,"cash":true,"reports":true,"settings":true}'
WHERE username = 'TU_USUARIO';
```

### 5. Variables de entorno (.env)

```
VITE_SUPABASE_URL=https://bjfqtqwlstfhplozobar.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_poLW8StMw8oa1DsU6tShIg_Ok1b2wOu
```

## Estructura del Proyecto

```
src/
├── types/           # Tipos TypeScript
│   └── index.ts
├── lib/             # Utilidades y Supabase
│   ├── supabase.ts      # Cliente Supabase
│   ├── utils.ts         # Helpers y validadores
│   └── constants.ts     # Constantes y roles
├── stores/          # Estado global (Zustand)
│   ├── authStore.ts     # Autenticacion
│   ├── posStore.ts      # Punto de Venta
│   ├── inventoryStore.ts # Inventario
│   ├── workshopStore.ts # Taller
│   ├── accountsStore.ts # Cuentas x Cobrar/Pagar
│   ├── cashStore.ts     # Cuadre de Caja
│   └── appStore.ts      # App global
├── components/
│   └── layout/
│       ├── Sidebar.tsx      # Menu lateral
│       └── MainLayout.tsx   # Layout principal
├── pages/           # Paginas/Rutas
│   ├── Login.tsx        # Login
│   ├── Dashboard.tsx    # Inicio
│   ├── POS.tsx          # Punto de Venta
│   ├── Inventory.tsx    # Inventario
│   ├── Workshop.tsx     # Taller
│   ├── Accounts.tsx     # Cuentas x Cobrar
│   ├── Suppliers.tsx    # Cuentas x Pagar
│   ├── Cash.tsx         # Cuadre de Caja
│   ├── Reports.tsx      # Reportes
│   └── Settings.tsx     # Configuracion
└── App.tsx          # Rutas
```

## Modulos incluidos

- Punto de Venta (POS) con carrito y recibos
- Inventario con gestion de IMEI para telefonos
- Taller de reparaciones con estados
- Cuentas por Cobrar (clientes)
- Cuentas por Pagar (suplidores)
- Cuadre de Caja con gastos
- Reportes con exportacion CSV
- Configuracion multi-usuario con permisos

## Stack Tecnologico

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Auth + API REST)
- Zustand (estado global)
- Lucide React (iconos)
