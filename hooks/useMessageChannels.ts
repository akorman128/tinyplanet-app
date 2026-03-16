import { useCallback } from "react";
import { useQuery, UseQueryResult, useMutation, useQueryClient } from "@tanstack/react-query";

import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import { queryKeys } from "@/lib/queryKeys";
import {
  MessageChannel,
  GetMessageChannelsInput,
  GetMessageChannelsOutput,
  MarkChannelAsReadInput,
} from "@/types/messageChannel";

// --- Mutation hooks ---

export const useMarkChannelAsRead = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MarkChannelAsReadInput) => {
      const { friendId } = input;
      const { error } = await supabase
        .from("conversation_reads")
        .upsert(
          { user_id: profile.id, friend_id: friendId, last_read_at: new Date().toISOString() },
          { onConflict: "user_id,friend_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.channels });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.unread });
    },
  });
};

// --- Query hooks ---

export const useGetMessageChannels = (): UseQueryResult<GetMessageChannelsOutput> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.messages.channels,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_message_channels", { p_user_id: profile.id });
      if (error) throw error;
      return { data: (data as MessageChannel[]) ?? [] };
    },
  });
};

export const useHasUnreadMessages = (): UseQueryResult<boolean> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.messages.unread,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_unread_messages", { p_user_id: profile.id });
      if (error) throw error;
      return (data as boolean) ?? false;
    },
  });
};

// --- Realtime subscription hooks ---

export const useSubscribeToAllMessages = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useCallback(
    (onMessage: (friendId: string, message: any) => void) => {
      const userId = profile.id;

      const channel = supabase
        .channel("all-messages")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `user_id_a=eq.${userId}` },
          (payload) => {
            const message = payload.new;
            const friendId = message.sender_id === userId ? message.user_id_b : message.sender_id;
            onMessage(friendId, message);
            queryClient.invalidateQueries({ queryKey: queryKeys.messages.channels });
            queryClient.invalidateQueries({ queryKey: queryKeys.messages.unread });
          })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `user_id_b=eq.${userId}` },
          (payload) => {
            const message = payload.new;
            const friendId = message.sender_id === userId ? message.user_id_a : message.sender_id;
            onMessage(friendId, message);
            queryClient.invalidateQueries({ queryKey: queryKeys.messages.channels });
            queryClient.invalidateQueries({ queryKey: queryKeys.messages.unread });
          })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    },
    [supabase, profile.id, queryClient]
  );
};
