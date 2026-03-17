-- Refactor lists table to use single location field instead of city/state_region/country
-- This migration:
-- 1. Adds location_name (text) and location (geography) columns
-- 2. Migrates existing data from city/state/country to location_name
-- 3. Drops old columns and index
-- 4. Adds new GiST index on location

-- Step 1: Add new columns
ALTER TABLE public.lists
ADD COLUMN location_name text,
ADD COLUMN location public.geography(POINT, 4326);

-- Step 2: Migrate existing data
-- Combine city, state_region, country into location_name
UPDATE public.lists
SET location_name = CASE
  WHEN state_region IS NOT NULL THEN city || ', ' || state_region || ', ' || country
  ELSE city || ', ' || country
END;

-- Step 3: Make location_name required (NOT NULL)
ALTER TABLE public.lists ALTER COLUMN location_name SET NOT NULL;

-- Step 4: Drop old columns and index
DROP INDEX IF EXISTS idx_lists_city;

ALTER TABLE public.lists
DROP COLUMN city,
DROP COLUMN state_region,
DROP COLUMN country;

-- Step 5: Add GiST index on location (for future spatial queries)
CREATE INDEX idx_lists_location ON public.lists USING GIST (location);

-- Note: Existing lists will have location = NULL since we cannot retroactively
-- determine coordinates from text fields. New lists created via LocationSearchInput
-- will have both location_name and location populated.
