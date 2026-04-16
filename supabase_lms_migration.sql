-- ================================================================
-- LMS MIGRATION: Courses, Lessons, Quiz Questions, User Progress
-- Jalankan di Supabase SQL Editor (aman dijalankan ulang — ON CONFLICT DO NOTHING)
-- ================================================================

-- 1. Tabel Courses (Modul)
CREATE TABLE IF NOT EXISTS public.courses (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabel Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
  id          TEXT PRIMARY KEY,
  course_id   INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('video', 'quiz')),
  video_url   TEXT,
  duration    TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabel Quiz Questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id            SERIAL PRIMARY KEY,
  lesson_id     TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options       JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  order_index   INTEGER NOT NULL DEFAULT 0
);

-- 4. Tabel User Progress
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id           SERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id    TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed    BOOLEAN NOT NULL DEFAULT false,
  score        INTEGER,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, lesson_id)
);

-- ================================================================
-- RLS
-- ================================================================
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Courses & Lessons & Quiz: semua user bisa baca, hanya admin yang bisa tulis
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='courses' AND policyname='courses_select') THEN
    CREATE POLICY "courses_select" ON public.courses FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='courses' AND policyname='courses_write_admin') THEN
    CREATE POLICY "courses_write_admin" ON public.courses FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lessons' AND policyname='lessons_select') THEN
    CREATE POLICY "lessons_select" ON public.lessons FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lessons' AND policyname='lessons_write_admin') THEN
    CREATE POLICY "lessons_write_admin" ON public.lessons FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quiz_questions' AND policyname='quiz_select') THEN
    CREATE POLICY "quiz_select" ON public.quiz_questions FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quiz_questions' AND policyname='quiz_write_admin') THEN
    CREATE POLICY "quiz_write_admin" ON public.quiz_questions FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_lesson_progress' AND policyname='progress_select_own') THEN
    CREATE POLICY "progress_select_own" ON public.user_lesson_progress FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_lesson_progress' AND policyname='progress_write_own') THEN
    CREATE POLICY "progress_write_own" ON public.user_lesson_progress FOR ALL TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ================================================================
-- SEED DATA: 5 Modul Kurikulum Pra-Nikah Islami
-- ================================================================

-- Hapus data lama (untuk reset bersih)
-- TRUNCATE public.quiz_questions, public.user_lesson_progress, public.lessons, public.courses RESTART IDENTITY CASCADE;

-- ── COURSES ──────────────────────────────────────────────────────────────────
(1, 'Modul 1: Fondasi Pernikahan Islami',
   'Memahami makna taaruf yang sesungguhnya dan fiqih memilih pasangan hidup.', 1, true),
(2, 'Modul 2: Hak & Kewajiban dalam Rumah Tangga',
   'Nafkah lahir batin, tanggung jawab suami istri, dan pola komunikasi yang sehat.', 2, true),
(3, 'Modul 3: Etika Pernikahan dalam Islam',
   'Membahas adab malam pertama, sikap lemah lembut kepada pasangan, dan rahasia rumah tangga menurut syariat.', 3, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  order_index = EXCLUDED.order_index;

SELECT setval('public.courses_id_seq', 3, true);

-- ── LESSONS ───────────────────────────────────────────────────────────────────
-- Modul 1
INSERT INTO public.lessons (id, course_id, title, type, video_url, duration, order_index) VALUES
('v1-1', 1, 'Makna Taaruf yang Sesungguhnya',
  'video', 'https://www.youtube.com/embed/xCJeGrQQ9hQ', '20:15', 1),
('v1-2', 1, 'Fiqih Memilih Pasangan dalam Islam',
  'video', 'https://www.youtube.com/embed/Z2T4dh913ps', '20:13', 2),
('q1-1', 1, 'Kuis Modul 1: Fondasi Pernikahan', 'quiz', NULL, NULL, 3),

-- Modul 2
('v2-1', 2, 'Kewajiban Nafkah Lahir & Batin Suami',
  'video', NULL, '25:00', 1),
('v2-2', 2, 'Hak & Kewajiban Istri Terhadap Suami',
  'video', NULL, '22:30', 2),
('v2-3', 2, 'Membangun Komunikasi Sehat dalam Rumah Tangga',
  'video', NULL, '18:45', 3),
('q2-1', 2, 'Kuis Modul 2: Hak & Kewajiban', 'quiz', NULL, NULL, 4),

-- Modul 3
('v3-1', 3, 'Etika Pernikahan & Adab Malam Pertama',
  'video', 'https://www.youtube.com/embed/bWZyWAnIMpU', '15:00', 1),
('q3-1', 3, 'Kuis Modul 3: Etika Pernikahan', 'quiz', NULL, NULL, 2)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  video_url = EXCLUDED.video_url,
  duration = EXCLUDED.duration,
  order_index = EXCLUDED.order_index;

-- ── QUIZ QUESTIONS ───────────────────────────────────────────────────────────
-- Hapus soal lama dan insert ulang (lebih aman)
DELETE FROM public.quiz_questions;

-- Kuis Modul 1: Fondasi Pernikahan (5 soal)
INSERT INTO public.quiz_questions (lesson_id, question_text, options, correct_index, order_index) VALUES
('q1-1',
 'Apa pengertian taaruf yang benar menurut syariat Islam?',
 '["Berkenalan bebas antara laki-laki dan perempuan","Proses mengenal calon pasangan melalui perantara yang syar''i","Pacaran yang diawali dengan pertemuan langsung","Melihat foto calon di media sosial lalu langsung melamar"]',
 1, 1),
('q1-1',
 'Dalam proses taaruf Islami, siapa yang berperan sebagai perantara yang dianjurkan?',
 '["Teman dekat yang sudah menikah","Orang tua, wali, atau ustadz/ustadzah yang terpercaya","Makelar jodoh profesional berbayar","Aplikasi kencan berbasis algoritma"]',
 1, 2),
('q1-1',
 'Menurut hadits Rasulullah ﷺ, faktor utama yang harus dijadikan prioritas dalam memilih pasangan adalah...',
 '["Kecantikan/ketampanan fisik","Kekayaan dan status sosial","Agama dan akhlak (dien)","Kesamaan hobi dan kepribadian"]',
 2, 3),
('q1-1',
 'Apa yang dimaksud dengan "nazhor" dalam konteks fiqih taaruf?',
 '["Khitbah atau proses melamar secara resmi","Izin melihat calon pasangan yang dibolehkan syariat sebelum memutuskan","Masa pengenalan bebas selama beberapa bulan","Diskusi keluarga tentang mahar"]',
 1, 4),
('q1-1',
 'Mana di bawah ini yang BUKAN termasuk tujuan pernikahan dalam Islam?',
 '["Menyempurnakan separuh agama","Menjaga kehormatan diri (iffah)","Mendapatkan keturunan yang shalih/shalihah","Meningkatkan status sosial di masyarakat"]',
 3, 5),

-- Kuis Modul 2: Hak & Kewajiban (5 soal)
('q2-1',
 'Apa yang dimaksud dengan "nafkah batin" yang wajib diberikan suami kepada istri?',
 '["Uang saku bulanan untuk kebutuhan pribadi istri","Pemenuhan kebutuhan emosional, kasih sayang, dan hubungan suami istri","Biaya pendidikan anak-anak","Pembelian perhiasan dan pakaian mewah"]',
 1, 1),
('q2-1',
 'Istri yang taat kepada suami dalam hal yang tidak melanggar syariat mendapat pahala seperti...',
 '["Pahala sedekah jariyah","Seperti jihad di jalan Allah menurut beberapa ulama","Pahala haji mabrur","Pahala puasa setahun penuh"]',
 1, 2),
('q2-1',
 'Dalam komunikasi suami istri, mana sikap yang paling dianjurkan Islam?',
 '["Suami selalu bersikap tegas dan istri selalu mengalah","Saling bermusyawarah, mendengarkan aktif, dan berbicara dengan lembut","Menghindari konflik dengan tidak membicarakan masalah","Hanya berkomunikasi saat ada keperluan penting saja"]',
 1, 3),
('q2-1',
 'Berapa batas mahar yang dianjurkan dalam Islam?',
 '["Harus setara dengan mas kawin zaman Nabi","Sesanggup suami; mahar terbaik adalah yang paling mudah","Minimal 10 gram emas","Harus disepakati oleh seluruh keluarga besar"]',
 1, 4),
('q2-1',
 'Suami yang tidak mampu memenuhi nafkah karena musibah/sakit dihukumi...',
 '["Berdosa dan wajib diceraikan","Tidak berdosa selama berusaha semampunya","Wajib bekerja apapun kondisinya","Kehilangan hak kepemimpinan dalam keluarga"]',
 1, 5),

-- Kuis Modul 3: Etika Pernikahan (5 soal)
('q3-1',
 'Apa niat utama seorang muslim dalam melangsungkan pernikahan?',
 '["Mencari kekayaan pasangan", "Mengikuti tren sosial semata", "Ibadah kepada Allah dan menjaga kehormatan diri", "Sekadar memenuhi keinginan orang tua"]',
 2, 1),
('q3-1',
 'Apa yang disunnahkan bagi suami saat pertama kali masuk ke kamar pengantin menemui istrinya?',
 '["Langsung mengajak berdiskusi masalah keuangan", "Bersikap lembut, menyapa, dan memberikan suguhan ringan seperti minuman", "Bersikap tegas agar langsung disegani sebagai kepala keluarga", "Menuntut hak-hak suami secara langsung"]',
 1, 2),
('q3-1',
 'Di mana posisi tangan suami saat membacakan doa keberkahan untuk istrinya di malam pertama?',
 '["Di pundak istri", "Di punggung istri", "Di kening atau ubun-ubun istri", "Di telapak tangan istri"]',
 2, 3),
('q3-1',
 'Shalat apa yang dianjurkan untuk dilakukan bersama pasangan pada malam pertama pernikahan?',
 '["Shalat sunnah dua rakaat berjamaah", "Shalat fardhu lima waktu berturut-turut", "Shalat sunnah Tahajud 11 rakaat", "Shalat sunnah Istikharah kembali"]',
 0, 4),
('q3-1',
 'Manakah di bawah ini yang merupakan larangan keras (haram) terkait hubungan suami istri?',
 '["Berdoa sebelum memulai hubungan", "Makan bersama sebelum mandi wajib", "Menyebarkan rahasia atau detail hubungan intim kepada orang lain", "Melaksanakan shalat sunnah bersama sebelum berhubungan"]',
 2, 5);;
