-- Add blocks table for user blocking functionality
-- Blocks are directional: blocker_id blocks blocked_id
-- Map hiding is symmetric: is_blocked() checks both directions

-- 1a. blocks table
CREATE TABLE blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT blocks_no_self CHECK (blocker_id != blocked_id),
  CONSTRAINT blocks_unique UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

-- 1b. RLS policies
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Users can view blocks they're involved in (either direction)
CREATE POLICY blocks_select ON blocks
  FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

-- Users can only insert blocks where they are the blocker
CREATE POLICY blocks_insert ON blocks
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Only the blocker can delete (unblock)
CREATE POLICY blocks_delete ON blocks
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- 1c. Helper function: check if a block exists in either direction
CREATE OR REPLACE FUNCTION is_blocked(user1 UUID, user2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = user1 AND blocked_id = user2)
       OR (blocker_id = user2 AND blocked_id = user1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION is_blocked(UUID, UUID) TO authenticated;

-- 1d. Trigger: delete friendship when a block is created
CREATE OR REPLACE FUNCTION trg_block_delete_friendship_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_user_a UUID;
  v_user_b UUID;
BEGIN
  -- Order IDs to match friendships table convention (user_a < user_b)
  IF NEW.blocker_id < NEW.blocked_id THEN
    v_user_a := NEW.blocker_id;
    v_user_b := NEW.blocked_id;
  ELSE
    v_user_a := NEW.blocked_id;
    v_user_b := NEW.blocker_id;
  END IF;

  DELETE FROM friendships
  WHERE user_a = v_user_a AND user_b = v_user_b;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_block_delete_friendship
  AFTER INSERT ON blocks
  FOR EACH ROW
  EXECUTE FUNCTION trg_block_delete_friendship_fn();
