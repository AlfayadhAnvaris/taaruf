-- =====================================================
-- FIX: cv_profiles RLS Policies
-- Memastikan user bisa membaca dan mengupdate CV mereka sendiri
-- =====================================================

-- 1. Pastikan RLS aktif
ALTER TABLE public.cv_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Beri izin user membaca CV mereka sendiri (penting agar upsert bisa mendapatkan ID)
CREATE POLICY "Users can view their own CV"
ON public.cv_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Beri izin user membaca CV public (approved)
CREATE POLICY "Users can view approved CVs"
ON public.cv_profiles
FOR SELECT
USING (status = 'approved');

-- 4. Beri izin user membuat CV mereka sendiri
CREATE POLICY "Users can insert their own CV"
ON public.cv_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Beri izin user mengupdate CV mereka sendiri
CREATE POLICY "Users can update their own CV"
ON public.cv_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Beri izin admin melihat dan mengubah semua CV
CREATE POLICY "Admins can view all CVs"
ON public.cv_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update all CVs"
ON public.cv_profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
