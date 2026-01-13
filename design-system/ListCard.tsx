import React from "react";
import { View, Text, Pressable } from "react-native";
import { ListWithPlaces, ListCategory } from "@/types/list";
import { ListMiniMap } from "@/components/ListMiniMap";
import { colors } from "./colors";

const CATEGORY_LABELS: Record<ListCategory, string> = {
  nightlife: "Nightlife",
  eat_drink: "Eat & Drink",
  activities: "Activities",
  explore: "Explore",
  shop: "Shop",
  work: "Work",
};

interface ListCardProps {
  list: ListWithPlaces;
  onPress?: () => void;
  fullWidth?: boolean;
}

export function ListCard({ list, onPress, fullWidth }: ListCardProps) {
  const resolvedCount = list.places.filter((p) => p.status === "resolved").length;
  const ambiguousCount = list.places.filter((p) => p.status === "ambiguous").length;
  const totalCount = list.places.length;

  return (
    <Pressable
      className="bg-white rounded-xl overflow-hidden border border-gray-200"
      onPress={onPress}
      style={fullWidth ? undefined : { width: 280 }}
    >
      {/* Mini Map */}
      <ListMiniMap places={list.places} height={160} />

      {/* Content */}
      <View className="p-4">
        {/* Title */}
        <Text className="text-lg font-semibold text-gray-900 mb-1">
          {list.title}
        </Text>

        {/* Location & Category */}
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-sm text-gray-600">{list.location_name}</Text>
          <View className="bg-purple-100 px-2 py-0.5 rounded">
            <Text className="text-xs text-purple-700">
              {CATEGORY_LABELS[list.category] || "Other"}
            </Text>
          </View>
        </View>

        {/* Place Count */}
        <View className="flex-row items-center gap-2">
          <Text className="text-sm text-gray-700">
            {totalCount} {totalCount === 1 ? "place" : "places"}
          </Text>
          {ambiguousCount > 0 && (
            <View className="bg-orange-100 px-2 py-0.5 rounded">
              <Text className="text-xs text-orange-700">
                {ambiguousCount} ambiguous
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
