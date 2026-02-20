import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useLists } from "@/hooks/useLists";
import { ListCard } from "@/design-system/ListCard";
import { ListWithPlaces } from "@/types/list";
import { colors, Text } from "@/design-system";

interface ListsSectionProps {
  userId: string;
  isOwnProfile: boolean;
}

export function ListsSection({ userId, isOwnProfile }: ListsSectionProps) {
  const router = useRouter();
  const { getLists } = useLists();
  const [lists, setLists] = useState<ListWithPlaces[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLists();
  }, [userId]);

  const fetchLists = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await getLists(userId);
      setLists(data);
    } catch (err) {
      console.error("Failed to fetch lists:", err);
      setError("Failed to load lists");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="py-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-900">Lists</Text>
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
          <Text className="text-lg font-semibold text-gray-900">Lists</Text>
        </View>
        <Text className="text-sm text-red-600">{error}</Text>
      </View>
    );
  }

  if (lists.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <View className="py-6">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-900">Lists</Text>
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
