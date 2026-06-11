-- ============================================================================
-- SECURITY FIX [#1]: Enforce auth.uid() in SECURITY DEFINER RPCs (close IDOR)
-- ============================================================================
--
-- Problem:
--   Many SECURITY DEFINER functions accept a CALLER-SUPPLIED acting/viewer user
--   id (named variously p_user_id, user_id_param, p_current_user_id, ...) and use
--   it for authorization. Because SECURITY DEFINER bypasses RLS, any authenticated
--   user could pass ANOTHER user's UUID to read that user's data (an IDOR).
--
-- Fix:
--   This migration re-defines each affected function with CREATE OR REPLACE,
--   re-using its LATEST body verbatim, and inserts the following guard as the
--   FIRST statement after BEGIN (using each function's actual acting-param name):
--
--       IF <acting_param> IS DISTINCT FROM auth.uid() THEN
--         RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
--       END IF;
--
-- Notes:
--   * Function SIGNATURES are intentionally unchanged so the ~30 client hooks keep
--     working.
--   * Functions that also take a separate TARGET/other-user param (e.g.
--     get_user_posts.target_user_id, get_profile.p_user_id, count_mutual_friends.
--     p_target_user_id) are guarded ONLY on their acting/viewer param; the target
--     param may legitimately differ.
--   * Functions with NO acting/viewer user-identity param are intentionally NOT
--     touched here:
--       - resource-id functions that verify ownership against auth.uid() internally
--         (can_access_list, reorder_list_places, get_list_places_with_coordinates,
--          update_travel_plan_with_post, cancel_travel_plan_with_post,
--          get_travel_plan_with_coordinates, get_travel_plan_by_post_id);
--       - target-only public-profile readers (get_top_vibes, top_emojis_for_user);
--       - create_intro (derives introducer from auth.uid() internally; its params
--         are the two introduced users);
--       - is_blocked (symmetric boolean predicate, no single acting param);
--       - trigger functions (handle_new_user, normalize_friendship_order, etc.).
-- ============================================================================


-- ============================================================================
-- get_feed_posts  (acting param: user_id_param)
-- latest body: 20260317000002_add_block_filters_to_rpcs.sql
-- ============================================================================
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


-- ============================================================================
-- get_saved_posts  (acting param: user_id_param)
-- latest body: 20260317000002_add_block_filters_to_rpcs.sql
-- ============================================================================
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


-- ============================================================================
-- get_user_posts  (acting param: user_id_param; target param: target_user_id)
-- latest body: 20251224160001_update_feed_functions_with_saved.sql
-- ============================================================================
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
  liked_by_user BOOLEAN,
  saved_by_user BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
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
    ) as saved_by_user
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


-- ============================================================================
-- get_friend_locations  (acting param: p_user_id)
-- latest body: 20260317000002_add_block_filters_to_rpcs.sql
-- ============================================================================
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
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
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


-- ============================================================================
-- get_mutual_locations  (acting param: p_user_id)
-- latest body: 20251124000003_add_indexes_optimize_queries.sql
-- ============================================================================
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
  WHERE p.location IS NOT NULL;
END;
$$;


-- ============================================================================
-- get_mutual_locations_with_connections  (acting param: p_user_id)
-- latest body: 20260317000002_add_block_filters_to_rpcs.sql
-- ============================================================================
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
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
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


-- ============================================================================
-- get_friend_hometown_locations  (acting param: p_user_id)
-- latest body: 20260317000002_add_block_filters_to_rpcs.sql
-- ============================================================================
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
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
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


-- ============================================================================
-- get_viewable_list_locations  (acting param: p_user_id)
-- latest body: 20260317000002_add_block_filters_to_rpcs.sql
-- ============================================================================
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
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
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


-- ============================================================================
-- get_message_channels  (acting param: p_user_id)
-- latest body: 20260103000003_fix_message_channels_ambiguous_friend_id.sql
-- ============================================================================
CREATE OR REPLACE FUNCTION get_message_channels(p_user_id UUID)
RETURNS TABLE (
  friend_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  last_message_id UUID,
  last_message_text TEXT,
  last_message_sender_id UUID,
  last_message_created_at TIMESTAMPTZ,
  last_message_deleted_at TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH accepted_friends AS (
    SELECT
      CASE
        WHEN f.user_a = p_user_id THEN f.user_b
        ELSE f.user_a
      END AS friend_id,
      f.accepted_at
    FROM friendships f
    WHERE
      (f.user_a = p_user_id OR f.user_b = p_user_id)
      AND f.status = 'accepted'
  ),
  last_messages AS (
    SELECT DISTINCT ON (m.user_id_a, m.user_id_b)
      m.id,
      m.user_id_a,
      m.user_id_b,
      m.sender_id,
      m.text,
      m.created_at,
      m.deleted_at
    FROM messages m
    ORDER BY m.user_id_a, m.user_id_b, m.created_at DESC
  )
  SELECT
    af.friend_id,
    p.full_name,
    p.avatar_url,
    lm.id AS last_message_id,
    lm.text AS last_message_text,
    lm.sender_id AS last_message_sender_id,
    lm.created_at AS last_message_created_at,
    lm.deleted_at AS last_message_deleted_at,
    COALESCE(
      (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.user_id_a = LEAST(p_user_id, af.friend_id)
          AND m.user_id_b = GREATEST(p_user_id, af.friend_id)
          AND m.sender_id = af.friend_id
          AND m.deleted_at IS NULL
          AND m.created_at > COALESCE(
            (SELECT last_read_at FROM conversation_reads cr WHERE cr.user_id = p_user_id AND cr.friend_id = af.friend_id),
            '1970-01-01'::timestamptz
          )
      ),
      0
    ) AS unread_count
  FROM accepted_friends af
  INNER JOIN profiles p ON p.id = af.friend_id
  LEFT JOIN last_messages lm ON (
    lm.user_id_a = LEAST(p_user_id, af.friend_id) AND
    lm.user_id_b = GREATEST(p_user_id, af.friend_id)
  )
  ORDER BY COALESCE(lm.created_at, af.accepted_at) DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================================================
-- get_platform_statistics  (acting param: p_user_id)
-- latest body: 20260111000001_add_get_platform_statistics_rpc.sql
-- ============================================================================
CREATE OR REPLACE FUNCTION get_platform_statistics(p_user_id UUID)
RETURNS TABLE (
  total_users INTEGER,
  connections_count INTEGER
) AS $$
DECLARE
  v_total_users INTEGER;
  v_friends_count INTEGER;
  v_mutuals_count INTEGER;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
  -- Count total users on platform
  SELECT COUNT(*)::INTEGER INTO v_total_users
  FROM profiles;

  -- Count user's direct friends (accepted friendships, bidirectional)
  SELECT COUNT(*)::INTEGER INTO v_friends_count
  FROM friendships
  WHERE (user_a = p_user_id OR user_b = p_user_id)
    AND status = 'accepted';

  -- Count mutuals (friends-of-friends, excluding direct friends and self)
  -- Uses the same logic as friends_of_friends_v view but returns a count
  WITH edges AS (
    -- Get all accepted friendship edges bidirectionally
    SELECT user_a AS user_id, user_b AS friend_id
    FROM friendships
    WHERE status = 'accepted'
    UNION ALL
    SELECT user_b AS user_id, user_a AS friend_id
    FROM friendships
    WHERE status = 'accepted'
  ),
  my_friends AS (
    -- Get direct friends of p_user_id
    SELECT friend_id
    FROM edges
    WHERE user_id = p_user_id
  ),
  foaf AS (
    -- Get friends of my friends
    SELECT DISTINCT e2.friend_id AS foaf_id
    FROM edges e1
    JOIN edges e2 ON e1.friend_id = e2.user_id
    WHERE e1.user_id = p_user_id
      AND e2.friend_id != p_user_id  -- Exclude self
      AND NOT EXISTS (
        SELECT 1 FROM my_friends WHERE friend_id = e2.friend_id
      )  -- Exclude direct friends
  )
  SELECT COUNT(*)::INTEGER INTO v_mutuals_count
  FROM foaf;

  -- Return total users and combined connections count (friends + mutuals)
  RETURN QUERY
  SELECT v_total_users, (v_friends_count + v_mutuals_count)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================================
-- get_lists_with_places  (acting param: p_user_id; target params: p_limit/p_offset)
-- latest body: 20260111000006_add_pagination_to_lists_rpc.sql
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_lists_with_places(
    p_user_id uuid,
    p_limit int DEFAULT NULL,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    title text,
    location_name text,
    longitude double precision,
    latitude double precision,
    created_at timestamptz,
    updated_at timestamptz,
    places jsonb,
    total_count bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
    WITH user_lists AS (
        -- Get all lists for user with total count via window function
        SELECT
            l.id,
            l.user_id,
            l.title,
            l.location_name,
            ST_X(l.location::geometry) as longitude,
            ST_Y(l.location::geometry) as latitude,
            l.created_at,
            l.updated_at,
            COUNT(*) OVER() as total_count
        FROM public.lists l
        WHERE l.user_id = p_user_id
        ORDER BY l.created_at DESC
        OFFSET p_offset
        LIMIT p_limit
    )
    SELECT
        ul.id,
        ul.user_id,
        ul.title,
        ul.location_name,
        ul.longitude,
        ul.latitude,
        ul.created_at,
        ul.updated_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', lp.id,
                        'list_id', lp.list_id,
                        'original_text', lp.original_text,
                        'resolved_name', lp.resolved_name,
                        'longitude', ST_X(lp.location::geometry),
                        'latitude', ST_Y(lp.location::geometry),
                        'confidence', lp.confidence,
                        'status', lp.status,
                        'alternatives', lp.alternatives,
                        'position', lp.position,
                        'created_at', lp.created_at,
                        'updated_at', lp.updated_at
                    )
                    ORDER BY lp.position ASC
                )
                FROM public.list_places lp
                WHERE lp.list_id = ul.id
            ),
            '[]'::jsonb
        ) as places,
        ul.total_count
    FROM user_lists ul;
END;
$$;


-- ============================================================================
-- has_unread_messages  (acting param: p_user_id)
-- latest body: 20260114000001_add_get_total_unread_count_rpc.sql
-- ============================================================================
CREATE OR REPLACE FUNCTION has_unread_messages(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM friendships f
    CROSS JOIN LATERAL (
      -- Check for unread messages from this friend
      SELECT 1
      FROM messages m
      WHERE
        -- Match conversation (user_id_a < user_id_b constraint)
        m.user_id_a = LEAST(p_user_id, CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END)
        AND m.user_id_b = GREATEST(p_user_id, CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END)
        -- Only count messages FROM the friend, not messages we sent
        AND m.sender_id = CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END
        -- Exclude deleted messages
        AND m.deleted_at IS NULL
        -- Only messages after last read time (or all if never read)
        AND m.created_at > COALESCE(
          (SELECT cr.last_read_at FROM conversation_reads cr
           WHERE cr.user_id = p_user_id
             AND cr.friend_id = CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END),
          '1970-01-01'::timestamptz
        )
      LIMIT 1
    ) unread
    WHERE (f.user_a = p_user_id OR f.user_b = p_user_id)
      AND f.status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================================================
-- get_total_unread_count  (acting param: p_user_id)
-- latest body: 20260317100001_add_push_tokens_and_notification_support.sql
-- ============================================================================
CREATE OR REPLACE FUNCTION get_total_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
  SELECT COALESCE(SUM(unread_count), 0)::INTEGER INTO total
  FROM (
    SELECT COUNT(*) AS unread_count
    FROM friendships f
    CROSS JOIN LATERAL (
      SELECT 1
      FROM messages m
      WHERE
        m.user_id_a = LEAST(p_user_id, CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END)
        AND m.user_id_b = GREATEST(p_user_id, CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END)
        AND m.sender_id = CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END
        AND m.deleted_at IS NULL
        AND m.created_at > COALESCE(
          (SELECT cr.last_read_at FROM conversation_reads cr
           WHERE cr.user_id = p_user_id
             AND cr.friend_id = CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END),
          '1970-01-01'::timestamptz
        )
    ) unread
    WHERE (f.user_a = p_user_id OR f.user_b = p_user_id)
      AND f.status = 'accepted'
  ) per_friend;

  RETURN total;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================================================
-- get_contacts_ordered  (acting param: p_user_id)
-- latest body: 20260223000002_add_location_name_to_contacts.sql
-- ============================================================================
CREATE OR REPLACE FUNCTION get_contacts_ordered(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  phone TEXT,
  email TEXT,
  company TEXT,
  note TEXT,
  location GEOGRAPHY,
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    c.id, c.user_id, c.name, c.phone, c.email,
    c.company, c.note, c.location, c.location_name,
    ST_Y(c.location::geometry)::DOUBLE PRECISION,
    ST_X(c.location::geometry)::DOUBLE PRECISION,
    c.created_at, c.updated_at
  FROM contacts c
  WHERE c.user_id = p_user_id
  ORDER BY ST_Y(c.location::geometry) DESC NULLS LAST, c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================================
-- get_active_travel_plan_locations  (acting param: p_user_id)
-- latest body: 20251229000003_travel_plan_rpc_functions.sql
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_active_travel_plan_locations(
    p_user_id uuid
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    full_name text,
    avatar_url text,
    destination_name text,
    start_date date,
    end_date date,
    longitude double precision,
    latitude double precision,
    type text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
    SELECT
        tp.id,
        tp.user_id,
        prof.full_name,
        prof.avatar_url,
        tp.destination_name,
        tp.start_date,
        tp.end_date,
        ST_X(tp.destination_location::geometry) as longitude,
        ST_Y(tp.destination_location::geometry) as latitude,
        CASE
            WHEN tp.user_id = p_user_id THEN 'own'
            WHEN EXISTS (
                SELECT 1 FROM public.friendships f
                WHERE f.status = 'accepted'
                    AND ((f.user_a = p_user_id AND f.user_b = tp.user_id) OR (f.user_b = p_user_id AND f.user_a = tp.user_id))
            ) THEN 'friend'
            ELSE 'mutual'
        END::text as type
    FROM public.travel_plans tp
    INNER JOIN public.profiles prof ON tp.user_id = prof.id
    WHERE tp.destination_location IS NOT NULL
        AND tp.start_date <= CURRENT_DATE
        AND tp.end_date >= CURRENT_DATE
        AND (
            tp.user_id = p_user_id -- Own plan
            OR EXISTS ( -- Friend's plan
                SELECT 1 FROM public.friendships f
                WHERE f.status = 'accepted'
                    AND ((f.user_a = p_user_id AND f.user_b = tp.user_id) OR (f.user_b = p_user_id AND f.user_a = tp.user_id))
            )
            OR EXISTS ( -- Mutual's plan
                SELECT 1
                FROM public.friendships f1
                INNER JOIN public.friendships f2
                    ON ((f1.user_a = f2.user_a OR f1.user_a = f2.user_b OR f1.user_b = f2.user_a OR f1.user_b = f2.user_b))
                WHERE f1.status = 'accepted' AND f2.status = 'accepted'
                    AND (
                        (f1.user_a = p_user_id OR f1.user_b = p_user_id) AND
                        (f2.user_a = tp.user_id OR f2.user_b = tp.user_id) AND
                        f1.user_a != f2.user_a AND f1.user_b != f2.user_b
                    )
            )
        );
END;
$$;


-- ============================================================================
-- create_travel_plan_with_post  (acting param: p_user_id; remaining params are trip data)
-- latest body: 20260103000007_fix_travel_plan_ambiguous_post_id.sql
-- (Function already had an equivalent ownership check; the mandated guard is
--  inserted as the first statement after BEGIN for consistency.)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_travel_plan_with_post(
    p_user_id uuid,
    p_destination_location_lng double precision,
    p_destination_location_lat double precision,
    p_destination_name text,
    p_start_date date,
    p_duration_days int,
    p_post_visibility text DEFAULT 'friends',
    p_text text DEFAULT NULL
)
RETURNS TABLE (
    travel_plan_id uuid,
    post_id uuid,
    destination_name text,
    start_date date,
    end_date date
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_travel_plan_id uuid;
    v_post_id uuid;
    v_end_date date;
    v_post_text text;
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
    END IF;
    -- Validate user
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot create travel plan for another user';
    END IF;

    -- Validate duration
    IF p_duration_days < 1 OR p_duration_days > 31 THEN
        RAISE EXCEPTION 'Duration must be between 1 and 31 days';
    END IF;

    -- Check if user already has an overlapping active or upcoming travel plan
    -- FIXED: Qualify end_date with table name to avoid ambiguity
    IF EXISTS (
        SELECT 1 FROM public.travel_plans tp
        WHERE tp.user_id = p_user_id AND tp.end_date >= CURRENT_DATE
    ) THEN
        RAISE EXCEPTION 'You already have an active or upcoming travel plan. Cancel it before creating a new one.';
    END IF;

    -- Calculate end date
    v_end_date := p_start_date + (p_duration_days || ' days')::interval;

    -- Create post text with optional custom message
    v_post_text := '🚀 Traveling to ' || p_destination_name ||
                   ' from ' || to_char(p_start_date, 'Mon DD') ||
                   ' to ' || to_char(v_end_date, 'Mon DD, YYYY') ||
                   ' (' || p_duration_days || ' days)';

    -- Append custom text message if provided
    IF p_text IS NOT NULL AND trim(p_text) != '' THEN
        v_post_text := v_post_text || E'\n\n' || p_text;
    END IF;

    -- Create post atomically
    INSERT INTO public.posts (author_id, text, visibility, media_urls)
    VALUES (
        p_user_id,
        v_post_text,
        p_post_visibility::post_visibility,
        ARRAY[]::text[]
    )
    RETURNING id INTO v_post_id;

    -- Create travel plan
    INSERT INTO public.travel_plans (
        user_id,
        destination_location,
        destination_name,
        start_date,
        duration_days,
        end_date,
        post_id
    )
    VALUES (
        p_user_id,
        ST_SetSRID(ST_MakePoint(p_destination_location_lng, p_destination_location_lat), 4326)::geography,
        p_destination_name,
        p_start_date,
        p_duration_days,
        v_end_date,
        v_post_id
    )
    RETURNING id INTO v_travel_plan_id;

    -- Return combined result
    RETURN QUERY
    SELECT
        v_travel_plan_id,
        v_post_id,
        p_destination_name,
        p_start_date,
        v_end_date;
END;
$$;


-- ============================================================================
-- get_profile  (acting param: p_current_user_id; target param: p_user_id)
-- latest body: 20260316000002_add_theme_settings.sql
-- ============================================================================
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
  post_count INTEGER,
  invited_by_name TEXT,
  theme_settings JSONB
) AS $$
BEGIN
  -- p_current_user_id is the OPTIONAL viewer param (DEFAULT NULL); it only drives
  -- mutual_friend_count below (ELSE 0 when NULL). Auth-bootstrap paths fetch your
  -- own profile with a NULL viewer (useSignIn, app/_layout session-restore), so the
  -- guard must permit NULL while still rejecting a non-null spoofed viewer id.
  IF p_current_user_id IS NOT NULL AND p_current_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
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
    ) as post_count,
    inviter.full_name AS invited_by_name,
    p.theme_settings
  FROM profiles p
  LEFT JOIN profiles inviter ON inviter.id = p.invited_by
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================================
-- count_mutual_friends  (acting param: p_user_id; target param: p_target_user_id)
-- latest body: 20251130000001_add_count_mutual_friends_rpc.sql
-- ============================================================================
CREATE OR REPLACE FUNCTION count_mutual_friends(
  p_user_id UUID,
  p_target_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  mutual_count INTEGER;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
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


-- ============================================================================
-- get_mutual_friends_between_users  (acting param: p_user_id; target: p_target_user_id)
-- latest body: 20251202000001_add_get_mutual_friends_rpc.sql
-- ============================================================================
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
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
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


-- ============================================================================
-- search_friends  (acting param: p_user_id; target param: p_query)
-- latest body: 20251223000001_add_search_friends_rpc.sql
-- ============================================================================
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
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
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
