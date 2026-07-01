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
  const rpcs = ['exec_sql', 'run_sql', 'execute_sql', 'sql', 'query'];
  for (const rpc of rpcs) {
    console.log(`Checking RPC: ${rpc}...`);
    const { data, error } = await supabase.rpc(rpc, { sql: 'SELECT 1' });
    console.log(`RPC ${rpc} error:`, error?.message || error);
    if (!error) {
      console.log(`RPC ${rpc} SUCCESS! Data:`, data);
      return;
    }
  }
}
run();
