const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Attempting insert without category...");
  const { data, error } = await supabase
    .from('lms_classes')
    .insert({
      title: 'Test Class Temp',
      is_published: false,
      level: 'Dasar'
    })
    .select();
  if (error) {
    console.error("Error inserting class:", error);
  } else {
    console.log("Insert success:", data);
    const { error: delErr } = await supabase.from('lms_classes').delete().eq('id', data[0].id);
    console.log("Delete cleanup success:", !delErr);
  }
}
run();
