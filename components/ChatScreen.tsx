import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, FlatList, Alert, ActivityIndicator } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import {
  LoadingState,
  ErrorState,
  ChatInput,
  TypingIndicator,
  IntroBanner,
  DateSeparator,
  Avatar,
  Text,
  colors,
} from "@/design-system";
import { MessageBubble } from "@/components";
import { formatDateLabel } from "@/lib/formatDateLabel";
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
import { useNotificationStore } from "@/stores/notificationStore";
import { logger } from "@/utils/logger";

type ChatListItem =
  | { type: "message"; data: MessageWithSender }
  | { type: "separator"; id: string; label: string };

// Helper to order user IDs consistently (same as useChat)
const orderUserIds = (userId1: string, userId2: string): [string, string] => {
  return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
};

function ChatHeaderTitle({
  fullName,
  avatarUrl,
}: {
  fullName: string;
  avatarUrl?: string;
}) {
  return (
    <View className="items-center">
      <Avatar fullName={fullName} avatarUrl={avatarUrl} size="small" />
      <Text className="text-sm font-semibold text-gray-900 mt-0.5">
        {fullName.split(" ")[0]}
      </Text>
    </View>
  );
}

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

  const flatListRef = useRef<FlatList<ChatListItem>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived values
  const messages = useMemo(
    () => messagesQuery.data?.pages.flat() ?? [],
    [messagesQuery.data]
  );
  const friendName = friendProfile.data?.full_name ?? "";
  const headerOptions = friendName
    ? {
        headerTitle: () => (
          <ChatHeaderTitle
            fullName={friendName}
            avatarUrl={friendProfile.data?.avatar_url || undefined}
          />
        ),
      }
    : { title: "Chat" };

  // Build mixed array with date separators between day boundaries
  const chatItems = useMemo((): ChatListItem[] => {
    const items: ChatListItem[] = [];
    for (let i = 0; i < messages.length; i++) {
      items.push({ type: "message", data: messages[i] });

      const currentDate = new Date(messages[i].created_at);
      const nextMessage = messages[i + 1];

      // Insert separator at day boundaries or after the oldest message
      const isDayBoundary =
        nextMessage &&
        currentDate.toDateString() !==
          new Date(nextMessage.created_at).toDateString();
      if (!nextMessage || isDayBoundary) {
        items.push({
          type: "separator",
          id: `sep-${messages[i].id}`,
          label: formatDateLabel(currentDate),
        });
      }
    }
    return items;
  }, [messages]);

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

  // Track active chat for foreground notification suppression
  const setActiveChatFriendId = useNotificationStore(
    (s) => s.setActiveChatFriendId
  );
  useEffect(() => {
    if (friendId) setActiveChatFriendId(friendId);
    return () => setActiveChatFriendId(null);
  }, [friendId, setActiveChatFriendId]);

  // Mark channel as read when opening chat
  useEffect(() => {
    if (friendId) {
      markChannelAsRead.mutateAsync({ friendId }).catch((err) => {
        logger.error("Error marking channel as read:", err);
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

  const handleSendMessage = async (text: string) => {
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
  };

  const handleTyping = () => {
    if (!friendId) return;
    sendTypingIndicator({ friendId });
  };

  const handleEditMessage = (message: MessageWithSender) => {
    setEditingMessage({ id: message.id, text: message.text });
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage.mutateAsync({ messageId });
    } catch (err) {
      Alert.alert("Error", "Failed to delete message");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  const renderLoadingMore = () => {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={colors.hex.blue500} />
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
        <Stack.Screen options={headerOptions} />
        <View className="flex-1 bg-cream">
          <LoadingState />
        </View>
      </>
    );
  }

  if (messagesQuery.isError) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <View className="flex-1 bg-cream">
          <ErrorState message="Failed to load messages" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <View className="flex-1 bg-cream">
        <FlatList<ChatListItem>
          ref={flatListRef}
          data={chatItems}
          keyExtractor={(item) =>
            item.type === "message" ? item.data.id : item.id
          }
          renderItem={({ item, index }) => {
            if (item.type === "separator") {
              return <DateSeparator label={item.label} />;
            }
            // Find the next message item (skipping separators) for timestamp logic
            let nextMessage: MessageWithSender | undefined;
            for (let j = index + 1; j < chatItems.length; j++) {
              const next = chatItems[j];
              if (next.type === "message") {
                nextMessage = next.data;
                break;
              }
            }
            return (
              <MessageBubble
                message={item.data}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                showTimestamp={shouldShowTimestamp(item.data, nextMessage)}
              />
            );
          }}
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
                  introducerAvatarUrl={
                    introQuery.data.data.introducer.avatar_url
                  }
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
