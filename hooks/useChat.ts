import { useCallback } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import { queryKeys } from "@/lib/queryKeys";
import {
  Message,
  MessageWithSender,
  GetMessagesInput,
  GetMessagesOutput,
  SendMessageInput,
  SendMessageOutput,
  UpdateMessageInput,
  UpdateMessageOutput,
  DeleteMessageInput,
  SendTypingIndicatorInput,
  TypingIndicatorEvent,
} from "@/types/chat";

const PAGE_SIZE = 10;

// --- Helpers ---

const orderUserIds = (userId1: string, userId2: string): [string, string] => {
  return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
};

// --- Mutation hooks ---

export const useSendMessage = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendMessageInput): Promise<SendMessageOutput> => {
      const { friendId, text } = input;
      const [user_a, user_b] = orderUserIds(profile.id, friendId);

      const { data, error } = await supabase
        .from("messages")
        .insert({
          user_id_a: user_a,
          user_id_b: user_b,
          sender_id: profile.id,
          text: text.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return { data };
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.conversation(input.friendId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.channels });
    },
  });
};

export const useUpdateMessage = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: UpdateMessageInput
    ): Promise<UpdateMessageOutput> => {
      const { messageId, text } = input;
      const { data, error } = await supabase
        .from("messages")
        .update({ text: text.trim(), edited_at: new Date().toISOString() })
        .eq("id", messageId)
        .eq("sender_id", profile.id)
        .is("deleted_at", null)
        .select()
        .single();

      if (error) throw error;
      return { data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
};

export const useDeleteMessage = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteMessageInput) => {
      const { messageId } = input;
      const { error } = await supabase
        .from("messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", messageId)
        .eq("sender_id", profile.id)
        .is("deleted_at", null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
};

// --- Query hooks ---

export const useGetMessages = (friendId?: string) => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useInfiniteQuery({
    queryKey: queryKeys.messages.conversation(friendId!),
    queryFn: async ({ pageParam = 0 }) => {
      const [user_a, user_b] = orderUserIds(profile.id, friendId!);
      const { data, error } = await supabase
        .from("messages")
        .select(
          `*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)`
        )
        .eq("user_id_a", user_a)
        .eq("user_id_b", user_b)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);
      if (error) throw error;
      return (data as unknown as MessageWithSender[]) || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.flat().length,
    enabled: !!friendId,
  });
};

// --- Realtime subscription hooks ---

export const useSubscribeToMessages = () => {
  const { isLoaded, supabase } = useSupabase();
  const profile = useRequireProfile();

  return useCallback(
    (friendId: string, onMessage: (message: Message) => void): (() => void) => {
      if (!isLoaded) return () => {};

      const [user_a, user_b] = orderUserIds(profile.id, friendId);
      const channelName = `chat:${user_a}:${user_b}`;

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `user_id_a=eq.${user_a},user_id_b=eq.${user_b}`,
          },
          (payload) => {
            onMessage(payload.new as Message);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    [isLoaded, supabase, profile.id]
  );
};

export const useSubscribeToMessageUpdates = () => {
  const { isLoaded, supabase } = useSupabase();
  const profile = useRequireProfile();

  return useCallback(
    (friendId: string, onUpdate: (message: Message) => void): (() => void) => {
      if (!isLoaded) return () => {};

      const [user_a, user_b] = orderUserIds(profile.id, friendId);
      const channelName = `chat:${user_a}:${user_b}_updates`;

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `user_id_a=eq.${user_a},user_id_b=eq.${user_b}`,
          },
          (payload) => {
            onUpdate(payload.new as Message);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    [isLoaded, supabase, profile.id]
  );
};

export const useSendTypingIndicator = () => {
  const { isLoaded, supabase } = useSupabase();
  const profile = useRequireProfile();

  return useCallback(
    async (input: SendTypingIndicatorInput): Promise<void> => {
      if (!isLoaded) return;

      const { friendId } = input;
      const [user_a, user_b] = orderUserIds(profile.id, friendId);
      const channelName = `chat:${user_a}:${user_b}_presence`;

      const channel = supabase.channel(channelName);
      await channel.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: profile.id, isTyping: true },
      });
    },
    [isLoaded, supabase, profile.id]
  );
};

export const useSubscribeToTypingIndicators = () => {
  const { isLoaded, supabase } = useSupabase();
  const profile = useRequireProfile();

  return useCallback(
    (
      friendId: string,
      onTyping: (event: TypingIndicatorEvent) => void
    ): (() => void) => {
      if (!isLoaded) return () => {};

      const [user_a, user_b] = orderUserIds(profile.id, friendId);
      const channelName = `chat:${user_a}:${user_b}_presence`;

      const channel = supabase
        .channel(channelName)
        .on("broadcast", { event: "typing" }, (payload) => {
          onTyping(payload.payload as TypingIndicatorEvent);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    [isLoaded, supabase, profile.id]
  );
};
