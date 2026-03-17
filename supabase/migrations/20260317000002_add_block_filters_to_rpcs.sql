-- Add is_blocked() filters to all RPC functions that return other users' data
-- This ensures blocked users are hidden from maps, feeds, and location views

-- get_feed_posts: exclude posts by blocked users
DROP FUNCTION IF EXISTS get_feed_posts(UUID, INT, INT);
CREATE OR REPLACE FUNCTION get_feed_posts(
  user_id_param UUID,
  limit_param INT,
  offset_param INT
)
RETURNS TABLE (
  id UUID,
  text TEXT,
  media_urls TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  author_id UUID,
  visibility TEXT,
  author JSONB,
  like_count BIGINT,
  comment_count BIGINT,
  liked_by_user BOOLEAN,
  saved_by_user BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.text,
    p.media_urls,
    p.created_at,
    p.updated_at,
    p.edited_at,
    p.author_id,
    p.visibility::TEXT,
    jsonb_build_object(
      'id', prof.id,
      'full_name', prof.full_name,
      'avatar_url', prof.avatar_url
    ) as author,
    COUNT(DISTINCT l.id)::BIGINT as like_count,
    COUNT(DISTINCT c.id)::BIGINT as comment_count,
    (COUNT(DISTINCT CASE WHEN l.user_id = user_id_param THEN l.id END) > 0) as liked_by_user,
    EXISTS(
      SELECT 1 FROM saved_posts s
      WHERE s.post_id = p.id AND s.user_id = user_id_param
    ) as saved_by_user
  FROM posts p
  INNER JOIN profiles prof ON p.author_id = prof.id
  LEFT JOIN likes l ON l.post_id = p.id
  LEFT JOIN comments c ON c.post_id = p.id
  WHERE (
    -- Own posts
    p.author_id = user_id_param
    OR (
      -- Friends' posts (visibility = 'friends' or 'public')
      p.visibility IN ('friends', 'public')
      AND EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.status = 'accepted'
          AND (
            (f.user_a = user_id_param AND f.user_b = p.author_id)
            OR (f.user_b = user_id_param AND f.user_a = p.author_id)
          )
      )
    )
    OR (
      -- Mutuals' posts (visibility = 'mutuals' or 'public')
      p.visibility IN ('mutuals', 'public')
      AND EXISTS (
        SELECT 1 FROM friendships f1
        JOIN friendships f2 ON (
          (f2.user_a = p.author_id OR f2.user_b = p.author_id)
          AND f2.status = 'accepted'
        )
        WHERE f1.status = 'accepted'
          AND (f1.user_a = user_id_param OR f1.user_b = user_id_param)
          AND (
            (f1.user_a = f2.user_a AND f1.user_a != p.author_id AND f1.user_a != user_id_param)
            OR (f1.user_a = f2.user_b AND f1.user_a != p.author_id AND f1.user_a != user_id_param)
            OR (f1.user_b = f2.user_a AND f1.user_b != p.author_id AND f1.user_b != user_id_param)
            OR (f1.user_b = f2.user_b AND f1.user_b != p.author_id AND f1.user_b != user_id_param)
          )
      )
    )
    OR p.visibility = 'public'
  )
  AND NOT is_blocked(user_id_param, p.author_id)
  GROUP BY p.id, p.text, p.media_urls, p.created_at, p.updated_at, p.edited_at, p.author_id, p.visibility, prof.id, prof.full_name, prof.avatar_url
  ORDER BY p.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- get_saved_posts: exclude saved posts by blocked users
DROP FUNCTION IF EXISTS get_saved_posts(UUID, INT, INT);
CREATE OR REPLACE FUNCTION get_saved_posts(
  user_id_param UUID,
  limit_param INT,
  offset_param INT
)
RETURNS TABLE (
  id UUID,
  text TEXT,
  media_urls TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  author_id UUID,
  visibility TEXT,
  author JSONB,
  like_count BIGINT,
  comment_count BIGINT,
  liked_by_user BOOLEAN,
  saved_by_user BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.text,
    p.media_urls,
    p.created_at,
    p.updated_at,
    p.edited_at,
    p.author_id,
    p.visibility::TEXT,
    jsonb_build_object(
      'id', prof.id,
      'full_name', prof.full_name,
      'avatar_url', prof.avatar_url
    ) as author,
    COUNT(DISTINCT l.id)::BIGINT as like_count,
    COUNT(DISTINCT c.id)::BIGINT as comment_count,
    (COUNT(DISTINCT CASE WHEN l.user_id = user_id_param THEN l.id END) > 0) as liked_by_user,
    true as saved_by_user
  FROM saved_posts sp
  INNER JOIN posts p ON sp.post_id = p.id
  INNER JOIN profiles prof ON p.author_id = prof.id
  LEFT JOIN likes l ON l.post_id = p.id
  LEFT JOIN comments c ON c.post_id = p.id
  WHERE sp.user_id = user_id_param
    AND NOT is_blocked(user_id_param, p.author_id)
  GROUP BY p.id, p.text, p.media_urls, p.created_at, p.updated_at, p.edited_at, p.author_id, p.visibility, prof.id, prof.full_name, prof.avatar_url, sp.created_at
  ORDER BY sp.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- get_friend_locations: exclude blocked users from friend locations
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
    'friend'::TEXT as type,
    CASE
      WHEN f.user_a = p_user_id THEN ST_X(p_b.location::geometry)
      ELSE ST_X(p_a.location::geometry)
    END as longitude,
    CASE
      WHEN f.user_a = p_user_id THEN ST_Y(p_b.location::geometry)
      ELSE ST_Y(p_a.location::geometry)
    END as latitude
  FROM friendships f
  JOIN profiles p_a ON f.user_a = p_a.id
  JOIN profiles p_b ON f.user_b = p_b.id
  WHERE (f.user_a = p_user_id OR f.user_b = p_user_id)
    AND f.status = 'accepted'
    AND (
      (f.user_a = p_user_id AND p_b.location IS NOT NULL) OR
      (f.user_b = p_user_id AND p_a.location IS NOT NULL)
    )
    AND NOT is_blocked(p_user_id,
      CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_mutual_locations_with_connections: exclude blocked users from mutual locations
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
      AND NOT is_blocked(p_user_id, f.user_b)
    UNION ALL
    SELECT f.user_a as foaf_id, mf.friend_id as connector_id
    FROM friendships f
    INNER JOIN my_friends mf ON f.user_b = mf.friend_id
    WHERE f.status = 'accepted'
      AND f.user_a != p_user_id
      AND NOT EXISTS (SELECT 1 FROM my_friends WHERE friend_id = f.user_a)
      AND NOT is_blocked(p_user_id, f.user_a)
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

-- get_friend_hometown_locations: exclude blocked users
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
    AND NOT is_blocked(p_user_id,
      CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END
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
    AND p.hometown_location IS NOT NULL
    AND NOT is_blocked(p_user_id, fof.foaf_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_viewable_list_locations: exclude blocked users' lists
CREATE OR REPLACE FUNCTION get_viewable_list_locations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  location_name TEXT,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  owner_name TEXT
) AS $$
BEGIN
  RETURN QUERY

  -- Own lists with location
  SELECT
    l.id,
    l.title,
    l.category,
    l.location_name,
    ST_X(l.location::geometry) as longitude,
    ST_Y(l.location::geometry) as latitude,
    'You'::TEXT as owner_name
  FROM lists l
  WHERE l.user_id = p_user_id
    AND l.location IS NOT NULL

  UNION ALL

  -- Friends' lists with location
  SELECT
    l.id,
    l.title,
    l.category,
    l.location_name,
    ST_X(l.location::geometry) as longitude,
    ST_Y(l.location::geometry) as latitude,
    p.full_name as owner_name
  FROM lists l
  JOIN profiles p ON p.id = l.user_id
  JOIN friendships f ON (
    (f.user_a = p_user_id AND f.user_b = l.user_id) OR
    (f.user_b = p_user_id AND f.user_a = l.user_id)
  )
  WHERE f.status = 'accepted'
    AND l.user_id != p_user_id
    AND l.location IS NOT NULL
    AND NOT is_blocked(p_user_id, l.user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
