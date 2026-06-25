const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runPostMigrationVerification() {
  console.log("=== RUNNING POST-MIGRATION VERIFICATION ===");
  
  // 1. Create a random user for reporting
  const email = `post_mig_reporter_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log(`[USER] Signing up new reporter: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error("[USER] Sign up failed:", signUpError.message);
    return;
  }

  const user = signUpData.user;
  if (!user) {
    console.error("[USER] Sign up succeeded but user is null.");
    return;
  }

  console.log("[USER] Reporter signed up successfully. ID:", user.id);

  // Read profiles to find someone to report
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, name').limit(5);
  if (profErr) {
    console.error("[USER] Failed to read profiles:", profErr.message);
    return;
  }

  const targetProfile = profiles.find(p => p.id !== user.id);
  if (!targetProfile) {
    console.error("[USER] No other user to report.");
    return;
  }

  console.log(`[USER] Target profile to report: ${targetProfile.name} (${targetProfile.id})`);

  // Insert a report
  const reportPayload = {
    reporter_id: user.id,
    reported_user_id: targetProfile.id,
    reason: 'Ketidakjujuran',
    details: 'This is a verification report to test user_reports insertion after RLS policies are applied.',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  console.log("[USER] Inserting report...");
  const { data: insertData, error: insertError } = await supabase
    .from('user_reports')
    .insert(reportPayload)
    .select();

  if (insertError) {
    console.error("[USER] ERROR: Insert report failed. RLS might not be applied yet:", insertError.message);
    console.log("Please make sure you ran the SQL script in Supabase SQL Editor!");
    await supabase.auth.signOut();
    return;
  }

  const reportId = insertData[0].id;
  console.log("[USER] SUCCESS: Report inserted. ID:", reportId);

  // Log out user
  await supabase.auth.signOut();
  console.log("[USER] Signed out.");

  // 2. Login as admin
  console.log("\n[ADMIN] Logging in as admin (admin@mail.com)...");
  const { data: adminAuth, error: adminErr } = await supabase.auth.signInWithPassword({
    email: 'admin@mail.com',
    password: '123456'
  });

  if (adminErr) {
    console.error("[ADMIN] Admin login failed:", adminErr.message);
    return;
  }

  console.log("[ADMIN] Admin logged in. ID:", adminAuth.user.id);

  // Read the report as admin
  console.log("[ADMIN] Reading report...");
  const { data: adminSelect, error: adminSelectErr } = await supabase
    .from('user_reports')
    .select('*, reporter:reporter_id(*), reported_user:reported_user_id(*)')
    .eq('id', reportId);

  if (adminSelectErr) {
    console.error("[ADMIN] ERROR: Admin failed to read reports:", adminSelectErr.message);
  } else {
    console.log("[ADMIN] SUCCESS: Admin read report:", adminSelect[0]?.details);
  }

  // Update report as admin
  console.log("[ADMIN] Updating report status to 'reviewed'...");
  const { data: adminUpdate, error: adminUpdateErr } = await supabase
    .from('user_reports')
    .update({ status: 'reviewed' })
    .eq('id', reportId)
    .select();

  if (adminUpdateErr) {
    console.error("[ADMIN] ERROR: Admin failed to update report:", adminUpdateErr.message);
  } else {
    console.log("[ADMIN] SUCCESS: Admin updated report status:", adminUpdate[0]?.status);
  }

  // Delete report as admin
  console.log("[ADMIN] Deleting report...");
  const { error: adminDeleteErr } = await supabase
    .from('user_reports')
    .delete()
    .eq('id', reportId);

  if (adminDeleteErr) {
    console.error("[ADMIN] ERROR: Admin failed to delete report:", adminDeleteErr.message);
  } else {
    console.log("[ADMIN] SUCCESS: Admin deleted report successfully.");
  }

  // 3. Test Testimonials management as Admin
  console.log("\n[ADMIN] Testing Testimonials CRUD...");
  const testiPayload = {
    name: 'Verification Testimonial',
    role: 'Verification Role',
    content: 'This is a test testimonial content to verify post-migration admin access.',
    rating: 5,
    is_published: false
  };

  console.log("[ADMIN] Inserting testimonial...");
  const { data: testiInsert, error: testiInsertErr } = await supabase.from('testimonials').insert(testiPayload).select();
  if (testiInsertErr) {
    console.error("[ADMIN] ERROR: Testimonial insert failed:", testiInsertErr.message);
  } else {
    const testiId = testiInsert[0].id;
    console.log("[ADMIN] SUCCESS: Testimonial inserted. ID:", testiId);

    console.log("[ADMIN] Updating testimonial is_published...");
    const { data: testiUpdate, error: testiUpdateErr } = await supabase
      .from('testimonials')
      .update({ is_published: true })
      .eq('id', testiId)
      .select();
    
    if (testiUpdateErr) {
      console.error("[ADMIN] ERROR: Testimonial update failed:", testiUpdateErr.message);
    } else {
      console.log("[ADMIN] SUCCESS: Testimonial updated is_published:", testiUpdate[0]?.is_published);
    }

    console.log("[ADMIN] Deleting testimonial...");
    const { error: testiDeleteErr } = await supabase.from('testimonials').delete().eq('id', testiId);
    if (testiDeleteErr) {
      console.error("[ADMIN] ERROR: Testimonial delete failed:", testiDeleteErr.message);
    } else {
      console.log("[ADMIN] SUCCESS: Testimonial deleted successfully.");
    }
  }

  // Logout admin
  await supabase.auth.signOut();
  console.log("\n=== POST-MIGRATION VERIFICATION COMPLETE ===");
}

runPostMigrationVerification();
