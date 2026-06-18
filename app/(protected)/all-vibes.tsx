import React, { useState } from "react";
import {
  View,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import {
  colors,
  Avatar,
  Icons,
  Button,
  Body,
  Meta,
  SectionTitle,
  Text,
  LoadingState,
} from "@/design-system";
import {
  useGetVibesWithSenderInfo,
  useCreateVibe,
  useHasGivenVibe,
} from "@/hooks/useVibe";
import { VibeWithSender } from "@/types/vibe";
import { formatTimeAgo } from "@/utils";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { extractEmojis } from "@/utils/emojiValidation";
import { logger } from "@/utils/logger";

export default function AllVibesScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const {
    data: vibesData,
    isLoading: loading,
    error: vibesError,
  } = useGetVibesWithSenderInfo(userId);
  const createVibe = useCreateVibe();
  const { data: hasUserGivenVibe = false } = useHasGivenVibe(userId);
  const [showModal, setShowModal] = useState(false);
  const [emojiInput, setEmojiInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profile = useRequireProfile();

  const vibes = vibesData?.data ?? [];
  const error = vibesError ? "Failed to load vibes" : null;

  const handleSubmitVibe = async () => {
    if (!userId) return;

    // Extract emojis from the input string
    const emojis = extractEmojis(emojiInput);

    if (emojis.length !== 3) {
      Alert.alert("Invalid Vibe", "Please enter exactly 3 emojis");
      return;
    }

    setIsSubmitting(true);
    try {
      await createVibe.mutateAsync({
        receiverId: userId,
        emojis: emojis,
      });

      setShowModal(false);
      setEmojiInput("");
    } catch (error) {
      logger.error("Error creating vibe:", error);
      Alert.alert("Error", "Failed to send vibe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderVibeItem = ({ item }: { item: VibeWithSender }) => (
    <View className="flex-row px-6 py-4 items-start">
      <Avatar
        fullName={item.giver.full_name}
        avatarUrl={item.giver.avatar_url || undefined}
        size="small"
      />
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between items-center mb-2">
          <Body className="font-semibold text-blue-900">
            {item.giver.full_name}
          </Body>
          <Meta className="font-medium text-gray-400">
            {formatTimeAgo(item.created_at)}
          </Meta>
        </View>
        <View className="flex-row gap-2">
          {item.emojis.map((emoji, index) => (
            <Text key={index} className="text-2xl">
              {emoji}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Vibes",
          headerRight:
            Platform.OS === "android" &&
            profile.id !== userId &&
            !hasUserGivenVibe
              ? () => (
                  <Pressable onPress={() => setShowModal(true)}>
                    <Icons.plus size={24} color={colors.hex.blue500} />
                  </Pressable>
                )
              : undefined,
        }}
      />
      {Platform.OS === "ios" && profile.id !== userId && !hasUserGivenVibe && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="plus"
            tintColor={colors.hex.blue500}
            onPress={() => setShowModal(true)}
          />
        </Stack.Toolbar>
      )}
      <View className="flex-1 bg-cream">
        {/* Content */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <View className="flex-1 justify-center items-center px-6">
            <Body className="text-gray-400 text-center">{error}</Body>
          </View>
        ) : vibes.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Body className="text-gray-400">No vibes yet</Body>
          </View>
        ) : (
          <FlatList
            data={vibes}
            renderItem={renderVibeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 16 }}
            ItemSeparatorComponent={() => (
              <View className="h-px bg-gray-100 mx-6" />
            )}
          />
        )}
      </View>

      {/* Add Vibe Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowModal(false)}
        >
          <Pressable
            className="bg-white rounded-2xl p-6 mx-6 w-[85%]"
            onPress={(e) => e.stopPropagation()}
          >
            <SectionTitle className="text-xl font-bold text-blue-900 mb-4">
              Send a Vibe
            </SectionTitle>
            <Body className="text-sm text-gray-600 mb-4">
              Enter 3 emojis to represent your vibe:
            </Body>
            <TextInput
              value={emojiInput}
              onChangeText={setEmojiInput}
              placeholder="🔥💎✨"
              className="border border-gray-300 rounded-lg p-3 mb-4 text-2xl"
              style={{ color: colors.hex.blue900 }}
              maxLength={50}
              autoFocus
            />
            <View className="flex-row gap-3">
              <Button
                variant="secondary"
                onPress={() => {
                  setShowModal(false);
                  setEmojiInput("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onPress={handleSubmitVibe}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Sending..." : "Send"}
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
