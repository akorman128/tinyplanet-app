import React from "react";
import { View } from "react-native";
import { Text } from "./Text";

interface DateSeparatorProps {
  label: string;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ label }) => (
  <View className="py-3 items-center">
    <Text className="text-xs text-gray-400">{label}</Text>
  </View>
);
