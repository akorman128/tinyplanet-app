import React from "react";
import { Pressable, ActivityIndicator, View } from "react-native";
import { Text } from "./Text";
import { Icons } from "./Icons";
import { colors } from "./colors";
import { hapticSelection } from "@/utils";

export interface FontPreviewItemProps {
  fontName: string;
  displayName: string;
  loaded: boolean;
  selected: boolean;
  onPress: () => void;
}

export function FontPreviewItem({
  fontName,
  displayName,
  loaded,
  selected,
  onPress,
}: FontPreviewItemProps) {
  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      className={`flex-row items-center px-4 py-3 border-b border-gray-100 ${
        selected ? "bg-blue-50" : ""
      }`}
    >
      <View className="flex-1">
        <Text
          style={loaded ? { fontFamily: fontName } : undefined}
          className="text-base text-gray-900"
        >
          {displayName}
        </Text>
      </View>
      {!loaded && <ActivityIndicator size="small" color={colors.hex.gray500} />}
      {selected && <Icons.check size={20} color={colors.hex.blue500} />}
    </Pressable>
  );
}
