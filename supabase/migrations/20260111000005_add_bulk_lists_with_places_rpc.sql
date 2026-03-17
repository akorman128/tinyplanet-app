-- Add RPC functions to optimize list queries and enable bulk operations
-- This migration solves the N+1 query problem and adds bulk reordering capability

-- Function 1: Get all lists with places for a user in a single query
-- This replaces the N+1 pattern where we fetch lists first, then places for each list
CREATE OR REPLACE FUNCTION public.get_lists_with_places(
    p_user_id uuid
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
    places jsonb
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Return lists with aggregated places as JSONB array
    -- Uses JSONB aggregation pattern similar to get_feed_posts
    RETURN QUERY
    SELECT
        l.id,
        l.user_id,
        l.title,
        l.location_name,
        ST_X(l.location::geometry) as longitude,
        ST_Y(l.location::geometry) as latitude,
        l.created_at,
        l.updated_at,
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
                WHERE lp.list_id = l.id
            ),
            '[]'::jsonb
        ) as places
    FROM public.lists l
    WHERE l.user_id = p_user_id
    ORDER BY l.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lists_with_places TO authenticated;

COMMENT ON FUNCTION public.get_lists_with_places IS 'Optimized function to fetch all lists with places in a single query, solving N+1 problem. Returns places as JSONB array with coordinates extracted from PostGIS geography type.';

-- Function 2: Reorder places within a list (bulk position update)
-- Accepts JSONB array of {place_id, position} objects for atomic bulk updates
CREATE OR REPLACE FUNCTION public.reorder_list_places(
    p_list_id uuid,
    p_place_positions jsonb
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_item jsonb;
BEGIN
    -- Verify user owns the list before allowing reorder
    IF NOT EXISTS (
        SELECT 1 FROM public.lists l
        WHERE l.id = p_list_id
        AND l.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'List not found or access denied';
    END IF;

    -- Update each place position atomically
    -- Input format: [{"place_id": "uuid", "position": 0}, ...]
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_place_positions)
    LOOP
        UPDATE public.list_places
        SET position = (v_item->>'position')::int,
            updated_at = now()
        WHERE id = (v_item->>'place_id')::uuid
        AND list_id = p_list_id;
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reorder_list_places TO authenticated;

COMMENT ON FUNCTION public.reorder_list_places IS 'Bulk update place positions within a list. Requires list ownership. Accepts JSONB array: [{"place_id": "uuid", "position": int}, ...]';
