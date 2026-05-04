import { supabase } from '../src/supabase';

async function checkSchema() {
  const { data, error } = await supabase
    .from('user_reviews')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching user_reviews:', error);
  } else {
    console.log('Columns in user_reviews:', Object.keys(data[0] || {}));
  }
}

checkSchema();
