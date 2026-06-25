const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('profiles').select('id, email, name, role').eq('role', 'admin');
  if (error) {
    console.error("Error reading admins:", error.message);
  } else {
    console.log("Admin list:");
    console.log(data);
  }
}

run();
