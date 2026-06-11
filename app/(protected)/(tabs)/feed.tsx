import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FeedView } from "@/components/FeedView";

export default function FeedTab() {
  return (
    <GestureHandlerRootView className="flex-1 bg-cream">
      <FeedView />
    </GestureHandlerRootView>
  );
}
