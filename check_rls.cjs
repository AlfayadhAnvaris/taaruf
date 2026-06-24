const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkRLS() {
  const { data, error } = await supabase.from('cv_profiles').select('*').limit(1);
  if (error) {
    console.error("Select Error:", error);
  }
  
  // We can't query pg_policies using anon key.
}

checkRLS();
