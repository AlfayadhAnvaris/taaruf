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
  const email = 'admin@mail.com';
  const password = 'password123';
  
  console.log(`Signing in as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error("Auth error:", authError.message);
    return;
  }
  
  console.log("Logged in. Reading count of requests...");
  const { data: beforeReqs, error: fetchErr } = await supabase.from('taaruf_requests').select('id');
  if (fetchErr) {
    console.error("Fetch error:", fetchErr.message);
    return;
  }
  console.log("Count before update:", beforeReqs.length);
  
  // Find an active request to update
  const targetId = '394f85e9-9d2d-44b7-ba89-353e914f8964';
  console.log(`Updating status of request ${targetId} to 'qna'...`);
  const { error: updateErr } = await supabase
    .from('taaruf_requests')
    .update({ status: 'qna', updated_at: new Date().toISOString() })
    .eq('id', targetId);
    
  if (updateErr) {
    console.error("Update error:", updateErr.message);
    return;
  }
  console.log("Update succeeded.");
  
  console.log("Reading count of requests after update...");
  const { data: afterReqs, error: fetchErr2 } = await supabase.from('taaruf_requests').select('id');
  if (fetchErr2) {
    console.error("Fetch error 2:", fetchErr2.message);
    return;
  }
  console.log("Count after update:", afterReqs.length);
  
  if (afterReqs.length > beforeReqs.length) {
    console.log("WARNING: A NEW ROW WAS INDEED INSERTED!");
    // Find the new row
    const beforeIds = new Set(beforeReqs.map(r => r.id));
    const newRows = afterReqs.filter(r => !beforeIds.has(r.id));
    console.log("New row IDs:", newRows);
  } else {
    console.log("No new row was inserted. The database trigger did not duplicate the row.");
  }
  
  // Revert the update to pending_target
  console.log("Reverting status back to 'pending_target'...");
  await supabase
    .from('taaruf_requests')
    .update({ status: 'pending_target', updated_at: new Date().toISOString() })
    .eq('id', targetId);
    
  await supabase.auth.signOut();
}
run();
