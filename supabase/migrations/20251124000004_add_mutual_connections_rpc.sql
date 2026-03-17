-- Add RPC function to get mutual locations with their connecting friend IDs
-- This enables drawing connection lines between friends and mutuals on the map

CREATE OR REPLACE FUNCTION get_mutual_locations_with_connections(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  type TEXT,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  connecting_friend_id UUID
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
  friends_of_friends_with_connector AS (
    -- Get friends of my friends (where user_a is my friend)
    -- Include the connecting friend ID
    SELECT DISTINCT ON (f.user_b)
      f.user_b as foaf_id,
      mf.friend_id as connecting_friend_id
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
    -- Include the connecting friend ID
    SELECT DISTINCT ON (f.user_a)
      f.user_a as foaf_id,
      mf.friend_id as connecting_friend_id
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
    ST_Y(p.location::geometry) as latitude,
    fof.connecting_friend_id
  FROM friends_of_friends_with_connector fof
  INNER JOIN profiles p ON p.id = fof.foaf_id
  WHERE p.location IS NOT NULL
    -- Also ensure the connecting friend has a location
    AND EXISTS (
      SELECT 1 FROM profiles cp
      WHERE cp.id = fof.connecting_friend_id
      AND cp.location IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_mutual_locations_with_connections(UUID) TO authenticated;

-- Add function comment for documentation
COMMENT ON FUNCTION get_mutual_locations_with_connections(UUID) IS
  'Returns locations of friends-of-friends with connecting_friend_id showing which direct friend connects to each mutual. Used for drawing network graph lines on map.';
