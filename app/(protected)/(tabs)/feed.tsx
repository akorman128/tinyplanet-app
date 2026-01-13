import React, { useState, useRef, useCallback } from "react";
import { View, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import BottomSheet from "@gorhom/bottom-sheet";
import { FeedView } from "@/components/FeedView";
import { CreateSheet } from "@/components/CreateSheet";
import { Icons } from "@/design-system";
import { useListSelectionStore } from "@/stores/listSelectionStore";

export default function FeedTab() {
  const router = useRouter();
  const [isCreatePostSheetOpen, setIsCreatePostSheetOpen] = useState(false);
  const [isCommentsSheetOpen, setIsCommentsSheetOpen] = useState(false);
  const createPostSheetRef = useRef<BottomSheet>(null);

  const { selectedList, clear: clearListSelection } = useListSelectionStore();

  const handleSheetChange = (index: number) => {
    setIsCreatePostSheetOpen(index >= 0);
    if (index < 0) {
      clearListSelection();
    }
  };

  const handleOpenListPicker = useCallback(() => {
    router.push("/select-list");
  }, [router]);

  const handleRemoveList = useCallback(() => {
    clearListSelection();
  }, [clearListSelection]);

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1">
        <FeedView onCommentsSheetChange={setIsCommentsSheetOpen} />

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

        <CreateSheet
          ref={createPostSheetRef}
          initialType="post"
          onSheetChange={handleSheetChange}
          selectedList={selectedList}
          onOpenListPicker={handleOpenListPicker}
          onRemoveList={handleRemoveList}
        />
      </View>
    </GestureHandlerRootView>
  );
}
