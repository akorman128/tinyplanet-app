import React, { ReactNode } from "react";
import { View, ActivityIndicator } from "react-native";
import { Text } from "./Text";
import { colors } from "./colors";

export interface InfoRowProps {
  label: string;
  value?: string | ReactNode;
  loading?: boolean;
  className?: string;
}

export function InfoRow({
  label,
  value,
  loading = false,
  className = "",
}: InfoRowProps) {
  return (
    <View className={`w-full mb-4 py-2 px-5 rounded-xl ${className}`}>
      <Text className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">
        {label}
      </Text>
      {loading ? (
        <ActivityIndicator size="small" color={colors.hex.blue500} />
      ) : (
        <>
          {typeof value === "string" ? (
            <Text className="text-base font-medium text-black">{value}</Text>
          ) : (
            value
          )}
        </>
      )}
    </View>
  );
}
