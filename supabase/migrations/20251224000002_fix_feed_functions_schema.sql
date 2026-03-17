-- Fix the feed functions to use correct column names (text, media_urls, edited_at)
-- This replaces the previous version that incorrectly referenced 'content' and 'media_url'

-- Drop the old functions first (required because we're changing the return type)
DROP FUNCTION IF EXISTS get_feed_posts(UUID, INT, INT);
DROP FUNCTION IF EXISTS get_user_posts(UUID, UUID, INT, INT);

-- Recreate with correct schema
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
  liked_by_user BOOLEAN
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
    (COUNT(DISTINCT CASE WHEN l.user_id = user_id_param THEN l.id END) > 0) as liked_by_user
  FROM posts p
  INNER JOIN profiles prof ON p.author_id = prof.id
  LEFT JOIN likes l ON l.post_id = p.id
  LEFT JOIN comments c ON c.post_id = p.id
  -- RLS policies on posts table will still filter which posts are visible
  GROUP BY p.id, p.text, p.media_urls, p.created_at, p.updated_at, p.edited_at, p.author_id, p.visibility, prof.id, prof.full_name, prof.avatar_url
  ORDER BY p.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_posts(
  user_id_param UUID,
  target_user_id UUID,
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
  liked_by_user BOOLEAN
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
    (COUNT(DISTINCT CASE WHEN l.user_id = user_id_param THEN l.id END) > 0) as liked_by_user
  FROM posts p
  INNER JOIN profiles prof ON p.author_id = prof.id
  LEFT JOIN likes l ON l.post_id = p.id
  LEFT JOIN comments c ON c.post_id = p.id
  WHERE p.author_id = target_user_id
  -- RLS policies on posts table will still filter which posts are visible
  GROUP BY p.id, p.text, p.media_urls, p.created_at, p.updated_at, p.edited_at, p.author_id, p.visibility, prof.id, prof.full_name, prof.avatar_url
  ORDER BY p.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;
