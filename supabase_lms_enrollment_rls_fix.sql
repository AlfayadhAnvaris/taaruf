-- =========================================================================
-- MIGRATION: Fix RLS Policies for course_enrollments
-- Jalankan ini di Supabase SQL Editor (Dashboard > SQL Editor)
-- =========================================================================

-- 1. Pastikan Row Level Security aktif pada course_enrollments
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- 2. Hapus policy lama jika ada untuk menghindari konflik duplikasi nama
DROP POLICY IF EXISTS "enrollments_select" ON public.course_enrollments;
DROP POLICY IF EXISTS "enrollments_insert_own" ON public.course_enrollments;
DROP POLICY IF EXISTS "enrollments_write_admin" ON public.course_enrollments;

-- 3. Buat policy SELECT: Pengguna bisa melihat pendaftaran mereka sendiri, Admin bisa melihat semua
CREATE POLICY "enrollments_select" ON public.course_enrollments 
  FOR SELECT TO authenticated 
  USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Buat policy INSERT: Pengguna bisa mendaftar kelas sendiri, Admin bisa mendaftarkan siapa saja
CREATE POLICY "enrollments_insert_own" ON public.course_enrollments 
  FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Buat policy ALL (INSERT, UPDATE, DELETE): Admin memiliki hak penuh untuk mengelola pendaftaran (suspend, pindah kelas, hapus)
CREATE POLICY "enrollments_write_admin" ON public.course_enrollments 
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
