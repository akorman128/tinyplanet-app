-- Create RPC function to search friends by name
-- This function efficiently searches through a user's accepted friends
-- and returns matching profiles based on the search query
CREATE OR REPLACE FUNCTION search_friends(
  p_user_id UUID,
  p_query TEXT
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  hometown TEXT,
  birthday DATE,
  location GEOGRAPHY(POINT, 4326)
) AS $$
BEGIN
  -- Return empty set if query is empty or only whitespace
  IF trim(p_query) = '' THEN
    RETURN;
  END IF;

  -- Search through accepted friendships and filter by name
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.website,
    p.hometown,
    p.birthday,
    p.location
  FROM profiles p
  WHERE p.id IN (
    -- Get all accepted friends of p_user_id
    SELECT
      CASE
        WHEN f.user_a = p_user_id THEN f.user_b
        ELSE f.user_a
      END AS friend_id
    FROM friendships f
    WHERE (f.user_a = p_user_id OR f.user_b = p_user_id)
      AND f.status = 'accepted'
  )
  AND p.full_name ILIKE '%' || trim(p_query) || '%'
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION search_friends(UUID, TEXT) TO authenticated;
