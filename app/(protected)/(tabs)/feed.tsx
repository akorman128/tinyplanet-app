import React from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { FeedView } from "@/components/FeedView";
import { SectionTitle, Avatar } from "@/design-system";
import { useProfileStore } from "@/stores/profileStore";

export default function FeedTab() {
  const router = useRouter();
  const { profileState } = useProfileStore();

  return (
    <View className="flex-1 bg-white">
      <View className="px-5 pt-12 flex-row items-center justify-between">
        <Pressable onPress={() => router.push("/profile")}>
          <Avatar
            fullName={profileState?.full_name ?? ""}
            avatarUrl={profileState?.avatar_url}
            size="small"
          />
        </Pressable>
        <SectionTitle>Feed</SectionTitle>
        <View className="w-12"></View>
      </View>
      <FeedView />
    </View>
  );
}
