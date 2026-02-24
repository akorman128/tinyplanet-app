import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, Input, Body, Icons, SectionTitle } from "@/design-system";
import { UserSearchListItem } from "@/components/UserSearchList";
import { useFriends } from "@/hooks/useFriends";
import { Friend } from "@/types/friendship";

export default function SearchScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { searchFriends, sendFriendRequest } = useFriends();

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const { data } = await searchFriends({ query: searchQuery });
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching users:", error);
      Alert.alert("Error", "Failed to search users");
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, searchFriends]);

  // Debounced search (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleAddFriend = useCallback(
    async (userId: string) => {
      try {
        await sendFriendRequest({ targetUserId: userId });
        Alert.alert("Success", "Friend request sent!");
        handleSearch();
      } catch (error) {
        console.error("Error sending friend request:", error);
        Alert.alert("Error", "Failed to send friend request");
      }
    },
    [sendFriendRequest, handleSearch]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (searchQuery.trim()) {
      await handleSearch();
    }
    setRefreshing(false);
  }, [searchQuery, handleSearch]);

  const handleUserPress = useCallback(
    (userId: string) => {
      router.back();
      router.push({ pathname: "/profile", params: { userId } });
    },
    [router]
  );

  return (
    <View className="flex-1 bg-white">
      <View className="pt-14 px-6 pb-3 gap-3">
        <View className="flex-row items-center justify-between mb-2">
          <SectionTitle>Search</SectionTitle>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Icons.close size={24} color={colors.hex.gray900} />
          </Pressable>
        </View>
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearable={true}
          onClear={() => setSearchQuery("")}
          autoFocus
        />
      </View>

      {searchLoading ? (
        <View className="flex-1 justify-center items-center px-6">
          <ActivityIndicator size="large" color={colors.hex.purple600} />
        </View>
      ) : searchResults.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Body className="text-base text-gray-400 text-center">
            {searchQuery.trim() ? "No results" : "Search your planet by name"}
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      )}
    </View>
  );
}
