const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envConfig = {};
fs.readFileSync('d:/taaruf/.env', 'utf8').split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envConfig[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('taaruf_requests').select('*');
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}
run();
