import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Stack } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  colors,
  Button,
  Body,
  Caption,
  TabBar,
  Tab,
} from "@/design-system";
import { FriendRequestItem } from "@/design-system/FriendRequestItem";
import { VibePhoneForm } from "@/components/VibePhoneForm";
import { useGetPendingRequests, useAcceptFriendRequest, useDeclineFriendRequest } from "@/hooks/useFriends";
import { useCreateVibe } from "@/hooks/useVibe";
import { useCreateInviteCode, useSendInviteCode, useGetInviteCountThisMonth } from "@/hooks/useInviteCodes";
import { useProfileStore } from "@/stores/profileStore";
import { useContactPicker } from "@/hooks/useContactPicker";
import { isValidVibe, extractEmojis } from "@/utils/emojiValidation";
import { formatPhoneNumber } from "@/utils";

type TabId = "requests" | "invite";

const TABS: Tab[] = [
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

  // Send Vibe forms
  const form1 = useForm({
    resolver: zodResolver(vibeFormSchema),
    defaultValues: { emojis: "", phone: "" },
    mode: "all",
  });

  const form2 = useForm({
    resolver: zodResolver(vibeFormSchema),
    defaultValues: { emojis: "", phone: "" },
    mode: "all",
  });

  const forms = [form1, form2];
  const [isSending, setIsSending] = useState(false);

  // Invite limit tracking (3 per month)
  const MONTHLY_INVITE_LIMIT = 3;
  const { data: invitesUsedThisMonth = 0 } = useGetInviteCountThisMonth();
  const invitesRemaining = MONTHLY_INVITE_LIMIT - invitesUsedThisMonth;

  const allFormsValid = form1.formState.isValid && form2.formState.isValid;

  const { data: pendingData, isLoading: requestsLoading, refetch: refetchPending } = useGetPendingRequests();
  const incomingRequests = pendingData?.incoming ?? [];
  const acceptFriendRequest = useAcceptFriendRequest();
  const declineFriendRequest = useDeclineFriendRequest();
  const createVibe = useCreateVibe();
  const createInviteCode = useCreateInviteCode();
  const sendInviteCode = useSendInviteCode();
  const { pickContact: pickContactFromDevice } = useContactPicker();

  const handleAcceptRequest = useCallback(
    async (userId: string) => {
      try {
        await acceptFriendRequest.mutateAsync({ fromUserId: userId });
        Alert.alert("Success", "Friend request accepted!");
      } catch (error) {
        console.error("Error accepting friend request:", error);
        Alert.alert("Error", "Failed to accept friend request");
      }
    },
    [acceptFriendRequest]
  );

  const handleDeclineRequest = useCallback(
    async (userId: string) => {
      try {
        await declineFriendRequest.mutateAsync({ targetUserId: userId });
      } catch (error) {
        console.error("Error declining friend request:", error);
        Alert.alert("Error", "Failed to decline friend request");
      }
    },
    [declineFriendRequest]
  );

  const pickContact = async (formIndex: number) => {
    const phoneNumber = await pickContactFromDevice();
    if (phoneNumber) {
      forms[formIndex].setValue("phone", phoneNumber, { shouldValidate: true });
    }
  };

  const sendAllInvites = async () => {
    if (!allFormsValid) {
      Alert.alert("Incomplete", "Please fill out both invite forms");
      return;
    }

    if (invitesRemaining < 2) {
      Alert.alert(
        "Invite Limit Reached",
        `You only have ${invitesRemaining} invite${invitesRemaining === 1 ? "" : "s"} remaining this month. You can send up to ${MONTHLY_INVITE_LIMIT} invites per month.`
      );
      return;
    }

    setIsSending(true);

    try {
      const formData = [form1.getValues(), form2.getValues()];

      const sendPromises = formData.map(async (data) => {
        const emojiArray = extractEmojis(data.emojis);
        const phoneNumber = formatPhoneNumber(data.phone);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const { data: inviteCodeData, code } = await createInviteCode.mutateAsync({
          expires_at: expiresAt,
        });

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
      });

      await Promise.all(sendPromises);

      Alert.alert("Success", "Vibes and invites sent successfully!");

      form1.reset();
      form2.reset();
    } catch (error: any) {
      console.error("Error sending invites:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to send invites. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    if (activeTab === "requests") {
      await refetchPending();
    }
  }, [activeTab, refetchPending]);

  const renderRequestsTab = () => (
    <View className="flex-1">
      {requestsLoading ? (
        <View className="flex-1 justify-center items-center px-6">
          <ActivityIndicator size="large" color={colors.hex.purple600} />
        </View>
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
            <RefreshControl refreshing={requestsLoading} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );

  const renderInviteTab = () => (
    <View className="flex-1">
      <View className="p-6 gap-6">
        <View className="bg-purple-50 p-4 rounded-lg">
          <Caption className="text-purple-900 font-medium text-center">
            {invitesRemaining > 0
              ? `${invitesRemaining} of ${MONTHLY_INVITE_LIMIT} invites remaining this month`
              : `No invites remaining this month (${MONTHLY_INVITE_LIMIT} limit)`}
          </Caption>
        </View>

        <VibePhoneForm
          control={form1.control}
          vibeError={form1.formState.errors?.emojis?.message}
          phoneError={form1.formState.errors?.phone?.message}
          onSelectContact={() => pickContact(0)}
          showContactPicker={true}
          maxLength={3}
        />
        <Button
          variant="primary"
          onPress={sendAllInvites}
          disabled={!allFormsValid || isSending || invitesRemaining < 2}
          className="mt-2"
        >
          {isSending ? "Sending..." : "Send Invites"}
        </Button>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: "Friends" }} />
      <View className="flex-1 bg-white">
        <TabBar
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as TabId)}
        />

        {activeTab === "requests" && renderRequestsTab()}
        {activeTab === "invite" && renderInviteTab()}
      </View>
    </>
  );
}
