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

const ikhwans = [
  'ikhwanulkurniarahman@gmail.com',
  'ikhwan@mail.com',
  'ikhwan@idn.id',
  'ikhwan5@mail.com'
];

const passwords = [
  'password123',
  'Password123!',
  'Password789!',
  '123456',
  '12345678'
];

async function run() {
  for (const email of ikhwans) {
    for (const password of passwords) {
      console.log(`Trying ${email} with password ${password}...`);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        console.log(`SUCCESS! Logged in as ${email}. User ID: ${data.user.id}`);
        // Fetch requests
        const { data: requests, error: reqError } = await supabase.from('taaruf_requests').select('*');
        console.log('Requests for this user:', requests);
        await supabase.auth.signOut();
        return;
      }
    }
  }
  console.log("None of the ikhwan login attempts succeeded.");
}
run();
