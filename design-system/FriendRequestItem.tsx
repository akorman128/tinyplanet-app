import React from "react";
import { View } from "react-native";
import { Text } from "./Text";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { PendingRequest } from "@/types/friendship";
import { hapticSuccess, hapticWarning } from "@/utils";

type FriendRequestItemProps = {
  request: PendingRequest;
  onAccept?: (userId: string) => void;
  onDecline?: (userId: string) => void;
};

export function FriendRequestItem({
  request,
  onAccept,
  onDecline,
}: FriendRequestItemProps) {
  const isIncoming = request.direction === "incoming";

  return (
    <View className="flex-row items-center px-6 py-4">
      <Avatar
        fullName={request.full_name}
        avatarUrl={request.avatar_url || undefined}
        size="small"
      />
      <View className="flex-1 ml-3">
        <Text className="text-base font-semibold text-purple-900 mb-0.5">
          {request.full_name}
        </Text>
        {request.hometown && (
          <Text className="text-sm text-gray-500">{request.hometown}</Text>
        )}
      </View>
      <View className="flex-row gap-2">
        {isIncoming ? (
          <>
            <Button
              variant="primary"
              onPress={() => {
                hapticSuccess();
                onAccept?.(request.id);
              }}
            >
              Accept
            </Button>
            <Button
              variant="secondary"
              onPress={() => {
                hapticWarning();
                onDecline?.(request.id);
              }}
            >
              Decline
            </Button>
          </>
        ) : (
          <Badge variant="default">Pending</Badge>
        )}
      </View>
    </View>
  );
}
