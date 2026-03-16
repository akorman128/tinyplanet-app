import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

/**
 * Create an authenticated Supabase client for a test user.
 * Useful for testing RLS policies — the returned client has the user's JWT.
 */
export async function createAuthenticatedClientForUser(
  email: string,
  password = "test-password-123"
) {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    },
  });
}
