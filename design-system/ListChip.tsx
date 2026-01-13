import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Icons } from "./Icons";
import { colors } from "./colors";
import { AttachedList } from "@/types/post";

export interface ListChipProps {
  list: AttachedList;
  size?: "small" | "medium";
}

export function ListChip({ list, size = "medium" }: ListChipProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/list/[listId]",
      params: { listId: list.id },
    });
  };

  const isSmall = size === "small";

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center bg-purple-50 border border-purple-200 rounded-lg px-3 py-2
      `}
    >
      <Icons.list size={isSmall ? 14 : 16} color={colors.hex.purple600} />
      <View className="flex-1 ml-2">
        <Text
          className={`font-medium text-purple-700 ${isSmall ? "text-xs" : "text-sm"}`}
          numberOfLines={1}
        >
          {list.title}
        </Text>
      </View>
      <Icons.chevronRight
        size={isSmall ? 12 : 14}
        color={colors.hex.purple400}
      />
    </Pressable>
  );
}
