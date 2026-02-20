import React from "react";
import { View, Pressable } from "react-native";
import { Body } from "./Typography";
import { Icons } from "./Icons";
import { colors } from "./colors";

export interface MenuRowProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  position?: "first" | "middle" | "last" | "standalone";
}

export function MenuRow({
  icon,
  label,
  onPress,
  position = "standalone",
}: MenuRowProps) {
  const rounded =
    position === "first"
      ? "rounded-t-lg"
      : position === "last"
        ? "rounded-b-lg"
        : position === "standalone"
          ? "rounded-lg"
          : "";

  return (
    <Pressable
      onPress={onPress}
      className={`w-full px-4 py-3 bg-gray-50 flex-row items-center justify-between ${rounded}`}
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Body className="font-semibold text-black">{label}</Body>
      </View>
      <Icons.chevronRight size={20} color={colors.black} />
    </Pressable>
  );
}
