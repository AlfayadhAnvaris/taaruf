-- ================================================================
-- MIGRATION: LMS Categories (Management for Curriculum Categories)
-- ================================================================

-- 1. Create lms_categories table
CREATE TABLE IF NOT EXISTS public.lms_categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.lms_categories ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
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

-- 4. Seed default categories if empty
INSERT INTO public.lms_categories (name, order_index)
SELECT name, order_index FROM (VALUES
  ('Umum', 1),
  ('Pranikah', 2),
  ('Aqidah', 3),
  ('Fikih', 4),
  ('Keluarga', 5)
) AS v(name, order_index)
WHERE NOT EXISTS (SELECT 1 FROM public.lms_categories);
