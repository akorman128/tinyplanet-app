-- Embed Hang data into the feed/saved post functions and hide expired hangs.
-- Based on the latest definitions in 20260317000002_add_block_filters_to_rpcs.sql
-- (preserves the NOT is_blocked() filters). A post linked to a hang gets a `hang`
-- JSONB payload (else NULL); a hang-post is excluded once starts_at + 3h has passed.

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
  saved_by_user BOOLEAN,
  hang JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Preserve the IDOR guard added by 20260610120000 (this DROP/CREATE rebuilds
  -- the function from a base that predates it, which would otherwise drop it).
  IF user_id_param IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
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
    ) as saved_by_user,
    hang.hang_json as hang
  FROM posts p
  INNER JOIN profiles prof ON p.author_id = prof.id
  LEFT JOIN likes l ON l.post_id = p.id
  LEFT JOIN comments c ON c.post_id = p.id
  LEFT JOIN LATERAL (
    SELECT
      h.id AS hang_id,
      h.starts_at AS hang_starts_at,
      jsonb_build_object(
        'id', h.id,
        'title', h.title,
        'description', h.description,
        'location_name', h.location_name,
        'longitude', ST_X(h.location::geometry),
        'latitude', ST_Y(h.location::geometry),
        'starts_at', h.starts_at,
        'attendee_count', (SELECT count(*) FROM hang_attendees a WHERE a.hang_id = h.id),
        'viewer_is_going', EXISTS(
          SELECT 1 FROM hang_attendees a WHERE a.hang_id = h.id AND a.user_id = user_id_param
        ),
        'attendees', COALESCE((
          SELECT jsonb_agg(jsonb_build_object('full_name', t.full_name, 'avatar_url', t.avatar_url))
          FROM (
            SELECT ap.full_name, ap.avatar_url
            FROM hang_attendees a2
            JOIN profiles ap ON ap.id = a2.user_id
            WHERE a2.hang_id = h.id
            ORDER BY a2.created_at
            LIMIT 3
          ) t
        ), '[]'::jsonb)
      ) AS hang_json
    FROM hangs h
    WHERE h.post_id = p.id
  ) hang ON true
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
    OR (
      -- Hang posts are visible to the host's friends AND mutuals (the hang's
      -- audience), independent of the carrier post's visibility value.
      hang.hang_id IS NOT NULL
      AND (
        EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.status = 'accepted'
            AND (
              (f.user_a = user_id_param AND f.user_b = p.author_id)
              OR (f.user_b = user_id_param AND f.user_a = p.author_id)
            )
        )
        OR EXISTS (
          SELECT 1
          FROM friendships f1
          JOIN friendships f2
            ON ((f1.user_a = f2.user_a OR f1.user_a = f2.user_b OR f1.user_b = f2.user_a OR f1.user_b = f2.user_b))
          WHERE f1.status = 'accepted' AND f2.status = 'accepted'
            AND (f1.user_a = user_id_param OR f1.user_b = user_id_param)
            AND (f2.user_a = p.author_id OR f2.user_b = p.author_id)
            AND f1.user_a != f2.user_a AND f1.user_b != f2.user_b
        )
      )
    )
  )
  AND NOT is_blocked(user_id_param, p.author_id)
  -- Hide hang-posts once the hang has expired (non-hang posts always pass)
  AND (hang.hang_id IS NULL OR hang.hang_starts_at + interval '3 hours' >= now())
  GROUP BY p.id, p.text, p.media_urls, p.created_at, p.updated_at, p.edited_at, p.author_id, p.visibility, prof.id, prof.full_name, prof.avatar_url, hang.hang_id, hang.hang_starts_at, hang.hang_json
  ORDER BY p.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

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
  saved_by_user BOOLEAN,
  hang JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Preserve the IDOR guard added by 20260610120000 (this DROP/CREATE rebuilds
  -- the function from a base that predates it, which would otherwise drop it).
  IF user_id_param IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
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
    true as saved_by_user,
    hang.hang_json as hang
  FROM saved_posts sp
  INNER JOIN posts p ON sp.post_id = p.id
  INNER JOIN profiles prof ON p.author_id = prof.id
  LEFT JOIN likes l ON l.post_id = p.id
  LEFT JOIN comments c ON c.post_id = p.id
  LEFT JOIN LATERAL (
    SELECT
      h.id AS hang_id,
      h.starts_at AS hang_starts_at,
      jsonb_build_object(
        'id', h.id,
        'title', h.title,
        'description', h.description,
        'location_name', h.location_name,
        'longitude', ST_X(h.location::geometry),
        'latitude', ST_Y(h.location::geometry),
        'starts_at', h.starts_at,
        'attendee_count', (SELECT count(*) FROM hang_attendees a WHERE a.hang_id = h.id),
        'viewer_is_going', EXISTS(
          SELECT 1 FROM hang_attendees a WHERE a.hang_id = h.id AND a.user_id = user_id_param
        ),
        'attendees', COALESCE((
          SELECT jsonb_agg(jsonb_build_object('full_name', t.full_name, 'avatar_url', t.avatar_url))
          FROM (
            SELECT ap.full_name, ap.avatar_url
            FROM hang_attendees a2
            JOIN profiles ap ON ap.id = a2.user_id
            WHERE a2.hang_id = h.id
            ORDER BY a2.created_at
            LIMIT 3
          ) t
        ), '[]'::jsonb)
      ) AS hang_json
    FROM hangs h
    WHERE h.post_id = p.id
  ) hang ON true
  WHERE sp.user_id = user_id_param
    AND NOT is_blocked(user_id_param, p.author_id)
    AND (hang.hang_id IS NULL OR hang.hang_starts_at + interval '3 hours' >= now())
  GROUP BY p.id, p.text, p.media_urls, p.created_at, p.updated_at, p.edited_at, p.author_id, p.visibility, prof.id, prof.full_name, prof.avatar_url, sp.created_at, hang.hang_id, hang.hang_starts_at, hang.hang_json
  ORDER BY sp.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;
