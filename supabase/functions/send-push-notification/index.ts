import { createClient } from "npm:@supabase/supabase-js@2.35.0";
import { deliver, type Db, type ResolvedNotification } from "../_shared/expo-push.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface MessageRecord {
  id: string;
  user_id_a: string;
  user_id_b: string;
  sender_id: string;
  text: string;
  created_at: string;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const record: MessageRecord = body.record;
    if (!record?.sender_id || !record?.text) return json({ error: "Invalid payload" }, 400);

    const recipientId =
      record.sender_id === record.user_id_a ? record.user_id_b : record.user_id_a;
    const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) as unknown as Db;

    const [senderRes, badgeRes] = await Promise.all([
      client.from("profiles").select("full_name").eq("id", record.sender_id).single(),
      client.rpc("get_total_unread_count", { p_user_id: recipientId }),
    ]);
    const senderName = senderRes.data?.full_name ?? "Someone";
    const badgeCount = badgeRes.data ?? 0;

    const truncatedText =
      record.text.length > 100 ? record.text.substring(0, 100) + "..." : record.text;

    const n: ResolvedNotification = {
      recipients: [recipientId],
      title: senderName,
      body: truncatedText,
      data: { friendId: record.sender_id },
      badge: badgeCount,
    };
    const sent = await deliver(client, n);

    return json({ success: true, sent, recipient: recipientId }, 200);
  } catch (err) {
    console.error("send-push-notification error:", err);
    return json(
      { error: "Internal server error", details: err instanceof Error ? err.message : String(err) },
      500
    );
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}
