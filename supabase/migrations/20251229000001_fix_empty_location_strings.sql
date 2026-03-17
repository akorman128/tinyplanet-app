-- Fix any existing profiles with empty string locations
-- Empty strings cannot be parsed by PostGIS ST_Y() and ST_X() functions
-- This migration sets them to NULL so they can be properly populated later
UPDATE profiles
SET location = NULL
WHERE location::text = '';
