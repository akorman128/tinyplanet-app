import React from "react";
import { View, FlatList, Pressable } from "react-native";
import { Stack } from "expo-router";
import { Avatar, Badge, Body, EmptyState } from "@/design-system";
import { useGetBlockedUsers, useUnblockUser } from "@/hooks/useBlock";
import { BlockedUser } from "@/types/block";

function BlockedUserRow({ user }: { user: BlockedUser }) {
  const unblock = useUnblockUser();

  return (
    <View className="flex-row items-center justify-between px-6 py-3">
      <View className="flex-row items-center gap-3 flex-1">
        <Avatar
          fullName={user.full_name}
          avatarUrl={user.avatar_url ?? undefined}
          size="small"
        />
        <Body className="text-black flex-1" numberOfLines={1}>
          {user.full_name}
        </Body>
      </View>
      <Pressable
        onPress={() => unblock.mutate({ targetUserId: user.id })}
        disabled={unblock.isPending}
      >
        <Badge variant="default" size="small">
          Unhide
        </Badge>
      </Pressable>
    </View>
  );
}

export default function BlockedUsersScreen() {
  const { data: blockedUsers, isPending } = useGetBlockedUsers();

  return (
    <>
      <Stack.Screen options={{ title: "Hidden Users" }} />
      <View className="flex-1 bg-cream">
        <FlatList
          data={blockedUsers ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BlockedUserRow user={item} />}
          ListEmptyComponent={
            !isPending ? (
              <EmptyState message="You haven't hidden anyone" />
            ) : null
          }
        />
      </View>
    </>
  );
}
