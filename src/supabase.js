import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ PERHATIAN: Supabase URL dan Anon Key belum dikonfigurasi di file .env");
}

// Fungsi untuk mendapatkan ID unik tab ini
const getTabId = () => {
  if (typeof window === 'undefined') return 'default';
  // Gunakan window.name sebagai identifier tab yang persisten saat refresh 
  // tapi tidak dibagikan antar tab baru (kecuali window.open dengan target tertentu)
  if (!window.name || window.name === "") {
    window.name = "tab-" + Math.random().toString(36).substring(2, 9);
  }
  return window.name;
};

const storageId = getTabId();

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: window.sessionStorage, // Tetap gunakan sessionStorage
      storageKey: `sb-${storageId}-auth-token`, // Kunci unik agar broadcast tidak tabrakan
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
