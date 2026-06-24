const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Read .env from parent directory
const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('course_enrollments').select('*').limit(1);
  if (error) {
    console.error("Error querying course_enrollments:", error);
    return;
  }
  console.log("Success! Columns in course_enrollments:", data.length > 0 ? Object.keys(data[0]) : "No rows found in table");
}
run();
