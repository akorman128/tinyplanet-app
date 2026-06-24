-- ============================================================================
-- Single source of truth for "can A view B's social data" = friends OR mutuals
-- ============================================================================
--
-- Follow-up to 20260624000001. That migration restored cross-user viewing of
-- lists/contacts in the two SUMMARY RPCs (get_lists_with_places,
-- get_contacts_ordered) for friends OR mutuals, but the matching DETAIL paths
-- were never widened, so a MUTUAL saw a list/contact card and then dead-ended:
--   * lists / list_places / contacts table RLS allowed only owner + DIRECT friends
--   * get_list_places_with_coordinates (list detail) allowed only owner + friends
--   * get_viewable_list_locations (map) showed only own + friends' lists
-- The visibility rule also lived inline in 4+ places and had already drifted.
--
-- This migration introduces ONE predicate, can_view_user(viewer, target), and
-- routes every reader through it so all access paths agree:
--   self OR (NOT blocked AND (direct accepted friend OR mutual/friend-of-friend)).
-- It uses TARGETED EXISTS checks (only the viewer's friendship edges), not the
-- full-set get_friends_and_mutuals_of materialization, so it is cheap enough for
-- per-row RLS evaluation and is index-backed by the friendships indexes.
--
-- Safety/replay: all CREATE OR REPLACE / DROP POLICY IF EXISTS; idempotent on a
-- fresh `db reset`. can_view_user is STABLE and COALESCEs to a strict boolean so
-- `IF NOT can_view_user(...)` can never fall through on a NULL (e.g. anon).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. The predicate. SECURITY DEFINER so RLS/RPC callers can evaluate friendship
--    and block state they cannot read directly. Never returns NULL.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_view_user(p_viewer uuid, p_target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    p_viewer = p_target
    OR (
      NOT public.is_blocked(p_viewer, p_target)
      AND (
        -- direct accepted friend
        EXISTS (
          SELECT 1 FROM public.friendships f
          WHERE f.status = 'accepted'
            AND ((f.user_a = p_viewer AND f.user_b = p_target)
              OR (f.user_b = p_viewer AND f.user_a = p_target))
        )
        -- mutual: viewer and target share an accepted-friend intermediary
        OR EXISTS (
          SELECT 1
          FROM (
            SELECT CASE WHEN f.user_a = p_viewer THEN f.user_b ELSE f.user_a END AS intermediary
            FROM public.friendships f
            WHERE f.status = 'accepted'
              AND (f.user_a = p_viewer OR f.user_b = p_viewer)
          ) af
          JOIN public.friendships f2 ON (
            f2.status = 'accepted'
            AND ((f2.user_a = af.intermediary AND f2.user_b = p_target)
              OR (f2.user_b = af.intermediary AND f2.user_a = p_target))
          )
        )
      )
    ),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_view_user(uuid, uuid) TO anon, authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 2. Route the two SUMMARY RPCs through the predicate (replaces the inline
--    friends-or-mutuals guard from 20260624000001; bodies otherwise unchanged).
--    Also adds SET search_path = public to get_contacts_ordered for parity.
-- ----------------------------------------------------------------------------
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
    IF NOT public.can_view_user(auth.uid(), p_user_id) THEN
      RAISE EXCEPTION 'forbidden: not authorized to view this user''s data'
        USING ERRCODE = '42501';
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
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF NOT public.can_view_user(auth.uid(), p_user_id) THEN
    RAISE EXCEPTION 'forbidden: not authorized to view this user''s data'
      USING ERRCODE = '42501';
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
$$;


-- ----------------------------------------------------------------------------
-- 3. Widen the list DETAIL RPC to friends + mutuals (was owner + direct friends).
--    Keeps the exact 'List not found or access denied' message (tests match it).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_list_places_with_coordinates(
    p_list_id uuid
)
RETURNS TABLE (
    id uuid,
    list_id uuid,
    original_text text,
    resolved_name text,
    longitude double precision,
    latitude double precision,
    confidence numeric,
    status text,
    alternatives jsonb,
    "position" int,
    created_at timestamptz,
    updated_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify access (owner, friend, or mutual of the list owner)
    IF NOT EXISTS (
        SELECT 1 FROM public.lists l
        WHERE l.id = p_list_id
        AND public.can_view_user(auth.uid(), l.user_id)
    ) THEN
        RAISE EXCEPTION 'List not found or access denied';
    END IF;

    RETURN QUERY
    SELECT
        lp.id,
        lp.list_id,
        lp.original_text,
        lp.resolved_name,
        ST_X(lp.location::geometry) as longitude,
        ST_Y(lp.location::geometry) as latitude,
        lp.confidence,
        lp.status,
        lp.alternatives,
        lp.position,
        lp.created_at,
        lp.updated_at
    FROM public.list_places lp
    WHERE lp.list_id = p_list_id
    ORDER BY lp.position ASC;
END;
$$;


-- ----------------------------------------------------------------------------
-- 4. Widen the map RPC to include mutuals' lists (was own + direct friends).
--    p_user_id is the viewer; keep its acting-param self guard.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_viewable_list_locations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  location_name TEXT,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  owner_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Friends' and mutuals' lists with location
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
  WHERE l.user_id != p_user_id
    AND l.location IS NOT NULL
    AND public.can_view_user(p_user_id, l.user_id);
END;
$$;


-- ----------------------------------------------------------------------------
-- 5. Widen table RLS to friends + mutuals via the same predicate, so DIRECT
--    PostgREST reads (detail screens) agree with the RPCs. The owner-only SELECT
--    policies remain as a cheap self fast-path.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view friends lists" ON public.lists;
CREATE POLICY "Users can view friends and mutuals lists"
    ON public.lists FOR SELECT
    USING (public.can_view_user(auth.uid(), user_id));

DROP POLICY IF EXISTS "Users can view places in accessible lists" ON public.list_places;
CREATE POLICY "Users can view places in accessible lists"
    ON public.list_places FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.lists l
            WHERE l.id = list_id
                AND public.can_view_user(auth.uid(), l.user_id)
        )
    );

DROP POLICY IF EXISTS "Users can view friends contacts" ON public.contacts;
CREATE POLICY "Users can view friends and mutuals contacts"
    ON public.contacts FOR SELECT
    USING (public.can_view_user(auth.uid(), user_id));
