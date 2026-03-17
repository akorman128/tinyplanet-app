-- Add location_name column to store human-readable name at write time
-- (mirrors the list_places.resolved_name pattern)

ALTER TABLE public.contacts ADD COLUMN location_name TEXT;

-- Update RPC to also return location_name
DROP FUNCTION IF EXISTS get_contacts_ordered(UUID);
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
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.user_id, c.name, c.phone, c.email,
    c.company, c.note, c.location, c.location_name,
    ST_Y(c.location::geometry)::DOUBLE PRECISION,
    ST_X(c.location::geometry)::DOUBLE PRECISION,
    c.created_at, c.updated_at
  FROM contacts c
  WHERE c.user_id = p_user_id
  ORDER BY ST_Y(c.location::geometry) DESC NULLS LAST, c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
