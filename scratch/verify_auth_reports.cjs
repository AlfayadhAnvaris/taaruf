const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function verifyReportsFlow() {
  console.log("Attempting login as user (ikhwan1@mail.com)...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ikhwan1@mail.com',
    password: 'password123'
  });

  if (authError) {
    console.error("User login failed:", authError.message);
    console.log("Trying login with alternate test account (yusup@mail.com)...");
    const { data: authDataAlt, error: authErrorAlt } = await supabase.auth.signInWithPassword({
      email: 'yusup@mail.com',
      password: 'password123'
    });

    if (authErrorAlt) {
      console.error("Alternate user login failed:", authErrorAlt.message);
      return;
    }
    await testWithUser(authDataAlt.user);
  } else {
    await testWithUser(authData.user);
  }
}

async function testWithUser(user) {
  console.log("User logged in. ID:", user.id);

  // We need another user ID to report
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
    details: 'This is a test report created via verify_auth_reports.cjs',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  const { data: insertData, error: insertError } = await supabase
    .from('user_reports')
    .insert(reportPayload)
    .select();

  if (insertError) {
    console.error("Insert report as authenticated user failed:", insertError.message);
    return;
  }

  console.log("Insert report success! Row ID:", insertData[0].id);
  const reportId = insertData[0].id;

  // Now, try to query user_reports as this normal user
  const { data: userSelectData, error: userSelectError } = await supabase
    .from('user_reports')
    .select('*')
    .eq('id', reportId);

  if (userSelectError) {
    console.log("User reading report failed (this is expected if RLS blocks users from reading reports):", userSelectError.message);
  } else {
    console.log("User reading report success (can user read reports?):", userSelectData.length > 0 ? "Yes" : "No");
  }

  // Logout user
  await supabase.auth.signOut();

  // Login as admin
  console.log("\nLogging in as admin (admin@mail.com)...");
  const { data: adminAuth, error: adminErr } = await supabase.auth.signInWithPassword({
    email: 'admin@mail.com',
    password: 'password123'
  });

  if (adminErr) {
    console.error("Admin login failed:", adminErr.message);
    return;
  }

  console.log("Admin logged in. ID:", adminAuth.user.id);

  // Read the report as admin
  const { data: adminSelect, error: adminSelectErr } = await supabase
    .from('user_reports')
    .select('*, reporter:reporter_id(*), reported_user:reported_user_id(*)')
    .eq('id', reportId);

  if (adminSelectErr) {
    console.error("Admin reading reports failed:", adminSelectErr.message);
  } else {
    console.log("Admin reading reports success! Report found:", adminSelect);
  }

  // Update report as admin
  const { data: adminUpdate, error: adminUpdateErr } = await supabase
    .from('user_reports')
    .update({ status: 'reviewed' })
    .eq('id', reportId)
    .select();

  if (adminUpdateErr) {
    console.error("Admin updating report status failed:", adminUpdateErr.message);
  } else {
    console.log("Admin updating report status success! Updated row:", adminUpdate);
  }

  // Delete report as admin
  const { error: adminDeleteErr } = await supabase
    .from('user_reports')
    .delete()
    .eq('id', reportId);

  if (adminDeleteErr) {
    console.error("Admin deleting report failed:", adminDeleteErr.message);
  } else {
    console.log("Admin deleting report success!");
  }

  // Logout admin
  await supabase.auth.signOut();
  console.log("All tests completed!");
}

verifyReportsFlow();
