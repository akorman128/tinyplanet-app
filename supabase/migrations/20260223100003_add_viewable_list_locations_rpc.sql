-- RPC function to get viewable list locations for the map
-- Returns own lists + friends' lists with extracted coordinates
CREATE OR REPLACE FUNCTION get_viewable_list_locations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  location_name TEXT,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  owner_name TEXT
) AS $$
BEGIN
  RETURN QUERY

  -- Own lists with location
  SELECT
    l.id,
    l.title,
    l.category,
    l.location_name,
    ST_X(l.location::geometry) as longitude,
    ST_Y(l.location::geometry) as latitude,
    'You'::TEXT as owner_name
  FROM lists l
  WHERE l.user_id = p_user_id
    AND l.location IS NOT NULL

  UNION ALL

  -- Friends' lists with location
  SELECT
    l.id,
    l.title,
    l.category,
    l.location_name,
    ST_X(l.location::geometry) as longitude,
    ST_Y(l.location::geometry) as latitude,
    p.full_name as owner_name
  FROM lists l
  JOIN profiles p ON p.id = l.user_id
  JOIN friendships f ON (
    (f.user_a = p_user_id AND f.user_b = l.user_id) OR
    (f.user_b = p_user_id AND f.user_a = l.user_id)
  )
  WHERE f.status = 'accepted'
    AND l.user_id != p_user_id
    AND l.location IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_viewable_list_locations(UUID) TO authenticated;
