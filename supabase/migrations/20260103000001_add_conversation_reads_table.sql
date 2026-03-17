-- Track when users last read each conversation
CREATE TABLE IF NOT EXISTS conversation_reads (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS conversation_reads_user_id_idx ON conversation_reads(user_id);

-- RLS policies
ALTER TABLE conversation_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversation reads"
  ON conversation_reads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation reads"
  ON conversation_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation reads"
  ON conversation_reads FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_conversation_reads_updated_at
  BEFORE UPDATE ON conversation_reads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
