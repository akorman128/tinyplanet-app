import { createClient } from "npm:@supabase/supabase-js@2.35.0";
import { deliver, profileName, type Db, type ResolvedNotification } from "../_shared/expo-push.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const table: string = body.table;
    const record = body.record;
    if (!record) return json({ error: "Invalid payload" }, 400);

    const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) as unknown as Db;

    if (table === "hangs") {
      const hostId: string = record.user_id;
      const [host, recipientsRes] = await Promise.all([
        profileName(client, hostId),
        client.rpc("get_friends_and_mutuals_of", { p_user_id: hostId }),
      ]);
      const recipients = (recipientsRes.data ?? []).map((r: { user_id: string }) => r.user_id);
      const n: ResolvedNotification = {
        recipients,
        title: host.full_name,
        body: `${host.full_name} created a Hang: ${record.title}`,
        data: { hangId: record.id },
      };
      const sent = await deliver(client, n);
      return json({ success: true, kind: "hang_created", sent });
    }

    if (table === "hang_attendees") {
      const attendeeId: string = record.user_id;
      const hangId: string = record.hang_id;
      const { data: hang } = await client.from("hangs").select("user_id, title").eq("id", hangId).single();
      if (!hang) return json({ message: "Hang not found" }, 200);
      if (hang.user_id === attendeeId) return json({ message: "Skipped host self-RSVP" }, 200);
      const attendee = await profileName(client, attendeeId);
      const n: ResolvedNotification = {
        recipients: [hang.user_id],
        title: "New RSVP",
        body: `${attendee.full_name} is going to your Hang.`,
        data: { hangId },
      };
      const sent = await deliver(client, n);
      return json({ success: true, kind: "hang_rsvp", sent });
    }

    return json({ message: `Ignored table: ${table}` }, 200);
  } catch (err) {
    console.error("notify-hangs error:", err);
    return json({ error: "Internal server error", details: String(err) }, 500);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}
