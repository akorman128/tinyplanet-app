-- Add RPC function to get list places with extracted coordinates
-- This solves the issue where Supabase returns geography columns as GeoJSON
-- instead of allowing PostGIS functions in .select() queries

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
    -- Verify access (user owns list OR is friends with list owner)
    IF NOT EXISTS (
        SELECT 1 FROM public.lists l
        WHERE l.id = p_list_id
        AND (
            l.user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.friendships f
                WHERE f.status = 'accepted'
                AND ((f.user_a = auth.uid() AND f.user_b = l.user_id)
                     OR (f.user_b = auth.uid() AND f.user_a = l.user_id))
            )
        )
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

GRANT EXECUTE ON FUNCTION public.get_list_places_with_coordinates TO authenticated;
