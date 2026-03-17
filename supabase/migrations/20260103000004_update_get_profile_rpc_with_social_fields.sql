-- Update get_profile RPC function to include social media fields
-- Adds instagram, x, letterboxd, and beli to the return type

-- Drop existing function
DROP FUNCTION IF EXISTS get_profile(UUID, UUID);

-- Create updated RPC function with social media fields
CREATE OR REPLACE FUNCTION get_profile(
  p_user_id UUID,
  p_current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  updated_at TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  instagram TEXT,
  x TEXT,
  letterboxd TEXT,
  beli TEXT,
  location GEOGRAPHY,
  hometown TEXT,
  birthday DATE,
  phone_number TEXT,
  invited_by UUID,
  onboarding_invites_sent BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  friend_count INTEGER,
  mutual_friend_count INTEGER,
  post_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.updated_at,
    p.full_name,
    p.avatar_url,
    p.website,
    p.instagram,
    p.x,
    p.letterboxd,
    p.beli,
    p.location,
    p.hometown,
    p.birthday,
    p.phone_number,
    p.invited_by,
    p.onboarding_invites_sent,
    p.created_at::TIMESTAMP WITH TIME ZONE,
    ST_Y(p.location::geometry)::DOUBLE PRECISION as latitude,
    ST_X(p.location::geometry)::DOUBLE PRECISION as longitude,
    (
      SELECT COUNT(*)::INTEGER
      FROM friendships
      WHERE (user_a = p.id OR user_b = p.id)
        AND status = 'accepted'
    ) as friend_count,
    CASE
      WHEN p_current_user_id IS NOT NULL THEN
        count_mutual_friends(p_current_user_id, p.id)::INTEGER
      ELSE 0
    END as mutual_friend_count,
    (
      SELECT COUNT(*)::INTEGER
      FROM posts
      WHERE author_id = p.id
    ) as post_count
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_profile(UUID, UUID) TO authenticated;
