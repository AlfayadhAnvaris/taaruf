const { createClient } = require('@supabase/supabase-js');
// Load env vars
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
  // Query to get triggers
  const { data: triggers, error: err1 } = await supabase.rpc('inspect_triggers', {}, { head: false });
  if (err1) {
    // If inspect_triggers function doesn't exist, we can run raw SQL if we have a way, or try listing triggers using postgres schema queries
    console.log('Error listing triggers:', err1.message);
  } else {
    console.log('Triggers:', triggers);
  }

  // Let's run a custom SQL query using a new script or just select from a system table if RLS allows, but wait! Supabase Client by default does not let you run arbitrary SQL unless you have a RPC function defined.
  // Let's check existing RPC functions!
  const { data: rpcs, error: err2 } = await supabase.from('pg_proc').select('proname');
  if (err2) {
    console.log('Error listing rpcs:', err2.message);
  } else {
    console.log('RPCs:', rpcs);
  }
}
check();
