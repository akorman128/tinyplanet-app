-- RPC Functions for Travel Plan Management

-- ========================================
-- Function 1: Create Travel Plan + Auto-Create Post
-- ========================================
CREATE OR REPLACE FUNCTION public.create_travel_plan_with_post(
    p_user_id uuid,
    p_destination_location_lng double precision,
    p_destination_location_lat double precision,
    p_destination_name text,
    p_start_date date,
    p_duration_days int,
    p_post_visibility text DEFAULT 'friends'
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
    -- Validate user
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot create travel plan for another user';
    END IF;

    -- Validate duration
    IF p_duration_days < 1 OR p_duration_days > 31 THEN
        RAISE EXCEPTION 'Duration must be between 1 and 31 days';
    END IF;

    -- Check if user already has an overlapping active or upcoming travel plan
    IF EXISTS (
        SELECT 1 FROM public.travel_plans
        WHERE user_id = p_user_id AND travel_plans.end_date >= CURRENT_DATE
    ) THEN
        RAISE EXCEPTION 'You already have an active or upcoming travel plan. Cancel it before creating a new one.';
    END IF;

    -- Calculate end date
    v_end_date := p_start_date + (p_duration_days || ' days')::interval;

    -- Create post text
    v_post_text := '🚀 Traveling to ' || p_destination_name ||
                   ' from ' || to_char(p_start_date, 'Mon DD') ||
                   ' to ' || to_char(v_end_date, 'Mon DD, YYYY') ||
                   ' (' || p_duration_days || ' days)';

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

GRANT EXECUTE ON FUNCTION public.create_travel_plan_with_post TO authenticated;

-- ========================================
-- Function 2: Update Travel Plan + Update Post
-- ========================================
CREATE OR REPLACE FUNCTION public.update_travel_plan_with_post(
    p_travel_plan_id uuid,
    p_destination_location_lng double precision,
    p_destination_location_lat double precision,
    p_destination_name text,
    p_start_date date,
    p_duration_days int,
    p_post_visibility text DEFAULT NULL
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
    v_user_id uuid;
    v_post_id uuid;
    v_end_date date;
    v_post_text text;
BEGIN
    -- Get travel plan and verify ownership
    SELECT user_id, post_id
    INTO v_user_id, v_post_id
    FROM public.travel_plans
    WHERE id = p_travel_plan_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Travel plan not found';
    END IF;

    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot update another user''s travel plan';
    END IF;

    -- Validate duration
    IF p_duration_days < 1 OR p_duration_days > 31 THEN
        RAISE EXCEPTION 'Duration must be between 1 and 31 days';
    END IF;

    -- Calculate end date
    v_end_date := p_start_date + (p_duration_days || ' days')::interval;

    -- Create updated post text
    v_post_text := '🚀 Traveling to ' || p_destination_name ||
                   ' from ' || to_char(p_start_date, 'Mon DD') ||
                   ' to ' || to_char(v_end_date, 'Mon DD, YYYY') ||
                   ' (' || p_duration_days || ' days)';

    -- Update post (sets edited_at automatically via existing trigger)
    UPDATE public.posts
    SET
        text = v_post_text,
        visibility = COALESCE(p_post_visibility::post_visibility, visibility),
        edited_at = now()
    WHERE id = v_post_id;

    -- Update travel plan
    UPDATE public.travel_plans
    SET
        destination_location = ST_SetSRID(ST_MakePoint(p_destination_location_lng, p_destination_location_lat), 4326)::geography,
        destination_name = p_destination_name,
        start_date = p_start_date,
        duration_days = p_duration_days,
        end_date = v_end_date
    WHERE id = p_travel_plan_id;

    -- Return updated result
    RETURN QUERY
    SELECT
        p_travel_plan_id,
        v_post_id,
        p_destination_name,
        p_start_date,
        v_end_date;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_travel_plan_with_post TO authenticated;

-- ========================================
-- Function 3: Cancel Travel Plan + Delete Post
-- ========================================
CREATE OR REPLACE FUNCTION public.cancel_travel_plan_with_post(
    p_travel_plan_id uuid
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
    -- Get travel plan and verify ownership
    SELECT user_id, post_id
    INTO v_user_id, v_post_id
    FROM public.travel_plans
    WHERE id = p_travel_plan_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Travel plan not found';
    END IF;

    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot cancel another user''s travel plan';
    END IF;

    -- Delete post (this will set travel_plans.post_id to NULL via ON DELETE SET NULL)
    IF v_post_id IS NOT NULL THEN
        DELETE FROM public.posts WHERE id = v_post_id;
    END IF;

    -- Delete travel plan row
    DELETE FROM public.travel_plans WHERE id = p_travel_plan_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_travel_plan_with_post TO authenticated;

-- ========================================
-- Function 4: Get Active Travel Plan Locations (for Map Display)
-- ========================================
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

GRANT EXECUTE ON FUNCTION public.get_active_travel_plan_locations TO authenticated;
