-- Add hometown_location column for storing hometown coordinates
-- Separate from `location` which is used for live GPS location
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hometown_location geography(Point, 4326);

-- Spatial index for efficient proximity queries
CREATE INDEX IF NOT EXISTS idx_profiles_hometown_location
  ON profiles USING GIST (hometown_location);
