import React from "react";
import { View, Pressable } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Text } from "./Text";
import { Icons } from "./Icons";
import { colors } from "./colors";

export interface ContactCardProps {
  name: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  location?: string | null;
  isVerified?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
}

export function ContactCard({
  name,
  phone,
  email,
  company,
  location,
  onPress,
  onDelete,
}: ContactCardProps) {
  const renderRightActions = () => (
    <Pressable
      onPress={onDelete}
      className="justify-center items-center bg-red-600 rounded-r-xl w-20"
    >
      <Icons.trash size={20} color={colors.hex.white} />
      <Text className="text-xs text-white mt-1">Delete</Text>
    </Pressable>
  );

  const content = (
    <Pressable
      onPress={onPress}
      className="bg-gray-50 rounded-xl px-4 py-3 active:opacity-70"
      disabled={!onPress}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-base font-semibold text-black">{name}</Text>
          </View>
          {(company || location) && (
            <Text className="text-sm text-gray-500">
              {[company, location].filter(Boolean).join(" · ")}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );

  if (onDelete) {
    return (
      <ReanimatedSwipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
      >
        {content}
      </ReanimatedSwipeable>
    );
  }

  return content;
}
