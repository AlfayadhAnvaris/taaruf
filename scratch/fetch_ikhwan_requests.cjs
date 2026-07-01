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
  const email = 'ikhwan1@mail.com';
  const password = 'password123';
  
  console.log(`Signing in as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error("Auth error:", authError.message);
    return;
  }
  
  console.log("Logged in. Fetching taaruf requests...");
  const { data: requests, error: reqError } = await supabase.from('taaruf_requests').select('*');
  if (reqError) {
    console.error("Fetch requests error:", reqError.message);
    return;
  }
  
  console.log("Requests found:", requests.length);
  console.log(JSON.stringify(requests, null, 2));
}
run();
