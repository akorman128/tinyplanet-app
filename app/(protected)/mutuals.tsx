import React, { useState, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  Pressable,
  FlatList,
} from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { colors, Avatar, Body, Caption, Text } from "@/design-system";
import { useFriends } from "@/hooks/useFriends";
import { Friend } from "@/types/friendship";

export default function MutualsScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { getMutualsBetweenUsers } = useFriends();
  const [mutuals, setMutuals] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMutuals = async () => {
      if (!userId) {
        setError("No user specified");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const mutualFriends = await getMutualsBetweenUsers(userId);
        setMutuals(mutualFriends);
      } catch (err) {
        console.error("Error fetching mutuals:", err);
        setError("Failed to load mutual friends");
      } finally {
        setLoading(false);
      }
    };

    fetchMutuals();
  }, [userId]);

  const handleUserPress = (friendId: string) => {
    router.push({ pathname: "/profile", params: { userId: friendId } });
  };

  const renderMutualItem = ({ item }: { item: Friend }) => (
    <Pressable
      onPress={() => handleUserPress(item.id)}
      className="flex-row items-center py-4 px-6 border-b border-gray-100 active:bg-gray-50"
    >
      <Avatar
        fullName={item.full_name}
        avatarUrl={item.avatar_url}
        size="small"
      />
      <View className="ml-3 flex-1">
        <Body className="font-medium">
          {item.full_name}
        </Body>
        {item.hometown && (
          <Caption className="mt-0.5">{item.hometown}</Caption>
        )}
      </View>
    </Pressable>
  );

  // Loading state
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Mutual Friends" }} />
        <View className="flex-1 bg-white">
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.hex.purple600} />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Mutual Friends" }} />
      <View className="flex-1 bg-white">

        {mutuals.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6">
            <Body className="text-gray-400 text-center">
              No mutual friends
            </Body>
          </View>
        ) : (
          <View className="flex-1">
            <View className="py-3 px-6 border-b border-gray-100">
              <Caption>
                {mutuals.length} {mutuals.length === 1 ? "mutual" : "mutuals"}
              </Caption>
            </View>
            <FlatList
              data={mutuals}
              keyExtractor={(item) => item.id}
              renderItem={renderMutualItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </View>
    </>
  );
}
