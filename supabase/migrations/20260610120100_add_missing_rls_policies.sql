-- Defense-in-depth: add missing RLS policies [#2]
--
-- Context: The RPC layer is SECURITY DEFINER and bypasses RLS, but several hooks
-- read/write base tables directly (e.g. hooks/useChat.ts -> messages,
-- hooks/useFriends.ts -> friendships). Those direct paths rely entirely on RLS.
--
-- This migration is INTENTIONALLY CONSERVATIVE. It adds a policy ONLY where:
--   (a) RLS is enabled on the table,
--   (b) an operation the app performs via DIRECT (non-RPC) table access has NO
--       matching policy and is therefore silently denied, and
--   (c) the correct, owner-scoped policy is unambiguous and cannot broaden
--       read access enforced elsewhere.
--
-- It is idempotent: every policy is DROP POLICY IF EXISTS then CREATE POLICY.
--
-- Gaps that were reviewed and DELIBERATELY NOT changed here (see report):
--   * messages: no DELETE policy, but the app only soft-deletes via UPDATE
--     (hooks/useChat.ts useDeleteMessage sets deleted_at), which the existing
--     UPDATE policy already covers. Hard DELETE is not used -> no policy added.
--   * intros: INSERT/UPDATE/DELETE are intentionally RPC-only (create_intro is
--     SECURITY DEFINER). Adding write policies would defeat that design.
--   * posts / lists / list_places / travel_plans / contacts: social-visibility
--     SELECT is enforced via friendship-aware policies and RPCs; not touched to
--     avoid broadening reads.

-- ---------------------------------------------------------------------------
-- friendships: missing DELETE policy
-- ---------------------------------------------------------------------------
-- RLS is enabled on public.friendships and there are participant-scoped
-- SELECT / INSERT / UPDATE policies, but NO DELETE policy. hooks/useFriends.ts
-- (useUnfriend) performs a direct DELETE on friendships filtered to the calling
-- user's row, so that delete is currently silently denied for direct access.
-- The owner pattern is unambiguous: a participant (user_a or user_b) may delete
-- a friendship row they are part of. This mirrors the existing
-- SELECT/INSERT/UPDATE policies on the same table.
DROP POLICY IF EXISTS "Participants can delete their friendship" ON public.friendships;
CREATE POLICY "Participants can delete their friendship"
    ON public.friendships
    FOR DELETE
    USING (auth.uid() = user_a OR auth.uid() = user_b);
