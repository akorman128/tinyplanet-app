import React from "react";
import { View } from "react-native";
import { Avatar } from "./Avatar";
import { Body, Caption } from "./Typography";

export interface IntroBannerProps {
  introducerName: string;
  introducerAvatarUrl: string | null;
  message: string;
}

export function IntroBanner({
  introducerName,
  introducerAvatarUrl,
  message,
}: IntroBannerProps) {
  return (
    <View className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <View className="flex-row items-center mb-2">
        <Avatar
          fullName={introducerName}
          avatarUrl={introducerAvatarUrl ?? undefined}
          size="small"
        />
        <Body className="ml-2 font-semibold text-purple-900">
          {introducerName} introed you
        </Body>
      </View>
      <Caption className="text-gray-700">{message}</Caption>
    </View>
  );
}
