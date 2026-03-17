-- Add note column to lists table
ALTER TABLE lists ADD COLUMN IF NOT EXISTS note TEXT;
