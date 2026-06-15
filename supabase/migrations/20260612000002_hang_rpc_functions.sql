-- RPC functions for Hangs. Mirror the travel_plan RPCs. All SECURITY DEFINER with an
-- explicit auth.uid() check (SECURITY DEFINER bypasses RLS, so visibility predicates are
-- replicated inside each read function's WHERE).

-- ========================================
-- Function 1: Create Hang + auto-create Post + auto-RSVP host
-- ========================================
CREATE OR REPLACE FUNCTION public.create_hang_with_post(
    p_user_id uuid,
    p_location_lng double precision,
    p_location_lat double precision,
    p_location_name text,
    p_title text,
    p_description text,
    p_starts_at timestamptz,
    p_post_visibility text DEFAULT 'mutuals'
)
RETURNS TABLE (
    hang_id uuid,
    post_id uuid,
    title text,
    starts_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_hang_id uuid;
    v_post_id uuid;
    v_post_text text;
BEGIN
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot create hang for another user';
    END IF;

    IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
        RAISE EXCEPTION 'Title is required';
    END IF;

    -- 5 min grace so the "now" default doesn't fail on submission delay
    IF p_starts_at < now() - interval '5 minutes' THEN
        RAISE EXCEPTION 'Hang time cannot be in the past';
    END IF;

    IF p_starts_at > now() + interval '7 days' THEN
        RAISE EXCEPTION 'Hangs can be scheduled at most 7 days in advance';
    END IF;

    v_post_text := '🎉 Hang: ' || p_title;

    -- Create the linked post (feed/visibility vehicle)
    INSERT INTO public.posts (author_id, text, visibility, media_urls)
    VALUES (
        p_user_id,
        v_post_text,
        p_post_visibility::post_visibility,
        ARRAY[]::text[]
    )
    RETURNING id INTO v_post_id;

    -- Create the hang
    INSERT INTO public.hangs (
        user_id, location, location_name, title, description, starts_at, post_id
    )
    VALUES (
        p_user_id,
        ST_SetSRID(ST_MakePoint(p_location_lng, p_location_lat), 4326)::geography,
        p_location_name,
        p_title,
        p_description,
        p_starts_at,
        v_post_id
    )
    RETURNING id INTO v_hang_id;

    -- Host is automatically "Going"
    INSERT INTO public.hang_attendees (hang_id, user_id, status)
    VALUES (v_hang_id, p_user_id, 'going');

    RETURN QUERY SELECT v_hang_id, v_post_id, p_title, p_starts_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_hang_with_post TO authenticated;

-- ========================================
-- Function 2: Update Hang + update Post
-- ========================================
CREATE OR REPLACE FUNCTION public.update_hang_with_post(
    p_hang_id uuid,
    p_location_lng double precision,
    p_location_lat double precision,
    p_location_name text,
    p_title text,
    p_description text,
    p_starts_at timestamptz,
    p_post_visibility text DEFAULT NULL
)
RETURNS TABLE (
    hang_id uuid,
    post_id uuid,
    title text,
    starts_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id uuid;
    v_post_id uuid;
    v_post_text text;
BEGIN
    -- Alias the table so `post_id` is not ambiguous with the RETURNS TABLE column.
    SELECT h.user_id, h.post_id INTO v_user_id, v_post_id
    FROM public.hangs h
    WHERE h.id = p_hang_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Hang not found';
    END IF;

    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot update another user''s hang';
    END IF;

    IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
        RAISE EXCEPTION 'Title is required';
    END IF;

    IF p_starts_at < now() - interval '5 minutes' THEN
        RAISE EXCEPTION 'Hang time cannot be in the past';
    END IF;

    IF p_starts_at > now() + interval '7 days' THEN
        RAISE EXCEPTION 'Hangs can be scheduled at most 7 days in advance';
    END IF;

    v_post_text := '🎉 Hang: ' || p_title;

    UPDATE public.posts
    SET text = v_post_text,
        visibility = COALESCE(p_post_visibility::post_visibility, visibility),
        edited_at = now()
    WHERE id = v_post_id;

    UPDATE public.hangs
    SET location = ST_SetSRID(ST_MakePoint(p_location_lng, p_location_lat), 4326)::geography,
        location_name = p_location_name,
        title = p_title,
        description = p_description,
        starts_at = p_starts_at
    WHERE id = p_hang_id;

    RETURN QUERY SELECT p_hang_id, v_post_id, p_title, p_starts_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_hang_with_post TO authenticated;

-- ========================================
-- Function 3: Delete Hang + delete Post (cascades attendees)
-- ========================================
CREATE OR REPLACE FUNCTION public.delete_hang_with_post(
    p_hang_id uuid
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id uuid;
    v_post_id uuid;
BEGIN
    SELECT user_id, post_id INTO v_user_id, v_post_id
    FROM public.hangs
    WHERE id = p_hang_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Hang not found';
    END IF;

    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot delete another user''s hang';
    END IF;

    IF v_post_id IS NOT NULL THEN
        DELETE FROM public.posts WHERE id = v_post_id;
    END IF;

    -- Deleting the hang cascades hang_attendees
    DELETE FROM public.hangs WHERE id = p_hang_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_hang_with_post TO authenticated;

-- ========================================
-- Function 4: Get active hang locations (map)
-- ========================================
CREATE OR REPLACE FUNCTION public.get_active_hang_locations(
    p_user_id uuid
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    full_name text,
    avatar_url text,
    title text,
    location_name text,
    starts_at timestamptz,
    longitude double precision,
    latitude double precision,
    type text,
    attendee_count bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- IDOR guard: the caller may only request their own visible hangs
    -- (matches get_active_travel_plan_locations per 20260610120000).
    IF p_user_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT
        h.id,
        h.user_id,
        prof.full_name,
        prof.avatar_url,
        h.title,
        h.location_name,
        h.starts_at,
        ST_X(h.location::geometry) AS longitude,
        ST_Y(h.location::geometry) AS latitude,
        CASE
            WHEN h.user_id = p_user_id THEN 'own'
            WHEN EXISTS (
                SELECT 1 FROM public.friendships f
                WHERE f.status = 'accepted'
                    AND ((f.user_a = p_user_id AND f.user_b = h.user_id) OR (f.user_b = p_user_id AND f.user_a = h.user_id))
            ) THEN 'friend'
            ELSE 'mutual'
        END::text AS type,
        (SELECT count(*) FROM public.hang_attendees a WHERE a.hang_id = h.id) AS attendee_count
    FROM public.hangs h
    INNER JOIN public.profiles prof ON h.user_id = prof.id
    WHERE h.starts_at + interval '3 hours' >= now()
        AND (
            h.user_id = p_user_id
            OR EXISTS (
                SELECT 1 FROM public.friendships f
                WHERE f.status = 'accepted'
                    AND ((f.user_a = p_user_id AND f.user_b = h.user_id) OR (f.user_b = p_user_id AND f.user_a = h.user_id))
            )
            OR EXISTS (
                SELECT 1
                FROM public.friendships f1
                INNER JOIN public.friendships f2
                    ON ((f1.user_a = f2.user_a OR f1.user_a = f2.user_b OR f1.user_b = f2.user_a OR f1.user_b = f2.user_b))
                WHERE f1.status = 'accepted' AND f2.status = 'accepted'
                    AND (
                        (f1.user_a = p_user_id OR f1.user_b = p_user_id) AND
                        (f2.user_a = h.user_id OR f2.user_b = h.user_id) AND
                        f1.user_a != f2.user_a AND f1.user_b != f2.user_b
                    )
            )
        );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_hang_locations TO authenticated;

-- ========================================
-- Function 5: Get hang detail (host + attendees + viewer flags)
-- ========================================
CREATE OR REPLACE FUNCTION public.get_hang_detail(
    p_hang_id uuid
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    title text,
    description text,
    location_name text,
    longitude double precision,
    latitude double precision,
    starts_at timestamptz,
    post_id uuid,
    host jsonb,
    attendees jsonb,
    attendee_count bigint,
    viewer_is_going boolean,
    viewer_is_host boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        h.id,
        h.user_id,
        h.title,
        h.description,
        h.location_name,
        ST_X(h.location::geometry) AS longitude,
        ST_Y(h.location::geometry) AS latitude,
        h.starts_at,
        h.post_id,
        jsonb_build_object(
            'id', hp.id,
            'full_name', hp.full_name,
            'avatar_url', hp.avatar_url
        ) AS host,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object('id', ap.id, 'full_name', ap.full_name, 'avatar_url', ap.avatar_url)
                ORDER BY a.created_at
            )
            FROM public.hang_attendees a
            INNER JOIN public.profiles ap ON ap.id = a.user_id
            WHERE a.hang_id = h.id),
            '[]'::jsonb
        ) AS attendees,
        (SELECT count(*) FROM public.hang_attendees a WHERE a.hang_id = h.id) AS attendee_count,
        EXISTS (SELECT 1 FROM public.hang_attendees a WHERE a.hang_id = h.id AND a.user_id = auth.uid()) AS viewer_is_going,
        (h.user_id = auth.uid()) AS viewer_is_host
    FROM public.hangs h
    INNER JOIN public.profiles hp ON hp.id = h.user_id
    WHERE h.id = p_hang_id
        AND (
            -- Host sees their hang always (incl. expired)
            h.user_id = auth.uid()
            -- Friends see active hangs
            OR (
                h.starts_at + interval '3 hours' >= now() AND
                EXISTS (
                    SELECT 1 FROM public.friendships f
                    WHERE f.status = 'accepted'
                        AND ((f.user_a = auth.uid() AND f.user_b = h.user_id) OR (f.user_b = auth.uid() AND f.user_a = h.user_id))
                )
            )
            -- Mutuals see active hangs
            OR (
                h.starts_at + interval '3 hours' >= now() AND
                EXISTS (
                    SELECT 1
                    FROM public.friendships f1
                    INNER JOIN public.friendships f2
                        ON ((f1.user_a = f2.user_a OR f1.user_a = f2.user_b OR f1.user_b = f2.user_a OR f1.user_b = f2.user_b))
                    WHERE f1.status = 'accepted' AND f2.status = 'accepted'
                        AND (
                            (f1.user_a = auth.uid() OR f1.user_b = auth.uid()) AND
                            (f2.user_a = h.user_id OR f2.user_b = h.user_id) AND
                            f1.user_a != f2.user_a AND f1.user_b != f2.user_b
                        )
                )
            )
        );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_hang_detail TO authenticated;

-- ========================================
-- Function 6: Resolve friends + mutuals of a user (for notification fan-out)
-- Called by the notify-hangs edge function as service_role.
-- ========================================
CREATE OR REPLACE FUNCTION public.get_friends_and_mutuals_of(
    p_user_id uuid
)
RETURNS TABLE (user_id uuid)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT u.id
    FROM public.profiles u
    WHERE u.id != p_user_id
        AND (
            EXISTS (
                SELECT 1 FROM public.friendships f
                WHERE f.status = 'accepted'
                    AND ((f.user_a = p_user_id AND f.user_b = u.id) OR (f.user_b = p_user_id AND f.user_a = u.id))
            )
            OR EXISTS (
                SELECT 1
                FROM public.friendships f1
                INNER JOIN public.friendships f2
                    ON ((f1.user_a = f2.user_a OR f1.user_a = f2.user_b OR f1.user_b = f2.user_a OR f1.user_b = f2.user_b))
                WHERE f1.status = 'accepted' AND f2.status = 'accepted'
                    AND (
                        (f1.user_a = p_user_id OR f1.user_b = p_user_id) AND
                        (f2.user_a = u.id OR f2.user_b = u.id) AND
                        f1.user_a != f2.user_a AND f1.user_b != f2.user_b
                    )
            )
        );
END;
$$;

-- Edge-function-internal only (called as service_role with an arbitrary host id).
-- NOT granted to authenticated, which would let any user enumerate anyone's
-- friends + mutuals.
GRANT EXECUTE ON FUNCTION public.get_friends_and_mutuals_of TO service_role;
