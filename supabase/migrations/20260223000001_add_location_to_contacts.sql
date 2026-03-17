-- Add location column to contacts table (PostGIS geography, matching profiles pattern)

ALTER TABLE public.contacts ADD COLUMN location public.geography;

-- Spatial index for location queries
CREATE INDEX idx_contacts_location ON public.contacts USING GIST(location);

-- Backfill existing contacts with random US locations
-- Spreads across major US cities with some randomization
UPDATE public.contacts
SET location = ST_MakePoint(
  -- Random longitude across continental US (-124 to -71) with per-row variation
  -124.0 + (53.0 * random()),
  -- Random latitude across continental US (25 to 49) with per-row variation
  25.0 + (24.0 * random())
)::geography
WHERE location IS NULL;

-- RPC: Get contacts ordered by latitude (north to south)
CREATE OR REPLACE FUNCTION get_contacts_ordered(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  phone TEXT,
  email TEXT,
  company TEXT,
  note TEXT,
  location GEOGRAPHY,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.user_id, c.name, c.phone, c.email,
    c.company, c.note, c.location,
    ST_Y(c.location::geometry)::DOUBLE PRECISION,
    ST_X(c.location::geometry)::DOUBLE PRECISION,
    c.created_at, c.updated_at
  FROM contacts c
  WHERE c.user_id = p_user_id
  ORDER BY ST_Y(c.location::geometry) DESC NULLS LAST, c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_contacts_ordered(UUID) TO authenticated;
