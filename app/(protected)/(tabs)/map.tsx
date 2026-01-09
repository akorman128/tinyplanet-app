import React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MapView } from "@/components/MapView";

export default function MapTab() {
  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1">
        <MapView />
      </View>
    </GestureHandlerRootView>
  );
}
