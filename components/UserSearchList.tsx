import React from "react";
import { View, Pressable } from "react-native";
import { Avatar, Badge, Body, Caption } from "@/design-system";
import { Friend } from "@/types/friendship";

type UserSearchListItemProps = {
  user: Friend;
  onAddFriend?: (userId: string) => void;
  onPress?: (userId: string) => void;
};

export function UserSearchListItem({
  user,
  onAddFriend,
  onPress,
}: UserSearchListItemProps) {
  return (
    <Pressable
      className="flex-row items-center px-6 py-4 active:bg-gray-50"
      onPress={() => onPress?.(user.id)}
    >
      <Avatar
        fullName={user.full_name}
        avatarUrl={user.avatar_url || undefined}
        size="small"
      />
      <View className="flex-1 ml-3">
        <Body className="font-semibold text-blue-900 mb-1">
          {user.full_name}
        </Body>
        <View className="flex-row items-center gap-2">
          {user.hometown && (
            <Caption className="text-gray-400">{user.hometown}</Caption>
          )}
          <Badge size="small" variant="secondary">
            Friend
          </Badge>
        </View>
      </View>
    </Pressable>
  );
}
