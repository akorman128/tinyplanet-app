import React from "react";
import { View, Pressable } from "react-native";
import { Heading } from "./Typography";
import { Icons } from "./Icons";

export interface ScreenHeaderProps {
  title: string;
  onClose: () => void;
  className?: string;
}

export function ScreenHeader({
  title,
  onClose,
  className = "",
}: ScreenHeaderProps) {
  return (
    <View
      className={`flex-row items-center justify-between px-6 py-2 bg-cream ${className}`}
    >
      <Heading>{title}</Heading>
      <Pressable onPress={onClose} hitSlop={12}>
        <Icons.close width={22} height={22} color="#111827" />
      </Pressable>
    </View>
  );
}
