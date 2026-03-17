-- Create RPC function to get friend locations with coordinates
CREATE OR REPLACE FUNCTION get_friend_locations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  type TEXT,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN f.user_a = p_user_id THEN p_b.id
      ELSE p_a.id
    END as id,
    CASE
      WHEN f.user_a = p_user_id THEN p_b.full_name
      ELSE p_a.full_name
    END as full_name,
    CASE
      WHEN f.user_a = p_user_id THEN p_b.avatar_url
      ELSE p_a.avatar_url
    END as avatar_url,
    'friend'::TEXT as type,
    CASE
      WHEN f.user_a = p_user_id THEN ST_X(p_b.location::geometry)
      ELSE ST_X(p_a.location::geometry)
    END as longitude,
    CASE
      WHEN f.user_a = p_user_id THEN ST_Y(p_b.location::geometry)
      ELSE ST_Y(p_a.location::geometry)
    END as latitude
  FROM friendships f
  JOIN profiles p_a ON f.user_a = p_a.id
  JOIN profiles p_b ON f.user_b = p_b.id
  WHERE (f.user_a = p_user_id OR f.user_b = p_user_id)
    AND f.status = 'accepted'
    AND (
      (f.user_a = p_user_id AND p_b.location IS NOT NULL) OR
      (f.user_b = p_user_id AND p_a.location IS NOT NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to get mutual (friends-of-friends) locations
CREATE OR REPLACE FUNCTION get_mutual_locations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  type TEXT,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    'mutual'::TEXT as type,
    ST_X(p.location::geometry) as longitude,
    ST_Y(p.location::geometry) as latitude
  FROM friends_of_friends_profiles_v p
  WHERE p.user_id = p_user_id
    AND p.location IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_friend_locations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mutual_locations(UUID) TO authenticated;
