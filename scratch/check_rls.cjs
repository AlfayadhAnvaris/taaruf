const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Checking RLS policies...");
  try {
    const { data, error } = await supabase.from('course_enrollments').select('*').limit(1);
    console.log("Fetch test:", { error, data });
  } catch (err) {
    console.error("Fetch error:", err);
  }

  try {
    const { data, error } = await supabase.from('course_enrollments').update({ is_suspended: true }).eq('id', 1).select();
    console.log("Update test:", { error, data });
  } catch (err) {
    console.error("Update error:", err);
  }
}
run();
