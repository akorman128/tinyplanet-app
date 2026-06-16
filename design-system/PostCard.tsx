import React from "react";
import { View, Pressable, Alert } from "react-native";
import { Text } from "./Text";
import { useRouter, Link } from "expo-router";
import { Avatar } from "./Avatar";
import { Icons } from "./Icons";
import { colors } from "./colors";
import { ListChip } from "./ListChip";
import { PostActions } from "./PostActions";
import { PostWithAuthor } from "@/types/post";
import { useDeletePost } from "@/hooks/usePosts";
import { useSupabase } from "@/hooks/useSupabase";
import { formatTimeAgo } from "@/utils";
import { logger } from "@/utils/logger";

interface PostCardProps {
  post: PostWithAuthor;
  onLike: (postId: string, updates: Partial<PostWithAuthor>) => void;
  onSave: (postId: string, updates: Partial<PostWithAuthor>) => void;
  onDelete: (postId: string) => void;
  onOpenComments: (postId: string, commentCount: number) => void;
}

export function PostCard({
  post,
  onLike,
  onSave,
  onDelete,
  onOpenComments,
}: PostCardProps) {
  const router = useRouter();
  const { session } = useSupabase();
  const deletePostMutation = useDeletePost();

  const handleOptions = () => {
    const isOwnPost = session?.user?.id === post.author.id;

    if (!isOwnPost) {
      Alert.alert("Options", "No actions available");
      return;
    }

    Alert.alert("Post Options", "Choose an action", [
      {
        text: "Edit",
        onPress: () => {
          router.push({
            pathname: "/edit-post",
            params: { postId: post.id },
          });
        },
      },
      {
        text: "Delete Post",
        onPress: () => {
          Alert.alert(
            "Delete Post",
            "Are you sure you want to delete this post? This will remove it from all users' feeds.",
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
                    logger.error("Error deleting post:", err);
                    Alert.alert(
                      "Error",
                      "Failed to delete post. Please try again."
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

  const visibilityIcon = {
    public: null,
    friends: <Icons.unlocked size={14} color={colors.hex.gray500} />,
    mutuals: <Icons.lock size={14} color={colors.hex.gray500} />,
  }[post.visibility];

  return (
    <Pressable className="flex-row px-5 py-4 border-b border-gray-200">
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
            <Text className="text-sm font-semibold text-gray-900">
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

        {/* Post text */}
        <Text className="text-sm text-gray-900 leading-5 mb-2">
          {post.text}
        </Text>

        {/* Attached list */}
        {post.attached_list && (
          <View className="mb-2">
            <ListChip list={post.attached_list} />
          </View>
        )}

        <PostActions
          post={post}
          onLike={onLike}
          onSave={onSave}
          onOpenComments={onOpenComments}
          trailing={
            visibilityIcon ? (
              <View className="flex-row items-center">
                {visibilityIcon}
                <Text className="text-xs text-gray-500 ml-1 capitalize">
                  {post.visibility}
                </Text>
              </View>
            ) : undefined
          }
        />
      </View>
    </Pressable>
  );
}
