import { useMutation, useQuery, UseQueryResult, useQueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";

import {
  Vibe,
  GetVibesDto,
  GetVibesOutputDto,
  VibeWithSender,
  GetVibesWithSenderOutputDto,
} from "../types/vibe";
import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import { queryKeys } from "@/lib/queryKeys";

// --- Types ---

interface CreateVibeDto {
  receiverId?: string | null;
  emojis: string[];
  inviteCodeId?: string;
}

interface CreateVibeOutputDto {
  data: Vibe;
}

interface DeleteVibeDto {
  receiverId: string;
  giverId: string;
}

interface UpdateVibeDto {
  vibeId: string;
  receiverId?: string;
  emojis?: string[];
  inviteCodeId?: string;
}

export interface GetTopVibesDto {
  userId: string;
  limit?: number;
}

export interface TopVibeItem {
  emoji: string;
  count: number;
}

export interface GetTopVibesOutputDto {
  data: TopVibeItem[];
  totalCount: number;
}

// --- Mutation hooks ---

export const useCreateVibe = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateVibeDto): Promise<CreateVibeOutputDto> => {
      const { receiverId, emojis, inviteCodeId } = input;

      const vibeData: {
        giver_id: string;
        receiver_id?: string;
        emojis: string[];
        invite_code_id?: string;
      } = {
        giver_id: profile.id,
        receiver_id: receiverId ?? undefined,
        emojis,
      };

      if (inviteCodeId) {
        vibeData.invite_code_id = inviteCodeId;
      }

      const { data, error } = await supabase
        .from("vibes")
        .insert(vibeData)
        .select()
        .single();

      if (error) throw error;
      return { data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vibes.all });
    },
  });
};

export const useDeleteVibe = () => {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteVibeDto) => {
      const { receiverId, giverId } = input;
      const { error } = await supabase
        .from("vibes")
        .delete()
        .eq("receiver_id", receiverId)
        .eq("giver_id", giverId)
        .select()
        .single();

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vibes.all });
    },
  });
};

export const useUpdateVibe = () => {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateVibeDto) => {
      const { vibeId, receiverId, emojis, inviteCodeId } = input;

      if (emojis && emojis.length !== 3) {
        throw new Error("Vibe must have exactly 3 emojis");
      }

      const updateData: {
        receiver_id?: string;
        emojis?: string[];
        invite_code_id?: string;
      } = {};

      if (receiverId !== undefined) updateData.receiver_id = receiverId;
      if (emojis !== undefined) updateData.emojis = emojis;
      if (inviteCodeId !== undefined) updateData.invite_code_id = inviteCodeId;

      const { error } = await supabase
        .from("vibes")
        .update(updateData)
        .eq("id", vibeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vibes.all });
    },
  });
};

// --- Standalone fetch for imperative consumers ---

export async function fetchVibes(
  supabase: SupabaseClient,
  input: GetVibesDto = {}
): Promise<GetVibesOutputDto> {
  const { recipientId, giverId, inviteCodeId } = input;
  let query = supabase.from("vibes").select("*");
  if (recipientId) query = query.eq("receiver_id", recipientId);
  if (giverId) query = query.eq("giver_id", giverId);
  if (inviteCodeId) query = query.eq("invite_code_id", inviteCodeId);
  const { data, error } = await query;
  if (error) throw error;
  return { data };
}

// --- Query hooks ---

export const useGetVibes = (recipientId?: string): UseQueryResult<GetVibesOutputDto> => {
  const { supabase } = useSupabase();
  return useQuery({
    queryKey: queryKeys.vibes.byRecipient(recipientId!),
    queryFn: () => fetchVibes(supabase, { recipientId: recipientId! }),
    enabled: !!recipientId,
  });
};

export const useGetVibesWithSenderInfo = (recipientId?: string): UseQueryResult<GetVibesWithSenderOutputDto> => {
  const { supabase } = useSupabase();
  return useQuery({
    queryKey: queryKeys.vibes.withSenderInfo(recipientId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vibes")
        .select("*, giver:profiles!giver_id(id, full_name, avatar_url)")
        .eq("receiver_id", recipientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { data: data as VibeWithSender[] };
    },
    enabled: !!recipientId,
  });
};

export const useGetTopVibes = (userId?: string, limit: number = 5): UseQueryResult<GetTopVibesOutputDto> => {
  const { supabase } = useSupabase();
  return useQuery({
    queryKey: queryKeys.vibes.top(userId!),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_top_vibes", {
        p_user_id: userId!,
        p_limit: limit,
      });
      if (error) throw error;
      const totalCount = data?.reduce((sum: number, item: TopVibeItem) => sum + item.count, 0) ?? 0;
      return { data: data ?? [], totalCount };
    },
    enabled: !!userId,
  });
};

export const useHasGivenVibe = (recipientId?: string): UseQueryResult<boolean> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  return useQuery({
    queryKey: queryKeys.vibes.hasGiven(profile.id, recipientId!),
    queryFn: async () => {
      if (recipientId === profile.id) return true;
      const { data, error } = await supabase
        .from("vibes")
        .select("*")
        .eq("receiver_id", recipientId!)
        .eq("giver_id", profile.id);
      if (error) throw error;
      return (data ?? []).length > 0;
    },
    enabled: !!recipientId,
  });
};
