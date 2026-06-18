import React from "react";
import { View, Pressable, FlatList } from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { Avatar, Body, Caption, LoadingState } from "@/design-system";
import { useGetMutualsBetweenUsers } from "@/hooks/useFriends";
import { Friend } from "@/types/friendship";

export default function MutualsScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { data: mutuals = [], isPending: loading } =
    useGetMutualsBetweenUsers(userId);

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
        <Body className="font-medium">{item.full_name}</Body>
        {item.hometown && <Caption className="mt-0.5">{item.hometown}</Caption>}
      </View>
    </Pressable>
  );

  // Loading state
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Mutual Friends" }} />
        <View className="flex-1 bg-cream">
          <LoadingState />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Mutual Friends" }} />
      <View className="flex-1 bg-cream">
        {mutuals.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6">
            <Body className="text-gray-400 text-center">No mutual friends</Body>
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
