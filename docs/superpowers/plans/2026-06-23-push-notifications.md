# Six New Push Notifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six push notifications (friend request, member joined, new post, invites refreshed, comment, like) on a shared engine + single dispatcher, and route their taps in the client.

**Architecture:** Extract the duplicated Expo-send/token/cleanup logic from the two existing edge functions into `supabase/functions/_shared/expo-push.ts`. A single `notify` edge function branches on the webhook's source table (and a cron `type`) into small per-type **resolvers** — `(client, record) → ResolvedNotification | null` — then hands off to the engine's `deliver()`. Recipients/filters come from SQL (`get_post_notification_recipients`, `get_invite_refresh_recipients`) and Vault-gated webhook/cron migrations.

**Tech Stack:** Supabase (Postgres + Edge Functions on Deno), `@supabase/supabase-js@2.35.0`, Expo Push API, Vitest 4 (jsdom) for tests, expo-router on the client.

## Global Constraints

- **Copy (exact).** `{name}` = the actor's `profiles.full_name`, falling back to `"Someone"`:
  - friend request → `{name} requested to be friends`
  - member joined → `{name} joined your planet`
  - new post → `{name} posted`
  - invites refreshed → `Your invites have refreshed` (system; no `{name}`, no avatar)
  - comment → `{name} commented on your post`
  - like → `{name} liked your post`
- **Avatars: text-only for now.** Every resolver threads the actor's `avatar_url` into the payload `data` (`buildMessage` adds `data.avatarUrl`). Do NOT set Android image fields and do NOT add an iOS Notification Service Extension — that is a separate slice.
- **No debouncing.** One push per comment and per like event.
- **No notification preferences / opt-out.** Out of scope.
- **New-post audience:** `visibility='friends'` → author's accepted friends only; `visibility IN ('mutuals','public')` → friends + mutuals (cap at mutuals — never the unbounded public). Always exclude the author and blocked users (symmetric `is_blocked`).
- **Skip self:** never notify the actor about their own comment/like.
- **Exclude Hang-carrier posts** from the new-post notification (Hangs have their own push).
- **Deno boundary:** only `notify/index.ts`, `notify-hangs/index.ts`, `send-push-notification/index.ts` may use `Deno.*` or `npm:` imports. `_shared/expo-push.ts`, `_shared/recipients.ts`, and `notify/resolvers/*` must use NONE (so Vitest can import the pure ones, and Deno cross-imports use explicit `.ts`).
- **Webhook/cron migrations** read the service-role JWT from Vault secret `service_role_key` and are a **no-op where the secret/extension is absent** (local/CI). Function URL base: `https://bkarkzwzbvfiqbtpjkvh.supabase.co/functions/v1/`.
- **`type` discriminator:** every notification's `data` includes `type` (`friend_request | member_joined | post | comment | like | invites_refreshed`).

## File Structure

```
supabase/functions/
  _shared/
    expo-push.ts        # NEW — engine: types, buildMessage, fetchTokens, profileName, sendExpoBatched, deliver
    recipients.ts       # NEW — pure helpers (friendRequestRecipient)
  notify/
    index.ts            # NEW — dispatcher (branches on table / cron type)
    resolvers/
      member-joined.ts  # NEW
      friend-request.ts # NEW
      comment.ts        # NEW
      like.ts           # NEW
      new-post.ts       # NEW
      invites-refreshed.ts # NEW
  notify-hangs/index.ts          # MODIFY — refactor onto engine
  send-push-notification/index.ts # MODIFY — refactor onto engine
supabase/migrations/
  20260623000001_get_post_notification_recipients.sql  # NEW
  20260623000002_get_invite_refresh_recipients.sql     # NEW
  20260623000010_notify_member_joined_webhook.sql      # NEW
  20260623000011_notify_friend_request_webhook.sql     # NEW
  20260623000012_notify_comment_webhook.sql            # NEW
  20260623000013_notify_like_webhook.sql               # NEW
  20260623000014_notify_new_post_webhook.sql           # NEW
  20260623000015_invites_refreshed_cron.sql            # NEW
__tests__/
  functions/expo-push.test.ts        # NEW — buildMessage (pure, no DB)
  functions/recipients.test.ts       # NEW — friendRequestRecipient (pure, no DB)
  rpc/post-notification-recipients.test.ts  # NEW — RPC (needs local Supabase)
  rpc/invite-refresh-recipients.test.ts     # NEW — RPC (needs local Supabase)
hooks/usePushNotifications.ts        # MODIFY — type→route map
```

**Suggested branch:** `feat/push-notifications` (the working tree has unrelated WIP on `design-system-hardening`).

**Test commands:**
- Pure unit tests (no Supabase): `npx vitest run __tests__/functions/expo-push.test.ts`
- RPC tests (need local Supabase + `.env.test`): `npm run test:rpc -- post-notification-recipients.test.ts`
- Deno type-check (if the Deno CLI is installed — Supabase Edge uses Deno): `deno check supabase/functions/notify/index.ts`. Otherwise this is verified at deploy time via `supabase functions deploy`.

---

### Task 1: Shared engine + refactor existing functions

**Files:**
- Create: `supabase/functions/_shared/expo-push.ts`
- Test: `__tests__/functions/expo-push.test.ts`
- Modify: `supabase/functions/notify-hangs/index.ts` (replace local helpers)
- Modify: `supabase/functions/send-push-notification/index.ts` (replace inline send/cleanup)

**Interfaces:**
- Produces (consumed by all later tasks):
  - `type Db = { from: (t: string) => any; rpc: (fn: string, args?: Record<string, unknown>) => any }`
  - `interface ResolvedNotification { recipients: string[]; title: string; body: string; data: Record<string, unknown>; avatarUrl?: string | null; badge?: number }`
  - `buildMessage(token: string, n: ResolvedNotification): ExpoMessage`
  - `fetchTokens(client: Db, userIds: string[]): Promise<string[]>`
  - `profileName(client: Db, userId: string): Promise<{ full_name: string; avatar_url: string | null }>`
  - `deliver(client: Db, n: ResolvedNotification): Promise<number>`

- [ ] **Step 1: Write the failing test** — `__tests__/functions/expo-push.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { buildMessage } from "../../supabase/functions/_shared/expo-push";

describe("buildMessage", () => {
  const base = {
    recipients: ["u1"],
    title: "Alice",
    body: "Alice posted",
    data: { type: "post", postId: "p1" },
  };

  it("threads type into data and sets default sound", () => {
    const msg = buildMessage("ExponentPushToken[x]", base);
    expect(msg.to).toBe("ExponentPushToken[x]");
    expect(msg.title).toBe("Alice");
    expect(msg.body).toBe("Alice posted");
    expect(msg.sound).toBe("default");
    expect(msg.data.type).toBe("post");
    expect(msg.data.postId).toBe("p1");
  });

  it("adds avatarUrl to data only when present", () => {
    expect(buildMessage("t", base).data.avatarUrl).toBeUndefined();
    const withAvatar = buildMessage("t", { ...base, avatarUrl: "https://x/a.jpg" });
    expect(withAvatar.data.avatarUrl).toBe("https://x/a.jpg");
  });

  it("includes badge only when set", () => {
    expect(buildMessage("t", base).badge).toBeUndefined();
    expect(buildMessage("t", { ...base, badge: 3 }).badge).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/functions/expo-push.test.ts`
Expected: FAIL — cannot resolve `../../supabase/functions/_shared/expo-push`.

- [ ] **Step 3: Create the engine** — `supabase/functions/_shared/expo-push.ts`

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/functions/expo-push.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Refactor `notify-hangs/index.ts` onto the engine** (replace entire file)

```ts
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
```

- [ ] **Step 6: Refactor `send-push-notification/index.ts` onto the engine** (replace entire file)

```ts
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
```

> Behavior note: the message cleanup now deletes dead tokens by `token` (globally unique device token) rather than scoped by `user_id+token`. This is equivalent and matches `notify-hangs`.

- [ ] **Step 7: Type-check the refactored Deno functions** (if Deno CLI present)

Run: `deno check supabase/functions/notify-hangs/index.ts supabase/functions/send-push-notification/index.ts`
Expected: no errors. (If Deno is not installed, verify by re-reading the diffs against the engine signatures in this task; deploy verification happens in Task 9's rollout.)

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/_shared/expo-push.ts __tests__/functions/expo-push.test.ts \
        supabase/functions/notify-hangs/index.ts supabase/functions/send-push-notification/index.ts
git commit -m "refactor(functions): extract shared Expo push engine; reuse in message + hangs fns"
```

---

### Task 2: `notify` dispatcher + member-joined notification

**Files:**
- Create: `supabase/functions/notify/resolvers/member-joined.ts`
- Create: `supabase/functions/notify/index.ts`
- Create: `supabase/migrations/20260623000010_notify_member_joined_webhook.sql`

**Interfaces:**
- Consumes: `deliver`, `profileName`, `Db`, `ResolvedNotification` from `../_shared/expo-push.ts` (Task 1).
- Produces: `memberJoined(client: Db, record): Promise<ResolvedNotification | null>`; the `notify` function at `/functions/v1/notify`.

- [ ] **Step 1: Create the resolver** — `supabase/functions/notify/resolvers/member-joined.ts`

```ts
import { profileName, type Db, type ResolvedNotification } from "../../_shared/expo-push.ts";

interface ProfileRecord {
  id: string;
  invited_by: string | null;
}

export async function memberJoined(
  client: Db,
  record: ProfileRecord
): Promise<ResolvedNotification | null> {
  if (!record.invited_by) return null;
  const member = await profileName(client, record.id);
  return {
    recipients: [record.invited_by],
    title: member.full_name,
    body: `${member.full_name} joined your planet`,
    data: { type: "member_joined", memberId: record.id },
    avatarUrl: member.avatar_url,
  };
}
```

- [ ] **Step 2: Create the dispatcher** — `supabase/functions/notify/index.ts`

```ts
import { createClient } from "npm:@supabase/supabase-js@2.35.0";
import { deliver, type Db } from "../_shared/expo-push.ts";
import { memberJoined } from "./resolvers/member-joined.ts";

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
```

- [ ] **Step 3: Create the webhook migration** — `supabase/migrations/20260623000010_notify_member_joined_webhook.sql`

```sql
-- "member joined" push: fires when an INVITED user's profile is inserted.
-- Vault pattern (cf. 20260615000001): reads service_role JWT from Vault; no-op
-- where the secret is absent (local/CI). WHEN clause keeps non-invited signups
-- from waking the function.
do $$
declare
  v_key text;
  v_url text := 'https://bkarkzwzbvfiqbtpjkvh.supabase.co/functions/v1/notify';
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_key is null then
    raise notice 'Vault secret "service_role_key" not set; skipping notify_member_joined webhook (expected in local/CI).';
    return;
  end if;

  drop trigger if exists notify_member_joined on public.profiles;
  execute format(
    'create trigger notify_member_joined after insert on public.profiles '
    'for each row when (new.invited_by is not null) '
    'execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    v_url, 'POST',
    jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key)::text,
    '{}', '5000'
  );
end $$;
```

- [ ] **Step 4: Type-check** (if Deno CLI present)

Run: `deno check supabase/functions/notify/index.ts`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/notify/ supabase/migrations/20260623000010_notify_member_joined_webhook.sql
git commit -m "feat(notify): dispatcher + member-joined push (invited user signup)"
```

---

### Task 3: Friend-request notification

**Files:**
- Create: `supabase/functions/_shared/recipients.ts`
- Test: `__tests__/functions/recipients.test.ts`
- Create: `supabase/functions/notify/resolvers/friend-request.ts`
- Modify: `supabase/functions/notify/index.ts` (add import + case)
- Create: `supabase/migrations/20260623000011_notify_friend_request_webhook.sql`

**Interfaces:**
- Produces: `friendRequestRecipient(r): string`; `friendRequest(client, record): Promise<ResolvedNotification | null>`.

- [ ] **Step 1: Write the failing test** — `__tests__/functions/recipients.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { friendRequestRecipient } from "../../supabase/functions/_shared/recipients";

describe("friendRequestRecipient", () => {
  it("returns user_b when user_a is the requester", () => {
    expect(friendRequestRecipient({ user_a: "a", user_b: "b", requested_by: "a" })).toBe("b");
  });
  it("returns user_a when user_b is the requester", () => {
    expect(friendRequestRecipient({ user_a: "a", user_b: "b", requested_by: "b" })).toBe("a");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/functions/recipients.test.ts`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Create the pure helper** — `supabase/functions/_shared/recipients.ts`

```ts
// Pure recipient helpers. NO Deno.* / npm: imports (Vitest-importable).

export function friendRequestRecipient(r: {
  user_a: string;
  user_b: string;
  requested_by: string;
}): string {
  return r.requested_by === r.user_a ? r.user_b : r.user_a;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/functions/recipients.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Create the resolver** — `supabase/functions/notify/resolvers/friend-request.ts`

```ts
import { profileName, type Db, type ResolvedNotification } from "../../_shared/expo-push.ts";
import { friendRequestRecipient } from "../../_shared/recipients.ts";

interface FriendshipRecord {
  user_a: string;
  user_b: string;
  requested_by: string;
  status: string;
}

export async function friendRequest(
  client: Db,
  record: FriendshipRecord
): Promise<ResolvedNotification | null> {
  if (record.status !== "pending") return null;
  const recipientId = friendRequestRecipient(record);
  const actor = await profileName(client, record.requested_by);
  return {
    recipients: [recipientId],
    title: actor.full_name,
    body: `${actor.full_name} requested to be friends`,
    data: { type: "friend_request", requesterId: record.requested_by },
    avatarUrl: actor.avatar_url,
  };
}
```

- [ ] **Step 6: Wire into the dispatcher** — `supabase/functions/notify/index.ts`

Add the import near the top:

```ts
import { friendRequest } from "./resolvers/friend-request.ts";
```

Add a case to the `switch (table)`:

```ts
      case "friendships":
        resolved = await friendRequest(client, record);
        break;
```

- [ ] **Step 7: Create the webhook migration** — `supabase/migrations/20260623000011_notify_friend_request_webhook.sql`

```sql
-- "friend request" push: fires on a NEW pending friendship. WHEN clause skips
-- auto-accepted invite friendships (status='accepted'). Vault-gated; no-op locally.
do $$
declare
  v_key text;
  v_url text := 'https://bkarkzwzbvfiqbtpjkvh.supabase.co/functions/v1/notify';
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_key is null then
    raise notice 'Vault secret "service_role_key" not set; skipping notify_friend_request webhook (expected in local/CI).';
    return;
  end if;

  drop trigger if exists notify_friend_request on public.friendships;
  execute format(
    'create trigger notify_friend_request after insert on public.friendships '
    'for each row when (new.status = ''pending'') '
    'execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    v_url, 'POST',
    jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key)::text,
    '{}', '5000'
  );
end $$;
```

- [ ] **Step 8: Run the pure tests + type-check**

Run: `npx vitest run __tests__/functions/` then (if Deno present) `deno check supabase/functions/notify/index.ts`
Expected: tests PASS; no type errors.

- [ ] **Step 9: Commit**

```bash
git add supabase/functions/_shared/recipients.ts __tests__/functions/recipients.test.ts \
        supabase/functions/notify/resolvers/friend-request.ts supabase/functions/notify/index.ts \
        supabase/migrations/20260623000011_notify_friend_request_webhook.sql
git commit -m "feat(notify): friend-request push"
```

---

### Task 4: Comment notification

**Files:**
- Create: `supabase/functions/notify/resolvers/comment.ts`
- Modify: `supabase/functions/notify/index.ts` (add import + case)
- Create: `supabase/migrations/20260623000012_notify_comment_webhook.sql`

**Interfaces:**
- Produces: `comment(client, record): Promise<ResolvedNotification | null>`.

- [ ] **Step 1: Create the resolver** — `supabase/functions/notify/resolvers/comment.ts`

```ts
import { profileName, type Db, type ResolvedNotification } from "../../_shared/expo-push.ts";

interface CommentRecord {
  id: string;
  post_id: string;
  author_id: string;
}

export async function comment(
  client: Db,
  record: CommentRecord
): Promise<ResolvedNotification | null> {
  const { data: post } = await client.from("posts").select("author_id").eq("id", record.post_id).single();
  if (!post) return null;
  const ownerId = post.author_id as string;
  if (ownerId === record.author_id) return null; // skip self-comment
  const actor = await profileName(client, record.author_id);
  return {
    recipients: [ownerId],
    title: actor.full_name,
    body: `${actor.full_name} commented on your post`,
    data: { type: "comment", postId: record.post_id, commentId: record.id },
    avatarUrl: actor.avatar_url,
  };
}
```

- [ ] **Step 2: Wire into the dispatcher** — `supabase/functions/notify/index.ts`

Add import:

```ts
import { comment } from "./resolvers/comment.ts";
```

Add case:

```ts
      case "comments":
        resolved = await comment(client, record);
        break;
```

- [ ] **Step 3: Create the webhook migration** — `supabase/migrations/20260623000012_notify_comment_webhook.sql`

```sql
-- "comment" push: fires on a new comment; resolver resolves post owner + skips self.
do $$
declare
  v_key text;
  v_url text := 'https://bkarkzwzbvfiqbtpjkvh.supabase.co/functions/v1/notify';
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_key is null then
    raise notice 'Vault secret "service_role_key" not set; skipping notify_comment webhook (expected in local/CI).';
    return;
  end if;

  drop trigger if exists notify_comment on public.comments;
  execute format(
    'create trigger notify_comment after insert on public.comments '
    'for each row execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    v_url, 'POST',
    jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key)::text,
    '{}', '5000'
  );
end $$;
```

- [ ] **Step 4: Type-check** (if Deno present)

Run: `deno check supabase/functions/notify/index.ts`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/notify/resolvers/comment.ts supabase/functions/notify/index.ts \
        supabase/migrations/20260623000012_notify_comment_webhook.sql
git commit -m "feat(notify): comment-on-your-post push"
```

---

### Task 5: Like notification

**Files:**
- Create: `supabase/functions/notify/resolvers/like.ts`
- Modify: `supabase/functions/notify/index.ts` (add import + case)
- Create: `supabase/migrations/20260623000013_notify_like_webhook.sql`

**Interfaces:**
- Produces: `like(client, record): Promise<ResolvedNotification | null>`.

- [ ] **Step 1: Create the resolver** — `supabase/functions/notify/resolvers/like.ts`

```ts
import { profileName, type Db, type ResolvedNotification } from "../../_shared/expo-push.ts";

interface LikeRecord {
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
}

export async function like(
  client: Db,
  record: LikeRecord
): Promise<ResolvedNotification | null> {
  if (!record.post_id) return null; // post likes only
  const { data: post } = await client.from("posts").select("author_id").eq("id", record.post_id).single();
  if (!post) return null;
  const ownerId = post.author_id as string;
  if (ownerId === record.user_id) return null; // skip self-like
  const actor = await profileName(client, record.user_id);
  return {
    recipients: [ownerId],
    title: actor.full_name,
    body: `${actor.full_name} liked your post`,
    data: { type: "like", postId: record.post_id },
    avatarUrl: actor.avatar_url,
  };
}
```

- [ ] **Step 2: Wire into the dispatcher** — `supabase/functions/notify/index.ts`

Add import:

```ts
import { like } from "./resolvers/like.ts";
```

Add case:

```ts
      case "likes":
        resolved = await like(client, record);
        break;
```

- [ ] **Step 3: Create the webhook migration** — `supabase/migrations/20260623000013_notify_like_webhook.sql`

```sql
-- "like" push: fires only on POST likes (WHEN post_id IS NOT NULL skips comment likes).
do $$
declare
  v_key text;
  v_url text := 'https://bkarkzwzbvfiqbtpjkvh.supabase.co/functions/v1/notify';
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_key is null then
    raise notice 'Vault secret "service_role_key" not set; skipping notify_like webhook (expected in local/CI).';
    return;
  end if;

  drop trigger if exists notify_like on public.likes;
  execute format(
    'create trigger notify_like after insert on public.likes '
    'for each row when (new.post_id is not null) '
    'execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    v_url, 'POST',
    jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key)::text,
    '{}', '5000'
  );
end $$;
```

- [ ] **Step 4: Type-check** (if Deno present)

Run: `deno check supabase/functions/notify/index.ts`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/notify/resolvers/like.ts supabase/functions/notify/index.ts \
        supabase/migrations/20260623000013_notify_like_webhook.sql
git commit -m "feat(notify): like-your-post push"
```

---

### Task 6: `get_post_notification_recipients` RPC (TDD)

**Files:**
- Create: `supabase/migrations/20260623000001_get_post_notification_recipients.sql`
- Test: `__tests__/rpc/post-notification-recipients.test.ts`

**Interfaces:**
- Produces SQL: `get_post_notification_recipients(p_post_id uuid) RETURNS TABLE(user_id uuid)` — friends-only for `visibility='friends'`; friends+mutuals for `'mutuals'|'public'`; excludes author + blocked.

- [ ] **Step 1: Write the failing test** — `__tests__/rpc/post-notification-recipients.test.ts`

```ts
import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, createFriendship, cleanupTestData, TestUser } from "../utils/seed";

async function createPost(authorId: string, visibility: "friends" | "mutuals" | "public") {
  const { data, error } = await adminClient
    .from("posts")
    .insert({ author_id: authorId, text: `post ${visibility}`, visibility })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

describe("get_post_notification_recipients", () => {
  let author: TestUser; // posts
  let friend: TestUser; // A's direct friend
  let mutual: TestUser; // friend-of-friend via `friend`
  let stranger: TestUser; // unconnected
  let blockedFriend: TestUser; // direct friend but blocked

  beforeAll(async () => {
    author = await createTestUser({ full_name: "Author Post" });
    friend = await createTestUser({ full_name: "Friend Post" });
    mutual = await createTestUser({ full_name: "Mutual Post" });
    stranger = await createTestUser({ full_name: "Stranger Post" });
    blockedFriend = await createTestUser({ full_name: "Blocked Post" });

    await createFriendship(author.id, friend.id); // author ↔ friend
    await createFriendship(friend.id, mutual.id); // friend ↔ mutual ⇒ mutual is author's mutual
    await createFriendship(author.id, blockedFriend.id); // author ↔ blockedFriend
    await adminClient.from("blocks").insert({ blocker_id: author.id, blocked_id: blockedFriend.id });
  });

  afterAll(async () => {
    await cleanupTestData([author.id, friend.id, mutual.id, stranger.id, blockedFriend.id]);
  });

  it("friends-visibility post notifies direct friends only (not mutuals/strangers)", async () => {
    const postId = await createPost(author.id, "friends");
    const { data, error } = await adminClient.rpc("get_post_notification_recipients", {
      p_post_id: postId,
    });
    expect(error).toBeNull();
    const ids = data!.map((r: { user_id: string }) => r.user_id);
    expect(ids).toContain(friend.id);
    expect(ids).not.toContain(mutual.id);
    expect(ids).not.toContain(stranger.id);
    expect(ids).not.toContain(author.id);
  });

  it("mutuals-visibility post notifies friends + mutuals (not strangers)", async () => {
    const postId = await createPost(author.id, "mutuals");
    const { data, error } = await adminClient.rpc("get_post_notification_recipients", {
      p_post_id: postId,
    });
    expect(error).toBeNull();
    const ids = data!.map((r: { user_id: string }) => r.user_id);
    expect(ids).toContain(friend.id);
    expect(ids).toContain(mutual.id);
    expect(ids).not.toContain(stranger.id);
  });

  it("public-visibility post caps at friends + mutuals (no unbounded public)", async () => {
    const postId = await createPost(author.id, "public");
    const { data, error } = await adminClient.rpc("get_post_notification_recipients", {
      p_post_id: postId,
    });
    expect(error).toBeNull();
    const ids = data!.map((r: { user_id: string }) => r.user_id);
    expect(ids).toContain(friend.id);
    expect(ids).toContain(mutual.id);
    expect(ids).not.toContain(stranger.id);
  });

  it("excludes blocked users even when they are friends", async () => {
    const postId = await createPost(author.id, "friends");
    const { data, error } = await adminClient.rpc("get_post_notification_recipients", {
      p_post_id: postId,
    });
    expect(error).toBeNull();
    const ids = data!.map((r: { user_id: string }) => r.user_id);
    expect(ids).toContain(friend.id);
    expect(ids).not.toContain(blockedFriend.id);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:rpc -- post-notification-recipients.test.ts`
Expected: FAIL — `function get_post_notification_recipients(uuid) does not exist` (Postgres `42883`).

- [ ] **Step 3: Create the migration** — `supabase/migrations/20260623000001_get_post_notification_recipients.sql`

```sql
-- Recipients for a "new post" push, bounded by visibility:
--   visibility='friends'           -> author's accepted friends
--   visibility in ('mutuals','public') -> friends + mutuals (reuses
--     get_friends_and_mutuals_of; we intentionally cap public at mutuals)
-- Always excludes the author and any blocked relationship (symmetric is_blocked).
create or replace function public.get_post_notification_recipients(p_post_id uuid)
returns table(user_id uuid)
security definer
set search_path = public
language plpgsql
as $$
declare
  v_author     uuid;
  v_visibility public.post_visibility;
begin
  select author_id, visibility into v_author, v_visibility
  from public.posts where id = p_post_id;

  if v_author is null then
    return;
  end if;

  if v_visibility = 'friends' then
    return query
    select (case when f.user_a = v_author then f.user_b else f.user_a end) as user_id
    from public.friendships f
    where f.status = 'accepted'
      and (f.user_a = v_author or f.user_b = v_author)
      and not is_blocked(
        v_author,
        (case when f.user_a = v_author then f.user_b else f.user_a end)
      );
  else
    return query
    select gfm.user_id
    from public.get_friends_and_mutuals_of(v_author) gfm
    where not is_blocked(v_author, gfm.user_id);
  end if;
end;
$$;

grant execute on function public.get_post_notification_recipients(uuid) to authenticated, service_role;
```

- [ ] **Step 4: Apply the migration locally**

Run: `npx supabase db reset` (or `npx supabase migration up`) against the local stack.
Expected: migration applies cleanly.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:rpc -- post-notification-recipients.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260623000001_get_post_notification_recipients.sql \
        __tests__/rpc/post-notification-recipients.test.ts
git commit -m "feat(db): get_post_notification_recipients RPC (visibility-bounded, block-aware)"
```

---

### Task 7: New-post notification

**Files:**
- Create: `supabase/functions/notify/resolvers/new-post.ts`
- Modify: `supabase/functions/notify/index.ts` (add import + case)
- Create: `supabase/migrations/20260623000014_notify_new_post_webhook.sql`

**Interfaces:**
- Consumes: `get_post_notification_recipients` (Task 6).
- Produces: `newPost(client, record): Promise<ResolvedNotification | null>`.

- [ ] **Step 1: Create the resolver** — `supabase/functions/notify/resolvers/new-post.ts`

```ts
import { profileName, type Db, type ResolvedNotification } from "../../_shared/expo-push.ts";

interface PostRecord {
  id: string;
  author_id: string;
}

export async function newPost(
  client: Db,
  record: PostRecord
): Promise<ResolvedNotification | null> {
  // Exclude Hang-carrier posts — Hangs already emit their own push. Post + hang
  // are created in one transaction (create_hang_with_post), so by the time this
  // post-commit webhook runs, the hangs row is visible.
  const { data: hang } = await client.from("hangs").select("id").eq("post_id", record.id).maybeSingle();
  if (hang) return null;

  const { data: rows } = await client.rpc("get_post_notification_recipients", { p_post_id: record.id });
  const recipients = (rows ?? []).map((r: { user_id: string }) => r.user_id);
  if (recipients.length === 0) return null;

  const author = await profileName(client, record.author_id);
  return {
    recipients,
    title: author.full_name,
    body: `${author.full_name} posted`,
    data: { type: "post", postId: record.id },
    avatarUrl: author.avatar_url,
  };
}
```

- [ ] **Step 2: Wire into the dispatcher** — `supabase/functions/notify/index.ts`

Add import:

```ts
import { newPost } from "./resolvers/new-post.ts";
```

Add case:

```ts
      case "posts":
        resolved = await newPost(client, record);
        break;
```

- [ ] **Step 3: Create the webhook migration** — `supabase/migrations/20260623000014_notify_new_post_webhook.sql`

```sql
-- "new post" push: fires on every post insert; the resolver excludes Hang-carrier
-- posts and resolves the visibility-bounded audience.
do $$
declare
  v_key text;
  v_url text := 'https://bkarkzwzbvfiqbtpjkvh.supabase.co/functions/v1/notify';
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_key is null then
    raise notice 'Vault secret "service_role_key" not set; skipping notify_new_post webhook (expected in local/CI).';
    return;
  end if;

  drop trigger if exists notify_new_post on public.posts;
  execute format(
    'create trigger notify_new_post after insert on public.posts '
    'for each row execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    v_url, 'POST',
    jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key)::text,
    '{}', '5000'
  );
end $$;
```

- [ ] **Step 4: Type-check** (if Deno present)

Run: `deno check supabase/functions/notify/index.ts`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/notify/resolvers/new-post.ts supabase/functions/notify/index.ts \
        supabase/migrations/20260623000014_notify_new_post_webhook.sql
git commit -m "feat(notify): new-post push (visibility-bounded, excludes hangs)"
```

---

### Task 8: Invites-refreshed notification (cron, TDD on the RPC)

**Files:**
- Create: `supabase/migrations/20260623000002_get_invite_refresh_recipients.sql`
- Test: `__tests__/rpc/invite-refresh-recipients.test.ts`
- Create: `supabase/functions/notify/resolvers/invites-refreshed.ts`
- Modify: `supabase/functions/notify/index.ts` (replace the `invites_refreshed` stub)
- Create: `supabase/migrations/20260623000015_invites_refreshed_cron.sql`

**Interfaces:**
- Produces SQL: `get_invite_refresh_recipients() RETURNS TABLE(user_id uuid)` — distinct inviters who created ≥1 invite_code in the previous calendar month.
- Produces: `invitesRefreshed(client): Promise<ResolvedNotification | null>`.

- [ ] **Step 1: Write the failing RPC test** — `__tests__/rpc/invite-refresh-recipients.test.ts`

```ts
import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, cleanupTestData, TestUser } from "../utils/seed";

describe("get_invite_refresh_recipients", () => {
  let lastMonthInviter: TestUser; // invited last calendar month -> included
  let thisMonthInviter: TestUser; // invited this calendar month -> excluded

  const now = new Date();
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15, 12, 0, 0));
  const thisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15, 12, 0, 0));

  beforeAll(async () => {
    lastMonthInviter = await createTestUser({ full_name: "Last Month Inviter" });
    thisMonthInviter = await createTestUser({ full_name: "This Month Inviter" });

    await adminClient.from("invite_codes").insert([
      { code: `LM-${lastMonthInviter.id.slice(0, 8)}`, inviter_id: lastMonthInviter.id, created_at: lastMonth.toISOString() },
      { code: `TM-${thisMonthInviter.id.slice(0, 8)}`, inviter_id: thisMonthInviter.id, created_at: thisMonth.toISOString() },
    ]);
  });

  afterAll(async () => {
    await cleanupTestData([lastMonthInviter.id, thisMonthInviter.id]);
  });

  it("returns inviters from the previous calendar month only", async () => {
    const { data, error } = await adminClient.rpc("get_invite_refresh_recipients", {});
    expect(error).toBeNull();
    const ids = data!.map((r: { user_id: string }) => r.user_id);
    expect(ids).toContain(lastMonthInviter.id);
    expect(ids).not.toContain(thisMonthInviter.id);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:rpc -- invite-refresh-recipients.test.ts`
Expected: FAIL — function does not exist (`42883`).

- [ ] **Step 3: Create the RPC migration** — `supabase/migrations/20260623000002_get_invite_refresh_recipients.sql`

```sql
-- Inviters who spent ≥1 invite in the PREVIOUS calendar month (the users for whom
-- a monthly "invites refreshed" reminder is meaningful).
create or replace function public.get_invite_refresh_recipients()
returns table(user_id uuid)
security definer
set search_path = public
language sql
stable
as $$
  select distinct inviter_id
  from public.invite_codes
  where created_at >= date_trunc('month', now()) - interval '1 month'
    and created_at <  date_trunc('month', now());
$$;

grant execute on function public.get_invite_refresh_recipients() to service_role;
```

- [ ] **Step 4: Apply migration + run test to verify it passes**

Run: `npx supabase migration up` then `npm run test:rpc -- invite-refresh-recipients.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Create the resolver** — `supabase/functions/notify/resolvers/invites-refreshed.ts`

```ts
import { type Db, type ResolvedNotification } from "../../_shared/expo-push.ts";

export async function invitesRefreshed(client: Db): Promise<ResolvedNotification | null> {
  const { data } = await client.rpc("get_invite_refresh_recipients", {});
  const recipients = (data ?? []).map((r: { user_id: string }) => r.user_id);
  if (recipients.length === 0) return null;
  return {
    recipients,
    title: "Tiny Planet",
    body: "Your invites have refreshed",
    data: { type: "invites_refreshed" },
  };
}
```

- [ ] **Step 6: Replace the dispatcher stub** — `supabase/functions/notify/index.ts`

Add import:

```ts
import { invitesRefreshed } from "./resolvers/invites-refreshed.ts";
```

Replace the stub block:

```ts
    if (body.type === "invites_refreshed") {
      // wired in Task 8
      return json({ message: "invites_refreshed not yet implemented" }, 200);
    }
```

with:

```ts
    if (body.type === "invites_refreshed") {
      const resolved = await invitesRefreshed(client);
      const sent = resolved ? await deliver(client, resolved) : 0;
      return json({ success: true, kind: "invites_refreshed", sent });
    }
```

- [ ] **Step 7: Create the cron migration** — `supabase/migrations/20260623000015_invites_refreshed_cron.sql`

```sql
-- Monthly "invites refreshed" reminder. Requires pg_cron + pg_net (Supabase).
-- The scheduled command reads the service-role JWT from Vault AT RUNTIME, so the
-- secret is not stored in cron.job.command. No-op where pg_cron is absent (local/CI).
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron not installed; skipping invites-refreshed cron (expected in local/CI).';
    return;
  end if;

  perform cron.unschedule('invites-refreshed-monthly')
  where exists (select 1 from cron.job where jobname = 'invites-refreshed-monthly');

  perform cron.schedule(
    'invites-refreshed-monthly',
    '0 12 1 * *',
    $cron$
    select net.http_post(
      url := 'https://bkarkzwzbvfiqbtpjkvh.supabase.co/functions/v1/notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := jsonb_build_object('type', 'invites_refreshed')
    );
    $cron$
  );
end $$;
```

> Prerequisite: ensure `pg_cron` and `pg_net` are enabled on the project (Supabase Dashboard → Database → Extensions, or `create extension if not exists pg_cron; create extension if not exists pg_net;`).

- [ ] **Step 8: Type-check** (if Deno present)

Run: `deno check supabase/functions/notify/index.ts`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/20260623000002_get_invite_refresh_recipients.sql \
        __tests__/rpc/invite-refresh-recipients.test.ts \
        supabase/functions/notify/resolvers/invites-refreshed.ts supabase/functions/notify/index.ts \
        supabase/migrations/20260623000015_invites_refreshed_cron.sql
git commit -m "feat(notify): monthly invites-refreshed reminder (pg_cron + RPC)"
```

---

### Task 9: Client tap routing + rollout

**Files:**
- Modify: `hooks/usePushNotifications.ts` (route on `data.type`)

**Interfaces:**
- Consumes: the `type` discriminator set by every resolver.

- [ ] **Step 1: Extend the response listener** — `hooks/usePushNotifications.ts`

Replace the body of the `addNotificationResponseReceivedListener` callback (currently the `hangId` / `friendId` checks) with a `type`-keyed router that preserves the existing message/hang routes:

```ts
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = (response.notification.request.content.data ?? {}) as {
          type?: string;
          hangId?: string;
          friendId?: string;
          postId?: string;
          memberId?: string;
        };

        switch (data.type) {
          case "friend_request":
            router.push("/friends");
            return;
          case "member_joined":
            if (data.memberId) {
              router.push({ pathname: "/profile", params: { userId: data.memberId } });
            }
            return;
          case "post":
          case "comment":
          case "like":
            if (data.postId) {
              router.push({ pathname: "/comments", params: { postId: data.postId } });
            }
            return;
          case "invites_refreshed":
            router.push("/friends");
            return;
        }

        // Existing routes (new-message / hang notifications carry no `type`).
        if (data.hangId) {
          router.push({ pathname: "/hang/[hangId]", params: { hangId: data.hangId } });
          return;
        }
        if (data.friendId) {
          router.push(`/chat/${data.friendId}`);
        }
      });
```

- [ ] **Step 2: Type-check the client**

Run: `npx tsc --noEmit`
Expected: no new errors from `hooks/usePushNotifications.ts`. (The route strings `"/friends"`, `"/profile"`, `"/comments"`, `"/hang/[hangId]"`, `"/chat/${id}"` all exist under `app/(protected)/`.)

- [ ] **Step 3: Commit**

```bash
git add hooks/usePushNotifications.ts
git commit -m "feat(push): route notification taps by type discriminator"
```

- [ ] **Step 4: Deploy & wire (rollout — requires Supabase CLI login/link)**

```bash
# Deploy the new + refactored functions
npx supabase functions deploy notify
npx supabase functions deploy notify-hangs
npx supabase functions deploy send-push-notification

# Apply migrations to the linked project (triggers/cron are no-ops without Vault/pg_cron)
npx supabase db push
```

Verify on the linked project:
- Vault secret `service_role_key` exists (the existing message/hang webhooks already rely on it): `select 1 from vault.decrypted_secrets where name = 'service_role_key';`
- `pg_cron` + `pg_net` enabled (Task 8): `select extname from pg_extension where extname in ('pg_cron','pg_net');`
- Triggers present: `select tgname from pg_trigger where tgname like 'notify_%';`

- [ ] **Step 5: Manual end-to-end smoke (on a device with a registered push token)**

For each notification, perform the action and confirm the push arrives with correct copy:
1. Send a friend request → recipient sees "{name} requested to be friends".
2. Sign up a new user via an invite → inviter sees "{name} joined your planet".
3. Publish a normal post → author's friends/mutuals see "{name} posted"; publish a Hang → confirm NO "posted" push (only the Hang push).
4. Comment on someone's post → owner sees "{name} commented on your post"; comment on your own → no push.
5. Like someone's post → owner sees "{name} liked your post"; like your own → no push.
6. Invoke the cron path manually to verify: `select net.http_post(url := '.../functions/v1/notify', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='service_role_key')), body := jsonb_build_object('type','invites_refreshed'));` → last-month inviters get "Your invites have refreshed".

---

## Self-Review

**Spec coverage:** All six notifications map to tasks — friend request (T3), member joined (T2), new post (T6 RPC + T7), invites refreshed (T8), comment (T4), like (T5). Engine extraction + duplication removal (T1). `type` discriminator + client routing (T9). Avatar URL threaded via `buildMessage`/`profileName` everywhere, no rich-image fields (Global Constraints, honored in T1). Visibility-bounded audience with block exclusion (T6). Self-skip (T4/T5). Hang exclusion (T7). Vault-gated, no-op-local migrations throughout. No debouncing, no preferences — absent by construction.

**Placeholder scan:** No "TBD"/"handle edge cases" — every step has concrete code or an exact command. The only deferred specifics are exact deploy/login (T9 rollout) which are environment actions, not code.

**Type consistency:** `Db`, `ResolvedNotification`, `buildMessage`, `fetchTokens`, `profileName`, `deliver` defined in T1 and used with matching signatures in every resolver and the dispatcher. `friendRequestRecipient` defined in T3 and used by the friend-request resolver. RPC names (`get_post_notification_recipients`, `get_invite_refresh_recipients`) match between migration, resolver, and test. Resolver function names (`memberJoined`, `friendRequest`, `comment`, `like`, `newPost`, `invitesRefreshed`) match their dispatcher imports/cases.
