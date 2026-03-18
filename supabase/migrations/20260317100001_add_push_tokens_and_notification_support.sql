-- Push notification support: push_tokens table and get_total_unread_count RPC
--
-- Architecture:
--   messages INSERT → Supabase Database Webhook → Edge Function → Expo Push API
--   (Webhook configured in Supabase Dashboard, not in SQL)

-- 1. Push tokens table for multi-device support
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT push_tokens_user_token_unique UNIQUE (user_id, token)
);

CREATE INDEX push_tokens_user_id_idx ON public.push_tokens(user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push tokens"
    ON public.push_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
    ON public.push_tokens FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
    ON public.push_tokens FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
    ON public.push_tokens FOR DELETE
    USING (auth.uid() = user_id);

CREATE TRIGGER push_tokens_updated_at
    BEFORE UPDATE ON public.push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.push_tokens OWNER TO postgres;
GRANT ALL ON TABLE public.push_tokens TO authenticated;
GRANT ALL ON TABLE public.push_tokens TO service_role;

-- 2. get_total_unread_count RPC — returns integer count (vs has_unread_messages which returns boolean)
CREATE OR REPLACE FUNCTION get_total_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(unread_count), 0)::INTEGER INTO total
  FROM (
    SELECT COUNT(*) AS unread_count
    FROM friendships f
    CROSS JOIN LATERAL (
      SELECT 1
      FROM messages m
      WHERE
        m.user_id_a = LEAST(p_user_id, CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END)
        AND m.user_id_b = GREATEST(p_user_id, CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END)
        AND m.sender_id = CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END
        AND m.deleted_at IS NULL
        AND m.created_at > COALESCE(
          (SELECT cr.last_read_at FROM conversation_reads cr
           WHERE cr.user_id = p_user_id
             AND cr.friend_id = CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END),
          '1970-01-01'::timestamptz
        )
    ) unread
    WHERE (f.user_a = p_user_id OR f.user_b = p_user_id)
      AND f.status = 'accepted'
  ) per_friend;

  RETURN total;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_total_unread_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_unread_count(UUID) TO service_role;
