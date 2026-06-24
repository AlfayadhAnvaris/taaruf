const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Checking lms_categories...");
  const catRes = await supabase.from('lms_categories').select('*');
  if (catRes.error) {
    console.error("Error querying lms_categories:", catRes.error);
  } else {
    console.log("lms_categories success:", catRes.data);
  }

  console.log("Checking lms_levels...");
  const lvlRes = await supabase.from('lms_levels').select('*');
  if (lvlRes.error) {
    console.error("Error querying lms_levels:", lvlRes.error);
  } else {
    console.log("lms_levels success:", lvlRes.data);
  }

  console.log("Checking course_enrollments...");
  const enrollRes = await supabase.from('course_enrollments').select('*');
  if (enrollRes.error) {
    console.error("Error querying course_enrollments:", enrollRes.error);
  } else {
    console.log("course_enrollments success, rows count:", enrollRes.data.length);
  }
}
run();
