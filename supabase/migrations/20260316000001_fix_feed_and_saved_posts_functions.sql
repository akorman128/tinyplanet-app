-- Fix get_feed_posts: add friendship filter since SECURITY DEFINER bypasses RLS
-- Fix get_saved_posts: add sp.created_at to GROUP BY to fix ORDER BY error

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
  GROUP BY p.id, p.text, p.media_urls, p.created_at, p.updated_at, p.edited_at, p.author_id, p.visibility, prof.id, prof.full_name, prof.avatar_url
  ORDER BY p.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- Fix get_saved_posts: add sp.created_at to GROUP BY
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
  GROUP BY p.id, p.text, p.media_urls, p.created_at, p.updated_at, p.edited_at, p.author_id, p.visibility, prof.id, prof.full_name, prof.avatar_url, sp.created_at
  ORDER BY sp.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;
