-- ============================================
-- MIGRATION: CS (Customer Service) Contacts
-- Tabel untuk menyimpan data kontak CS yang
-- bisa dihubungi user via WhatsApp
-- ============================================

-- 1. Create cs_contacts table
CREATE TABLE IF NOT EXISTS public.cs_contacts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Umum',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add comment
COMMENT ON TABLE public.cs_contacts IS 'Daftar kontak Customer Service yang bisa dihubungi user via WhatsApp';

-- 3. Enable RLS
ALTER TABLE public.cs_contacts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DO $$ BEGIN
  -- SELECT: all authenticated users can read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cs_contacts' AND policyname = 'cs_contacts_select') THEN
    CREATE POLICY "cs_contacts_select" ON public.cs_contacts
      FOR SELECT TO authenticated
      USING (true);
  END IF;

  -- INSERT: admin only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cs_contacts' AND policyname = 'cs_contacts_insert_admin') THEN
    CREATE POLICY "cs_contacts_insert_admin" ON public.cs_contacts
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- UPDATE: admin only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cs_contacts' AND policyname = 'cs_contacts_update_admin') THEN
    CREATE POLICY "cs_contacts_update_admin" ON public.cs_contacts
      FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- DELETE: admin only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cs_contacts' AND policyname = 'cs_contacts_delete_admin') THEN
    CREATE POLICY "cs_contacts_delete_admin" ON public.cs_contacts
      FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;
