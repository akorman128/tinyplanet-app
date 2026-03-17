import {
  useQuery,
  UseQueryResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { useRequireProfile } from "./useRequireProfile";
import { useSupabase } from "./useSupabase";
import { queryKeys } from "@/lib/queryKeys";
import { BlockUserInput, UnblockUserInput, BlockedUser } from "@/types/block";

export const useBlockUser = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BlockUserInput) => {
      if (profile.id === input.targetUserId)
        throw new Error("Cannot block yourself");

      const { error } = await supabase
        .from("blocks")
        .insert({ blocker_id: profile.id, blocked_id: input.targetUserId });
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.feed() });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.saved() });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.locations });
      queryClient.invalidateQueries({
        queryKey: queryKeys.friends.status(input.targetUserId),
      });
    },
  });
};

export const useUnblockUser = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UnblockUserInput) => {
      const { error } = await supabase
        .from("blocks")
        .delete()
        .eq("blocker_id", profile.id)
        .eq("blocked_id", input.targetUserId);
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.feed() });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.saved() });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.locations });
      queryClient.invalidateQueries({
        queryKey: queryKeys.friends.status(input.targetUserId),
      });
    },
  });
};

export const useGetBlockStatus = (
  targetUserId?: string
): UseQueryResult<{ isBlocked: boolean }> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.blocks.status(targetUserId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocks")
        .select("id")
        .eq("blocker_id", profile.id)
        .eq("blocked_id", targetUserId!)
        .maybeSingle();
      if (error) throw error;
      return { isBlocked: !!data };
    },
    enabled: !!targetUserId,
  });
};

export const useGetBlockedUsers = (): UseQueryResult<BlockedUser[]> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.blocks.list,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocks")
        .select(
          "blocked_id, created_at, profiles:profiles!blocks_blocked_id_fkey (id, full_name, avatar_url)"
        )
        .eq("blocker_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => {
        const p = row.profiles as {
          id: string;
          full_name: string;
          avatar_url: string | null;
        } | null;
        return {
          id: p?.id ?? (row.blocked_id as string),
          full_name: p?.full_name ?? "Unknown",
          avatar_url: p?.avatar_url ?? null,
          blocked_at: row.created_at as string,
        };
      });
    },
  });
};
