-- FIX RLS UNTUK USER_REVIEWS (ADMIN MODERATION)
-- Memungkinkan admin untuk mengupdate status is_active

-- 1. Pastikan RLS aktif
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;

-- 2. Kebijakan Update untuk Admin
-- Mengizinkan user dengan role 'admin' di tabel profiles untuk mengubah data review
DROP POLICY IF EXISTS "Admin can update user_reviews" ON user_reviews;
CREATE POLICY "Admin can update user_reviews" 
ON user_reviews 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 3. Kebijakan Delete untuk Admin (opsional jika belum ada)
DROP POLICY IF EXISTS "Admin can delete user_reviews" ON user_reviews;
CREATE POLICY "Admin can delete user_reviews" 
ON user_reviews 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
