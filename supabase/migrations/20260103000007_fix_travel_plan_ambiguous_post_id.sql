-- Fix ambiguous post_id column reference in travel plan functions
-- Issue: Line 138 and other places use unqualified "post_id" which conflicts with PL/pgSQL variable

-- ========================================
-- Fix: Create Travel Plan + Auto-Create Post (with qualified columns)
-- ========================================
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

-- ========================================
-- Fix: Update Travel Plan + Update Post (with qualified columns)
-- ========================================
CREATE OR REPLACE FUNCTION public.update_travel_plan_with_post(
    p_travel_plan_id uuid,
    p_destination_location_lng double precision,
    p_destination_location_lat double precision,
    p_destination_name text,
    p_start_date date,
    p_duration_days int,
    p_post_visibility text DEFAULT NULL,
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
    v_user_id uuid;
    v_post_id uuid;
    v_end_date date;
    v_post_text text;
BEGIN
    -- Get travel plan and verify ownership
    -- FIXED: Qualify columns with table alias to avoid ambiguity
    SELECT tp.user_id, tp.post_id
    INTO v_user_id, v_post_id
    FROM public.travel_plans tp
    WHERE tp.id = p_travel_plan_id;

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

    -- Create updated post text with optional custom message
    v_post_text := '🚀 Traveling to ' || p_destination_name ||
                   ' from ' || to_char(p_start_date, 'Mon DD') ||
                   ' to ' || to_char(v_end_date, 'Mon DD, YYYY') ||
                   ' (' || p_duration_days || ' days)';

    -- Append custom text message if provided
    IF p_text IS NOT NULL AND trim(p_text) != '' THEN
        v_post_text := v_post_text || E'\n\n' || p_text;
    END IF;

    -- Update post (sets edited_at automatically via existing trigger)
    UPDATE public.posts
    SET
        text = v_post_text,
        visibility = COALESCE(p_post_visibility::post_visibility, posts.visibility),
        edited_at = now()
    WHERE posts.id = v_post_id;

    -- Update travel plan
    UPDATE public.travel_plans tp
    SET
        destination_location = ST_SetSRID(ST_MakePoint(p_destination_location_lng, p_destination_location_lat), 4326)::geography,
        destination_name = p_destination_name,
        start_date = p_start_date,
        duration_days = p_duration_days,
        end_date = v_end_date
    WHERE tp.id = p_travel_plan_id;

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
