-- Add onboarding_invites_sent column to profiles table
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "onboarding_invites_sent" boolean DEFAULT false;

