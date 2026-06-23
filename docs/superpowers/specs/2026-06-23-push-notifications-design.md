# Design: Six New Push Notifications

**Date:** 2026-06-23
**Status:** Approved (brainstorming) — pending spec review
**Author:** Alex Korman (with Claude)

## Overview

Add six new push notifications to the Tiny Planet app. All are sent server-side
from Supabase edge functions; five are driven by database webhooks on `INSERT`,
and one is driven by `pg_cron`. The work also extracts the duplicated Expo-push
plumbing in the two existing functions into a shared engine and routes the new
notifications through a single dispatcher.

### The six notifications

| # | Event | Recipient | Copy | `type` |
|---|---|---|---|---|
| 1 | New pending friend request (`friendships` INSERT, `status='pending'`) | the user who is **not** `requested_by` | `{name} requested to be friends` | `friend_request` |
| 2 | An invited user joins (`profiles` INSERT, `invited_by IS NOT NULL`) | the inviter (`invited_by`) | `{name} joined your planet` | `member_joined` |
| 3 | New post (`posts` INSERT, non-hang) | author's friends + mutuals, bounded by post visibility | `{name} posted` | `post` |
| 4 | Monthly invite refresh (`pg_cron`, 1st of month) | users who created ≥1 invite last calendar month | `Your invites have refreshed` | `invites_refreshed` |
| 5 | New comment (`comments` INSERT) | post owner (skip self) | `{name} commented on your post` | `comment` |
| 6 | New post like (`likes` INSERT, `post_id IS NOT NULL`) | post owner (skip self) | `{name} liked your post` | `like` |

`{name}` is the actor's `profiles.full_name`.

## Goals

- Six new notifications matching the copy above.
- Eliminate the duplicated Expo-send / token-fetch / dead-token-cleanup logic
  currently copied across the two existing functions.
- A structure where adding the seventh notification is a small, isolated change.
- Thread avatar URLs into every payload now so rich images become a one-line
  change later.

## Non-goals (explicitly out of scope)

- **Rich avatar images.** Per decision, notifications are **text-only for now**.
  Resolvers still stash `avatarUrl` in the payload `data`, but no Android image
  fields are set and no iOS Notification Service Extension is built. Turning on
  rich images is a separate slice (Android payload fields + iOS NSE + EAS native
  rebuild).
- **Debouncing / coalescing.** v1 sends one push per like and per comment. No
  rate-limiting or batching.
- **Notification preferences / opt-out.** No preferences table exists today;
  building one is a separate slice. The dispatcher is the natural future home for
  a preference check.

## Architecture

```
supabase/functions/
  _shared/
    expo-push.ts        # reusable engine (extracted from the existing 2 fns)
  notify/
    index.ts            # single dispatcher; branches on webhook table / cron type
    resolvers/
      friend-request.ts # (record) -> { recipients, title, body, data }
      member-joined.ts
      new-post.ts
      comment.ts
      like.ts
      invites-refreshed.ts
  send-push-notification/index.ts   # existing (messages) — refactored onto engine
  notify-hangs/index.ts             # existing (hangs)    — refactored onto engine
```

### Shared engine — `_shared/expo-push.ts`

Extracted verbatim-in-behavior from `send-push-notification/index.ts` and
`notify-hangs/index.ts`. Public surface:

- `fetchPushTokens(supabase, userIds: string[]): Promise<{userId, token}[]>` —
  reads `public.push_tokens` (`user_id`, `token`).
- `buildMessage({ to, title, body, data, badge?, sound? }): ExpoMessage` — single
  place that constructs the Expo message. `data` always includes `type` and
  `avatarUrl`. This is where Android image fields / iOS `mutable-content` get
  added when rich images are enabled.
- `sendExpoBatched(messages: ExpoMessage[]): Promise<Ticket[]>` — POSTs to
  `https://exp.host/--/api/v2/push/send` in batches of 100.
- `cleanupDeadTokens(supabase, tickets, tokensByIndex): Promise<void>` — deletes
  tokens for `DeviceNotRegistered` responses.

The two existing functions are refactored to import these instead of holding
their own copies. Behavior (message badge count, hang batching) is preserved.

### Dispatcher — `notify/index.ts`

A single edge function. All five webhook triggers POST to it; `pg_cron` also
calls it for #4. It:

1. Parses the request. For webhooks, branches on `payload.table`
   (`friendships`, `profiles`, `posts`, `comments`, `likes`). For the cron call,
   branches on a body `{ "type": "invites_refreshed" }`.
2. Calls the matching **resolver**, a pure function returning
   `{ recipients: string[], title: string, body: string, data: object }`.
   Returns early (no-op) when the resolver yields no recipients (e.g. self-action,
   non-pending friendship, hang-carrier post, comment/post-like filtered out).
3. Fetches the actor's `full_name` + `avatar_url`, fetches recipient push tokens,
   builds messages via the engine, sends, and cleans up dead tokens.

Runtime isolation is preserved: each webhook is its own HTTP invocation, so a bug
in one resolver cannot affect another notification at runtime — they share only
code.

### `type` discriminator

Every payload `data` includes a `type` field (`friend_request`, `member_joined`,
`post`, `comment`, `like`, `invites_refreshed`). The client routes taps off it
(see Client Routing). It also gives free analytics later.

## Per-notification detail

Source-of-truth schema references:
- `friendships`: `supabase/migrations/20251024000000_remote_schema.sql:170-181`
  (`user_a`, `user_b`, `requested_by`, `status` enum `friend_status`).
- `profiles`: same file `:223-232` (`id`, `full_name`, `avatar_url`); `invited_by`
  added in `20251024000001_add_missing_profile_columns.sql`.
- `posts` / `comments` / `likes`:
  `supabase/migrations/20251024153920_posts_comments_likes.sql:9-45`.
- `invite_codes`: `20251024000000_remote_schema.sql:255-265` (`inviter_id`,
  `status`, `created_at`).
- `push_tokens`: `20260317100001_add_push_tokens_and_notification_support.sql`.

### 1. Friend request — `friend-request.ts`

- **Trigger:** `AFTER INSERT ON public.friendships`.
- **Filter:** `status = 'pending'` (skip auto-accepted invite friendships).
- **Recipient:** the user who is **not** `requested_by`
  (`requested_by === user_a ? user_b : user_a`).
- **Actor:** `requested_by`.
- **Copy:** title = actor `full_name`, body = `"{full_name} requested to be friends"`.
  (Friendships are a mutual model; copy intentionally says "be friends," not
  "follow.")
- **`data`:** `{ type: "friend_request", requesterId, avatarUrl }`.

### 2. Member joined — `member-joined.ts`

- **Trigger:** `AFTER INSERT ON public.profiles`.
- **Filter:** `invited_by IS NOT NULL`.
- **Recipient:** `invited_by` (the inviter).
- **Actor:** the new user (`NEW.id`).
- **Copy:** body = `"{new user full_name} joined your planet"`.
- **`data`:** `{ type: "member_joined", memberId, avatarUrl }`.
- **Note:** signup auto-creates a friendship between invitee and inviter, so the
  inviter's "person they invited" is also their new friend — one signal
  (`invited_by`) covers both readings of the original request. If `full_name` is
  not yet populated at profile-insert time, the resolver fetches it fresh.

### 3. New post — `new-post.ts`

- **Trigger:** `AFTER INSERT ON public.posts`.
- **Hang exclusion:** skip if a `hangs` row references this post
  (`SELECT 1 FROM hangs WHERE post_id = NEW.id`). Hangs already emit their own
  "created a Hang" push. **Verify during implementation** that the post and its
  `hangs` row are created in one transaction, so the `hangs` row is visible when
  the resolver runs (webhooks fire post-commit). If they are not transactional,
  make them so or add a guard.
- **Recipient — bounded by visibility:**
  - `visibility = 'friends'` → author's accepted friends only.
  - `visibility = 'mutuals'` → friends + mutuals.
  - `visibility = 'public'` → friends + mutuals (we **cap at mutuals**; we do not
    blast the unbounded public audience — this matches the "friends + mutuals"
    decision).
  - Always exclude the author and blocked users.
  - Implemented as a SQL RPC `get_post_notification_recipients(p_post_id uuid)`
    that encapsulates the friend/mutual/visibility/block logic (reusing the
    existing friend + mutual joins; cf. `get_friends_and_mutuals_of` used by
    `notify-hangs`).
- **Copy:** body = `"{author full_name} posted"`.
- **`data`:** `{ type: "post", postId, avatarUrl }`.

### 4. Invites refreshed — `invites-refreshed.ts`

- **Trigger:** `pg_cron`, `0 12 1 * *` (12:00 UTC on the 1st of each month),
  which `net.http_post`s to the `notify` function with body
  `{ "type": "invites_refreshed" }` and a service-role auth header (key from
  Vault). pg_cron + pg_net are available on Supabase.
- **Recipient:** users who created ≥1 `invite_codes` row in the **previous**
  calendar month (`inviter_id` of
  `created_at >= date_trunc('month', now()) - interval '1 month'` and
  `< date_trunc('month', now())`). These are the only users whose quota was
  actually spent, so they are the ones for whom "refreshed" is meaningful.
- **Copy:** body = `"Your invites have refreshed"`. No `{name}`, no avatar — this
  is a system notification.
- **`data`:** `{ type: "invites_refreshed" }`.

### 5. Comment — `comment.ts`

- **Trigger:** `AFTER INSERT ON public.comments`.
- **Recipient:** the post owner — `SELECT author_id FROM posts WHERE id = NEW.post_id`.
- **Skip self:** if `post.author_id = NEW.author_id`, no-op.
- **Actor:** `NEW.author_id` (commenter).
- **Copy:** body = `"{commenter full_name} commented on your post"`.
- **`data`:** `{ type: "comment", postId, commentId, avatarUrl }`.
- **Scope note:** notifies the **post owner** only. Notifying a parent-comment
  author on replies (`parent_comment_id`) is out of scope.

### 6. Post like — `like.ts`

- **Trigger:** `AFTER INSERT ON public.likes`.
- **Filter:** `post_id IS NOT NULL` (post likes only; comment likes are ignored).
- **Recipient:** the post owner — `SELECT author_id FROM posts WHERE id = NEW.post_id`.
- **Skip self:** if `post.author_id = NEW.user_id`, no-op.
- **Actor:** `NEW.user_id` (liker).
- **Copy:** body = `"{liker full_name} liked your post"`.
- **`data`:** `{ type: "like", postId, avatarUrl }`.

## Database wiring

Each webhook trigger follows the established pattern in
`20260615000001_add_new_message_push_webhook.sql` and
`20260615000002_codify_hangs_webhooks.sql`:

- An `AFTER INSERT` trigger calling `supabase_functions.http_request(...)` against
  the `notify` function URL, with the service-role JWT read from the Vault secret
  `service_role_key` (never hardcoded — cf. the webhooks-as-Vault-migrations
  pattern).
- Codified as new migrations under `supabase/migrations/`.
- The `pg_cron` job for #4 and the `get_post_notification_recipients` RPC are also
  migrations.

WHERE-style filtering (`status='pending'`, `invited_by IS NOT NULL`,
`post_id IS NOT NULL`) is applied in the resolver rather than the trigger where
the webhook helper makes per-row conditions awkward; the trigger fires broadly and
the resolver no-ops cheaply. (Final placement — trigger `WHEN` clause vs. resolver
guard — decided per-trigger during implementation for efficiency.)

## Client routing

Extend the single existing hook `hooks/usePushNotifications.ts`, which today
routes on `data.friendId` / `data.hangId`. Add a `type`→route map:

- `friend_request` → friend requests screen.
- `member_joined` → the new member's profile.
- `post` / `comment` / `like` → the post detail for `data.postId`.
- `invites_refreshed` → the invites screen.

Exact route paths are pinned against `expo-router` during implementation. The
foreground handler in `app/_layout.tsx` is left as-is (message-chat suppression is
the only foreground special-case and does not apply here).

## Testing strategy

- **Resolvers** are pure functions of the webhook record (plus a mockable DB
  client) → unit tests per resolver covering recipient resolution and copy,
  including the no-op paths (self-action, non-pending friendship, hang-carrier
  post, comment-like ignored). TDD these before implementation.
- **Engine** (`expo-push.ts`) — unit test `buildMessage` and the dead-token
  cleanup mapping; the Expo HTTP call is mocked.
- **Refactor safety** — the two existing functions must retain current behavior
  (message badge count, hang batching) after moving onto the shared engine;
  cover with the engine tests + a behavior check.
- Follows the existing `__tests__/rpc/` conventions; assert presence of data (no
  `?? []` masking — cf. project lesson on null-coalescing in tests).

## Open items to verify during implementation

1. Post + `hangs` row are inserted in one transaction (affects #3 hang exclusion).
2. Exact `expo-router` paths for the friend-requests, profile, post-detail, and
   invites screens.
3. `pg_cron` / `pg_net` are enabled on the project; confirm the cron-call auth
   path mirrors the Vault service-role pattern.
4. `profiles.full_name` is populated at the moment of the `profiles` INSERT (#2);
   if not, resolver fetches it fresh (already specified).
