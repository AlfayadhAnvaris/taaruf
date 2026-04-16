import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hahmffnafuwovwzyszzu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhaG1mZm5hZnV3b3Z3enlzenp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMzYyMjgsImV4cCI6MjA5MTcxMjIyOH0.Ci4cUstTd4xAZOX1mB1l1AYP0MwSYLTWsFleo8jBU9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addModul6() {
  console.log('--- Memulai Migrasi Modul 6 ---');

  // 1. Insert Course
  const { error: cErr } = await supabase.from('courses').upsert({
    id: 6,
    title: 'Modul 6: Etika Pernikahan dalam Islam',
    description: 'Membahas adab malam pertama, sikap lemah lembut kepada pasangan, dan rahasia rumah tangga menurut syariat.',
    order_index: 6,
    is_active: true
  });
  if (cErr) { console.error('Gagal tambah modul:', cErr); return; }
  console.log('✓ Modul 6 Berhasil ditambahkan');

  // 2. Insert Lessons
  const { error: lErr } = await supabase.from('lessons').upsert([
    { 
      id: 'v6-1', 
      course_id: 6, 
      title: 'Etika Pernikahan & Adab Malam Pertama', 
      type: 'video', 
      video_url: 'https://www.youtube.com/embed/bWZyWAnIMpU', 
      duration: '15:00', 
      order_index: 1 
    },
    { 
      id: 'q6-1', 
      course_id: 6, 
      title: 'Kuis Modul 6: Etika Pernikahan', 
      type: 'quiz', 
      order_index: 2 
    }
  ]);
  if (lErr) { console.error('Gagal tambah lesson:', lErr); return; }
  console.log('✓ Lesson Modul 6 Berhasil ditambahkan');

  // 3. Insert Quiz Questions
  await supabase.from('quiz_questions').delete().eq('lesson_id', 'q6-1');

  const { error: qErr } = await supabase.from('quiz_questions').insert([
    {
      lesson_id: 'q6-1',
      question_text: 'Apa niat utama seorang muslim dalam melangsungkan pernikahan?',
      options: ['Mencari kekayaan pasangan', 'Mengikuti tren sosial semata', 'Ibadah kepada Allah dan menjaga kehormatan diri', 'Sekadar memenuhi keinginan orang tua'],
      correct_index: 2,
      order_index: 1
    },
    {
      lesson_id: 'q6-1',
      question_text: 'Apa yang disunnahkan bagi suami saat pertama kali masuk ke kamar pengantin menemui istrinya?',
      options: ['Langsung mengajak berdiskusi masalah keuangan', 'Bersikap lembut, menyapa, dan memberikan suguhan ringan seperti minuman', 'Bersikap tegas agar langsung disegani sebagai kepala keluarga', 'Menuntut hak-hak suami secara langsung'],
      correct_index: 1,
      order_index: 2
    },
    {
      lesson_id: 'q6-1',
      question_text: 'Di mana posisi tangan suami saat membacakan doa keberkahan untuk istrinya di malam pertama?',
      options: ['Di pundak istri', 'Di punggung istri', 'Di kening atau ubun-ubun istri', 'Di telapak tangan istri'],
      correct_index: 2,
      order_index: 3
    },
    {
      lesson_id: 'q6-1',
      question_text: 'Shalat apa yang dianjurkan untuk dilakukan bersama pasangan pada malam pertama pernikahan?',
      options: ['Shalat sunnah dua rakaat berjamaah', 'Shalat fardhu lima waktu berturut-turut', 'Shalat sunnah Tahajud 11 rakaat', 'Shalat sunnah Istikharah kembali'],
      correct_index: 0,
      order_index: 4
    },
    {
      lesson_id: 'q6-1',
      question_text: 'Manakah di bawah ini yang merupakan larangan keras (haram) terkait hubungan suami istri?',
      options: ['Berdoa sebelum memulai hubungan', 'Makan bersama sebelum mandi wajib', 'Menyebarkan rahasia atau detail hubungan intim kepada orang lain', 'Melaksanakan shalat sunnah bersama sebelum berhubungan'],
      correct_index: 2,
      order_index: 5
    }
  ]);
  if (qErr) { console.error('Gagal tambah kuis:', qErr); return; }
  console.log('✓ Pertanyaan Kuis Modul 6 Berhasil ditambahkan');
  console.log('--- Migrasi Selesai ---');
}

addModul6();
