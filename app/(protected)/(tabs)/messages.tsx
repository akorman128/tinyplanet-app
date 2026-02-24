import React from "react";
import { View } from "react-native";
import { MessagesView } from "@/components/MessagesView";
import { SectionTitle } from "@/design-system";

export default function MessagesTab() {
  return (
    <View className="flex-1 bg-white">
      <View className="px-5 pt-12 items-center">
        <SectionTitle>Messages</SectionTitle>
      </View>
      <MessagesView />
    </View>
  );
}
