import React from "react";
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useGetLists } from "@/hooks/useLists";
import { ListCard } from "@/design-system/ListCard";
import { colors, SectionTitle, Caption, Text } from "@/design-system";

interface ListsSectionProps {
  userId: string;
  isOwnProfile: boolean;
}

export function ListsSection({ userId, isOwnProfile }: ListsSectionProps) {
  const router = useRouter();
  const {
    data: listsResult,
    isLoading,
    error: queryError,
  } = useGetLists(userId);
  const lists = listsResult?.data ?? [];
  const error = queryError ? "Failed to load lists" : null;

  if (isLoading) {
    return (
      <View className="py-6">
        <View className="flex-row items-center justify-between mb-4">
          <SectionTitle>Lists</SectionTitle>
        </View>
        <View className="items-center justify-center py-8">
          <ActivityIndicator size="large" color={colors.hex.purple600} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="py-6 px-6">
        <View className="flex-row items-center justify-between mb-4">
          <SectionTitle>Lists</SectionTitle>
        </View>
        <Caption className="text-red-600">{error}</Caption>
      </View>
    );
  }

  if (lists.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <View className="py-6">
      <View className="flex-row items-center justify-between mb-4">
        <SectionTitle>Lists</SectionTitle>
        {isOwnProfile && (
          <Pressable
            onPress={() => router.push("/create-list")}
            className="bg-purple-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white text-sm font-medium">Create List</Text>
          </Pressable>
        )}
      </View>

      {lists.length === 0 ? (
        <View className="px-6 py-8 items-center">
          <Text className="text-gray-500 text-center mb-4">
            No lists yet. Create your first list to share your favorite places.
          </Text>
          <Pressable
            onPress={() => router.push("/create-list")}
            className="bg-purple-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-medium">
              Create Your First List
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
        >
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onPress={() => router.push(`/list/${list.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
