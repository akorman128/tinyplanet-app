import React from "react";
import { View, Pressable } from "react-native";
import { Text } from "./Text";
import { Icons } from "./Icons";
import { colors } from "./colors";

export interface ContactCardProps {
  name: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  isVerified?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
}

export function ContactCard({
  name,
  phone,
  email,
  company,
  onPress,
  onDelete,
}: ContactCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-gray-50 rounded-xl px-4 py-3 active:opacity-70"
      disabled={!onPress}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          {/* Name with verified badge */}
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-base font-semibold text-black">{name}</Text>
          </View>
        </View>

        {/* Delete button */}
        {onDelete && (
          <Pressable
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-1"
          >
            <Icons.trash size={20} color={colors.hex.error} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
