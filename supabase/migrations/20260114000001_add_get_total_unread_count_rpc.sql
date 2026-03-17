-- Add RPC function to check if user has any unread messages
--
-- Purpose: Efficiently check if a user has any unread messages across all conversations.
--          Used to display an unread indicator badge in the Navigation component.
--
-- Performance: Uses EXISTS with CROSS JOIN LATERAL for early termination.
--              Stops scanning as soon as one unread message is found.
--
-- Logic:
--   1. Find all accepted friendships for the user
--   2. For each friendship, check if there are any messages where:
--      - The message is in the conversation between user and friend
--      - The message was sent BY the friend (not by the user)
--      - The message is not deleted
--      - The message was created AFTER the user's last_read_at timestamp
--   3. If no read record exists, defaults to epoch (all messages are unread)
--
-- Returns: TRUE if any unread messages exist, FALSE otherwise

CREATE OR REPLACE FUNCTION has_unread_messages(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM friendships f
    CROSS JOIN LATERAL (
      -- Check for unread messages from this friend
      SELECT 1
      FROM messages m
      WHERE
        -- Match conversation (user_id_a < user_id_b constraint)
        m.user_id_a = LEAST(p_user_id, CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END)
        AND m.user_id_b = GREATEST(p_user_id, CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END)
        -- Only count messages FROM the friend, not messages we sent
        AND m.sender_id = CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END
        -- Exclude deleted messages
        AND m.deleted_at IS NULL
        -- Only messages after last read time (or all if never read)
        AND m.created_at > COALESCE(
          (SELECT cr.last_read_at FROM conversation_reads cr
           WHERE cr.user_id = p_user_id
             AND cr.friend_id = CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END),
          '1970-01-01'::timestamptz
        )
      LIMIT 1
    ) unread
    WHERE (f.user_a = p_user_id OR f.user_b = p_user_id)
      AND f.status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION has_unread_messages(UUID) TO authenticated;

COMMENT ON FUNCTION has_unread_messages(UUID) IS
  'Returns true if user has any unread messages across all conversations.';
