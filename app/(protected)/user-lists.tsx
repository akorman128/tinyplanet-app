import React from "react";
import { View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@/design-system";
import { UserListsSection } from "@/components/UserListsSection";
import { useRequireProfile } from "@/hooks/useRequireProfile";

export default function UserListsScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const currentUserProfile = useRequireProfile();

  const displayUserId = userId || currentUserProfile.id;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white pt-8">
        <ScreenHeader title="Lists" showBackButton={true} />
        <UserListsSection userId={displayUserId} />
      </View>
    </>
  );
}
