import { createClient } from "npm:@supabase/supabase-js@2.35.0";

/*
  Push notification edge function — called by database trigger on messages INSERT.
  Uses SUPABASE_SERVICE_ROLE_KEY (not user auth) since this is invoked server-side.

  Flow:
  1. Parse webhook payload (new message record)
  2. Determine recipient (the non-sender participant)
  3. Fetch sender's name from profiles
  4. Fetch recipient's push tokens from push_tokens
  5. Fetch badge count via get_total_unread_count RPC
  6. Call Expo Push API
  7. Clean up invalid tokens (DeviceNotRegistered)
*/

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

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

    if (!record?.sender_id || !record?.text) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Determine recipient: the participant who is NOT the sender
    const recipientId =
      record.sender_id === record.user_id_a
        ? record.user_id_b
        : record.user_id_a;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch sender name, recipient tokens, and badge count in parallel
    const [senderResult, tokensResult, badgeResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", record.sender_id)
        .single(),
      supabase
        .from("push_tokens")
        .select("token")
        .eq("user_id", recipientId),
      supabase.rpc("get_total_unread_count", { p_user_id: recipientId }),
    ]);

    const senderName = senderResult.data?.full_name ?? "Someone";
    const tokens = tokensResult.data ?? [];
    const badgeCount = badgeResult.data ?? 0;

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push tokens for recipient" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build Expo push messages
    const truncatedText =
      record.text.length > 100
        ? record.text.substring(0, 100) + "..."
        : record.text;

    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      title: senderName,
      body: truncatedText,
      data: { friendId: record.sender_id },
      badge: badgeCount,
      sound: "default" as const,
    }));

    // Send to Expo Push API
    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    const pushResult = await pushResponse.json();

    // Clean up invalid tokens (DeviceNotRegistered)
    if (pushResult.data) {
      const invalidTokens: string[] = [];
      for (let i = 0; i < pushResult.data.length; i++) {
        const ticket = pushResult.data[i];
        if (
          ticket.status === "error" &&
          ticket.details?.error === "DeviceNotRegistered"
        ) {
          invalidTokens.push(tokens[i].token);
        }
      }

      if (invalidTokens.length > 0) {
        await supabase
          .from("push_tokens")
          .delete()
          .eq("user_id", recipientId)
          .in("token", invalidTokens);

        console.log(`Cleaned up ${invalidTokens.length} invalid push tokens`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: tokens.length,
        recipient: recipientId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-push-notification error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
