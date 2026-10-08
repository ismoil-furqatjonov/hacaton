import { createClient } from '@supabase/supabase-js';

// ============================================================
// Supabase konfiguratsiyasi
// .env faylida VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY ni sozlang
// ============================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  supabaseUrl !== 'https://your-project.supabase.co';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export default supabase;
