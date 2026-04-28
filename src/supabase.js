import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ PERHATIAN: Supabase URL dan Anon Key belum dikonfigurasi di file .env");
}

// Menghapus logika tab-specific storage untuk mendukung auto-login antar tab
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: window.localStorage, // Menggunakan localStorage agar sesi dibagikan antar tab
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
