import React, { useState, useRef } from "react";
import { View, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet from "@gorhom/bottom-sheet";
import { FeedView } from "@/components/FeedView";
import { CreateSheet } from "@/components/CreateSheet";
import { Icons } from "@/design-system";

export default function FeedTab() {
  const [isCreatePostSheetOpen, setIsCreatePostSheetOpen] = useState(false);
  const [isCommentsSheetOpen, setIsCommentsSheetOpen] = useState(false);
  const createPostSheetRef = useRef<BottomSheet>(null);

  const handleSheetChange = (index: number) => {
    setIsCreatePostSheetOpen(index >= 0);
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1">
        <FeedView onCommentsSheetChange={setIsCommentsSheetOpen} />

        {/* Floating + Button (visible when no sheets are open) */}
        {!isCreatePostSheetOpen && !isCommentsSheetOpen && (
          <TouchableOpacity
            className="absolute bottom-8 right-5 w-14 h-14 rounded-full bg-purple-600 justify-center items-center z-10"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
            onPress={() => createPostSheetRef.current?.snapToIndex(0)}
          >
            <Icons.plus size={28} color="white" />
          </TouchableOpacity>
        )}

        {/* Create Content Bottom Sheet */}
        <CreateSheet
          ref={createPostSheetRef}
          initialType="post"
          onSheetChange={handleSheetChange}
        />
      </View>
    </GestureHandlerRootView>
  );
}
