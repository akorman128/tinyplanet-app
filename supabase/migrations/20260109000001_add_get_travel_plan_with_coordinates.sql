-- Add RPC function to get travel plan with extracted coordinates
-- This is a helper for the edit travel plan screen

CREATE OR REPLACE FUNCTION public.get_travel_plan_with_coordinates(
    p_travel_plan_id uuid
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
    -- Verify ownership
    IF NOT EXISTS (
        SELECT 1 FROM public.travel_plans
        WHERE travel_plans.id = p_travel_plan_id
        AND travel_plans.user_id = auth.uid()
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
    WHERE tp.id = p_travel_plan_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_travel_plan_with_coordinates TO authenticated;
