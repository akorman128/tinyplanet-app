import React, { useState, useEffect } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSupabase } from "@/hooks/useSupabase";
import {
  useGetMessageChannels,
  useMarkChannelAsRead,
  useSubscribeToAllMessages,
} from "@/hooks/useMessageChannels";
import { ChannelListItem } from "../design-system/ChannelListItem";
import { LoadingState, ErrorState, EmptyState } from "@/design-system";
import { colors } from "@/design-system/colors";
import { logger } from "@/utils/logger";

export function MessagesView() {
  const { session } = useSupabase();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    data: channelsData,
    isPending: loading,
    error: queryError,
    refetch,
  } = useGetMessageChannels();
  const channels = channelsData?.data ?? [];
  const error = queryError?.message ?? null;
  const markChannelAsRead = useMarkChannelAsRead();
  const subscribeToAllMessages = useSubscribeToAllMessages();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Real-time subscription
  useEffect(() => {
    if (!session?.user?.id) return;
    const unsubscribe = subscribeToAllMessages(() => {});
    return unsubscribe;
  }, [session?.user?.id, subscribeToAllMessages]);

  const handleChannelPress = async (friendId: string) => {
    try {
      await markChannelAsRead.mutateAsync({ friendId });
    } catch (err) {
      logger.error("Error marking channel as read:", err);
      // Continue navigation even if marking as read fails
    }
    router.push(`/chat/${friendId}`);
  };

  if (!session?.user) return <LoadingState />;
  if (loading && !refreshing) return <LoadingState />;
  if (error && !refreshing) return <ErrorState message={error} />;
  if (channels.length === 0 && !loading)
    return <EmptyState message="No messages yet" />;

  return (
    <FlatList
      data={channels}
      renderItem={({ item }) => (
        <ChannelListItem
          channel={item}
          currentUserId={session.user.id}
          onPress={handleChannelPress}
        />
      )}
      keyExtractor={(item) => item.friend_id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.hex.blue500}
        />
      }
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 80 }}
    />
  );
}
