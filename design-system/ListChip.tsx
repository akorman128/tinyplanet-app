import React from "react";
import { View, Pressable } from "react-native";
import { Text } from "./Text";
import { Link } from "expo-router";
import { Icons } from "./Icons";
import { colors } from "./colors";
import { AttachedList } from "@/types/post";

export interface ListChipProps {
  list: AttachedList;
  size?: "small" | "medium";
}

export function ListChip({ list, size = "medium" }: ListChipProps) {
  const isSmall = size === "small";

  return (
    <Link
      href={{ pathname: "/list/[listId]", params: { listId: list.id } }}
      asChild
    >
      <Pressable className="flex-row items-center bg-blue-50  rounded-lg px-3 py-4">
        <Link.AppleZoom>
          <View className="flex-row items-center flex-1" collapsable={false}>
            <Icons.list size={isSmall ? 14 : 16} color={colors.hex.blue500} />
            <View className="flex-1 ml-2">
              <Text
                className={`font-medium text-blue-600 ${isSmall ? "text-xs" : "text-sm"}`}
                numberOfLines={1}
              >
                {list.title}
              </Text>
            </View>
            <Icons.chevronRight
              size={isSmall ? 12 : 14}
              color={colors.hex.blue400}
            />
          </View>
        </Link.AppleZoom>
      </Pressable>
    </Link>
  );
}
