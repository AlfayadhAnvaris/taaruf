const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function authAndUpsert() {
  // Login as ikhwan (since they are using ikhwan account)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ikhwan@mail.com', // Assumption from screenshot
    password: 'password123'
  });
  
  if (authError) {
    console.log("Login failed", authError);
    return;
  }
  
  const user = authData.user;
  console.log("Logged in as", user.id);
  
  // Upsert cv_profiles
  const payload = {
    user_id: user.id,
    kesehatan: 'Sangat Sehat',
    tinggi_badan: '175',
    berat_badan: '70',
    ciri_fisik: 'Tidak ada'
  };
  
  const { data, error } = await supabase.from('cv_profiles').upsert(payload).select();
  console.log('Upsert CV Error:', error);
  console.log('Upsert CV Data:', data);
}

authAndUpsert();
