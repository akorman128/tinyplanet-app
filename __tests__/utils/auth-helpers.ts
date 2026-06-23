import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

/**
 * Create an authenticated Supabase client for a test user.
 *
 * Needed for SECURITY DEFINER RPCs that are IDOR-guarded
 * (`IF p_user_id IS DISTINCT FROM auth.uid() ...`): they reject the
 * service-role `adminClient` (which has no `auth.uid()`), so they must be
 * called as the acting user.
 *
 * The client is isolated (`persistSession: false` + a unique `storageKey`) so
 * signing in does NOT clobber `adminClient`'s service-role session in shared
 * GoTrue storage — otherwise later `adminClient` writes start running as this
 * user and fail RLS (`42501 new row violates row-level security policy`).
 */
export async function createAuthenticatedClientForUser(
  email: string,
  password = "test-password-123"
): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storageKey: `sb-test-${email}`,
    },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

const clientCache = new Map<string, Promise<SupabaseClient>>();

/**
 * Memoized authenticated client for a test user (one sign-in per email per
 * test process). Use to call IDOR-guarded RPCs as the acting user:
 *
 *   const { data } = await (await authedClientFor(alice.email))
 *     .rpc("get_friend_locations", { p_user_id: alice.id });
 */
export function authedClientFor(email: string): Promise<SupabaseClient> {
  let cached = clientCache.get(email);
  if (!cached) {
    cached = createAuthenticatedClientForUser(email);
    clientCache.set(email, cached);
  }
  return cached;
}
