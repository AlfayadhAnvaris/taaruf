-- Migration to add individual screening columns to profiles table
-- instead of a single JSONB column

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS aqidah1 TEXT,
ADD COLUMN IF NOT EXISTS aqidah2 TEXT,
ADD COLUMN IF NOT EXISTS aqidah3 TEXT,
ADD COLUMN IF NOT EXISTS aqidah4 TEXT,
ADD COLUMN IF NOT EXISTS marriage_vision TEXT,
ADD COLUMN IF NOT EXISTS polygamy_view TEXT,
ADD COLUMN IF NOT EXISTS role_view TEXT;

-- Optional: Drop the old screening_data column if you want to clean up
-- ALTER TABLE profiles DROP COLUMN IF EXISTS screening_data;
