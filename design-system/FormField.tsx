import React from "react";
import { View } from "react-native";
import { Text } from "./Text";

export interface FormFieldProps {
  label?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Label + control + error wrapper for form fields whose control does NOT render
 * its own label/error (date pickers, segmented selectors, custom inputs).
 * Mirrors the label/error treatment built into <Input> so custom-control fields
 * are visually consistent with text inputs.
 */
export function FormField({
  label,
  error,
  className = "",
  children,
}: FormFieldProps) {
  return (
    <View className={`w-full ${className}`}>
      {label && (
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          {label}
        </Text>
      )}
      {children}
      {error && <Text className="text-sm text-red-500 mt-1">{error}</Text>}
    </View>
  );
}
