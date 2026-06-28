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
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  console.log('supabaseUrl:', supabaseUrl);
  // Let's inspect active triggers on table taaruf_requests or similar by executing an SQL statement.
  // Wait, does Supabase have SQL query endpoint? No, but let's query via RPC or check if there's any trigger error.
  // Wait! Let's insert a duplicate row or run a query using standard select.
  // Let's print table names and descriptions if possible.
  // Wait, let's try to query public tables using supabase.from.
  const { data, error } = await supabase.from('taaruf_requests').select('*');
  console.log('taaruf_requests data count:', data?.length, 'error:', error);
}
check();
