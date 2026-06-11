-- Reconcile prod: restore contacts.location_name + the 13-column
-- get_contacts_ordered (follow-up to the SECURITY DEFINER guard work in
-- 20260610120000).
--
-- Why this exists:
--   Migration 20260223000002 ("add location_name to contacts") is recorded as
--   applied on prod, but its effects never actually landed -- prod's contacts
--   table had NO location_name column and get_contacts_ordered still returned
--   the older 12-column shape from 20260223000001. (The other 19 guarded RPCs
--   matched prod exactly; this desync is isolated to 20260223000002's contacts
--   changes.)
--
--   Because that column was missing, the guard migration 20260610120000 had to
--   match prod's actual 12-column signature in order to apply via CREATE OR
--   REPLACE. This migration finishes the reconciliation by (re-)applying
--   20260223000002's intent AND keeping the auth.uid() guard.
--
-- Safety / replay:
--   * ADD COLUMN IF NOT EXISTS  -> no-op where the column already exists.
--   * DROP + CREATE the function -> required because adding a returned column is
--     a return-type change that CREATE OR REPLACE cannot perform. There are no
--     DB objects depending on get_contacts_ordered, so the DROP is safe.
--   On a fresh replay (db reset) the column/function are already in 13-column
--   form by this point, so this runs as a harmless no-op / identical re-create.

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS location_name TEXT;

DROP FUNCTION IF EXISTS public.get_contacts_ordered(UUID);
CREATE FUNCTION public.get_contacts_ordered(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  phone TEXT,
  email TEXT,
  company TEXT,
  note TEXT,
  location GEOGRAPHY,
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user mismatch' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    c.id, c.user_id, c.name, c.phone, c.email,
    c.company, c.note, c.location, c.location_name,
    ST_Y(c.location::geometry)::DOUBLE PRECISION,
    ST_X(c.location::geometry)::DOUBLE PRECISION,
    c.created_at, c.updated_at
  FROM contacts c
  WHERE c.user_id = p_user_id
  ORDER BY ST_Y(c.location::geometry) DESC NULLS LAST, c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Re-grant: DROP/CREATE does not preserve grants the way CREATE OR REPLACE does.
GRANT EXECUTE ON FUNCTION public.get_contacts_ordered(UUID) TO anon, authenticated, service_role;
