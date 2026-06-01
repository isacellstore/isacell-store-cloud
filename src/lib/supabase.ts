import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tbhhxbaomqhbapgobnxw.supabase.co';
const supabaseKey = 'sb_publishable_8wYVwL0CYzl__vyA_jqcIw_y_42A7Cc';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
