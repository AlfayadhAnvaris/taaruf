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

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const testColumns = [
    'id', 'sender_id', 'receiver_id', 'target_id', 'target_user_id', 
    'sender_alias', 'target_alias', 'sender_email', 'target_email', 
    'target_cv_id', 'status', 'created_at', 'updated_at'
  ];

  for (const col of testColumns) {
    const { data, error } = await supabase.from('taaruf_requests').select(col).limit(1);
    if (error) {
      console.log(`Column '${col}': ERROR:`, error.message);
    } else {
      console.log(`Column '${col}': OK`);
    }
  }
}
run();
