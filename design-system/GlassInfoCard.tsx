import React, { ReactNode } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { colors } from "./colors";

export interface GlassInfoItemProps {
  label: string;
  value?: string;
  loading?: boolean;
  onPress?: () => void;
}

export function GlassInfoItem({
  label,
  value,
  loading = false,
  onPress,
}: GlassInfoItemProps) {
  const content = (
    <View className="py-3">
      <Text className="text-xs font-semibold text-[#9ca3af] mb-1 uppercase tracking-wide">
        {label}
      </Text>
      {loading ? (
        <ActivityIndicator size="small" color={colors.hex.purple600} />
      ) : (
        value && (
          <Text className="text-base font-medium text-black">{value}</Text>
        )
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70">
        {content}
      </Pressable>
    );
  }

  return content;
}

export interface GlassInfoCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassInfoCard({
  children,
  className = "",
}: GlassInfoCardProps) {
  const childArray = React.Children.toArray(children);

  return (
    <View
      className={`bg-gray-50 rounded-xl px-5 overflow-hidden ${className}`}
    >
      {childArray.map((child, index) => (
        <View key={index}>
          {child}
          {index < childArray.length - 1 && (
            <View className="h-px bg-gray-200" />
          )}
        </View>
      ))}
    </View>
  );
}
