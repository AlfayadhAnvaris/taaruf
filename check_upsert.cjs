const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); // Using service role to bypass RLS for testing

async function checkUpsert() {
  const { data: users, error: getErr } = await supabase.from('profiles').select('id').limit(1);
  if (getErr) { console.error(getErr); return; }
  if (users.length === 0) { console.log('no users'); return; }
  const uid = users[0].id;

  const payload = {
    user_id: uid,
    hobi: 'Membaca',
    tinggi_badan: '170',
    status: 'pending'
  };

  const { data, error } = await supabase.from('cv_profiles').upsert(payload).select();
  console.log('Upsert Error:', error);
  console.log('Upsert Data:', data);
}

checkUpsert();
