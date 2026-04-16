-- ================================================================
-- ADD MODULE 6: Etika Pernikahan dalam Islam
-- Based on: https://youtu.be/bWZyWAnIMpU
-- ================================================================

-- 1. Insert Course
INSERT INTO public.courses (id, title, description, order_index, is_active) VALUES
(6, 'Modul 6: Etika Pernikahan dalam Islam',
   'Membahas adab malam pertama, sikap lemah lembut kepada pasangan, dan rahasia rumah tangga menurut syariat.', 6, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  order_index = EXCLUDED.order_index;

-- Update sequence to prevent collision
SELECT setval('public.courses_id_seq', (SELECT MAX(id) FROM public.courses));

-- 2. Insert Lessons
INSERT INTO public.lessons (id, course_id, title, type, video_url, duration, order_index) VALUES
('v6-1', 6, 'Etika Pernikahan & Adab Malam Pertama',
  'video', 'https://www.youtube.com/embed/bWZyWAnIMpU', '15:00', 1),
('q6-1', 6, 'Kuis Modul 6: Etika Pernikahan', 'quiz', NULL, NULL, 2)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  video_url = EXCLUDED.video_url,
  duration = EXCLUDED.duration,
  order_index = EXCLUDED.order_index;

-- 3. Insert Quiz Questions
-- Clean up old questions for this quiz if any
DELETE FROM public.quiz_questions WHERE lesson_id = 'q6-1';

INSERT INTO public.quiz_questions (lesson_id, question_text, options, correct_index, order_index) VALUES
('q6-1',
 'Apa niat utama seorang muslim dalam melangsungkan pernikahan?',
 '["Mencari kekayaan pasangan", "Mengikuti tren sosial semata", "Ibadah kepada Allah dan menjaga kehormatan diri", "Sekadar memenuhi keinginan orang tua"]',
 2, 1),
('q6-1',
 'Apa yang disunnahkan bagi suami saat pertama kali masuk ke kamar pengantin menemui istrinya?',
 '["Langsung mengajak berdiskusi masalah keuangan", "Bersikap lembut, menyapa, dan memberikan suguhan ringan seperti minuman", "Bersikap tegas agar langsung disegani sebagai kepala keluarga", "Menuntut hak-hak suami secara langsung"]',
 1, 2),
('q6-1',
 'Di mana posisi tangan suami saat membacakan doa keberkahan untuk istrinya di malam pertama?',
 '["Di pundak istri", "Di punggung istri", "Di kening atau ubun-ubun istri", "Di telapak tangan istri"]',
 2, 3),
('q6-1',
 'Shalat apa yang dianjurkan untuk dilakukan bersama pasangan pada malam pertama pernikahan?',
 '["Shalat sunnah dua rakaat berjamaah", "Shalat fardhu lima waktu berturut-turut", "Shalat sunnah Tahajud 11 rakaat", "Shalat sunnah Istikharah kembali"]',
 0, 4),
('q6-1',
 'Manakah di bawah ini yang merupakan larangan keras (haram) terkait hubungan suami istri?',
 '["Berdoa sebelum memulai hubungan", "Makan bersama sebelum mandi wajib", "Menyebarkan rahasia atau detail hubungan intim kepada orang lain", "Melaksanakan shalat sunnah bersama sebelum berhubungan"]',
 2, 5);
