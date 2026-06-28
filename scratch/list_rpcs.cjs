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
  // Try to query pg_catalog tables via PostgREST to list functions or tables, but PostgREST usually blocks it. Let's see if it works.
  const { data, error } = await supabase.from('pg_proc').select('proname').limit(10);
  console.log('pg_proc:', data, 'error:', error);

  // Let's try to query public schema information if available
  const { data: tables, error: tablesErr } = await supabase.from('pg_tables').select('tablename').eq('schemaname', 'public');
  console.log('pg_tables:', tables, 'error:', tablesErr);
}
run();
