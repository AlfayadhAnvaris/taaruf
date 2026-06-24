-- =========================================================================
-- MIGRATION GABUNGAN: LMS Categories, LMS Levels, dan Kolom Kelas
-- Jalankan ini di Supabase SQL Editor (Dashboard > SQL Editor)
-- =========================================================================

-- 1. Tambah kolom 'category' ke table public.lms_classes jika belum ada
ALTER TABLE public.lms_classes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Umum';

-- 2. Tambah kolom 'level' ke table public.lms_classes jika belum ada
ALTER TABLE public.lms_classes ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Dasar';

-- 3. Tambah kolom 'is_published' ke table public.lms_classes jika belum ada
ALTER TABLE public.lms_classes ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

-- 4. Buat table lms_categories jika belum ada
CREATE TABLE IF NOT EXISTS public.lms_categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable RLS untuk lms_categories
ALTER TABLE public.lms_categories ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies untuk lms_categories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lms_categories' AND policyname='categories_select') THEN
    CREATE POLICY "categories_select" ON public.lms_categories FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lms_categories' AND policyname='categories_write_admin') THEN
    CREATE POLICY "categories_write_admin" ON public.lms_categories FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 7. Seed default categories ke lms_categories jika kosong
INSERT INTO public.lms_categories (name, order_index)
SELECT name, order_index FROM (VALUES
  ('Umum', 1),
  ('Pranikah', 2),
  ('Aqidah', 3),
  ('Fikih', 4),
  ('Keluarga', 5)
) AS v(name, order_index)
WHERE NOT EXISTS (SELECT 1 FROM public.lms_categories);

-- 8. Buat table lms_levels jika belum ada
CREATE TABLE IF NOT EXISTS public.lms_levels (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Enable RLS untuk lms_levels
ALTER TABLE public.lms_levels ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies untuk lms_levels
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lms_levels' AND policyname='levels_select') THEN
    CREATE POLICY "levels_select" ON public.lms_levels FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lms_levels' AND policyname='levels_write_admin') THEN
    CREATE POLICY "levels_write_admin" ON public.lms_levels FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 11. Seed default levels ke lms_levels jika kosong
INSERT INTO public.lms_levels (name, order_index)
SELECT name, order_index FROM (VALUES
  ('Dasar', 1),
  ('Menengah', 2),
  ('Lanjutan', 3)
) AS v(name, order_index)
WHERE NOT EXISTS (SELECT 1 FROM public.lms_levels);

-- 12. Tambah kolom is_suspended ke table public.course_enrollments jika belum ada
ALTER TABLE public.course_enrollments 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

