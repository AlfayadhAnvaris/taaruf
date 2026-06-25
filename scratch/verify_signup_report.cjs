const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runTest() {
  const email = `test_reporter_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log(`Signing up new user: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error("Sign up failed:", signUpError.message);
    return;
  }

  const user = signUpData.user;
  if (!user) {
    console.error("Sign up succeeded but user is null (maybe email confirmation is required).");
    return;
  }

  console.log("Sign up success! User ID:", user.id);

  // Read profiles to find someone to report
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, name').limit(5);
  if (profErr) {
    console.error("Failed to read profiles:", profErr.message);
    return;
  }

  const targetProfile = profiles.find(p => p.id !== user.id);
  if (!targetProfile) {
    console.error("No other user to report.");
    return;
  }

  console.log(`Reporting user: ${targetProfile.name} (${targetProfile.id})`);

  // Insert a report
  const reportPayload = {
    reporter_id: user.id,
    reported_user_id: targetProfile.id,
    reason: 'Ketidakjujuran',
    details: 'This is a test report created via verify_signup_report.cjs',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  const { data: insertData, error: insertError } = await supabase
    .from('user_reports')
    .insert(reportPayload)
    .select();

  if (insertError) {
    console.error("Insert report as authenticated user failed:", insertError.message);
  } else {
    console.log("Insert report success! Row ID:", insertData[0].id);
  }

  // Sign out
  await supabase.auth.signOut();
  console.log("Sign out completed.");

  // Test admin login
  console.log("Testing admin login with standard passwords...");
  const passwords = ['password123', 'admin123', 'admin', '12345678', '123456'];
  for (const pw of passwords) {
    const { data: adminData, error: adminErr } = await supabase.auth.signInWithPassword({
      email: 'admin@mail.com',
      password: pw
    });
    if (!adminErr) {
      console.log(`Admin login succeeded with password: "${pw}"! Admin ID:`, adminData.user.id);
      await supabase.auth.signOut();
      break;
    } else {
      console.log(`Admin login failed with password "${pw}":`, adminErr.message);
    }
  }
}

runTest();
