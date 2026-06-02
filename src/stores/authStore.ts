import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, Company, ModulePermissions } from '@/types';
import { getDefaultPermissions } from '@/lib/utils';
import { ROLES } from '@/lib/constants';

interface AuthState {
  user: User | null;
  company: Company | null;
  companyId: string | null;
  permissions: ModulePermissions;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  hasPermission: (module: keyof ModulePermissions) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  company: null,
  companyId: null,
  permissions: getDefaultPermissions(''),
  isLoading: true,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    try {
      const email = username.includes('@') ? username : `${username}@isacell.store`;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) return { success: false, error: error.message };

      if (data.user) {
        const companyId = data.user.user_metadata?.company_id;
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', data.user.id)
          .maybeSingle();

        if (userError) {
          console.error('Error fetching user:', userError);
          return { success: false, error: 'Error al obtener datos del usuario' };
        }

        if (userData) {
          const permissions = (userData.permissions as ModulePermissions) || getDefaultPermissions(userData.role as string);
          const user = userData as unknown as User;
          set({ 
            user, 
            companyId: companyId || userData.company_id as string,
            permissions,
            isAuthenticated: true,
          });

          if (companyId || userData.company_id) {
            const { data: companyData, error: companyError } = await supabase
              .from('companies')
              .select('*')
              .eq('id', (companyId || userData.company_id) as string)
              .maybeSingle();
            
            if (companyError) {
              console.error('Error fetching company:', companyError);
            } else if (companyData) {
              set({ company: companyData as unknown as Company });
            }
          }
        } else {
          return { success: false, error: 'Usuario no encontrado en la base de datos' };
        }
        return { success: true };
      }
      return { success: false, error: 'Usuario no encontrado' };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: err.message || 'Error de login' };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, company: null, companyId: null, permissions: getDefaultPermissions(''), isAuthenticated: false });
    window.location.href = '/login';
  },

  checkSession: async () => {
    try {
      set({ isLoading: true });
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const companyId = session.user.user_metadata?.company_id;
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .maybeSingle();
        
        if (userError) {
          console.error('Session check - user error:', userError);
        } else if (userData) {
          const permissions = (userData.permissions as ModulePermissions) || getDefaultPermissions(userData.role as string);
          set({ 
            user: userData as unknown as User,
            companyId: companyId || userData.company_id as string,
            permissions,
            isAuthenticated: true,
          });
          if (companyId || userData.company_id) {
            const { data: companyData, error: companyError } = await supabase
              .from('companies')
              .select('*')
              .eq('id', (companyId || userData.company_id) as string)
              .maybeSingle();
            
            if (companyError) {
              console.error('Session check - company error:', companyError);
            } else if (companyData) {
              set({ company: companyData as unknown as Company });
            }
          }
        }
      }
    } catch (e) { 
      console.error('Session check error:', e); 
    }
    finally { set({ isLoading: false }); }
  },

  hasPermission: (module: keyof ModulePermissions) => {
    if (get().isAdmin()) return true;
    return get().permissions[module] === true;
  },
  isAdmin: () => get().user?.role === ROLES.ADMIN,
}));
