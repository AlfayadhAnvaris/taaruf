const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'cv_profiles' });
  if (error) {
    // try querying pg_policies
    const { data: pData, error: pErr } = await supabase.from('pg_policies').select('*').eq('tablename', 'cv_profiles');
    if (pErr) {
      console.log('Failed to fetch pg_policies using service role key. Are we using the service role key?');
      console.log(process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No');
    } else {
      console.log(pData);
    }
  } else {
    console.log(data);
  }
}

check();
