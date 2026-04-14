-- =====================================================
-- FIX: cv_profiles_user_id_fkey Violation
-- Root Cause: profiles table RLS blocks INSERT/SELECT
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Beri izin user INSERT profil sendiri saat pertama kali login
CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 2. Beri izin user membaca profil sendiri
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 3. Beri izin user mengupdate profil sendiri
CREATE POLICY IF NOT EXISTS "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Pastikan RLS aktif (jika belum)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- MIGRATION: Tambah kolom phone untuk OTP
-- =====================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';

-- =====================================================
-- VERIFIKASI: Jalankan query ini untuk melihat RLS aktif
-- =====================================================
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles';
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- =====================================================
-- BONUS: Jika masih error, cek apakah ada existing user
-- yang belum punya profil di tabel profiles:
-- =====================================================
-- SELECT au.id, au.email, p.id AS profile_id
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON p.id = au.id
-- WHERE p.id IS NULL;
--
-- Jika ada, jalankan ini untuk membuat profil mereka:
-- INSERT INTO public.profiles (id, email, name, role, gender)
-- SELECT au.id, au.email, split_part(au.email, '@', 1), 'user', 'ikhwan'
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON p.id = au.id
-- WHERE p.id IS NULL;

