-- ================================================================
-- MIGRATION: LMS Levels (Management for Curriculum Difficulty Levels)
-- ================================================================

-- 1. Create lms_levels table
CREATE TABLE IF NOT EXISTS public.lms_levels (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add level column to lms_classes table
ALTER TABLE public.lms_classes ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Dasar';

-- 3. Enable RLS
ALTER TABLE public.lms_levels ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for lms_levels
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

-- 5. Seed default levels if empty
INSERT INTO public.lms_levels (name, order_index)
SELECT name, order_index FROM (VALUES
  ('Dasar', 1),
  ('Menengah', 2),
  ('Lanjutan', 3)
) AS v(name, order_index)
WHERE NOT EXISTS (SELECT 1 FROM public.lms_levels);
