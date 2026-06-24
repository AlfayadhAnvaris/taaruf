-- ============================================
-- MIGRATION: CV Photos Storage Bucket
-- Membuat storage bucket untuk menyimpan foto CV Taaruf
-- ============================================

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-photos', 'cv-photos', true)
ON CONFLICT (id) DO NOTHING;


-- 3. RLS Policies

-- a. Allow public access to view/download photos
CREATE POLICY "Public Access for CV Photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'cv-photos');

-- b. Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload CV photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cv-photos');

-- c. Allow users to update their own photos
CREATE POLICY "Users can update their own CV photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cv-photos' AND auth.uid() = owner);

-- d. Allow users to delete their own photos
CREATE POLICY "Users can delete their own CV photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cv-photos' AND auth.uid() = owner);
