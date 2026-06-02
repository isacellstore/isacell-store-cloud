import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { supabase } from '@/lib/supabase';
import type { ModulePermissions } from '@/types';
import { Settings as SettingsIcon, Save, Users, Shield, Store } from 'lucide-react';

const MODULE_LABELS: Record<string, string> = {
  pos: 'Punto de Venta', inventory: 'Inventario', purchases: 'Compras', workshop: 'Taller',
  accounts: 'Cuentas x Cobrar', suppliers: 'Cuentas x Pagar', cash: 'Cuadre de Caja', reports: 'Reportes', settings: 'Configuracion',
};

export default function Settings() {
  const { user, company } = useAuthStore();
  const { showAlert } = useAppStore();
  const [activeTab, setActiveTab] = useState<'company' | 'users'>('company');
  const [companyForm, setCompanyForm] = useState({
    name: company?.name || '', rnc: company?.rnc || '', phone: company?.phone || '', address: company?.address || '',
    email: company?.email || '', tax_rate: company?.tax_rate || 18, max_discount_percent: company?.max_discount_percent || 10,
    sale_footer_message: company?.sale_footer_message || '', repair_footer_message: company?.repair_footer_message || '',
  });
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '', username: '', password: '', role: 'ventas',
    permissions: { pos: true, inventory: true, purchases: false, workshop: false, accounts: false, suppliers: false, cash: false, reports: false, settings: false } as ModulePermissions,
  });

  const handleSaveCompany = async () => {
    if (!company?.id) return;
    const { error } = await supabase.from('companies').update({
      name: companyForm.name, rnc: companyForm.rnc, phone: companyForm.phone, address: companyForm.address, email: companyForm.email,
      tax_rate: companyForm.tax_rate, max_discount_percent: companyForm.max_discount_percent,
      sale_footer_message: companyForm.sale_footer_message, repair_footer_message: companyForm.repair_footer_message,
    }).eq('id', company.id);
    if (error) { showAlert('Error guardando', 'error'); return; }
    showAlert('Configuracion guardada', 'success');
  };

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.username || !userForm.password) { 
        showAlert('Nombre, usuario y contraseña requeridos', 'error'); 
        return; 
    }
    
    if (userForm.password.length < 6) {
        showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    const email = `${userForm.username}@isacell.store`;
    
    try {
        // Obtener token de sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            showAlert('Sesión expirada. Por favor inicia sesión de nuevo.', 'error');
            return;
        }
        
        // Llamar a la Edge Function
        const response = await fetch('https://tbhhxbaomqhbapgobnxw.supabase.co/functions/v1/create-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                email,
                password: userForm.password,
                username: userForm.username,
                name: userForm.name,
                role: userForm.role,
                company_id: company?.id,
                permissions: userForm.permissions,
                user_metadata: {
                    company_id: company?.id,
                    name: userForm.name,
                    role: userForm.role
                }
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            showAlert('Error creando usuario: ' + (result.error || 'Error desconocido'), 'error');
            return;
        }
        
        showAlert('Usuario creado exitosamente', 'success');
        setShowUserForm(false);
        setUserForm({ 
            name: '', 
            username: '', 
            password: '', 
            role: 'ventas', 
            permissions: { pos: true, inventory: true, purchases: false, workshop: false, accounts: false, suppliers: false, cash: false, reports: false, settings: false } 
        });
        
    } catch (error: any) {
        showAlert('Error: ' + error.message, 'error');
    }
};

  if (user?.role !== 'admin') {
    return (
      <div className="bg-white p-8 rounded-xl shadow text-center">
        <Shield size={48} className="text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Acceso Restringido</h2>
        <p className="text-gray-500 mt-2">Solo administradores pueden acceder a esta seccion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="bg-white p-4 rounded-lg shadow-sm"><h2 className="text-2xl font-bold flex items-center gap-2"><SettingsIcon className="text-red-600" /> Configuracion</h2></div>
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('company')} className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${activeTab === 'company' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Store size={16} /> Empresa</button>
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${activeTab === 'users' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Users size={16} /> Usuarios</button>
      </div>

      {activeTab === 'company' && (
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h3 className="font-bold text-lg mb-4">Datos de la Empresa</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Nombre Negocio</label><input className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-red-500" value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">RNC</label><input className="w-full border rounded-lg p-2.5" value={companyForm.rnc} onChange={e => setCompanyForm({ ...companyForm, rnc: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Telefono</label><input className="w-full border rounded-lg p-2.5" value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Email</label><input className="w-full border rounded-lg p-2.5" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">% Max Descuento</label><input type="number" className="w-full border rounded-lg p-2.5" value={companyForm.max_discount_percent} onChange={e => setCompanyForm({ ...companyForm, max_discount_percent: parseInt(e.target.value) || 0 })} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Direccion</label><input className="w-full border rounded-lg p-2.5" value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Mensaje Pie de Factura</label><textarea className="w-full border rounded-lg p-2.5" rows={2} value={companyForm.sale_footer_message} onChange={e => setCompanyForm({ ...companyForm, sale_footer_message: e.target.value })} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Mensaje Pie de Taller</label><textarea className="w-full border rounded-lg p-2.5" rows={2} value={companyForm.repair_footer_message} onChange={e => setCompanyForm({ ...companyForm, repair_footer_message: e.target.value })} /></div>
          </div>
          <button onClick={handleSaveCompany} className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 flex items-center justify-center gap-2"><Save size={18} /> Guardar Configuracion</button>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
            <h3 className="font-bold text-lg">Usuarios del Sistema</h3>
            <button onClick={() => setShowUserForm(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Nuevo Usuario</button>
          </div>
          {showUserForm && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h4 className="font-bold mb-4">Crear Usuario</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium mb-1">Nombre Completo *</label><input className="w-full border rounded-lg p-2.5" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Usuario *</label><input className="w-full border rounded-lg p-2.5" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Contraseña *</label><input type="password" className="w-full border rounded-lg p-2.5" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Rol</label>
                  <select className="w-full border rounded-lg p-2.5 bg-white" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                    <option value="admin">Administrador</option><option value="ventas">Ventas</option><option value="tecnico">Tecnico</option><option value="supervisor">Supervisor</option>
                  </select></div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Permisos</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(MODULE_LABELS).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={userForm.permissions[key as keyof ModulePermissions]} onChange={e => setUserForm({ ...userForm, permissions: { ...userForm.permissions, [key]: e.target.checked } })} />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowUserForm(false)} className="flex-1 bg-gray-200 py-2 rounded font-bold">Cancelar</button>
                <button onClick={handleAddUser} className="flex-1 bg-red-600 text-white py-2 rounded font-bold">Crear Usuario</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
