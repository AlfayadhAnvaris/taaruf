-- ================================================================
-- MIGRATION: Tambah Fitur Suspend & Pindah Kelas User pada Akademi
-- Jalankan ini di Supabase SQL Editor (Dashboard > SQL Editor)
-- ================================================================

-- 1. Tambah kolom is_suspended ke table public.course_enrollments jika belum ada
ALTER TABLE public.course_enrollments 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

-- 2. Berikan komentar pada kolom untuk dokumentasi
COMMENT ON COLUMN public.course_enrollments.is_suspended IS 'Menandakan apakah pendaftaran/akses kelas user ditangguhkan oleh admin';
