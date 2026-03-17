-- Add optional pagination support to get_lists_with_places function
-- Adds p_limit and p_offset parameters (both optional) and returns total_count

-- Drop old function signature to avoid overload conflict
DROP FUNCTION IF EXISTS public.get_lists_with_places(uuid);

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

COMMENT ON FUNCTION public.get_lists_with_places IS 'Optimized function to fetch lists with places. Supports optional pagination via p_limit/p_offset. Returns total_count for pagination UI. When p_limit is NULL, returns all lists.';
