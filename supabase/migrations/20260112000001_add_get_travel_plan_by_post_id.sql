-- Add RPC function to get travel plan by post ID
-- This is needed for editing travel plans from the feed where we only have the post ID

CREATE OR REPLACE FUNCTION public.get_travel_plan_by_post_id(
    p_post_id uuid
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    destination_name text,
    start_date date,
    duration_days int,
    end_date date,
    post_id uuid,
    created_at timestamptz,
    updated_at timestamptz,
    longitude double precision,
    latitude double precision
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify ownership via the post
    IF NOT EXISTS (
        SELECT 1 FROM public.travel_plans tp
        WHERE tp.post_id = p_post_id
        AND tp.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Travel plan not found or access denied';
    END IF;

    RETURN QUERY
    SELECT
        tp.id,
        tp.user_id,
        tp.destination_name,
        tp.start_date,
        tp.duration_days,
        tp.end_date,
        tp.post_id,
        tp.created_at,
        tp.updated_at,
        ST_X(tp.destination_location::geometry) as longitude,
        ST_Y(tp.destination_location::geometry) as latitude
    FROM public.travel_plans tp
    WHERE tp.post_id = p_post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_travel_plan_by_post_id TO authenticated;
