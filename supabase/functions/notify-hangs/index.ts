import { createClient } from "npm:@supabase/supabase-js@2.35.0";

/*
  Hang push notifications — called by database webhooks (configured in the
  Supabase Dashboard) on INSERT into `hangs` and `hang_attendees`.

  - hangs INSERT          → notify the host's friends + mutuals:
                            "<Host> created a Hang: <title>"
  - hang_attendees INSERT → notify the host (skip the host's own auto-RSVP):
                            "<User> is going to your Hang."

  Uses SUPABASE_SERVICE_ROLE_KEY (RLS-bypassing) since it runs server-side.
*/

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_BATCH_SIZE = 100;

type Supabase = ReturnType<typeof createClient>;

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: "default";
}

/** Send Expo push messages in batches of 100 and clean up dead tokens. */
async function sendExpoMessages(
  supabase: Supabase,
  tokens: string[],
  build: (token: string) => ExpoMessage
): Promise<number> {
  if (tokens.length === 0) return 0;

  let sent = 0;
  for (let i = 0; i < tokens.length; i += EXPO_BATCH_SIZE) {
    const batch = tokens.slice(i, i + EXPO_BATCH_SIZE);
    const messages = batch.map(build);

    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    const result = await res.json();

    if (result.data) {
      const invalid: string[] = [];
      for (let j = 0; j < result.data.length; j++) {
        const ticket = result.data[j];
        if (
          ticket.status === "error" &&
          ticket.details?.error === "DeviceNotRegistered"
        ) {
          invalid.push(batch[j]);
        }
      }
      if (invalid.length > 0) {
        await supabase.from("push_tokens").delete().in("token", invalid);
      }
    }
    sent += batch.length;
  }
  return sent;
}

async function tokensForUsers(
  supabase: Supabase,
  userIds: string[]
): Promise<string[]> {
  if (userIds.length === 0) return [];
  const { data } = await supabase
    .from("push_tokens")
    .select("token")
    .in("user_id", userIds);
  return (data ?? []).map((t: { token: string }) => t.token);
}

async function nameOf(supabase: Supabase, userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();
  return data?.full_name ?? "Someone";
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const table: string = body.table;
    const record = body.record;

    if (!record) {
      return json({ error: "Invalid payload" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (table === "hangs") {
      const hostId: string = record.user_id;
      const title: string = record.title;

      const [hostName, recipients] = await Promise.all([
        nameOf(supabase, hostId),
        supabase.rpc("get_friends_and_mutuals_of", { p_user_id: hostId }),
      ]);

      const recipientIds = (recipients.data ?? []).map(
        (r: { user_id: string }) => r.user_id
      );
      const tokens = await tokensForUsers(supabase, recipientIds);

      const sent = await sendExpoMessages(supabase, tokens, (token) => ({
        to: token,
        title: hostName,
        body: `${hostName} created a Hang: ${title}`,
        data: { hangId: record.id },
        sound: "default",
      }));

      return json({ success: true, kind: "hang_created", sent });
    }

    if (table === "hang_attendees") {
      const attendeeId: string = record.user_id;
      const hangId: string = record.hang_id;

      const { data: hang } = await supabase
        .from("hangs")
        .select("user_id, title")
        .eq("id", hangId)
        .single();

      if (!hang) return json({ message: "Hang not found" }, 200);

      // Don't notify the host of their own auto-RSVP.
      if (hang.user_id === attendeeId) {
        return json({ message: "Skipped host self-RSVP" }, 200);
      }

      const [attendeeName, tokens] = await Promise.all([
        nameOf(supabase, attendeeId),
        tokensForUsers(supabase, [hang.user_id]),
      ]);

      const sent = await sendExpoMessages(supabase, tokens, (token) => ({
        to: token,
        title: "New RSVP",
        body: `${attendeeName} is going to your Hang.`,
        data: { hangId },
        sound: "default",
      }));

      return json({ success: true, kind: "hang_rsvp", sent });
    }

    return json({ message: `Ignored table: ${table}` }, 200);
  } catch (err) {
    console.error("notify-hangs error:", err);
    return json(
      { error: "Internal server error", details: String(err) },
      500
    );
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
