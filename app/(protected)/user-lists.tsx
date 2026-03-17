import React from "react";
import { View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { UserListsSection } from "@/components/UserListsSection";
import { useRequireProfile } from "@/hooks/useRequireProfile";

export default function UserListsScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const currentUserProfile = useRequireProfile();

  const displayUserId = userId || currentUserProfile.id;

  return (
    <>
      <Stack.Screen options={{ title: "Lists" }} />
      <View className="flex-1 bg-cream">
        <UserListsSection userId={displayUserId} />
      </View>
    </>
  );
}
