import { createClient } from "npm:@supabase/supabase-js@2.35.0";
import { deliver, type Db } from "../_shared/expo-push.ts";
import { memberJoined } from "./resolvers/member-joined.ts";
import { friendRequest } from "./resolvers/friend-request.ts";
import { comment } from "./resolvers/comment.ts";
import { like } from "./resolvers/like.ts";
import { newPost } from "./resolvers/new-post.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) as unknown as Db;

    let resolved = null;

    if (body.type === "invites_refreshed") {
      // wired in Task 8
      return json({ message: "invites_refreshed not yet implemented" }, 200);
    }

    const table: string = body.table;
    const record = body.record;
    if (!record) return json({ error: "Invalid payload" }, 400);

    switch (table) {
      case "profiles":
        resolved = await memberJoined(client, record);
        break;
      case "friendships":
        resolved = await friendRequest(client, record);
        break;
      case "comments":
        resolved = await comment(client, record);
        break;
      case "likes":
        resolved = await like(client, record);
        break;
      case "posts":
        resolved = await newPost(client, record);
        break;
      default:
        return json({ message: `Ignored table: ${table}` }, 200);
    }

    const sent = resolved ? await deliver(client, resolved) : 0;
    return json({ success: true, sent });
  } catch (err) {
    console.error("notify error:", err);
    return json({ error: "Internal server error", details: String(err) }, 500);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}
