CREATE OR REPLACE FUNCTION get_message_channels(p_user_id UUID)
RETURNS TABLE (
  friend_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  last_message_id UUID,
  last_message_text TEXT,
  last_message_sender_id UUID,
  last_message_created_at TIMESTAMPTZ,
  last_message_deleted_at TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH accepted_friends AS (
    SELECT
      CASE
        WHEN f.user_a = p_user_id THEN f.user_b
        ELSE f.user_a
      END AS friend_id,
      f.accepted_at
    FROM friendships f
    WHERE
      (f.user_a = p_user_id OR f.user_b = p_user_id)
      AND f.status = 'accepted'
  ),
  last_messages AS (
    SELECT DISTINCT ON (m.user_id_a, m.user_id_b)
      m.id,
      m.user_id_a,
      m.user_id_b,
      m.sender_id,
      m.text,
      m.created_at,
      m.deleted_at
    FROM messages m
    ORDER BY m.user_id_a, m.user_id_b, m.created_at DESC
  )
  SELECT
    af.friend_id,
    p.full_name,
    p.avatar_url,
    lm.id AS last_message_id,
    lm.text AS last_message_text,
    lm.sender_id AS last_message_sender_id,
    lm.created_at AS last_message_created_at,
    lm.deleted_at AS last_message_deleted_at,
    COALESCE(
      (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.user_id_a = LEAST(p_user_id, af.friend_id)
          AND m.user_id_b = GREATEST(p_user_id, af.friend_id)
          AND m.sender_id = af.friend_id
          AND m.deleted_at IS NULL
          AND m.created_at > COALESCE(
            (SELECT last_read_at FROM conversation_reads WHERE user_id = p_user_id AND friend_id = af.friend_id),
            '1970-01-01'::timestamptz
          )
      ),
      0
    ) AS unread_count
  FROM accepted_friends af
  INNER JOIN profiles p ON p.id = af.friend_id
  LEFT JOIN last_messages lm ON (
    lm.user_id_a = LEAST(p_user_id, af.friend_id) AND
    lm.user_id_b = GREATEST(p_user_id, af.friend_id)
  )
  ORDER BY COALESCE(lm.created_at, af.accepted_at) DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_message_channels(UUID) TO authenticated;
