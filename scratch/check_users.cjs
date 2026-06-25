const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('profiles').select('id, email, name, role').limit(20);
  if (error) {
    console.error("Error reading profiles:", error.message);
  } else {
    console.log("Profiles list:");
    console.log(data);
  }
}

run();
