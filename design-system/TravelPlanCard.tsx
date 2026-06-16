import React from "react";
import { View, Pressable, Alert } from "react-native";
import { Text } from "./Text";
import { useRouter, Link } from "expo-router";
import { Avatar } from "./Avatar";
import { Icons } from "./Icons";
import { colors } from "./colors";
import { PostActions } from "./PostActions";
import { PostWithAuthor } from "@/types/post";
import { useDeletePost } from "@/hooks/usePosts";
import { useSupabase } from "@/hooks/useSupabase";
import { formatTimeAgo } from "@/utils";
import { logger } from "@/utils/logger";

interface TravelPlanCardProps {
  post: PostWithAuthor;
  onLike: (postId: string, updates: Partial<PostWithAuthor>) => void;
  onSave: (postId: string, updates: Partial<PostWithAuthor>) => void;
  onDelete: (postId: string) => void;
  onOpenComments: (postId: string, commentCount: number) => void;
}

/**
 * Specialized card for travel plan posts
 * Displays with distinct styling and travel-specific UI
 */
export function TravelPlanCard({
  post,
  onLike,
  onSave,
  onDelete,
  onOpenComments,
}: TravelPlanCardProps) {
  const router = useRouter();
  const { session } = useSupabase();
  const deletePostMutation = useDeletePost();

  const handleOptions = () => {
    const isOwnPost = session?.user?.id === post.author.id;

    if (!isOwnPost) {
      Alert.alert("Options", "No actions available");
      return;
    }

    Alert.alert("Travel Plan Options", "Choose an action", [
      {
        text: "Edit Travel Plan",
        onPress: () => {
          router.push({
            pathname: "/edit-travel-plan",
            params: { postId: post.id },
          });
        },
      },
      {
        text: "Delete Travel Plan",
        onPress: () => {
          Alert.alert(
            "Delete Travel Plan",
            "Are you sure you want to delete this travel plan? This will remove it from all users' feeds.",
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  try {
                    await deletePostMutation.mutateAsync(post.id);
                    onDelete(post.id);
                  } catch (err) {
                    logger.error("Error deleting travel plan:", err);
                    Alert.alert(
                      "Error",
                      "Failed to delete travel plan. Please try again."
                    );
                  }
                },
              },
            ]
          );
        },
        style: "destructive",
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  // Parse travel plan details from post text
  // Format: "🚀 Traveling to {destination} from {start} to {end} ({duration} days)"
  const parseTravelDetails = () => {
    const match = post.text.match(
      /🚀 Traveling to (.+?) from (.+?) to (.+?) \((\d+) days?\)/
    );

    if (!match) {
      return {
        destination: "Unknown",
        startDate: "",
        endDate: "",
      };
    }

    return {
      destination: match[1],
      startDate: match[2],
      endDate: match[3],
    };
  };

  const { destination, startDate, endDate } = parseTravelDetails();

  // Extract custom message if present (appended after double newline)
  const getCustomMessage = () => {
    const parts = post.text.split("\n\n");
    return parts.length > 1 ? parts.slice(1).join("\n\n").trim() : null;
  };

  const customMessage = getCustomMessage();

  return (
    <View className="flex-row px-5 py-4 border-b border-gray-200">
      <Link
        href={{ pathname: "/profile", params: { userId: post.author.id } }}
        asChild
      >
        <Pressable>
          <Link.AppleZoom>
            <View collapsable={false}>
              <Avatar
                fullName={post.author.full_name}
                avatarUrl={post.author.avatar_url}
                size="small"
              />
            </View>
          </Link.AppleZoom>
        </Pressable>
      </Link>

      <View className="flex-1 ml-3">
        {/* Header: Name • Time • Options */}
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center flex-1">
            <Text className="text-base font-semibold text-gray-900">
              {post.author.full_name}
            </Text>
            <Text className="text-sm text-gray-500 ml-2">
              • {formatTimeAgo(post.created_at)}
            </Text>
          </View>

          {/* Options */}
          <Pressable onPress={handleOptions} hitSlop={8}>
            <Icons.dots size={20} color={colors.hex.gray500} />
          </Pressable>
        </View>

        {/* Custom Message */}
        {customMessage && (
          <Text className="text-sm text-gray-700 mb-2">{customMessage}</Text>
        )}

        <View className="flex-row rounded-xl overflow-hidden mb-2">
          <View className="w-1 bg-gray-600" />
          <View className="flex-1 bg-gray-50 p-4">
            <View className="flex-row items-center">
              <Text className="text-xl mr-2">🚀</Text>
              <Text className="text-lg font-bold text-gray-900 flex-1">
                {destination}
              </Text>
            </View>

            <View className="flex-row items-center border-t border-gray-200 mt-3 pt-3">
              <View className="flex-1">
                <Text className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                  Depart
                </Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {startDate}
                </Text>
              </View>
              <Icons.arrowRight size={16} color={colors.hex.gray600} />
              <View className="flex-1 items-end">
                <Text className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                  Return
                </Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {endDate}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <PostActions
          post={post}
          onLike={onLike}
          onSave={onSave}
          onOpenComments={onOpenComments}
        />

        {post.edited_at && (
          <Text className="text-xs text-gray-500 mt-2">Edited</Text>
        )}
      </View>
    </View>
  );
}
