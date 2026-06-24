const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  // Try to upsert invalid type to trigger an error message that reveals the type
  const payload = {
    user_id: '11111111-1111-1111-1111-111111111111',
    age: 'not_an_int'
  };
  const { error } = await supabase.from('cv_profiles').upsert(payload);
  console.log("Upsert error:", error);
}

check();
