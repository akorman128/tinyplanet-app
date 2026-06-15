import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type { Contact } from "@/types/contact";
import type { Friend, PlatformStatistics } from "@/types/friendship";
import type { ListPlace } from "@/types/list";
import type { MessageChannel } from "@/types/messageChannel";
import type { PostWithAuthor } from "@/types/post";
import type { Profile } from "@/types/profile";
import type {
  CreateTravelPlanOutput,
  TravelPlanMapLocation,
  TravelPlanWithCoordinates,
} from "@/types/travelPlan";
import type {
  CreateHangOutput,
  HangDetail,
  HangMapLocation,
} from "@/types/hang";

/**
 * Typed boundary for Supabase RPC (Postgres function) calls.
 *
 * The Supabase client in this app is created without a generated `Database`
 * type (see `providers/supabase-provider.tsx`), so `supabase.rpc(...)` returns
 * `any` and every call site casts the result by hand
 * (e.g. `data as PostWithAuthor[]`). Those casts are scattered across hooks and
 * silently rot when a DB function's shape changes.
 *
 * `typedRpc` centralizes the cast in ONE place: the `RpcReturns` map below is
 * the single source of truth for "what each RPC returns". When you regenerate
 * `types/database.types.ts` (see `docs/SUPABASE_TYPES.md`) you can tighten or
 * delete entries here and every consumer updates at once.
 *
 * NOTE: This is intentionally a thin wrapper. It does not run the query
 * differently from `supabase.rpc(...)`; it only attaches the return type. The
 * mapped types are hand-maintained and only as correct as the SQL behind them.
 */

/**
 * Shapes that an RPC may return but that don't have a dedicated type in
 * `types/`. Inlined here so callers still get structural safety. Once the
 * generated `Database` types exist these can be replaced by
 * `Database['public']['Functions'][...]['Returns']`.
 */

/** Row of `get_friend_locations` / `get_mutual_locations_with_connections`. */
export interface FriendLocationRow {
  id: string;
  full_name: string;
  type: string;
  avatar_url: string | null;
  latitude: number;
  longitude: number;
  /** Present only on mutual-location rows. */
  connecting_friend_id?: string;
}

/** Row of `get_friend_hometown_locations`. */
export interface FriendHometownLocationRow {
  id: string;
  full_name: string;
  type: string;
  avatar_url: string | null;
  latitude: number;
  longitude: number;
  hometown_name: string;
}

/** Row of `get_lists_with_places` (flattened list + embedded places + count). */
export interface ListWithPlacesRow {
  id: string;
  user_id: string;
  title: string;
  category: string;
  location_name: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  longitude: number | null;
  latitude: number | null;
  places: ListPlace[];
  total_count: number;
}

/** Row of `get_viewable_list_locations`. */
export interface ViewableListLocationRow {
  id: string;
  title: string;
  category: string;
  location_name: string;
  longitude: number;
  latitude: number;
  owner_name: string;
}

/** Row of `get_top_vibes`. */
export interface TopVibeRow {
  emoji: string;
  count: number;
}

/**
 * Map of RPC function name -> return type.
 *
 * Functions are mapped from the existing types in `types/` wherever the shape
 * could be determined confidently from the call site. Functions whose return
 * shape is not yet modeled fall back to `unknown`, which forces a deliberate
 * narrowing at the call site rather than a silent `any`.
 *
 * Several RPCs return an ARRAY even when the caller treats it as a single row
 * (e.g. `get_profile` -> `data[0]`); the array shape is preserved here so the
 * type matches what Postgres actually sends back.
 */
export interface RpcReturns {
  // --- Posts (hooks/useFeed.ts, hooks/useSavedPosts.ts) ---
  get_feed_posts: PostWithAuthor[];
  get_user_posts: PostWithAuthor[];
  get_saved_posts: PostWithAuthor[];

  // --- Messages (hooks/useMessageChannels.ts) ---
  get_message_channels: MessageChannel[];
  has_unread_messages: boolean;

  // --- Profile (hooks/useProfile.ts) -- RPC returns an array; caller reads [0]
  get_profile: Profile[];

  // --- Contacts (hooks/useContacts.ts) ---
  get_contacts_ordered: Contact[];

  // --- Friends (hooks/useFriends.ts) ---
  get_friend_locations: FriendLocationRow[];
  get_mutual_locations_with_connections: FriendLocationRow[];
  get_friend_hometown_locations: FriendHometownLocationRow[];
  search_friends: Friend[];
  get_mutual_friends_between_users: Friend[];
  /** Returns an array; caller reads [0]. */
  get_platform_statistics: PlatformStatistics[];

  // --- Vibes (hooks/useVibe.ts) ---
  get_top_vibes: TopVibeRow[];

  // --- Lists (hooks/useLists.ts) ---
  get_list_places_with_coordinates: ListPlace[];
  get_lists_with_places: ListWithPlacesRow[];
  get_viewable_list_locations: ViewableListLocationRow[];

  // --- Travel plans (hooks/useTravelPlan.ts) ---
  /** Returns an array; caller reads [0]. */
  create_travel_plan_with_post: CreateTravelPlanOutput[];
  /** Returns an array; caller reads [0]. */
  update_travel_plan_with_post: CreateTravelPlanOutput[];
  cancel_travel_plan_with_post: unknown;
  get_active_travel_plan_locations: TravelPlanMapLocation[];
  /** Returns an array; caller reads [0]. */
  get_travel_plan_by_post_id: TravelPlanWithCoordinates[];

  // --- Intros (hooks/useIntros.ts) -- returns the new intro id as a string ---
  create_intro: string;

  // --- Hangs (hooks/useHangs.ts) ---
  /** Returns an array; caller reads [0]. */
  create_hang_with_post: CreateHangOutput[];
  /** Returns an array; caller reads [0]. */
  update_hang_with_post: CreateHangOutput[];
  delete_hang_with_post: unknown;
  /** Returns an array; caller reads [0]. */
  get_hang_detail: HangDetail[];
  get_active_hang_locations: HangMapLocation[];
}

/** Name of an RPC that has an entry in {@link RpcReturns}. */
export type KnownRpcName = keyof RpcReturns;

/** Return type for a known RPC, or `unknown` for everything else. */
export type RpcReturn<Name extends string> = Name extends KnownRpcName
  ? RpcReturns[Name]
  : unknown;

export interface TypedRpcResult<Name extends string> {
  data: RpcReturn<Name> | null;
  error: PostgrestError | null;
}

/**
 * Call a Supabase RPC and get back a typed `{ data, error }` result.
 *
 * Thin wrapper over `supabase.rpc(name, args)` whose only job is to attach the
 * return type from {@link RpcReturns}. The underlying client is the existing
 * untyped `SupabaseClient`, so this does not require generated DB types to
 * compile — it overlays the hand-maintained `RpcReturns` map instead.
 *
 * @example
 * // Before (hooks/useFeed.ts):
 * const { data: posts, error } = await supabase.rpc("get_feed_posts", {
 *   user_id_param: profileState!.id,
 *   limit_param: PAGE_SIZE,
 *   offset_param: pageParam,
 * });
 * if (error) throw error;
 * return (posts as PostWithAuthor[]) || [];
 *
 * @example
 * // After: no cast — `posts` is already `PostWithAuthor[] | null`.
 * const { data: posts, error } = await typedRpc(supabase, "get_feed_posts", {
 *   user_id_param: profileState!.id,
 *   limit_param: PAGE_SIZE,
 *   offset_param: pageParam,
 * });
 * if (error) throw error;
 * return posts || [];
 */
export async function typedRpc<Name extends string>(
  supabase: SupabaseClient,
  name: Name,
  args?: Record<string, unknown>
): Promise<TypedRpcResult<Name>> {
  const { data, error } = await supabase.rpc(name, args);
  return {
    data: (data ?? null) as RpcReturn<Name> | null,
    error,
  };
}
