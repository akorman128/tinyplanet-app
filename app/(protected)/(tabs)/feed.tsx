import React from "react";
import { View, Pressable } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { FeedView } from "@/components/FeedView";
import { SectionTitle } from "@/design-system";

export default function FeedTab() {
  const router = useRouter();

  return (
    <GestureHandlerRootView className="flex-1 bg-cream">
      <View className="px-5 pt-12 flex-row items-center justify-between">
        <Pressable onPress={() => router.push("/profile")}>
          <View className="w-12"></View>
        </Pressable>
        <SectionTitle>Feed</SectionTitle>
        <View className="w-12"></View>
      </View>
      <FeedView />
    </GestureHandlerRootView>
  );
}
