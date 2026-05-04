-- Migration to add screening_data column to profiles table
-- This column will store religious understanding and aqidah answers in JSONB format

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS screening_data JSONB DEFAULT '{}'::jsonb;

-- Optional: Update existing rows to have an empty object instead of null if needed
UPDATE profiles SET screening_data = '{}'::jsonb WHERE screening_data IS NULL;

-- Enable indexing for better performance if querying inside JSON (optional)
-- CREATE INDEX IF NOT EXISTS idx_profiles_screening_data ON profiles USING GIN (screening_data);
