import React, { useState } from "react";
import { View, Alert } from "react-native";
import { useRouter, Stack } from "expo-router";
import { ListForm } from "@/components/ListForm";
import { useLists } from "@/hooks/useLists";
import { CreateListInput } from "@/types/list";
import { ScreenHeader } from "@/design-system";

export default function CreateListScreen() {
  const router = useRouter();
  const { createList } = useLists();
  const [isLoading, setIsLoading] = useState(false);

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
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white pt-12">
        <ScreenHeader title="Create List" showBackButton={true} />
        <ListForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </View>
    </>
  );
}
