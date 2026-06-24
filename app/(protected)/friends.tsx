import React, { useState } from "react";
import { View, FlatList, Alert, RefreshControl } from "react-native";
import { Stack } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Body,
  Caption,
  TabBar,
  Tab,
  LoadingState,
} from "@/design-system";
import { FriendRequestItem } from "@/design-system/FriendRequestItem";
import { VibePhoneForm } from "@/components/VibePhoneForm";
import {
  useGetPendingRequests,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
} from "@/hooks/useFriends";
import { useCreateVibe } from "@/hooks/useVibe";
import {
  useCreateInviteCode,
  useSendInviteCode,
  useGetInviteCountThisMonth,
} from "@/hooks/useInviteCodes";
import { useProfileStore } from "@/stores/profileStore";
import { useContactPicker } from "@/hooks/useContactPicker";
import { isValidVibe, extractEmojis } from "@/utils/emojiValidation";
import { formatPhoneNumber } from "@/utils";
import { logger } from "@/utils/logger";

type TabId = "requests" | "invite";

const TABS: Tab<TabId>[] = [
  { id: "requests", label: "Requests" },
  { id: "invite", label: "Invite" },
];

const vibeFormSchema = z.object({
  emojis: z
    .string()
    .min(1, "Please enter 3 emojis")
    .refine((val) => isValidVibe(val), {
      message: "Please enter exactly 3 emojis",
    }),
  phone: z.string().min(10, "Phone number is required"),
});

export default function FriendsScreen() {
  const { profileState } = useProfileStore();
  const [activeTab, setActiveTab] = useState<TabId>("requests");

  // Send Vibe form
  const form = useForm({
    resolver: zodResolver(vibeFormSchema),
    defaultValues: { emojis: "", phone: "" },
    mode: "all",
  });

  const [isSending, setIsSending] = useState(false);

  // Invite limit tracking (3 per month)
  const MONTHLY_INVITE_LIMIT = 3;
  const { data: invitesUsedThisMonth = 0 } = useGetInviteCountThisMonth();
  const invitesRemaining = MONTHLY_INVITE_LIMIT - invitesUsedThisMonth;

  const isFormValid = form.formState.isValid;

  const {
    data: pendingData,
    isLoading: requestsLoading,
    refetch: refetchPending,
  } = useGetPendingRequests();
  const incomingRequests = pendingData?.incoming ?? [];
  const acceptFriendRequest = useAcceptFriendRequest();
  const declineFriendRequest = useDeclineFriendRequest();
  const createVibe = useCreateVibe();
  const createInviteCode = useCreateInviteCode();
  const sendInviteCode = useSendInviteCode();
  const { pickContact: pickContactFromDevice } = useContactPicker();

  const handleAcceptRequest = async (userId: string) => {
    try {
      await acceptFriendRequest.mutateAsync({ fromUserId: userId });
      Alert.alert("Success", "Friend request accepted!");
    } catch (error) {
      logger.error("Error accepting friend request:", error);
      Alert.alert("Error", "Failed to accept friend request");
    }
  };

  const handleDeclineRequest = async (userId: string) => {
    try {
      await declineFriendRequest.mutateAsync({ targetUserId: userId });
    } catch (error) {
      logger.error("Error declining friend request:", error);
      Alert.alert("Error", "Failed to decline friend request");
    }
  };

  const pickContact = async () => {
    const phoneNumber = await pickContactFromDevice();
    if (phoneNumber) {
      form.setValue("phone", phoneNumber, { shouldValidate: true });
    }
  };

  const sendInvite = async () => {
    if (!isFormValid) {
      Alert.alert("Incomplete", "Please fill out the invite form");
      return;
    }

    if (invitesRemaining < 1) {
      Alert.alert(
        "Invite Limit Reached",
        `You have no invites remaining this month. You can send up to ${MONTHLY_INVITE_LIMIT} invites per month.`
      );
      return;
    }

    setIsSending(true);

    try {
      const data = form.getValues();
      const emojiArray = extractEmojis(data.emojis);
      const phoneNumber = formatPhoneNumber(data.phone);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data: inviteCodeData, code } = await createInviteCode.mutateAsync(
        {
          expires_at: expiresAt,
        }
      );

      await createVibe.mutateAsync({
        receiverId: null,
        emojis: emojiArray,
        inviteCodeId: inviteCodeData.id,
      });

      await sendInviteCode.mutateAsync({
        phone_number: phoneNumber,
        invite_code: code,
        inviter_name: profileState?.full_name,
      });

      Alert.alert("Success", "Vibe and invite sent successfully!");

      form.reset();
    } catch (error: unknown) {
      logger.error("Error sending invite:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to send invite. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = async () => {
    if (activeTab === "requests") {
      await refetchPending();
    }
  };

  const renderRequestsTab = () => (
    <View className="flex-1">
      {requestsLoading ? (
        <LoadingState className="px-6" />
      ) : incomingRequests.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Body className="text-base text-gray-400 text-center">
            No incoming requests
          </Body>
        </View>
      ) : (
        <FlatList
          data={incomingRequests}
          renderItem={({ item }) => (
            <FriendRequestItem
              request={item}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
          )}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => (
            <View className="h-[1px] bg-gray-100 mx-6" />
          )}
          contentContainerClassName="pb-6"
          refreshControl={
            <RefreshControl
              refreshing={requestsLoading}
              onRefresh={handleRefresh}
            />
          }
        />
      )}
    </View>
  );

  const renderInviteTab = () => (
    <View className="flex-1">
      <View className="p-6 gap-6">
        <View className="bg-blue-50 p-4 rounded-lg shadow-xl">
          <Caption className="text-blue-900 font-medium text-center">
            {invitesRemaining > 0
              ? `${invitesRemaining} of ${MONTHLY_INVITE_LIMIT} invites remaining this month`
              : `No invites remaining this month (${MONTHLY_INVITE_LIMIT} limit)`}
          </Caption>
        </View>

        <VibePhoneForm
          control={form.control}
          vibeError={form.formState.errors?.emojis?.message}
          phoneError={form.formState.errors?.phone?.message}
          onSelectContact={pickContact}
          showContactPicker={true}
          maxLength={3}
        />
        <Button
          variant="primary"
          onPress={sendInvite}
          disabled={!isFormValid || isSending || invitesRemaining < 1}
          className="mt-2"
        >
          {isSending ? "Sending..." : "Send Invite"}
        </Button>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: "Friends" }} />
      <View className="flex-1 bg-cream">
        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "requests" && renderRequestsTab()}
        {activeTab === "invite" && renderInviteTab()}
      </View>
    </>
  );
}
