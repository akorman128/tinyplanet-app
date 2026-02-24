import React, { useState, useEffect } from "react";
import { View, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/design-system";
import { ListForm } from "@/components/ListForm";
import { useLists } from "@/hooks/useLists";
import { CreateListInput } from "@/types/list";
import { getSharedNote, clearSharedNote } from "@/modules/SharedNoteModule";

export default function CreateListScreen() {
  const router = useRouter();
  const { createList } = useLists();
  const { fromShare } = useLocalSearchParams<{ fromShare?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [initialPlaces, setInitialPlaces] = useState("");

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
    try {
      setIsLoading(true);
      await createList(data);
      Alert.alert("Success", "List created successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Failed to create list:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create list"
      );
    } finally {
      setIsLoading(false);
    }
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
          isLoading={isLoading}
          initialPlaces={initialPlaces}
        />
      </View>
    </SafeAreaView>
  );
}
