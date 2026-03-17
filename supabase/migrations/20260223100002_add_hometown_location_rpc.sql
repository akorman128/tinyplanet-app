-- RPC function to get friend and mutual hometown locations
-- Returns both friends and friends-of-friends (mutuals) who have a hometown_location set
CREATE OR REPLACE FUNCTION get_friend_hometown_locations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  type TEXT,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  hometown_name TEXT
) AS $$
BEGIN
  RETURN QUERY

  -- Direct friends with hometown_location
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
    'friend_hometown'::TEXT as type,
    CASE
      WHEN f.user_a = p_user_id THEN ST_X(p_b.hometown_location::geometry)
      ELSE ST_X(p_a.hometown_location::geometry)
    END as longitude,
    CASE
      WHEN f.user_a = p_user_id THEN ST_Y(p_b.hometown_location::geometry)
      ELSE ST_Y(p_a.hometown_location::geometry)
    END as latitude,
    CASE
      WHEN f.user_a = p_user_id THEN p_b.hometown
      ELSE p_a.hometown
    END as hometown_name
  FROM friendships f
  JOIN profiles p_a ON f.user_a = p_a.id
  JOIN profiles p_b ON f.user_b = p_b.id
  WHERE (f.user_a = p_user_id OR f.user_b = p_user_id)
    AND f.status = 'accepted'
    AND (
      (f.user_a = p_user_id AND p_b.hometown_location IS NOT NULL) OR
      (f.user_b = p_user_id AND p_a.hometown_location IS NOT NULL)
    )

  UNION ALL

  -- Friends-of-friends (mutuals) with hometown_location
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    'mutual_hometown'::TEXT as type,
    ST_X(p.hometown_location::geometry) as longitude,
    ST_Y(p.hometown_location::geometry) as latitude,
    p.hometown as hometown_name
  FROM friends_of_friends_v fof
  JOIN profiles p ON p.id = fof.foaf_id
  WHERE fof.user_id = p_user_id
    AND p.hometown_location IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_friend_hometown_locations(UUID) TO authenticated;
