const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkCvProfiles() {
  const { data, error } = await supabase.from('cv_profiles').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("cv_profiles Columns:", data.length > 0 ? Object.keys(data[0]) : "No rows found in table");
    if (data.length > 0) {
      console.log("Sample row:", data[0]);
    }
  }
}

checkCvProfiles();
