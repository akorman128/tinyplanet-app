-- Restore block-filter parity for get_mutual_locations
--
-- get_mutual_locations returns the locations of a user's friends-of-friends
-- ("mutuals"). Its actively-used sibling get_mutual_locations_with_connections
-- excludes blocked users (block-filter pass, 20260317000002), but this function
-- was skipped at the time and 20260610120000 carried the block-less body forward
-- (see its own "latest body: 20251124000003" note). The function is still
-- GRANTed to authenticated, so a direct call leaks blocked users' coordinates.
--
-- Fix: apply the same symmetric is_blocked predicate the sibling uses, so a
-- mutual is omitted whenever the caller has blocked them or they have blocked
-- the caller. Behaviour is otherwise identical (read-only, SECURITY DEFINER,
-- IDOR-guarded). is_blocked is referenced unqualified to match the sibling.
CREATE OR REPLACE FUNCTION get_mutual_locations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  type TEXT,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH my_friends AS (
    -- Get all direct friends of the current user
    -- Changed UNION to UNION ALL for performance (no duplicates possible due to constraint)
    SELECT f.user_b as friend_id
    FROM friendships f
    WHERE f.user_a = p_user_id AND f.status = 'accepted'

    UNION ALL

    SELECT f.user_a as friend_id
    FROM friendships f
    WHERE f.user_b = p_user_id AND f.status = 'accepted'
  ),
  friends_of_friends AS (
    -- Get friends of my friends (where user_a is my friend)
    -- Use LEFT ANTI JOIN instead of NOT EXISTS for better performance with indexes
    SELECT DISTINCT f.user_b as foaf_id
    FROM friendships f
    INNER JOIN my_friends mf ON f.user_a = mf.friend_id
    LEFT JOIN my_friends exclude_direct ON f.user_b = exclude_direct.friend_id
    WHERE f.status = 'accepted'
      AND f.user_b != p_user_id  -- exclude self
      AND exclude_direct.friend_id IS NULL  -- exclude direct friends

    UNION

    -- Get friends of my friends (where user_b is my friend)
    SELECT DISTINCT f.user_a as foaf_id
    FROM friendships f
    INNER JOIN my_friends mf ON f.user_b = mf.friend_id
    LEFT JOIN my_friends exclude_direct ON f.user_a = exclude_direct.friend_id
    WHERE f.status = 'accepted'
      AND f.user_a != p_user_id  -- exclude self
      AND exclude_direct.friend_id IS NULL  -- exclude direct friends
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
  WHERE p.location IS NOT NULL
    AND NOT is_blocked(p_user_id, fof.foaf_id);
END;
$$;

GRANT EXECUTE ON FUNCTION get_mutual_locations(UUID) TO authenticated;

COMMENT ON FUNCTION get_mutual_locations(UUID) IS 'Returns friends-of-friends locations, excluding users blocked in either direction (block-filter parity with get_mutual_locations_with_connections).';
