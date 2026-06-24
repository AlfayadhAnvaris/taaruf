const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('course_enrollments')
    .update({ is_suspended: false })
    .eq('id', '00000000-0000-0000-0000-000000000000'); // UUID format to prevent type errors if UUID is used
  
  if (error) {
    console.log("Error response:", error.code, error.message);
  } else {
    console.log("Success! The column exists. Rows affected:", data);
  }
}
run();
