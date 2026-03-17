-- Create messages table for 1-on-1 chat
-- Follows the bidirectional pattern from friendships table

CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    -- Bidirectional participants: user_a < user_b (enforced by trigger)
    user_id_a uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id_b uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Sender must be one of the participants
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Message content
    text text NOT NULL,
    -- Timestamps for editing and soft deletion
    edited_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    -- Constraints
    CONSTRAINT users_different CHECK (user_id_a <> user_id_b),
    CONSTRAINT sender_is_participant CHECK (sender_id = user_id_a OR sender_id = user_id_b)
);

-- Helper function to normalize user_id ordering (follows friendships pattern)
CREATE OR REPLACE FUNCTION public.normalize_message_user_order()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  a uuid;
  b uuid;
BEGIN
  -- Order using LEAST/GREATEST for UUID comparison
  a := LEAST(NEW.user_id_a, NEW.user_id_b);
  b := GREATEST(NEW.user_id_a, NEW.user_id_b);

  -- Assign normalized values
  NEW.user_id_a := a;
  NEW.user_id_b := b;

  RETURN NEW;
END;
$$;

-- Trigger to enforce ordering on INSERT and UPDATE
CREATE TRIGGER normalize_message_user_order_trigger
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_message_user_order();

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance (critical for chat queries)
CREATE INDEX messages_conversation_idx ON public.messages(user_id_a, user_id_b, created_at DESC);
CREATE INDEX messages_sender_idx ON public.messages(sender_id);
CREATE INDEX messages_created_at_idx ON public.messages(created_at DESC);
CREATE INDEX messages_deleted_at_idx ON public.messages(deleted_at) WHERE deleted_at IS NULL;

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view messages in conversations they're part of
-- AND they must be accepted friends
CREATE POLICY "Users can view messages in their conversations with accepted friends"
    ON public.messages FOR SELECT
    USING (
        (user_id_a = auth.uid() OR user_id_b = auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.friendships
            WHERE status = 'accepted'
            AND ((user_a = messages.user_id_a AND user_b = messages.user_id_b) OR
                 (user_a = messages.user_id_b AND user_b = messages.user_id_a))
        )
    );

-- RLS Policy: Users can send messages if they are participants AND accepted friends
CREATE POLICY "Users can create messages in their conversations with accepted friends"
    ON public.messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND (user_id_a = auth.uid() OR user_id_b = auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.friendships
            WHERE status = 'accepted'
            AND ((user_a = user_id_a AND user_b = user_id_b) OR
                 (user_a = user_id_b AND user_b = user_id_a))
        )
    );

-- RLS Policy: Users can only update their own messages
CREATE POLICY "Users can update their own messages"
    ON public.messages FOR UPDATE
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

-- Grant permissions
ALTER TABLE public.messages OWNER TO postgres;
GRANT ALL ON TABLE public.messages TO authenticated;
GRANT ALL ON TABLE public.messages TO service_role;
