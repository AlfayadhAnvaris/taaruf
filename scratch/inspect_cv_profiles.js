const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const { data: cvs, error } = await supabase
    .from('cv_profiles')
    .select('id, user_id, status, created_at, updated_at');
  
  if (error) {
    console.error('Error fetching cvs:', error);
    return;
  }
  
  console.log(`Total cv_profiles rows: ${cvs.length}`);
  
  const userCounts = {};
  cvs.forEach(cv => {
    userCounts[cv.user_id] = userCounts[cv.user_id] || [];
    userCounts[cv.user_id].push(cv);
  });
  
  console.log('\nUsers with multiple CV profiles:');
  let duplicatesFound = false;
  for (const [userId, list] of Object.entries(userCounts)) {
    if (list.length > 1) {
      duplicatesFound = true;
      console.log(`User ID: ${userId} has ${list.length} CV profiles:`);
      list.forEach(cv => {
        console.log(`  - CV ID: ${cv.id}, Status: ${cv.status}, Updated At: ${cv.updated_at || cv.created_at}`);
      });
    }
  }
  if (!duplicatesFound) {
    console.log('None found.');
  }
}

inspect();
