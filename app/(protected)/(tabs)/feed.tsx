import React, { useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FeedView } from "@/components/FeedView";
import { FABMenu } from "@/components/FABMenu";

export default function FeedTab() {
  const [isCommentsSheetOpen, setIsCommentsSheetOpen] = useState(false);

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1">
        <FeedView onCommentsSheetChange={setIsCommentsSheetOpen} />
        {!isCommentsSheetOpen && <FABMenu />}
      </View>
    </GestureHandlerRootView>
  );
}
