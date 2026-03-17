import { useQuery, UseQueryResult, useMutation, useQueryClient } from "@tanstack/react-query";

import { useRequireProfile } from "./useRequireProfile";
import { useSupabase } from "./useSupabase";
import { queryKeys } from "@/lib/queryKeys";
import {
  GetFriendsOutput,
  GetFriendsOfFriendsOutput,
  SendFriendRequestInput,
  SendFriendRequestOutput,
  AcceptFriendRequestInput,
  AcceptFriendRequestOutput,
  DeclineFriendRequestInput,
  UnfriendInput,
  CreateFriendInput,
  CreateFriendOutput,
  FriendshipWithProfiles,
  Friend,
  FriendshipStatus,
  FriendshipDisplayStatus,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  SearchFriendsOutput,
  GetPendingRequestsOutput,
  PendingRequest,
  PlatformStatisticsOutput,
} from "@/types/friendship";

// --- Helpers ---

const orderUserIds = (userId1: string, userId2: string): [string, string] => {
  return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
};

const validateFriendRequest = (currentUserId: string, targetUserId: string): void => {
  if (currentUserId === targetUserId) throw new Error("Cannot send friend request to yourself");
};

// --- Mutation hooks ---

export const useSendFriendRequest = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendFriendRequestInput): Promise<SendFriendRequestOutput> => {
      const { targetUserId } = input;
      const userId = profile.id;
      validateFriendRequest(userId, targetUserId);
      const [user_a, user_b] = orderUserIds(userId, targetUserId);

      const { data: insertData, error: insertError } = await supabase
        .from("friendships")
        .insert({ user_a, user_b, requested_by: userId, status: FriendshipStatus.PENDING, accepted_at: null })
        .select()
        .single();

      if (!insertError) return { data: insertData };

      if (insertError.code === "23505") {
        const { data: updateData, error: updateError } = await supabase
          .from("friendships")
          .update({ requested_by: userId, status: FriendshipStatus.PENDING, accepted_at: null })
          .or(`and(user_a.eq.${user_a},user_b.eq.${user_b}),and(user_a.eq.${user_b},user_b.eq.${user_a})`)
          .select()
          .maybeSingle();

        if (updateError) throw new Error("A friendship record already exists but cannot be updated.");
        if (!updateData) throw new Error("A friendship request already exists between you and this user.");
        return { data: updateData };
      }

      throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
};

export const useAcceptFriendRequest = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AcceptFriendRequestInput): Promise<AcceptFriendRequestOutput> => {
      const { fromUserId } = input;
      const [user_a, user_b] = orderUserIds(profile.id, fromUserId);

      const { data, error } = await supabase
        .from("friendships")
        .update({ status: FriendshipStatus.ACCEPTED, accepted_at: new Date().toISOString() })
        .eq("user_a", user_a)
        .eq("user_b", user_b)
        .eq("status", FriendshipStatus.PENDING)
        .select()
        .single();

      if (error) throw error;
      return { data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
};

export const useDeclineFriendRequest = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeclineFriendRequestInput) => {
      const [user_a, user_b] = orderUserIds(profile.id, input.targetUserId);
      const { error } = await supabase
        .from("friendships")
        .update({ status: FriendshipStatus.DECLINED })
        .eq("user_a", user_a)
        .eq("user_b", user_b)
        .eq("status", FriendshipStatus.PENDING);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
};

export const useUnfriend = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UnfriendInput) => {
      const [user_a, user_b] = orderUserIds(profile.id, input.targetUserId);
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("user_a", user_a)
        .eq("user_b", user_b)
        .eq("status", FriendshipStatus.ACCEPTED);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
};

export const useCreateFriend = () => {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFriendInput): Promise<CreateFriendOutput> => {
      const { currentUserId, targetUserId } = input;
      validateFriendRequest(currentUserId, targetUserId);
      const [user_a, user_b] = orderUserIds(currentUserId, targetUserId);

      const { data, error } = await supabase
        .from("friendships")
        .insert({ user_a, user_b, requested_by: targetUserId, status: FriendshipStatus.ACCEPTED, accepted_at: new Date().toISOString() })
        .select()
        .single();

      if (error) throw error;
      return { data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
};

// --- Query hooks ---

export const useGetFriends = (userId?: string): UseQueryResult<GetFriendsOutput> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const id = userId ?? profile.id;

  return useQuery({
    queryKey: queryKeys.friends.list(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friendships")
        .select(`id, user_a, user_b, status,
          a:profiles!friendships_user_a_fkey (id, full_name, avatar_url, website, hometown, birthday, location),
          b:profiles!friendships_user_b_fkey (id, full_name, avatar_url, website, hometown, birthday, location)`)
        .or(`user_a.eq.${id},user_b.eq.${id}`)
        .eq("status", FriendshipStatus.ACCEPTED);
      if (error) throw error;
      const friends = ((data as unknown as FriendshipWithProfiles[]) ?? [])
        .map((row) => (row.user_a === id ? row.b : row.a))
        .filter((friend): friend is Friend => friend !== null);
      return { data: friends };
    },
  });
};

export const useGetFriendsOfFriends = (): UseQueryResult<GetFriendsOfFriendsOutput> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.friends.friendsOfFriends,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friends_of_friends_profiles_v")
        .select("id, full_name, avatar_url, website, location")
        .eq("user_id", profile.id);
      if (error) throw error;
      return { data: (data as Friend[]) ?? [] };
    },
  });
};

export const useGetFriendLocations = (): UseQueryResult<GeoJSONFeatureCollection> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.friends.locations,
    queryFn: async () => {
      const userId = profile.id;
      const [{ data: friends, error: friendsError }, { data: mutuals, error: mutualsError }] = await Promise.all([
        supabase.rpc("get_friend_locations", { p_user_id: userId }),
        supabase.rpc("get_mutual_locations_with_connections", { p_user_id: userId }),
      ]);
      if (friendsError) throw friendsError;
      if (mutualsError) throw mutualsError;

      const allLocations = [...(friends || []), ...(mutuals || [])];
      const features: GeoJSONFeature[] = allLocations.map((loc) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [loc.longitude, loc.latitude] },
        properties: { id: loc.id, name: loc.full_name, type: loc.type as "friend" | "mutual", avatar_url: loc.avatar_url, connecting_friend_id: loc.connecting_friend_id },
      }));

      return { type: "FeatureCollection" as const, features };
    },
  });
};

export const useGetFriendHometownLocations = (): UseQueryResult<GeoJSONFeatureCollection> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.friends.hometownLocations,
    queryFn: async () => {
      interface HometownLocationRow {
        id: string;
        full_name: string;
        type: string;
        avatar_url: string | null;
        latitude: number;
        longitude: number;
        hometown_name: string;
      }
      const { data: rawData, error } = await supabase.rpc("get_friend_hometown_locations", { p_user_id: profile.id });
      if (error) throw error;
      const data = (rawData || []) as HometownLocationRow[];

      const features: GeoJSONFeature[] = data.map((loc) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [loc.longitude, loc.latitude] },
        properties: { id: loc.id, name: loc.full_name, type: loc.type as "friend_hometown" | "mutual_hometown", avatar_url: loc.avatar_url ?? undefined, hometown_name: loc.hometown_name },
      }));

      return { type: "FeatureCollection" as const, features };
    },
  });
};

export const useSearchFriends = (query?: string): UseQueryResult<SearchFriendsOutput> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.friends.search(query!),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_friends", { p_user_id: profile.id, p_query: query! });
      if (error) throw error;
      return { data: (data as Friend[]) ?? [] };
    },
    enabled: !!query && query.length > 0,
  });
};

export const useGetFriendshipStatus = (targetUserId?: string): UseQueryResult<{ status: FriendshipDisplayStatus }> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.friends.status(targetUserId!),
    queryFn: async () => {
      const userId = profile.id;
      const [user_a, user_b] = orderUserIds(userId, targetUserId!);
      const { data: friendship, error } = await supabase
        .from("friendships")
        .select("status, requested_by")
        .eq("user_a", user_a)
        .eq("user_b", user_b)
        .maybeSingle();
      if (error) throw error;
      if (!friendship) return { status: FriendshipDisplayStatus.NOT_FRIENDS };
      if (friendship.status === FriendshipStatus.ACCEPTED) return { status: FriendshipDisplayStatus.FRIENDS };
      if (friendship.status === FriendshipStatus.PENDING) {
        return {
          status: friendship.requested_by === userId
            ? FriendshipDisplayStatus.PENDING_SENT
            : FriendshipDisplayStatus.PENDING_RECEIVED,
        };
      }
      return { status: FriendshipDisplayStatus.NOT_FRIENDS };
    },
    enabled: !!targetUserId,
  });
};

export const useGetPendingRequests = (): UseQueryResult<GetPendingRequestsOutput> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.friends.pending,
    queryFn: async () => {
      const userId = profile.id;
      const { data, error } = await supabase
        .from("friendships")
        .select(`id, user_a, user_b, status, requested_by, created_at,
          a:profiles!friendships_user_a_fkey (id, full_name, avatar_url, website, hometown, birthday, location),
          b:profiles!friendships_user_b_fkey (id, full_name, avatar_url, website, hometown, birthday, location)`)
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .eq("status", FriendshipStatus.PENDING);
      if (error) throw error;

      const friendships = (data as unknown as FriendshipWithProfiles[]) ?? [];
      const incoming: PendingRequest[] = [];
      const outgoing: PendingRequest[] = [];

      friendships.forEach((f) => {
        const isIncoming = f.requested_by !== userId;
        const otherUser = f.user_a === userId ? f.b : f.a;
        if (!otherUser) return;
        const request: PendingRequest = { ...otherUser, direction: isIncoming ? "incoming" : "outgoing", created_at: f.created_at };
        if (isIncoming) incoming.push(request);
        else outgoing.push(request);
      });

      return { incoming, outgoing };
    },
  });
};

export const useGetMutualsBetweenUsers = (targetUserId?: string): UseQueryResult<Friend[]> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.friends.mutuals(targetUserId!),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_mutual_friends_between_users", {
        p_user_id: profile.id,
        p_target_user_id: targetUserId!,
      });
      if (error) throw error;
      return (data as Friend[]) ?? [];
    },
    enabled: !!targetUserId,
  });
};

export const useGetPlatformStatistics = (): UseQueryResult<PlatformStatisticsOutput> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.friends.platformStats,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_platform_statistics", { p_user_id: profile.id });
      if (error) throw error;
      return { data: data?.[0] || { total_users: 0, connections_count: 0 } };
    },
  });
};
