-- =====================================================
-- MIGRATION: Fitur Peringkat Belajar (Leaderboard) Akademi
-- Deskripsi: Membuat view untuk menghitung jumlah penyelesaian materi per user
--            dengan tetap menyembunyikan identitas asli (menggunakan alias & foto dari CV approved).
--            Jika CV belum disetujui, ditampilkan sebagai "Siswa Akademi".
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Buat view peringkat belajar dengan enkapsulasi privasi
CREATE OR REPLACE VIEW public.academy_leaderboard AS
SELECT 
  p.id AS user_id,
  COALESCE(cp.alias, 'Siswa Akademi') AS alias,
  COALESCE(cp.foto_url, '') AS foto_url,
  COALESCE(cp.gender, p.gender, 'ikhwan') AS gender,
  COUNT(ulp.id) AS completed_lessons_count,
  MAX(ulp.completed_at) AS last_completed_at
FROM public.profiles p
LEFT JOIN public.cv_profiles cp ON p.id = cp.user_id AND cp.status = 'approved'
JOIN public.user_lesson_progress ulp ON p.id = ulp.user_id
WHERE ulp.completed = true AND p.role != 'admin'
GROUP BY p.id, cp.alias, cp.foto_url, cp.gender, p.gender;

-- 2. Beri izin SELECT untuk role authenticated agar bisa diakses dari frontend client
GRANT SELECT ON public.academy_leaderboard TO authenticated;
