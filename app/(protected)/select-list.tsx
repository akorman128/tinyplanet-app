import React, { useState, useEffect } from "react";
import { View, Pressable, FlatList, Platform } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useLists } from "@/hooks/useLists";
import { useListSelectionStore } from "@/stores/listSelectionStore";
import { ViewableList } from "@/types/list";
import {
  LoadingState,
  EmptyState,
  Icons,
  colors,
  Text,
} from "@/design-system";

export default function SelectListScreen() {
  const router = useRouter();
  const { getViewableLists } = useLists();
  const { selectedList, setSelectedList } = useListSelectionStore();
  const [lists, setLists] = useState<ViewableList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      setLoading(true);
      const { data } = await getViewableLists();
      setLists(data);
    } catch (err) {
      console.error("Error loading lists:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (list: ViewableList) => {
    setSelectedList({
      id: list.id,
      title: list.title,
      location_name: list.location_name,
      place_count: list.places.length,
      owner_name: list.owner_name,
    });
    router.back();
  };

  const handleClear = () => {
    setSelectedList(null);
    router.back();
  };

  const renderItem = ({ item }: { item: ViewableList }) => (
    <Pressable
      onPress={() => handleSelect(item)}
      className={`flex-row items-center px-4 py-4 border-b border-gray-100 ${
        selectedList?.id === item.id ? "bg-purple-50" : ""
      }`}
    >
      <Icons.list size={20} color={colors.hex.purple600} />
      <View className="flex-1 ml-3">
        <Text className="text-base font-medium text-gray-900">
          {item.title}
        </Text>
        <Text className="text-sm text-gray-500">
          {item.location_name}
          {item.owner_name !== "You" && ` - by ${item.owner_name}`}
        </Text>
      </View>
      {selectedList?.id === item.id && (
        <Icons.check size={20} color={colors.hex.purple600} />
      )}
    </Pressable>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Select a List",
          headerRight: Platform.OS === "android" && selectedList
            ? () => (
                <Pressable onPress={handleClear} className="px-2">
                  <Text className="text-purple-600 font-medium">Clear</Text>
                </Pressable>
              )
            : undefined,
        }}
      />
      {Platform.OS === "ios" && selectedList && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="xmark"
            onPress={handleClear}
          />
        </Stack.Toolbar>
      )}
      <View className="flex-1 bg-white">

        {loading ? (
          <LoadingState />
        ) : lists.length === 0 ? (
          <EmptyState message="No lists available" />
        ) : (
          <FlatList
            data={lists}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerClassName="pb-6"
          />
        )}
      </View>
    </>
  );
}
