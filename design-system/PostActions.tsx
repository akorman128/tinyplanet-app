import React from "react";
import { View, Pressable } from "react-native";
import { Text } from "./Text";
import { Icons } from "./Icons";
import { colors } from "./colors";
import { PostWithAuthor } from "@/types/post";
import { useLikePost, useUnlikePost } from "@/hooks/useLikes";
import { useSavePost, useUnsavePost } from "@/hooks/useSavedPosts";
import { hapticLight } from "@/utils";
import { logger } from "@/utils/logger";

export interface PostActionsProps {
  post: Pick<
    PostWithAuthor,
    "id" | "liked_by_user" | "like_count" | "comment_count" | "saved_by_user"
  >;
  onLike: (postId: string, updates: Partial<PostWithAuthor>) => void;
  onSave: (postId: string, updates: Partial<PostWithAuthor>) => void;
  onOpenComments: (postId: string, commentCount: number) => void;
  leading?: React.ReactNode;
  className?: string;
}

export function PostActions({
  post,
  onLike,
  onSave,
  onOpenComments,
  leading,
  className = "flex-row items-center gap-4",
}: PostActionsProps) {
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();
  const isLiking = likePost.isPending || unlikePost.isPending;
  const isSaving = savePost.isPending || unsavePost.isPending;

  const handleLikeToggle = async () => {
    if (isLiking) return;
    hapticLight();

    const wasLiked = post.liked_by_user;
    onLike(post.id, {
      liked_by_user: !wasLiked,
      like_count: wasLiked ? post.like_count - 1 : post.like_count + 1,
    });

    try {
      if (wasLiked) await unlikePost.mutateAsync(post.id);
      else await likePost.mutateAsync(post.id);
    } catch (err) {
      logger.error("Error toggling like:", err);
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
    onSave(post.id, { saved_by_user: !wasSaved });

    try {
      if (wasSaved) await unsavePost.mutateAsync(post.id);
      else await savePost.mutateAsync(post.id);
    } catch (err) {
      logger.error("Error toggling save:", err);
      onSave(post.id, { saved_by_user: wasSaved });
    }
  };

  const handleComment = () => {
    onOpenComments(post.id, post.comment_count);
  };

  return (
    <View className={className}>
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

      <Pressable className="flex-row items-center" onPress={handleComment}>
        <Icons.comment size={20} color={colors.hex.gray500} />
        {post.comment_count > 0 && (
          <Text className="text-sm text-gray-500 ml-1">
            {post.comment_count}
          </Text>
        )}
      </Pressable>

      <Pressable
        className="flex-row items-center"
        onPress={handleSaveToggle}
        disabled={isSaving}
      >
        <Icons.bookmark
          size={20}
          color={post.saved_by_user ? colors.hex.gray900 : colors.hex.gray500}
          fill={post.saved_by_user ? colors.hex.gray900 : "none"}
        />
      </Pressable>
      {leading}
    </View>
  );
}
