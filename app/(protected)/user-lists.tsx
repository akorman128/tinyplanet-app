import React from "react";
import { View, Pressable, Platform } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Icons, colors } from "@/design-system";
import { UserListsSection } from "@/components/UserListsSection";
import { useRequireProfile } from "@/hooks/useRequireProfile";

export default function UserListsScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const currentUserProfile = useRequireProfile();

  const displayUserId = userId || currentUserProfile.id;
  const isOwnProfile = !userId || userId === currentUserProfile.id;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          headerShadowVisible: false,
        }}
      />
      {Platform.OS === "ios" && isOwnProfile && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="plus"
            onPress={() => router.push("/create-list")}
          />
        </Stack.Toolbar>
      )}
      <View className="flex-1 bg-cream">
        <UserListsSection userId={displayUserId} />
      </View>
    </>
  );
}
