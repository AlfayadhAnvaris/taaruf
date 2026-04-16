import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hahmffnafuwovwzyszzu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhaG1mZm5hZnV3b3Z3enlzenp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMzYyMjgsImV4cCI6MjA5MTcxMjIyOH0.Ci4cUstTd4xAZOX1mB1l1AYP0MwSYLTWsFleo8jBU9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugData() {
  console.log('--- Debug Data Progres ---');
  
  // Ambil profile ikhwan1
  const { data: profile } = await supabase.from('profiles').select('*').eq('email', 'ikhwan1@gmail.com').single();
  console.log('Profile Ikhwan1:', profile);

  if (profile) {
    // Ambil progres mereka
    const { data: progress } = await supabase.from('user_lesson_progress').select('*').eq('user_id', profile.id);
    console.log(`Jumlah progres ditemukan untuk ID ${profile.id}:`, progress?.length || 0);
    if (progress) console.log('Sampel Data:', progress[0]);
  }

  // Cek jika ada progres tapi dengan user_id lain (mungkin email?)
  const { data: allProgress } = await supabase.from('user_lesson_progress').select('*').limit(5);
  console.log('Contoh 5 data progres random:', allProgress);
}

debugData();
