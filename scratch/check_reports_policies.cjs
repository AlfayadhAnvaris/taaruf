const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testReports() {
  console.log("--- TEST USER_REPORTS ---");
  // 1. Try to read user_reports
  const { data: selectData, error: selectError } = await supabase.from('user_reports').select('*');
  if (selectError) {
    console.error("Select reports failed:", selectError.message);
  } else {
    console.log("Select reports success. Rows:", selectData.length);
  }

  // Find a valid reporter (user) and reported user from profiles
  const { data: users, error: usersErr } = await supabase.from('profiles').select('id, name, role').limit(5);
  if (usersErr) {
    console.error("Failed to get users:", usersErr.message);
    return;
  }
  if (users.length < 2) {
    console.log("Not enough users to test reporting. Total users:", users.length);
    return;
  }

  const reporter = users[0];
  const reported = users[1];
  console.log(`Using reporter: ${reporter.name} (${reporter.id}), reported: ${reported.name} (${reported.id})`);

  // Try to insert a report
  const testReport = {
    reporter_id: reporter.id,
    reported_user_id: reported.id,
    reason: 'Ketidakjujuran',
    details: 'This is a test report created by scratch script to check database access.',
    status: 'pending'
  };

  const { data: insertData, error: insertError } = await supabase.from('user_reports').insert(testReport).select();
  if (insertError) {
    console.error("Insert report failed:", insertError.message);
  } else {
    console.log("Insert report success! Inserted:", insertData);
    const newId = insertData[0].id;

    // Try to update the status of the report
    const { data: updateData, error: updateError } = await supabase
      .from('user_reports')
      .update({ status: 'reviewed' })
      .eq('id', newId)
      .select();
    
    if (updateError) {
      console.error("Update report status failed:", updateError.message);
    } else {
      console.log("Update report status success! Updated:", updateData);
    }

    // Try to delete the report
    const { error: deleteError } = await supabase.from('user_reports').delete().eq('id', newId);
    if (deleteError) {
      console.error("Delete report failed:", deleteError.message);
    } else {
      console.log("Delete report success!");
    }
  }

  console.log("\n--- TEST TESTIMONIALS ---");
  // Test Testimonials CRUD
  const { data: testiSelect, error: testiSelectErr } = await supabase.from('testimonials').select('*');
  if (testiSelectErr) {
    console.error("Select testimonials failed:", testiSelectErr.message);
  } else {
    console.log("Select testimonials success. Rows:", testiSelect.length);
  }

  const testTestimonial = {
    name: 'Test Name',
    role: 'Test Role',
    content: 'This is a test testimonial content.',
    rating: 5,
    is_published: false
  };

  const { data: testiInsert, error: testiInsertErr } = await supabase.from('testimonials').insert(testTestimonial).select();
  if (testiInsertErr) {
    console.error("Insert testimonial failed:", testiInsertErr.message);
  } else {
    console.log("Insert testimonial success! Inserted:", testiInsert);
    const testiId = testiInsert[0].id;

    // Update testimonial
    const { data: testiUpdate, error: testiUpdateErr } = await supabase
      .from('testimonials')
      .update({ is_published: true })
      .eq('id', testiId)
      .select();
    
    if (testiUpdateErr) {
      console.error("Update testimonial failed:", testiUpdateErr.message);
    } else {
      console.log("Update testimonial success! Updated:", testiUpdate);
    }

    // Delete testimonial
    const { error: testiDeleteErr } = await supabase.from('testimonials').delete().eq('id', testiId);
    if (testiDeleteErr) {
      console.error("Delete testimonial failed:", testiDeleteErr.message);
    } else {
      console.log("Delete testimonial success!");
    }
  }
}

testReports();
