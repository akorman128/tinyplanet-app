-- Create RPC function to get top vibes (emoji counts) for a user
-- This function aggregates all emojis from all vibes received by a user,
-- counts each emoji's frequency, and returns the top 5 most common emojis

CREATE OR REPLACE FUNCTION get_top_vibes(p_user_id UUID, p_limit INT DEFAULT 5)
RETURNS TABLE (
  emoji TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    unnested_emoji AS emoji,
    COUNT(*) AS count
  FROM (
    SELECT unnest(emojis) AS unnested_emoji
    FROM vibes
    WHERE receiver_id = p_user_id
  ) AS emoji_list
  GROUP BY unnested_emoji
  ORDER BY count DESC, emoji ASC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_top_vibes(UUID, INT) TO authenticated;

-- Comment on function
COMMENT ON FUNCTION get_top_vibes IS 'Returns the top N emojis (by frequency) that a user has received in vibes, ordered by count descending';
