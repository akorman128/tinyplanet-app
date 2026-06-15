import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, Input, Body, ScreenHeader } from "@/design-system";
import { UserSearchListItem } from "@/components/UserSearchList";
import { useSearchFriends, useSendFriendRequest } from "@/hooks/useFriends";
import { logger } from "@/utils/logger";

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const {
    data: searchData,
    isPending: searchLoading,
    refetch,
  } = useSearchFriends(debouncedQuery);
  const searchResults = searchData?.data ?? [];

  const sendFriendRequest = useSendFriendRequest();

  // Debounced search (500ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddFriend = useCallback(
    async (userId: string) => {
      try {
        await sendFriendRequest.mutateAsync({ targetUserId: userId });
        Alert.alert("Success", "Friend request sent!");
      } catch (error) {
        logger.error("Error sending friend request:", error);
        Alert.alert("Error", "Failed to send friend request");
      }
    },
    [sendFriendRequest]
  );

  const handleUserPress = useCallback(
    (userId: string) => {
      router.back();
      router.push({ pathname: "/profile", params: { userId } });
    },
    [router]
  );

  return (
    <View className="flex-1">
      <Pressable className="absolute inset-0" onPress={() => router.back()} />
      <View className="flex-1 bg-cream" style={{ marginTop: insets.top }}>
        <ScreenHeader title="Search" onClose={() => router.back()} />
        <View className="px-6 pt-3 pb-3 gap-3">
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearable={true}
            onClear={() => setSearchQuery("")}
            autoFocus
          />
        </View>

        {searchLoading && debouncedQuery ? (
          <View className="flex-1 justify-center items-center px-6">
            <ActivityIndicator size="large" color={colors.hex.purple600} />
          </View>
        ) : searchResults.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6">
            <Body className="text-base text-gray-400 text-center">
              {searchQuery.trim() ? "No results" : "Search for friends by name"}
            </Body>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={({ item }) => (
              <UserSearchListItem
                user={item}
                onAddFriend={handleAddFriend}
                onPress={handleUserPress}
              />
            )}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => (
              <View className="h-[1px] bg-gray-100 mx-6" />
            )}
            contentContainerClassName="pb-6"
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={() => refetch()} />
            }
          />
        )}
      </View>
    </View>
  );
}
