import { createClient } from "npm:@supabase/supabase-js@2.35.0";
import { json } from "./http.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Validate the caller's JWT. Returns the user id, or a 401 Response to return
// directly. The token is forwarded so any DB access runs as that user.
export async function requireUser(
  req: Request
): Promise<{ userId: string } | Response> {
  const authHeader =
    req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader) {
    return json(
      { error: "Unauthorized", details: "Missing Authorization header" },
      401
    );
  }
  const token = authHeader.split(" ")[1]?.trim();
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return json({ error: "Unauthorized", details: "Invalid token" }, 401);
  }
  return { userId: data.user.id };
}
