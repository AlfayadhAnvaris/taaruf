-- ====================================================================
-- MIGRATION: RLS POLICIES FOR USER_REPORTS AND TESTIMONIALS
-- Run this in your Supabase Dashboard > SQL Editor
-- ====================================================================

-- ==========================================
-- 1. TABLE: user_reports (Laporan Pelanggaran)
-- ==========================================

-- Enable Row Level Security if not already enabled
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can insert reports" ON public.user_reports;
DROP POLICY IF EXISTS "Admins can view reports" ON public.user_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.user_reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON public.user_reports;

-- Policy: Allow authenticated users to insert reports (reporter_id must match auth.uid)
CREATE POLICY "Users can insert reports" 
ON public.user_reports 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = reporter_id);

-- Policy: Allow only administrators to view reports
CREATE POLICY "Admins can view reports" 
ON public.user_reports 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy: Allow only administrators to update reports
CREATE POLICY "Admins can update reports" 
ON public.user_reports 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy: Allow only administrators to delete reports
CREATE POLICY "Admins can delete reports" 
ON public.user_reports 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);


-- ==========================================
-- 2. TABLE: testimonials (Manajemen Testimoni)
-- ==========================================

-- Enable Row Level Security if not already enabled
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Anyone can view published testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can view all testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can insert testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can update testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can delete testimonials" ON public.testimonials;

-- Policy: Anyone (including anonymous public traffic) can view published testimonials
CREATE POLICY "Anyone can view published testimonials"
ON public.testimonials
FOR SELECT
USING (is_published = true);

-- Policy: Administrators can view all testimonials (both published and unpublished)
CREATE POLICY "Admins can view all testimonials"
ON public.testimonials
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy: Only administrators can insert testimonials
CREATE POLICY "Admins can insert testimonials"
ON public.testimonials
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy: Only administrators can update testimonials
CREATE POLICY "Admins can update testimonials"
ON public.testimonials
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy: Only administrators can delete testimonials
CREATE POLICY "Admins can delete testimonials"
ON public.testimonials
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
