import React from "react";
import { View } from "react-native";
import { MessagesView } from "@/components/MessagesView";

export default function MessagesTab() {
  return (
    <View className="flex-1">
      <MessagesView />
    </View>
  );
}
