-- ====================================================================
-- MIGRATION: Perbaikan Duplikasi CV & Penambahan Batasan Unik (user_id)
-- Deskripsi: 
--   1. Memetakan CV duplikat ke CV terbaru (terupdate) per pengguna.
--   2. Memperbarui tabel relasional agar tidak melanggar foreign key.
--   3. Menghapus CV duplikat dari tabel cv_profiles.
--   4. Menambahkan batasan UNIQUE pada cv_profiles(user_id).
-- Jalankan query ini di Supabase Dashboard > SQL Editor
-- ====================================================================

-- 1. Update target_cv_id di tabel taaruf_requests agar merujuk ke CV terbaru
UPDATE public.taaruf_requests tr
SET target_cv_id = m.new_cv_id
FROM (
  SELECT 
    cp.id AS old_cv_id,
    keep.id AS new_cv_id
  FROM public.cv_profiles cp
  JOIN (
    SELECT DISTINCT ON (user_id) id, user_id
    FROM public.cv_profiles
    ORDER BY user_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
  ) keep ON cp.user_id = keep.user_id
  WHERE cp.id != keep.id
) m
WHERE tr.target_cv_id = m.old_cv_id;

-- 2. Update reported_cv_id di tabel user_reports (jika tabel/kolom ada)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_reports' 
      AND column_name = 'reported_cv_id'
  ) THEN
    EXECUTE '
      UPDATE public.user_reports ur
      SET reported_cv_id = m.new_cv_id
      FROM (
        SELECT 
          cp.id AS old_cv_id,
          keep.id AS new_cv_id
        FROM public.cv_profiles cp
        JOIN (
          SELECT DISTINCT ON (user_id) id, user_id
          FROM public.cv_profiles
          ORDER BY user_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
        ) keep ON cp.user_id = keep.user_id
        WHERE cp.id != keep.id
      ) m
      WHERE ur.reported_cv_id = m.old_cv_id;
    ';
  END IF;
END $$;

-- 3. Hapus CV duplikat dan pertahankan hanya CV terbaru per user_id
DELETE FROM public.cv_profiles
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.cv_profiles
  ORDER BY user_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
);

-- 4. Tambahkan batasan UNIQUE (user_id) jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'cv_profiles_user_id_key' 
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.cv_profiles
    ADD CONSTRAINT cv_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;
