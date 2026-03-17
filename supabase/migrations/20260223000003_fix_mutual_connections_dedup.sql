-- Fix: deduplicate mutual friend rows in get_mutual_locations_with_connections
-- The previous UNION of two DISTINCT ON subqueries could return the same foaf_id
-- twice when a person appeared on both sides of the friendships table with
-- different connecting_friend_id values. This migration replaces the function
-- with a version that collects all pairs first, then applies a single
-- DISTINCT ON (foaf_id) with a deterministic ORDER BY.

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
    SELECT f.user_b as friend_id
    FROM friendships f
    WHERE f.user_a = p_user_id AND f.status = 'accepted'
    UNION
    SELECT f.user_a as friend_id
    FROM friendships f
    WHERE f.user_b = p_user_id AND f.status = 'accepted'
  ),
  all_foaf AS (
    SELECT f.user_b as foaf_id, mf.friend_id as connector_id
    FROM friendships f
    INNER JOIN my_friends mf ON f.user_a = mf.friend_id
    WHERE f.status = 'accepted'
      AND f.user_b != p_user_id
      AND NOT EXISTS (SELECT 1 FROM my_friends WHERE friend_id = f.user_b)
    UNION ALL
    SELECT f.user_a as foaf_id, mf.friend_id as connector_id
    FROM friendships f
    INNER JOIN my_friends mf ON f.user_b = mf.friend_id
    WHERE f.status = 'accepted'
      AND f.user_a != p_user_id
      AND NOT EXISTS (SELECT 1 FROM my_friends WHERE friend_id = f.user_a)
  ),
  unique_foaf AS (
    SELECT DISTINCT ON (foaf_id) foaf_id, connector_id
    FROM all_foaf
    ORDER BY foaf_id, connector_id
  )
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    'mutual'::TEXT as type,
    ST_X(p.location::geometry) as longitude,
    ST_Y(p.location::geometry) as latitude,
    uf.connector_id
  FROM unique_foaf uf
  INNER JOIN profiles p ON p.id = uf.foaf_id
  WHERE p.location IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles cp
      WHERE cp.id = uf.connector_id
      AND cp.location IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
