-- Optimize RPC functions to eliminate timeout issues
-- This replaces the view-based approach with direct SQL queries using existing indexes

-- Optimized get_friend_locations: Direct query instead of complex CASE statements
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
  -- Get friends where current user is user_a
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    'friend'::TEXT as type,
    ST_X(p.location::geometry) as longitude,
    ST_Y(p.location::geometry) as latitude
  FROM friendships f
  INNER JOIN profiles p ON p.id = f.user_b
  WHERE f.user_a = p_user_id
    AND f.status = 'accepted'
    AND p.location IS NOT NULL

  UNION ALL

  -- Get friends where current user is user_b
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    'friend'::TEXT as type,
    ST_X(p.location::geometry) as longitude,
    ST_Y(p.location::geometry) as latitude
  FROM friendships f
  INNER JOIN profiles p ON p.id = f.user_a
  WHERE f.user_b = p_user_id
    AND f.status = 'accepted'
    AND p.location IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Optimized get_mutual_locations: Direct query without nested views
-- This eliminates the friends_of_friends_profiles_v -> friends_of_friends_v -> friend_edges_v chain
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
  WITH my_friends AS (
    -- Get all direct friends of the current user
    SELECT f.user_b as friend_id
    FROM friendships f
    WHERE f.user_a = p_user_id AND f.status = 'accepted'
    UNION
    SELECT f.user_a as friend_id
    FROM friendships f
    WHERE f.user_b = p_user_id AND f.status = 'accepted'
  ),
  friends_of_friends AS (
    -- Get friends of my friends (where user_a is my friend)
    SELECT DISTINCT f.user_b as foaf_id
    FROM friendships f
    INNER JOIN my_friends mf ON f.user_a = mf.friend_id
    WHERE f.status = 'accepted'
      AND f.user_b != p_user_id  -- exclude self
      AND NOT EXISTS (
        -- exclude direct friends
        SELECT 1 FROM my_friends WHERE friend_id = f.user_b
      )

    UNION

    -- Get friends of my friends (where user_b is my friend)
    SELECT DISTINCT f.user_a as foaf_id
    FROM friendships f
    INNER JOIN my_friends mf ON f.user_b = mf.friend_id
    WHERE f.status = 'accepted'
      AND f.user_a != p_user_id  -- exclude self
      AND NOT EXISTS (
        -- exclude direct friends
        SELECT 1 FROM my_friends WHERE friend_id = f.user_a
      )
  )
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    'mutual'::TEXT as type,
    ST_X(p.location::geometry) as longitude,
    ST_Y(p.location::geometry) as latitude
  FROM friends_of_friends fof
  INNER JOIN profiles p ON p.id = fof.foaf_id
  WHERE p.location IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions (reapply to be safe)
GRANT EXECUTE ON FUNCTION get_friend_locations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mutual_locations(UUID) TO authenticated;

-- Add function comments for documentation
COMMENT ON FUNCTION get_friend_locations(UUID) IS 'Optimized: Returns locations of direct friends using indexed queries with UNION ALL';
COMMENT ON FUNCTION get_mutual_locations(UUID) IS 'Optimized: Returns locations of friends-of-friends without nested views, using CTEs with indexed lookups';
