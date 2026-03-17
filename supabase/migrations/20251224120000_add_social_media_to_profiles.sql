-- Add social media handle fields to profiles table
-- Adds Instagram, X (Twitter), Letterboxd, and Beli handles

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS x TEXT,
ADD COLUMN IF NOT EXISTS letterboxd TEXT,
ADD COLUMN IF NOT EXISTS beli TEXT;
