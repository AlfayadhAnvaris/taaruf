-- MIGRASI UNTUK FITUR MODERASI REVIEW
-- Menambahkan kolom is_active untuk kontrol admin terhadap ulasan/komentar

ALTER TABLE user_reviews 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Tambahkan komentar untuk dokumentasi (opsional)
COMMENT ON COLUMN user_reviews.is_active IS 'Status aktif review (true: tampil, false: disembunyikan oleh admin)';
