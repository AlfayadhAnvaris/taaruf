const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envContent = fs.readFileSync('d:/taaruf/.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@mail.com',
    password: '123456'
  });
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  const targetId = '394f85e9-9d2d-44b7-ba89-353e914f8964';
  console.log(`Trying to update status of request ${targetId} to 'test_status_val'...`);
  const { data, error } = await supabase
    .from('taaruf_requests')
    .update({ status: 'test_status_val' })
    .eq('id', targetId)
    .select();
    
  if (error) {
    console.log('Update failed with error:', error.message || error);
  } else {
    console.log('Update succeeded! Returned data:', data);
    
    // Revert it back to pending_target
    console.log('Reverting status back to pending_target...');
    await supabase
      .from('taaruf_requests')
      .update({ status: 'pending_target' })
      .eq('id', targetId);
  }
  
  await supabase.auth.signOut();
}
run();
