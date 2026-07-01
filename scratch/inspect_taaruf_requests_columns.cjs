const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envContent = fs.readFileSync('d:/taaruf/.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@mail.com',
    password: '123456'
  });
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  const { data, error } = await supabase.from('taaruf_requests').select('*').limit(5);
  console.log('Error:', error);
  console.log('Keys:', data.length > 0 ? Object.keys(data[0]) : 'No data');
  if (data.length > 0) {
    console.log('Sample Row:', data[0]);
  }
}
run();
