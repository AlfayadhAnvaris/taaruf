const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Checking lms_classes...");
  const { data, error } = await supabase.from('lms_classes').select('*').limit(1);
  if (error) {
    console.error("Error querying lms_classes:", error);
  } else {
    console.log("lms_classes first row:", data && data.length > 0 ? data[0] : "No rows found");
  }
}
run();
