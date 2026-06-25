const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log("Checking academy_leaderboard view...");
  const { data, error } = await supabase
    .from('academy_leaderboard')
    .select('*')
    .limit(5);

  if (error) {
    console.error("Error reading academy_leaderboard:", error);
  } else {
    console.log("Success! Rows found:", data.length);
    console.log("Rows:", data);
  }
}

run();
