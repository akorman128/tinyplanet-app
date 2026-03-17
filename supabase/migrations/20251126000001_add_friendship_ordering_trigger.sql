-- Update the existing normalize_friendship_order function to work with correct column names
CREATE OR REPLACE FUNCTION public.normalize_friendship_order()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  a uuid;
  b uuid;
BEGIN
  -- Order using LEAST/GREATEST which matches JavaScript's < operator for UUIDs
  a := LEAST(NEW.user_a, NEW.user_b);
  b := GREATEST(NEW.user_a, NEW.user_b);

  -- Assign the normalized values
  NEW.user_a := a;
  NEW.user_b := b;

  RETURN NEW;
END;
$$;

-- Create trigger to enforce ordering on INSERT and UPDATE
CREATE TRIGGER normalize_friendship_order_trigger
  BEFORE INSERT OR UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_friendship_order();

-- Fix existing seed data to use correct ordering
UPDATE public.friendships
SET user_a = LEAST(user_a, user_b),
    user_b = GREATEST(user_a, user_b)
WHERE user_a > user_b;
