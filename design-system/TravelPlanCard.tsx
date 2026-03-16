import React from "react";
import { View, Pressable, Alert } from "react-native";
import { Text } from "./Text";
import { useRouter, Link } from "expo-router";
import { Avatar } from "./Avatar";
import { Icons } from "./Icons";
import { colors } from "./colors";
import { PostWithAuthor } from "@/types/post";
import { useLikePost, useUnlikePost } from "@/hooks/useLikes";
import { useSavePost, useUnsavePost } from "@/hooks/useSavedPosts";
import { useDeletePost } from "@/hooks/usePosts";
import { useSupabase } from "@/hooks/useSupabase";
import { formatTimeAgo, hapticLight } from "@/utils";

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
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();
  const deletePostMutation = useDeletePost();
  const isLiking = likePost.isPending || unlikePost.isPending;
  const isSaving = savePost.isPending || unsavePost.isPending;

  const handleLikeToggle = async () => {
    if (isLiking) return;
    hapticLight();

    const wasLiked = post.liked_by_user;

    // Optimistic update
    onLike(post.id, {
      liked_by_user: !wasLiked,
      like_count: wasLiked ? post.like_count - 1 : post.like_count + 1,
    });

    try {
      if (wasLiked) {
        await unlikePost.mutateAsync(post.id);
      } else {
        await likePost.mutateAsync(post.id);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Revert optimistic update on error
      onLike(post.id, {
        liked_by_user: wasLiked,
        like_count: post.like_count,
      });
    }
  };

  const handleSaveToggle = async () => {
    if (isSaving) return;
    hapticLight();

    const wasSaved = post.saved_by_user;

    // Optimistic update
    onSave(post.id, {
      saved_by_user: !wasSaved,
    });

    try {
      if (wasSaved) {
        await unsavePost.mutateAsync(post.id);
      } else {
        await savePost.mutateAsync(post.id);
      }
    } catch (err) {
      console.error("Error toggling save:", err);
      // Revert optimistic update on error
      onSave(post.id, {
        saved_by_user: wasSaved,
      });
    }
  };

  const handleComment = () => {
    onOpenComments(post.id, post.comment_count);
  };

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
                    console.error("Error deleting travel plan:", err);
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
        duration: "",
      };
    }

    return {
      destination: match[1],
      startDate: match[2],
      endDate: match[3],
      duration: match[4],
    };
  };

  const { destination, startDate, endDate, duration } = parseTravelDetails();

  // Extract custom message if present (appended after double newline)
  const getCustomMessage = () => {
    const parts = post.text.split("\n\n");
    return parts.length > 1 ? parts.slice(1).join("\n\n").trim() : null;
  };

  const customMessage = getCustomMessage();

  return (
    <View className="flex-row px-5 py-4 border-b border-gray-200 bg-orange-50">
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

        {/* Travel Plan Badge */}
        <Text className="text-sm text-orange-600 font-medium mb-2">
          Travel Plan
        </Text>

        {/* Custom Message */}
        {customMessage && (
          <Text className="text-sm text-gray-700 mb-2">{customMessage}</Text>
        )}

        {/* Travel Details Card */}
        <View className="bg-white rounded-lg p-4 border border-orange-200 mb-2">
          <View className="flex-row items-center mb-2">
            <Text className="text-2xl mr-2">🚀</Text>
            <Text className="text-lg font-bold text-gray-900 flex-1">
              {destination}
            </Text>
          </View>

          <View className="flex-row items-center mb-1">
            <Icons.calendar size={16} color={colors.hex.gray600} />
            <Text className="text-sm text-gray-600 ml-2">
              {startDate} → {endDate}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Icons.clock size={16} color={colors.hex.gray600} />
            <Text className="text-sm text-gray-600 ml-2">
              {duration} {parseInt(duration) === 1 ? "day" : "days"}
            </Text>
          </View>
        </View>

        {/* Actions row */}
        <View className="flex-row items-center gap-4">
          {/* Like */}
          <Pressable
            className="flex-row items-center"
            onPress={handleLikeToggle}
            disabled={isLiking}
          >
            <Icons.heartOutline
              size={20}
              color={post.liked_by_user ? colors.hex.error : colors.hex.gray500}
            />
            {post.like_count > 0 && (
              <Text
                className={`text-sm ml-1 ${
                  post.liked_by_user ? "text-red-500" : "text-gray-500"
                }`}
              >
                {post.like_count}
              </Text>
            )}
          </Pressable>

          {/* Comment */}
          <Pressable className="flex-row items-center" onPress={handleComment}>
            <Icons.comment size={20} color={colors.hex.gray500} />
            {post.comment_count > 0 && (
              <Text className="text-sm text-gray-500 ml-1">
                {post.comment_count}
              </Text>
            )}
          </Pressable>

          {/* Save/Bookmark */}
          <Pressable
            className="flex-row items-center"
            onPress={handleSaveToggle}
            disabled={isSaving}
          >
            <Icons.bookmark
              size={20}
              color={
                post.saved_by_user ? colors.hex.purple600 : colors.hex.gray500
              }
              fill={post.saved_by_user ? colors.hex.purple600 : "none"}
            />
          </Pressable>
        </View>

        {post.edited_at && (
          <Text className="text-xs text-gray-500 mt-2">Edited</Text>
        )}
      </View>
    </View>
  );
}
