-- ================================================================
-- MIGRATION: LMS Classes (Layer above Modules)
-- ================================================================

-- 1. Create lms_classes table
CREATE TABLE IF NOT EXISTS public.lms_classes (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  banner_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Link existing courses (Modules) to lms_classes
-- Add class_id column to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES public.lms_classes(id) ON DELETE CASCADE;

-- 3. RLS for lms_classes
ALTER TABLE public.lms_classes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lms_classes' AND policyname='classes_select') THEN
    CREATE POLICY "classes_select" ON public.lms_classes FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lms_classes' AND policyname='classes_write_admin') THEN
    CREATE POLICY "classes_write_admin" ON public.lms_classes FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 4. Initial Seed (Optional: move current modules to a default class if needed, or just let user create)
-- INSERT INTO public.lms_classes (id, title, description, order_index) 
-- VALUES (1, 'Fiqih Dasar Tentang Menikah', 'Kurikulum utama persiapan pernikahan sakinah.', 1)
-- ON CONFLICT (id) DO NOTHING;

-- UPDATE public.courses SET class_id = 1 WHERE class_id IS NULL;
