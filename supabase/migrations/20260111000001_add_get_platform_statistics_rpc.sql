-- Create RPC function to get platform statistics for MapLegend
-- Returns total users on platform and combined connections count (friends + mutuals)
CREATE OR REPLACE FUNCTION get_platform_statistics(p_user_id UUID)
RETURNS TABLE (
  total_users INTEGER,
  connections_count INTEGER
) AS $$
DECLARE
  v_total_users INTEGER;
  v_friends_count INTEGER;
  v_mutuals_count INTEGER;
BEGIN
  -- Count total users on platform
  SELECT COUNT(*)::INTEGER INTO v_total_users
  FROM profiles;

  -- Count user's direct friends (accepted friendships, bidirectional)
  SELECT COUNT(*)::INTEGER INTO v_friends_count
  FROM friendships
  WHERE (user_a = p_user_id OR user_b = p_user_id)
    AND status = 'accepted';

  -- Count mutuals (friends-of-friends, excluding direct friends and self)
  -- Uses the same logic as friends_of_friends_v view but returns a count
  WITH edges AS (
    -- Get all accepted friendship edges bidirectionally
    SELECT user_a AS user_id, user_b AS friend_id
    FROM friendships
    WHERE status = 'accepted'
    UNION ALL
    SELECT user_b AS user_id, user_a AS friend_id
    FROM friendships
    WHERE status = 'accepted'
  ),
  my_friends AS (
    -- Get direct friends of p_user_id
    SELECT friend_id
    FROM edges
    WHERE user_id = p_user_id
  ),
  foaf AS (
    -- Get friends of my friends
    SELECT DISTINCT e2.friend_id AS foaf_id
    FROM edges e1
    JOIN edges e2 ON e1.friend_id = e2.user_id
    WHERE e1.user_id = p_user_id
      AND e2.friend_id != p_user_id  -- Exclude self
      AND NOT EXISTS (
        SELECT 1 FROM my_friends WHERE friend_id = e2.friend_id
      )  -- Exclude direct friends
  )
  SELECT COUNT(*)::INTEGER INTO v_mutuals_count
  FROM foaf;

  -- Return total users and combined connections count (friends + mutuals)
  RETURN QUERY
  SELECT v_total_users, (v_friends_count + v_mutuals_count)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_platform_statistics(UUID) TO authenticated;

-- Add function comment for documentation
COMMENT ON FUNCTION get_platform_statistics(UUID) IS
  'Returns platform statistics for MapLegend: total users count and combined connections count (friends + mutuals).';
