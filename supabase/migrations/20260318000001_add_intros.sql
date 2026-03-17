-- Add intros table for introducing two friends to each other.
-- An intro renders as a banner at the top of the DM channel between the pair.

-- 1. intros table
CREATE TABLE intros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  introducer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_a UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_b UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Normalized ordering: user_id_a < user_id_b (matches messages convention)
  CONSTRAINT intros_user_order CHECK (user_id_a < user_id_b),
  -- All three users must be different
  CONSTRAINT intros_distinct_users CHECK (
    introducer_id != user_id_a
    AND introducer_id != user_id_b
    AND user_id_a != user_id_b
  ),
  -- One intro per introducer per pair
  CONSTRAINT intros_unique_per_introducer UNIQUE (introducer_id, user_id_a, user_id_b)
);

-- Index for channel lookups (finding intros for a DM pair)
CREATE INDEX idx_intros_pair ON intros(user_id_a, user_id_b);

-- 2. RLS
ALTER TABLE intros ENABLE ROW LEVEL SECURITY;

-- Participants and the introducer can see the intro
CREATE POLICY intros_select ON intros
  FOR SELECT
  USING (auth.uid() IN (user_id_a, user_id_b, introducer_id));

-- No INSERT/UPDATE/DELETE policies — writes only via RPC

-- 3. RPC: create_intro
CREATE OR REPLACE FUNCTION create_intro(
  p_user_a_id UUID,
  p_user_b_id UUID,
  p_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_introducer UUID := auth.uid();
  v_user_a UUID;
  v_user_b UUID;
  v_intro_id UUID;
BEGIN
  -- Normalize user ordering
  IF p_user_a_id < p_user_b_id THEN
    v_user_a := p_user_a_id;
    v_user_b := p_user_b_id;
  ELSE
    v_user_a := p_user_b_id;
    v_user_b := p_user_a_id;
  END IF;

  -- Validate introducer is not one of the users
  IF v_introducer = v_user_a OR v_introducer = v_user_b THEN
    RAISE EXCEPTION 'Cannot introduce yourself';
  END IF;

  -- Check no blocks
  IF is_blocked(v_introducer, v_user_a) THEN
    RAISE EXCEPTION 'Cannot create intro: blocked';
  END IF;
  IF is_blocked(v_introducer, v_user_b) THEN
    RAISE EXCEPTION 'Cannot create intro: blocked';
  END IF;
  IF is_blocked(v_user_a, v_user_b) THEN
    RAISE EXCEPTION 'Cannot create intro: blocked';
  END IF;

  -- Validate introducer is friends with both users
  IF NOT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
      AND (
        (user_a = LEAST(v_introducer, v_user_a) AND user_b = GREATEST(v_introducer, v_user_a))
      )
  ) THEN
    RAISE EXCEPTION 'You must be friends with both users to make an intro';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
      AND (
        (user_a = LEAST(v_introducer, v_user_b) AND user_b = GREATEST(v_introducer, v_user_b))
      )
  ) THEN
    RAISE EXCEPTION 'You must be friends with both users to make an intro';
  END IF;

  -- Insert the intro
  INSERT INTO intros (introducer_id, user_id_a, user_id_b, message)
  VALUES (v_introducer, v_user_a, v_user_b, p_message)
  RETURNING id INTO v_intro_id;

  RETURN v_intro_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_intro(UUID, UUID, TEXT) TO authenticated;
