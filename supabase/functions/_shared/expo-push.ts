// Shared Expo push engine. NO Deno.* and NO npm: imports — so it is importable
// by both Deno edge functions and Vitest. Uses the global fetch (Deno + Node 18+).

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_BATCH_SIZE = 100;

export type Db = {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

export interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  badge?: number;
  sound: "default";
}

export interface ResolvedNotification {
  recipients: string[];
  title: string;
  body: string;
  data: Record<string, unknown>;
  avatarUrl?: string | null;
  badge?: number;
}

export function buildMessage(token: string, n: ResolvedNotification): ExpoMessage {
  const data = n.avatarUrl ? { ...n.data, avatarUrl: n.avatarUrl } : { ...n.data };
  const msg: ExpoMessage = { to: token, title: n.title, body: n.body, data, sound: "default" };
  if (n.badge !== undefined) msg.badge = n.badge;
  return msg;
}

export async function fetchTokens(client: Db, userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const { data } = await client.from("push_tokens").select("token").in("user_id", userIds);
  return (data ?? []).map((t: { token: string }) => t.token);
}

export async function profileName(
  client: Db,
  userId: string
): Promise<{ full_name: string; avatar_url: string | null }> {
  const { data } = await client
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", userId)
    .single();
  return { full_name: data?.full_name ?? "Someone", avatar_url: data?.avatar_url ?? null };
}

export async function sendExpoBatched(
  client: Db,
  tokens: string[],
  n: ResolvedNotification
): Promise<number> {
  if (tokens.length === 0) return 0;
  let sent = 0;
  for (let i = 0; i < tokens.length; i += EXPO_BATCH_SIZE) {
    const batch = tokens.slice(i, i + EXPO_BATCH_SIZE);
    const messages = batch.map((token) => buildMessage(token, n));
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
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          invalid.push(batch[j]);
        }
      }
      if (invalid.length > 0) {
        await client.from("push_tokens").delete().in("token", invalid);
      }
    }
    sent += batch.length;
  }
  return sent;
}

export async function deliver(client: Db, n: ResolvedNotification): Promise<number> {
  const tokens = await fetchTokens(client, n.recipients);
  return sendExpoBatched(client, tokens, n);
}
