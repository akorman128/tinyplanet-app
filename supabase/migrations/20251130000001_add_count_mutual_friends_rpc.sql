-- Create RPC function to count mutual friends between two users
-- This function finds how many friends user A and user B have in common
CREATE OR REPLACE FUNCTION count_mutual_friends(
  p_user_id UUID,
  p_target_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  mutual_count INTEGER;
BEGIN
  -- Find the count of mutual friends by intersecting the friend lists
  -- A mutual friend is someone who is friends with both p_user_id and p_target_user_id
  SELECT COUNT(DISTINCT mutual_friend_id) INTO mutual_count
  FROM (
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
  ) AS mutual_friends;

  RETURN COALESCE(mutual_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION count_mutual_friends(UUID, UUID) TO authenticated;
