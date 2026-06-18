import React, { useState } from "react";
import {
  View,
  FlatList,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScreenHeader,
  Avatar,
  Button,
  Body,
  Subheading,
  Caption,
  colors,
  Input,
} from "@/design-system";
import { useGetFriends } from "@/hooks/useFriends";
import { useCreateIntro } from "@/hooks/useIntros";
import { Friend } from "@/types/friendship";

type Step = "pick-friend-a" | "pick-friend-b" | "write-message";

export default function CreateIntroScreen() {
  const router = useRouter();
  const friendsQuery = useGetFriends();
  const createIntro = useCreateIntro();

  const [step, setStep] = useState<Step>("pick-friend-a");
  const [friendA, setFriendA] = useState<Friend | null>(null);
  const [friendB, setFriendB] = useState<Friend | null>(null);
  const [message, setMessage] = useState("");

  const friends = friendsQuery.data?.data ?? [];

  const handlePickFriendA = (friend: Friend) => {
    setFriendA(friend);
    setStep("pick-friend-b");
  };

  const handlePickFriendB = (friend: Friend) => {
    setFriendB(friend);
    setStep("write-message");
  };

  const handleSubmit = async () => {
    if (!friendA || !friendB || !message.trim()) return;

    try {
      await createIntro.mutateAsync({
        userAId: friendA.id,
        userBId: friendB.id,
        message: message.trim(),
      });
      router.back();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create intro";
      Alert.alert("Error", errorMessage);
    }
  };

  const handleBack = () => {
    if (step === "pick-friend-b") {
      setFriendA(null);
      setStep("pick-friend-a");
    } else if (step === "write-message") {
      setFriendB(null);
      setStep("pick-friend-b");
    }
  };

  const title =
    step === "pick-friend-a"
      ? "Pick Friend A"
      : step === "pick-friend-b"
        ? "Pick Friend B"
        : "Write Intro";

  const renderFriendItem = (
    friend: Friend,
    onPress: (friend: Friend) => void
  ) => (
    <Pressable
      key={friend.id}
      onPress={() => onPress(friend)}
      className="flex-row items-center px-6 py-3"
    >
      <Avatar
        fullName={friend.full_name}
        avatarUrl={friend.avatar_url ?? undefined}
        size="small"
      />
      <Body className="ml-3 font-medium">{friend.full_name}</Body>
    </Pressable>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.hex.cream }}
      edges={["top"]}
    >
      <ScreenHeader
        title={title}
        onClose={() =>
          step === "pick-friend-a" ? router.back() : handleBack()
        }
      />

      {(step === "pick-friend-a" || step === "pick-friend-b") && (
        <FlatList
          data={
            step === "pick-friend-b"
              ? friends.filter((f) => f.id !== friendA?.id)
              : friends
          }
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            renderFriendItem(
              item,
              step === "pick-friend-a" ? handlePickFriendA : handlePickFriendB
            )
          }
          ListHeaderComponent={
            step === "pick-friend-b" && friendA ? (
              <View className="px-6 py-3 bg-purple-50 border-b border-purple-200">
                <Caption className="text-purple-700 mb-1">Introducing</Caption>
                <Body className="font-semibold">{friendA.full_name} &</Body>
              </View>
            ) : null
          }
        />
      )}

      {step === "write-message" && friendA && friendB && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 px-6 pt-4">
            <View className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <Caption className="text-purple-700 mb-1">Introducing</Caption>
              <Subheading>
                {friendA.full_name} & {friendB.full_name}
              </Subheading>
            </View>

            <Body className="font-medium mb-2">Your intro message</Body>
            <Input
              value={message}
              onChangeText={setMessage}
              placeholder="e.g. You both love hiking and live in SF!"
              multiline
              className="min-h-[120px]"
              autoFocus
            />

            <Button
              variant="primary"
              onPress={handleSubmit}
              disabled={!message.trim() || createIntro.isPending}
              className="mt-4"
            >
              {createIntro.isPending ? "Sending..." : "Send Intro"}
            </Button>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
