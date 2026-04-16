-- =====================================================
-- Migration: Tambah kolom profil lengkap
-- Jalankan di Supabase SQL Editor
-- =====================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone_wa TEXT,
  ADD COLUMN IF NOT EXISTS wali_name TEXT,
  ADD COLUMN IF NOT EXISTS domisili_kota TEXT,
  ADD COLUMN IF NOT EXISTS domisili_provinsi TEXT,
  ADD COLUMN IF NOT EXISTS domisili_detail TEXT,
  ADD COLUMN IF NOT EXISTS ktp_url TEXT,
  ADD COLUMN IF NOT EXISTS ktp_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (ktp_status IN ('unverified','pending','verified','rejected'));

-- Update semua user lama (yang sudah punya gender) agar
-- mereka tidak diminta lengkapi profil ulang
-- Catatan: gender adalah ENUM, tidak bisa dibandingkan dengan '' (string kosong)
UPDATE public.profiles
  SET profile_complete = TRUE
  WHERE gender IS NOT NULL;

-- Pastikan kolom baru bisa diupdate oleh user sendiri (RLS policy)
-- Jika pakai Row Level Security, pastikan policy UPDATE sudah aktif:
-- CREATE POLICY "Users can update own profile" ON profiles
--   FOR UPDATE USING (auth.uid() = id);
