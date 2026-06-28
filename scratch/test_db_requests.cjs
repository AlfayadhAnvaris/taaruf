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

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  // 1. Get some candidate CVs
  const { data: cvs, error: cvErr } = await supabase.from('cv_profiles').select('*').limit(3);
  if (cvErr) {
    console.error('Error fetching CVs:', cvErr);
    return;
  }
  if (!cvs || cvs.length < 2) {
    console.log('Not enough CVs in DB to test.');
    return;
  }

  const sender = 'test-sender-id';
  const rec1 = cvs[0];
  const rec2 = cvs[1];

  console.log('Inserting request 1 from', sender, 'to', rec1.user_id);
  const { data: d1, error: e1 } = await supabase.from('taaruf_requests').insert({
    sender_id: sender,
    receiver_id: rec1.user_id,
    sender_alias: 'TestSender',
    target_alias: rec1.alias,
    sender_email: 'test@example.com',
    target_email: 'target1@example.com',
    target_cv_id: rec1.id,
    status: 'pending_target'
  }).select();

  console.log('Insert 1 result:', d1, 'Error:', e1);

  console.log('Inserting request 2 from', sender, 'to', rec2.user_id);
  const { data: d2, error: e2 } = await supabase.from('taaruf_requests').insert({
    sender_id: sender,
    receiver_id: rec2.user_id,
    sender_alias: 'TestSender',
    target_alias: rec2.alias,
    sender_email: 'test@example.com',
    target_email: 'target2@example.com',
    target_cv_id: rec2.id,
    status: 'pending_target'
  }).select();

  console.log('Insert 2 result:', d2, 'Error:', e2);

  // Clean up
  await supabase.from('taaruf_requests').delete().eq('sender_id', sender);
}

run();
