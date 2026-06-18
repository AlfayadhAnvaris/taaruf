import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ PERHATIAN: Supabase URL dan Anon Key belum dikonfigurasi di file .env");
}

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const sid = params.get('sid');
  
  return {
    getItem: (key) => window.localStorage.getItem(sid ? `${key}-${sid}` : key),
    setItem: (key, value) => window.localStorage.setItem(sid ? `${key}-${sid}` : key, value),
    removeItem: (key) => window.localStorage.removeItem(sid ? `${key}-${sid}` : key),
  };
};

// Custom fetch wrapper to catch network errors and prevent unhandled promise rejections
const customFetch = async (url, options) => {
  try {
    return await fetch(url, options);
  } catch (error) {
    console.warn(`[Supabase Fetch Error] ${error.message} - URL might be unreachable.`);
    return new Response(JSON.stringify({ error: "Network error or Supabase is unreachable." }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

const createSupabaseClient = () => createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: getStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: customFetch
    }
  }
);

// Prevent multiple instances in development mode (Fast Refresh)
export const supabase = globalThis.supabaseClient || createSupabaseClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.supabaseClient = supabase;
}
