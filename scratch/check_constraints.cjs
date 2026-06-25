const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkConstraints() {
  // Query information_schema via RPC or raw query if we have an RPC, 
  // or query a simple taaruf_request to see if we can read it.
  // Wait, let's query a sample of taaruf_requests to see what columns they have.
  const { data, error } = await supabase.from('taaruf_requests').select('*').limit(5);
  if (error) {
    console.error('Error fetching taaruf_requests:', error);
  } else {
    console.log('Sample taaruf_requests:', data);
  }
}

checkConstraints();
