# Supabase types & the typed RPC boundary

The app talks to Postgres through Supabase RPCs (`supabase.rpc(...)`). Today the
client is created **without** a generated `Database` type, so every RPC returns
`any` and each call site casts the result by hand
(e.g. `data as PostWithAuthor[]`, `data as unknown as MessageWithSender[]`).
Those casts are invisible to the compiler: if a DB function changes shape, the
build still passes and the bug only shows up at runtime.

This doc explains how to close that gap in three steps:

1. Generate real DB types from the linked Supabase project.
2. Wire those types into the Supabase client (`createClient<Database>`).
3. Adopt `typedRpc` (in `lib/rpc.ts`) so hooks drop their manual casts.

You can do these incrementally — `lib/rpc.ts` already gives you typed RPC
results **before** the generated types exist, by overlaying a hand-maintained
`RpcReturns` map.

---

## 1. Generate the database types

Generation requires the Supabase CLI and a project that the CLI is "linked" to.

```bash
# One-time: link this repo to the remote Supabase project.
# You'll be prompted for the project ref (Dashboard → Project Settings → General).
supabase link

# Generate types into types/database.types.ts
npm run gen:types
```

The `gen:types` script is defined in `package.json`:

```json
"gen:types": "supabase gen types typescript --linked > types/database.types.ts"
```

It writes a `Database` type describing every table, view, enum, and **function**
(RPC) in the `public` schema, including each function's `Args` and `Returns`.

Re-run `npm run gen:types` whenever you change a migration so the types stay in
sync with the schema. Commit the regenerated `types/database.types.ts`.

> Prerequisites: the Supabase CLI installed (`brew install supabase/tap/supabase`
> or `npx supabase ...`) and authenticated (`supabase login`). The CLI needs
> network access, so this cannot be run in sandboxed/offline environments.

---

## 2. Wire `Database` into the client

The client is created in `providers/supabase-provider.tsx`:

```ts
import { createClient, processLock } from "@supabase/supabase-js";
// ...
const supabase = useMemo(
  () => createClient(supabaseUrl, supabaseKey, { /* ...options... */ }),
  [supabaseUrl, supabaseKey]
);
```

After generating types, parameterize `createClient` with the `Database` type:

```ts
import { createClient, processLock } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
// ...
const supabase = useMemo(
  () => createClient<Database>(supabaseUrl, supabaseKey, { /* ...options... */ }),
  [supabaseUrl, supabaseKey]
);
```

Also widen the client type used elsewhere. `hooks/useSupabase.ts` and
`context/supabase-context` currently use the untyped `SupabaseClient`; switch
them to `SupabaseClient<Database>` so RPC/table calls are typed end-to-end.

With this in place, `supabase.rpc("get_feed_posts", ...)` is type-checked: the
function name must exist, the args are validated, and `data` is typed from the
schema — no cast needed.

---

## 3. Adopt `typedRpc` to remove the `as X` casts

`lib/rpc.ts` provides a thin wrapper, `typedRpc(supabase, name, args)`, that
returns `{ data: RpcReturns[name] | null, error }`. It works **today** (no
generated types required) by mapping each RPC name to a return type drawn from
`types/`.

Migration is mechanical — replace the call and delete the trailing cast:

```ts
// Before
const { data: posts, error } = await supabase.rpc("get_feed_posts", {
  user_id_param: profileState!.id,
  limit_param: PAGE_SIZE,
  offset_param: pageParam,
});
if (error) throw error;
return (posts as PostWithAuthor[]) || [];

// After
import { typedRpc } from "@/lib/rpc";

const { data: posts, error } = await typedRpc(supabase, "get_feed_posts", {
  user_id_param: profileState!.id,
  limit_param: PAGE_SIZE,
  offset_param: pageParam,
});
if (error) throw error;
return posts || []; // already PostWithAuthor[] | null
```

For RPCs that return an array but are consumed as a single row (the type map
preserves the array shape), keep the `[0]` access and drop only the cast:

```ts
const { data, error } = await typedRpc(supabase, "get_profile", {
  p_user_id: userId,
  p_current_user_id: currentUserId,
});
if (error) throw error;
return data?.[0]; // Profile | undefined — no cast
```

### Call sites to migrate

These currently cast RPC results and should be converted to `typedRpc`
(remove the corresponding `as X` / `as unknown as X`):

| File | RPC | Current cast |
| --- | --- | --- |
| `hooks/useFeed.ts` | `get_feed_posts` | `as PostWithAuthor[]` |
| `hooks/useFeed.ts` | `get_user_posts` | `as PostWithAuthor[]` |
| `hooks/useSavedPosts.ts` | `get_saved_posts` | `as PostWithAuthor[]` |
| `hooks/useMessageChannels.ts` | `get_message_channels` | `as MessageChannel[]` |
| `hooks/useMessageChannels.ts` | `has_unread_messages` | `as boolean` |
| `hooks/useProfile.ts` | `get_profile` | `data[0]` (array) |
| `hooks/useContacts.ts` | `get_contacts_ordered` | `as Contact[]` |
| `hooks/useFriends.ts` | `get_friend_locations` | inline `loc` typing |
| `hooks/useFriends.ts` | `get_mutual_locations_with_connections` | inline `loc` typing |
| `hooks/useFriends.ts` | `get_friend_hometown_locations` | `as HometownLocationRow[]` |
| `hooks/useFriends.ts` | `search_friends` | `as Friend[]` |
| `hooks/useFriends.ts` | `get_mutual_friends_between_users` | `as Friend[]` |
| `hooks/useFriends.ts` | `get_platform_statistics` | `data?.[0]` (array) |
| `hooks/useVibe.ts` | `get_top_vibes` | inline `TopVibeItem` typing |
| `hooks/useLists.ts` | `get_list_places_with_coordinates` | `as ListPlace[]` |
| `hooks/useLists.ts` | `get_lists_with_places` | `as ListWithPlacesRow[]` |
| `hooks/useLists.ts` | `get_viewable_list_locations` | `as ListLocationRow[]` |
| `hooks/useTravelPlan.ts` | `create_travel_plan_with_post` | `data[0] as CreateTravelPlanOutput` |
| `hooks/useTravelPlan.ts` | `update_travel_plan_with_post` | `data[0] as CreateTravelPlanOutput` |
| `hooks/useTravelPlan.ts` | `get_active_travel_plan_locations` | `as TravelPlanMapLocation[]` |
| `hooks/useTravelPlan.ts` | `get_travel_plan_by_post_id` | `data[0] as TravelPlanWithCoordinates` |
| `hooks/useIntros.ts` | `create_intro` | `data as string` |

> `cancel_travel_plan_with_post` is in the map as `unknown` (no payload used).
> The `messages` reads in `hooks/useChat.ts` go through the query builder
> (`.from("messages").select(...)`), **not** `rpc`, so they are not covered by
> `typedRpc`; they are fixed by step 2 (`createClient<Database>`) instead.

### Keeping `lib/rpc.ts` honest

Once `types/database.types.ts` exists, the `RpcReturns` entries in `lib/rpc.ts`
can be progressively replaced with
`Database["public"]["Functions"]["<name>"]["Returns"]` and the inline `*Row`
helper interfaces deleted. At that point the hand-maintained map becomes a
generated, always-correct boundary.
