-- =====================================================
-- MIGRATION: Restrukturisasi Tabel cv_profiles
-- Jalankan query ini di Supabase Dashboard > SQL Editor
-- =====================================================

ALTER TABLE public.cv_profiles
ADD COLUMN IF NOT EXISTS domisili_provinsi TEXT,
ADD COLUMN IF NOT EXISTS domisili_kota TEXT,
ADD COLUMN IF NOT EXISTS foto_url TEXT,
ADD COLUMN IF NOT EXISTS tinggi_badan TEXT,
ADD COLUMN IF NOT EXISTS berat_badan TEXT,
ADD COLUMN IF NOT EXISTS ciri_fisik TEXT,
ADD COLUMN IF NOT EXISTS karakter_positif TEXT,
ADD COLUMN IF NOT EXISTS karakter_negatif TEXT,
ADD COLUMN IF NOT EXISTS hal_disukai TEXT,
ADD COLUMN IF NOT EXISTS hal_benci TEXT,
ADD COLUMN IF NOT EXISTS kondisi_keluarga TEXT,
ADD COLUMN IF NOT EXISTS pekerjaan_ortu TEXT,
ADD COLUMN IF NOT EXISTS anak_ke_dari TEXT,
ADD COLUMN IF NOT EXISTS riwayat_pendidikan TEXT,
ADD COLUMN IF NOT EXISTS pengalaman_kerja TEXT,
ADD COLUMN IF NOT EXISTS worship_wajib TEXT,
ADD COLUMN IF NOT EXISTS worship_sunnah TEXT,
ADD COLUMN IF NOT EXISTS baca_quran TEXT,
ADD COLUMN IF NOT EXISTS marriage_vision TEXT,
ADD COLUMN IF NOT EXISTS role_view TEXT,
ADD COLUMN IF NOT EXISTS target_menikah TEXT,
ADD COLUMN IF NOT EXISTS rencana_nafkah TEXT,
ADD COLUMN IF NOT EXISTS harapan_pasangan TEXT,
ADD COLUMN IF NOT EXISTS kriteria_fisik TEXT,
ADD COLUMN IF NOT EXISTS kriteria_non_fisik TEXT;
