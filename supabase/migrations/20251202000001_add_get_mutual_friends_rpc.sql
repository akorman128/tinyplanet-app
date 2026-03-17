-- Create RPC function to get mutual friends between two users
-- This function returns the profiles of friends that user A and user B have in common
CREATE OR REPLACE FUNCTION get_mutual_friends_between_users(
  p_user_id UUID,
  p_target_user_id UUID
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
  -- Find mutual friends by intersecting the friend lists
  -- and return their profile information
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
    -- Get all friends of p_user_id
    SELECT
      CASE
        WHEN f1.user_a = p_user_id THEN f1.user_b
        ELSE f1.user_a
      END AS mutual_friend_id
    FROM friendships f1
    WHERE (f1.user_a = p_user_id OR f1.user_b = p_user_id)
      AND f1.status = 'accepted'

    INTERSECT

    -- Get all friends of p_target_user_id
    SELECT
      CASE
        WHEN f2.user_a = p_target_user_id THEN f2.user_b
        ELSE f2.user_a
      END AS mutual_friend_id
    FROM friendships f2
    WHERE (f2.user_a = p_target_user_id OR f2.user_b = p_target_user_id)
      AND f2.status = 'accepted'
  )
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_mutual_friends_between_users(UUID, UUID) TO authenticated;
