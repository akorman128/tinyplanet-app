import React, { useState, useEffect, useRef } from "react";
import { View, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/design-system";
import { ListForm } from "@/components/ListForm";
import { useCreateList } from "@/hooks/useLists";
import { CreateListInput } from "@/types/list";
import { getSharedNote, clearSharedNote } from "@/modules/SharedNoteModule";

export default function CreateListScreen() {
  const router = useRouter();
  const createList = useCreateList();
  const { fromShare } = useLocalSearchParams<{ fromShare?: string }>();
  const [initialPlaces, setInitialPlaces] = useState("");
  const submittingRef = useRef(false);

  // Load shared note if coming from share extension
  useEffect(() => {
    if (fromShare === "true") {
      loadSharedNote();
    }
  }, [fromShare]);

  const loadSharedNote = async () => {
    const note = await getSharedNote();
    if (note?.text) {
      setInitialPlaces(note.text);
      // Clear immediately to prevent duplicate imports
      await clearSharedNote();
    }
  };

  const handleSubmit = async (data: CreateListInput) => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    // Navigate immediately — realtime subscription on user-lists will refresh when the DB insert lands
    router.replace("/user-lists");

    // Fire-and-forget: create the list in the background
    createList.mutateAsync(data).catch((error) => {
      console.error("Failed to create list:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create list"
      );
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={["top"]}>
      <ScreenHeader title="Create List" onClose={handleCancel} />
      <View className="flex-1">
        <ListForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialPlaces={initialPlaces}
        />
      </View>
    </SafeAreaView>
  );
}
