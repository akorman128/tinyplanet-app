import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert, TextInput, Pressable, Text } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ScreenHeader,
  LoadingState,
  ErrorState,
  Select,
  SelectOption,
  colors,
} from "@/design-system";
import { useLists } from "@/hooks/useLists";
import { ListWithPlaces, ListCategory } from "@/types/list";

const CATEGORY_OPTIONS: SelectOption<ListCategory>[] = [
  { value: "nightlife", label: "Nightlife" },
  { value: "eat_drink", label: "Eat & Drink" },
  { value: "activities", label: "Activities" },
  { value: "explore", label: "Explore" },
  { value: "shop", label: "Shop" },
  { value: "work", label: "Work" },
];

export default function EditListScreen() {
  const router = useRouter();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { getList, updateList } = useLists();

  const [list, setList] = useState<ListWithPlaces | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ListCategory>("eat_drink");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchList = async () => {
      if (!listId) {
        setError("Missing list ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { data } = await getList(listId);

        if (!data) {
          setError("List not found");
          return;
        }

        setList(data);
        setTitle(data.title);
        setCategory(data.category);
        setNote(data.note || "");
      } catch (err) {
        console.error("Error fetching list:", err);
        setError("Failed to load list");
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [listId, getList]);

  const handleSave = async () => {
    if (!list || !title.trim()) return;

    setIsSubmitting(true);
    try {
      await updateList({
        list_id: list.id,
        title: title.trim(),
        category,
        note: note.trim() || undefined,
      });
      router.back();
    } catch (err) {
      console.error("Error updating list:", err);
      Alert.alert("Error", "Failed to update list. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges =
    list &&
    (title.trim() !== list.title ||
      category !== list.category ||
      note.trim() !== (list.note || ""));

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-white pt-12">
          <ScreenHeader title="Edit List" showBackButton={true} />
          <LoadingState />
        </View>
      </>
    );
  }

  if (error || !list) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-white pt-12">
          <ScreenHeader title="Edit List" showBackButton={true} />
          <ErrorState message={error || "List not found"} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white pt-12">
        <ScreenHeader
          title="Edit List"
          showBackButton={true}
          rightComponent={
            <Pressable
              onPress={handleSave}
              disabled={!hasChanges || isSubmitting}
              className={!hasChanges || isSubmitting ? "opacity-50" : ""}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: colors.hex.purple600 }}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          }
        />

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-6 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Name</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
              placeholder="List name"
              autoFocus
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Category</Text>
            <Select
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={setCategory}
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Notes</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
              placeholder="Add any notes about this list..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{ minHeight: 80 }}
            />
          </View>
        </ScrollView>
      </View>
    </>
  );
}
