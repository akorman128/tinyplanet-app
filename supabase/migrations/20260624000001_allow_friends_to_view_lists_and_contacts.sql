-- ============================================================================
-- FIX: restore viewing other users' lists & contacts (friends OR mutuals)
-- ============================================================================
--
-- Regression:
--   The IDOR fix in 20260610120000 added the guard
--       IF <param> IS DISTINCT FROM auth.uid() THEN RAISE 'forbidden...'
--   as the first statement of many SECURITY DEFINER RPCs. That guard is correct
--   for functions whose param is the ACTING/VIEWER user (they return *your* feed
--   or map of *your* friends' data). But two functions take the param as the
--   TARGET user being viewed -- the app legitimately passes another user's id:
--       - get_lists_with_places(p_user_id, p_limit, p_offset)
--       - get_contacts_ordered(p_user_id)        [guard re-applied in 20260611000001]
--   The over-broad guard made every cross-user fetch fail with
--   'forbidden: user mismatch', so users could no longer view anyone else's
--   lists or contacts.
--
-- Fix:
--   Re-define both functions (bodies unchanged) with a guard that allows the
--   target to be viewed by FRIENDS OR MUTUALS (friends-of-friends) who have not
--   blocked each other, and still rejects unconnected/blocked users (IDOR stays
--   closed). The friends-or-mutuals set is computed by the existing
--   get_friends_and_mutuals_of() (20260623000002) -- reused rather than
--   re-derived, since its friend-of-friend logic was subtly bugged and only just
--   fixed. is_blocked() (20260317000001) covers the mutual path, where a block
--   does not delete the friend-of-friend relationship.
--
-- Notes:
--   * Signatures/return types are unchanged, so CREATE OR REPLACE preserves grants.
--   * get_friends_and_mutuals_of is granted only to service_role, but is called
--     INTERNALLY here from SECURITY DEFINER functions, so EXECUTE is checked
--     against the function owner (postgres), not the authenticated caller.
--   * auth.uid() / public.* are fully qualified so search_path is irrelevant.
-- ============================================================================


-- ============================================================================
-- get_lists_with_places  (p_user_id is the TARGET user)
-- body verbatim from 20260111000006 / 20260610120000; only the guard changed.
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
      -- Viewing another user's data is allowed only for friends or mutuals
      -- (friends-of-friends) who have not blocked each other.
      IF public.is_blocked(auth.uid(), p_user_id)
         OR NOT EXISTS (
           SELECT 1 FROM public.get_friends_and_mutuals_of(auth.uid()) g
           WHERE g.user_id = p_user_id
         ) THEN
        RAISE EXCEPTION 'forbidden: not authorized to view this user''s data'
          USING ERRCODE = '42501';
      END IF;
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
-- get_contacts_ordered  (p_user_id is the TARGET user)
-- body verbatim from 20260611000001; only the guard changed.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_contacts_ordered(p_user_id UUID)
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
    -- Viewing another user's data is allowed only for friends or mutuals
    -- (friends-of-friends) who have not blocked each other.
    IF public.is_blocked(auth.uid(), p_user_id)
       OR NOT EXISTS (
         SELECT 1 FROM public.get_friends_and_mutuals_of(auth.uid()) g
         WHERE g.user_id = p_user_id
       ) THEN
      RAISE EXCEPTION 'forbidden: not authorized to view this user''s data'
        USING ERRCODE = '42501';
    END IF;
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
