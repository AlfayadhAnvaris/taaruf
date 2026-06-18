require('dotenv').config({ path: 'd:/taaruf/.env.local' });
require('dotenv').config({ path: 'd:/taaruf/.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('taaruf_requests').select('*').limit(1);
  console.log('Error:', JSON.stringify(error, null, 2));
  console.log('Data:', JSON.stringify(data, null, 2));
}

test();
