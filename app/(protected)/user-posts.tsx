import React from "react";
import { View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { UserPostsSection } from "@/components/UserPostsSection";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { logger } from "@/utils/logger";

export default function UserPostsScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const currentUserProfile = useRequireProfile();

  // Use provided userId or default to current user's ID
  const displayUserId = userId || currentUserProfile.id;

  return (
    <>
      <Stack.Screen options={{ title: "Posts" }} />
      <View className="flex-1 bg-cream">
        <UserPostsSection
          userId={displayUserId}
          onOpenComments={(postId, commentCount) => {
            // Could navigate to comments screen here if implemented
            logger.log("Open comments for post:", postId);
          }}
        />
      </View>
    </>
  );
}
