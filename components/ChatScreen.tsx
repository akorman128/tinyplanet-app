import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, FlatList, Alert, ActivityIndicator } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import {
  LoadingState,
  ErrorState,
  ChatInput,
  TypingIndicator,
  IntroBanner,
  colors,
} from "@/design-system";
import { MessageBubble } from "@/components";
import {
  useSendMessage,
  useUpdateMessage,
  useDeleteMessage,
  useGetMessages,
  useSubscribeToMessages,
  useSubscribeToMessageUpdates,
  useSendTypingIndicator,
  useSubscribeToTypingIndicators,
} from "@/hooks/useChat";
import { useGetProfile } from "@/hooks/useProfile";
import { useGetIntro } from "@/hooks/useIntros";
import { useSupabase } from "@/hooks/useSupabase";
import { useMarkChannelAsRead } from "@/hooks/useMessageChannels";
import { MessageWithSender } from "@/types/chat";
import { queryKeys } from "@/lib/queryKeys";

// Helper to order user IDs consistently (same as useChat)
const orderUserIds = (userId1: string, userId2: string): [string, string] => {
  return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
};

export default function ChatScreen() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const { session, isLoaded } = useSupabase();
  const queryClient = useQueryClient();
  const friendProfile = useGetProfile(friendId);
  const currentUserProfile = useGetProfile(session?.user?.id);
  const markChannelAsRead = useMarkChannelAsRead();
  const sendMessage = useSendMessage();
  const updateMessage = useUpdateMessage();
  const deleteMessage = useDeleteMessage();
  const messagesQuery = useGetMessages(friendId);
  const introQuery = useGetIntro(friendId);
  const subscribeToMessages = useSubscribeToMessages();
  const subscribeToMessageUpdates = useSubscribeToMessageUpdates();
  const sendTypingIndicator = useSendTypingIndicator();
  const subscribeToTypingIndicators = useSubscribeToTypingIndicators();

  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived values
  const messages = messagesQuery.data?.pages.flat() ?? [];
  const friendName = friendProfile.data?.full_name ?? "";

  // Helper to determine if timestamp should be shown
  // Note: messages array is in reverse chronological order (newest first)
  const shouldShowTimestamp = (
    currentMessage: MessageWithSender,
    nextMessage: MessageWithSender | undefined
  ): boolean => {
    // Always show timestamp if it's the last message or if there's no next message
    if (!nextMessage) return true;

    // Show timestamp if next message is from a different sender
    if (currentMessage.sender_id !== nextMessage.sender_id) return true;

    // Show timestamp if time difference is more than 1 minute
    // Since array is newest-first, nextMessage is older than currentMessage
    const currentTime = new Date(currentMessage.created_at).getTime();
    const nextTime = new Date(nextMessage.created_at).getTime();
    const timeDiffInMinutes = Math.abs(currentTime - nextTime) / (1000 * 60);

    return timeDiffInMinutes >= 1;
  };

  // Mark channel as read when opening chat
  useEffect(() => {
    if (friendId) {
      markChannelAsRead.mutateAsync({ friendId }).catch((err) => {
        console.error("Error marking channel as read:", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!friendId || !isLoaded) return;

    const unsubscribe = subscribeToMessages(friendId, (newMessage) => {
      // Prepend new message to first page of infinite query cache
      queryClient.setQueryData(
        queryKeys.messages.conversation(friendId),
        (oldData: InfiniteData<MessageWithSender[]> | undefined) => {
          if (!oldData?.pages) return oldData;
          const firstPage = oldData.pages[0] || [];
          // Check for duplicates (from optimistic updates)
          if (firstPage.some((msg) => msg.id === newMessage.id)) return oldData;
          // We need the sender profile for the message. Use the profiles we already have.
          const senderProfile =
            newMessage.sender_id === session?.user?.id
              ? currentUserProfile.data
              : friendProfile.data;
          const messageWithSender: MessageWithSender = {
            ...newMessage,
            sender: senderProfile
              ? {
                  id: senderProfile.id,
                  full_name: senderProfile.full_name,
                  avatar_url: senderProfile.avatar_url,
                }
              : { id: newMessage.sender_id, full_name: "", avatar_url: null },
          };
          return {
            ...oldData,
            pages: [
              [messageWithSender, ...firstPage],
              ...oldData.pages.slice(1),
            ],
          };
        }
      );
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    });

    return unsubscribe;
  }, [friendId, isLoaded, subscribeToMessages, queryClient, session?.user?.id]);

  // Subscribe to message updates (edits/deletes)
  useEffect(() => {
    const unsubscribe = subscribeToMessageUpdates(
      friendId,
      (updatedMessage) => {
        queryClient.setQueryData(
          queryKeys.messages.conversation(friendId),
          (oldData: InfiniteData<MessageWithSender[]> | undefined) => {
            if (!oldData?.pages) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page) =>
                page.map((msg) =>
                  msg.id === updatedMessage.id
                    ? { ...msg, ...updatedMessage }
                    : msg
                )
              ),
            };
          }
        );
      }
    );

    return unsubscribe;
  }, [friendId, isLoaded, subscribeToMessageUpdates, queryClient]);

  // Subscribe to typing indicators
  useEffect(() => {
    const unsubscribe = subscribeToTypingIndicators(friendId, (event) => {
      if (event.userId === friendId) {
        setIsTyping(true);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Auto-hide typing indicator after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    });

    return () => {
      unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId, isLoaded]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!friendId || !session?.user?.id || !currentUserProfile.data) return;

      if (editingMessage) {
        await updateMessage.mutateAsync({ messageId: editingMessage.id, text });
        setEditingMessage(null);
      } else {
        const tempId = `temp-${Date.now()}`;
        const [user_a, user_b] = orderUserIds(session.user.id, friendId);
        const optimisticMessage: MessageWithSender = {
          id: tempId,
          user_id_a: user_a,
          user_id_b: user_b,
          sender_id: session.user.id,
          text: text.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          edited_at: null,
          deleted_at: null,
          sender: {
            id: currentUserProfile.data.id,
            full_name: currentUserProfile.data.full_name,
            avatar_url: currentUserProfile.data.avatar_url,
          },
        };

        // Optimistic: prepend to first page
        queryClient.setQueryData(
          queryKeys.messages.conversation(friendId),
          (oldData: InfiniteData<MessageWithSender[]> | undefined) => {
            if (!oldData?.pages)
              return { pages: [[optimisticMessage]], pageParams: [0] };
            return {
              ...oldData,
              pages: [
                [optimisticMessage, ...oldData.pages[0]],
                ...oldData.pages.slice(1),
              ],
            };
          }
        );

        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);

        try {
          const result = await sendMessage.mutateAsync({ friendId, text });
          // Replace temp message with real one
          queryClient.setQueryData(
            queryKeys.messages.conversation(friendId),
            (oldData: InfiniteData<MessageWithSender[]> | undefined) => {
              if (!oldData?.pages) return oldData;
              return {
                ...oldData,
                pages: oldData.pages.map((page) =>
                  page.map((msg) =>
                    msg.id === tempId
                      ? { ...optimisticMessage, id: result.data.id }
                      : msg
                  )
                ),
              };
            }
          );
        } catch (err) {
          Alert.alert("Error", "Failed to send message");
          // Remove optimistic message on error
          queryClient.setQueryData(
            queryKeys.messages.conversation(friendId),
            (oldData: InfiniteData<MessageWithSender[]> | undefined) => {
              if (!oldData?.pages) return oldData;
              return {
                ...oldData,
                pages: oldData.pages.map((page) =>
                  page.filter((msg) => !msg.id.startsWith("temp-"))
                ),
              };
            }
          );
        }
      }
    },
    [
      friendId,
      session?.user?.id,
      currentUserProfile.data,
      editingMessage,
      sendMessage,
      updateMessage,
      queryClient,
    ]
  );

  const handleTyping = useCallback(() => {
    if (!friendId) return;
    sendTypingIndicator({ friendId });
  }, [friendId, sendTypingIndicator]);

  const handleEditMessage = useCallback((message: MessageWithSender) => {
    setEditingMessage({ id: message.id, text: message.text });
  }, []);

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await deleteMessage.mutateAsync({ messageId });
      } catch (err) {
        Alert.alert("Error", "Failed to delete message");
      }
    },
    [deleteMessage]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
  }, []);

  const renderLoadingMore = () => {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={colors.hex.purple600} />
      </View>
    );
  };

  if (!friendId) {
    return (
      <>
        <Stack.Screen options={{ title: "Chat" }} />
        <View className="flex-1 bg-cream">
          <ErrorState message="Friend ID not provided" />
        </View>
      </>
    );
  }

  if (messagesQuery.isPending) {
    return (
      <>
        <Stack.Screen options={{ title: friendName || "Chat" }} />
        <View className="flex-1 bg-cream">
          <LoadingState />
        </View>
      </>
    );
  }

  if (messagesQuery.isError) {
    return (
      <>
        <Stack.Screen options={{ title: friendName || "Chat" }} />
        <View className="flex-1 bg-cream">
          <ErrorState message="Failed to load messages" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: friendName || "Chat" }} />
      <View className="flex-1 bg-cream">
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              showTimestamp={shouldShowTimestamp(item, messages[index + 1])}
            />
          )}
          contentContainerClassName="px-4 pt-4"
          inverted
          onEndReached={() => {
            if (messagesQuery.hasNextPage) messagesQuery.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            messagesQuery.isFetchingNextPage ? renderLoadingMore() : null
          }
          ListFooterComponent={
            <>
              {isTyping && <TypingIndicator friendName={friendName} />}
              {introQuery.data?.data && (
                <IntroBanner
                  introducerName={introQuery.data.data.introducer.full_name}
                  introducerAvatarUrl={introQuery.data.data.introducer.avatar_url}
                  message={introQuery.data.data.message}
                />
              )}
            </>
          }
        />

        <ChatInput
          onSend={handleSendMessage}
          onTyping={handleTyping}
          editingMessage={editingMessage}
          onCancelEdit={handleCancelEdit}
        />
      </View>
    </>
  );
}
