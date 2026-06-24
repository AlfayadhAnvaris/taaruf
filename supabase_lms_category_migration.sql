-- Migration to add category column to lms_classes table
ALTER TABLE lms_classes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Umum';
