# Push Notifications

> **IMPORTANT**: When adding, removing, or changing a push notification, update this file — it is the single source of truth for every push the app sends and when it fires.

This document catalogs every push notification Tiny Planet sends, the exact event that triggers it, who receives it, the copy the user sees, and where the code lives.

## How notifications work

All push notifications are sent **server-side** via the [Expo Push API](https://exp.host/--/api/v2/push/send) from Supabase Edge Functions. There is no client-side scheduling.

```
DB INSERT / pg_cron  ──webhook/cron──►  Edge Function  ──►  Expo Push API  ──►  device
   (trigger fires)                      (resolves recipients,                  (APNs/FCM)
                                         builds message, sends)
```

- **Event-driven (5 + 3 existing):** a Postgres `AFTER INSERT` trigger calls `supabase_functions.http_request(...)`, POSTing the new row to an edge function. The service-role JWT in the trigger header is read from the Vault secret `service_role_key` (never hard-coded), so the migrations are a **no-op in local/CI** where that secret is absent.
- **Schedule-driven (1):** `pg_cron` calls the dispatcher monthly via `net.http_post`.
- **Engine:** `supabase/functions/_shared/expo-push.ts` holds the reusable send logic (token fetch, 100/batch Expo send, dead-token cleanup, `buildMessage`, `deliver`). Dead tokens (`DeviceNotRegistered`) are deleted automatically.
- **Dispatcher:** `supabase/functions/notify/index.ts` branches on the webhook `table` (or cron `type`) into a small pure **resolver** per notification (`supabase/functions/notify/resolvers/*`). The two older functions (`send-push-notification`, `notify-hangs`) reuse the same engine.
- **Tap routing:** every notification's `data` payload carries a `type` discriminator; `hooks/usePushNotifications.ts` routes the tap to the right screen. (The three pre-existing notifications predate the `type` field and route on `data.friendId` / `data.hangId` instead.)
- **Avatars:** each resolver threads the actor's `avatarUrl` into `data`, but rich images are **not rendered yet** (text-only) — enabling them is a future change (Android image fields + an iOS Notification Service Extension).

`{name}` below is the acting user's `profiles.full_name`, falling back to `"Someone"`.

## Notification catalog

| Notification | Fires when | Recipient | Title / Body | `data` | Tap → |
|---|---|---|---|---|---|
| **Friend request** | A pending friendship is created (`friendships` INSERT, `status = 'pending'`) | The user who is **not** `requested_by` | `{name}` / `{name} requested to be friends` | `type: friend_request`, `requesterId`, `avatarUrl` | `/friends` |
| **Member joined** | An **invited** user signs up (`profiles` INSERT, `invited_by IS NOT NULL`) | The inviter (`invited_by`) | `{name}` / `{name} joined your planet` | `type: member_joined`, `memberId`, `avatarUrl` | `/profile?userId=` |
| **New post** | A post is published (`posts` INSERT) that is **not** a Hang carrier | Author's friends + mutuals, bounded by post visibility, minus blocked | `{name}` / `{name} posted` | `type: post`, `postId`, `avatarUrl` | `/comments?postId=` |
| **Comment** | Someone comments on a post (`comments` INSERT) | The post owner (skipped if commenting on own post) | `{name}` / `{name} commented on your post` | `type: comment`, `postId`, `commentId`, `avatarUrl` | `/comments?postId=` |
| **Like** | Someone likes a **post** (`likes` INSERT, `post_id IS NOT NULL`) | The post owner (skipped on self-like) | `{name}` / `{name} liked your post` | `type: like`, `postId`, `avatarUrl` | `/comments?postId=` |
| **Invites refreshed** | Monthly, 1st at 12:00 UTC (`pg_cron`) | Users who created ≥1 invite in the **previous** calendar month | `Tiny Planet` / `Your invites have refreshed` | `type: invites_refreshed` | `/friends` |
| **New message** *(pre-existing)* | A direct message is sent (`messages` INSERT) | The recipient (non-sender); sets app badge to unread count | `{sender}` / first 100 chars of the message | `friendId: <sender>` | `/chat/<friendId>` |
| **Hang created** *(pre-existing)* | A Hang is created (`hangs` INSERT) | Host's friends + mutuals, minus blocked | `{host}` / `{host} created a Hang: {title}` | `hangId` | `/hang/[hangId]` |
| **Hang RSVP** *(pre-existing)* | Someone RSVPs to a Hang (`hang_attendees` INSERT) | The Hang host (skipped on the host's own auto-RSVP) | `New RSVP` / `{attendee} is going to your Hang.` | `hangId` | `/hang/[hangId]` |

## Trigger details & filters

### Friend request
- Trigger `notify_friend_request` on `public.friendships`, `WHEN (new.status = 'pending')`. The `WHEN` clause skips the auto-accepted friendship created at invite-signup (which inserts `status = 'accepted'`), so signing up via an invite fires **Member joined**, not a friend request.
- Recipient = the participant who did not initiate: `requested_by === user_a ? user_b : user_a`.

### Member joined
- Trigger `notify_member_joined` on `public.profiles`, `WHEN (new.invited_by IS NOT NULL)`.
- Recipient = the inviter. The invitee also auto-becomes the inviter's friend at signup, so one signal (`invited_by`) covers "a person I invited joined."

### New post
- Trigger `notify_new_post` on `public.posts` (no `WHEN` clause — fires on every post).
- The resolver **excludes Hang-carrier posts**: it skips the notification if a `hangs` row references the post (Hangs send their own "Hang created" push). Post + Hang are inserted in one transaction (`create_hang_with_post`), so the `hangs` row is visible when the post-commit webhook runs.
- **Audience** comes from `get_post_notification_recipients(p_post_id)`:
  - `visibility = 'friends'` → the author's accepted friends only
  - `visibility = 'mutuals'` or `'public'` → friends **+ mutuals** (public is intentionally capped at mutuals — it is **not** a broadcast to everyone)
  - always excludes the author and any blocked relationship (symmetric `is_blocked`)

### Comment
- Trigger `notify_comment` on `public.comments` (no `WHEN`).
- Recipient = the post owner (`posts.author_id` for the comment's `post_id`). **Skips self** (no push when you comment on your own post). Replies to a comment notify only the post owner, not the parent commenter.

### Like
- Trigger `notify_like` on `public.likes`, `WHEN (new.post_id IS NOT NULL)` — comment likes are ignored (the resolver also re-checks). Recipient = the post owner; **skips self-like**.

### Invites refreshed
- `pg_cron` job `invites-refreshed-monthly`, schedule `0 12 1 * *` (12:00 UTC on the 1st), `net.http_post`s `{"type":"invites_refreshed"}` to the dispatcher, reading the service-role JWT from Vault at run time.
- Audience = `get_invite_refresh_recipients()` — distinct inviters who created ≥1 `invite_codes` row in the previous calendar month (the users whose monthly invite quota just reset). This is the only notification with no actor and no avatar.

### Hang created / Hang RSVP / New message *(pre-existing)*
- Hang recipients come from `get_hang_notification_recipients(p_host_id)` (friends + mutuals, block-filtered).
- New message sets the app badge from `get_total_unread_count` and truncates the body to 100 characters. It is suppressed in the foreground when the user is already viewing that chat (`app/_layout.tsx`).

## Source map

| Concern | Location |
|---|---|
| Send engine | `supabase/functions/_shared/expo-push.ts` |
| Dispatcher | `supabase/functions/notify/index.ts` |
| Resolvers | `supabase/functions/notify/resolvers/{friend-request,member-joined,new-post,comment,like,invites-refreshed}.ts` |
| Existing functions | `supabase/functions/{send-push-notification,notify-hangs}/index.ts` |
| Webhook triggers | `supabase/migrations/20260623000010`–`14` (new), `20260615000001`–`02` (message + hangs) |
| Audience RPCs | `get_post_notification_recipients` (`…000001`), `get_invite_refresh_recipients` (`…000003`), `get_hang_notification_recipients` (`…000017`), `get_friends_and_mutuals_of` (`…000002` fix) |
| Cron | `supabase/migrations/20260623000016_invites_refreshed_cron.sql` |
| Client registration + tap routing | `hooks/usePushNotifications.ts` |

## Operational notes

- **Vault secret:** webhook triggers and the cron require the Vault secret `service_role_key` on the project (`select vault.create_secret('<KEY>', 'service_role_key')`). Absent it, the trigger/cron migrations no-op — expected in local/CI.
- **Extensions:** the invites-refreshed cron requires `pg_cron` **and** `pg_net` enabled on the project (Dashboard → Database → Extensions). The migration is gated on `pg_cron` and no-ops without it.
- **No notification preferences yet:** there is no per-user opt-out; the dispatcher is the natural place to add one.
- **No debouncing:** every like and comment sends its own push (no coalescing).
