const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log("Checking user_reports table...");
  const { data: reportsData, error: reportsError } = await supabase
    .from('user_reports')
    .select('*')
    .limit(5);

  if (reportsError) {
    console.error("Error reading user_reports:", reportsError);
  } else {
    console.log("Success reading user_reports. Rows found:", reportsData.length);
    console.log("First row (if any):", reportsData[0]);
  }

  console.log("\nChecking testimonials table...");
  const { data: testimonialsData, error: testimonialsError } = await supabase
    .from('testimonials')
    .select('*')
    .limit(5);

  if (testimonialsError) {
    console.error("Error reading testimonials:", testimonialsError);
  } else {
    console.log("Success reading testimonials. Rows found:", testimonialsData.length);
    console.log("First row (if any):", testimonialsData[0]);
  }
}

run();
