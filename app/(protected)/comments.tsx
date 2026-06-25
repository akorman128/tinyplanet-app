import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  Icons,
  colors,
  LoadingState,
  EmptyState,
  ListChip,
  CommentInput,
  Text,
  ScreenHeader,
} from "@/design-system";
import { CommentItem } from "@/design-system/CommentItem";
import {
  useGetComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  GetCommentsOutput,
} from "@/hooks/useComments";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { useLikeComment, useUnlikeComment } from "@/hooks/useLikes";
import { useListSelectionStore } from "@/stores/listSelectionStore";
import { useCommentCountStore } from "@/stores/commentCountStore";
import { queryKeys } from "@/lib/queryKeys";
import { CommentWithAuthor } from "@/types/comment";
import { logger } from "@/utils/logger";

const commentSchema = z.object({
  body: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment is too long")
    .trim(),
});

type CommentForm = z.infer<typeof commentSchema>;

// Pure tree transforms applied to the react-query cache (single source of truth).
const insertComment = (
  list: CommentWithAuthor[],
  comment: CommentWithAuthor
): CommentWithAuthor[] => {
  if (!comment.parent_comment_id) return [...list, comment];
  return list.map((c) =>
    c.id === comment.parent_comment_id
      ? { ...c, replies: [...(c.replies ?? []), comment] }
      : c.replies?.length
        ? { ...c, replies: insertComment(c.replies, comment) }
        : c
  );
};

const removeComment = (
  list: CommentWithAuthor[],
  commentId: string
): CommentWithAuthor[] =>
  list
    .filter((c) => c.id !== commentId)
    .map((c) =>
      c.replies?.length
        ? { ...c, replies: removeComment(c.replies, commentId) }
        : c
    );

const editCommentBody = (
  list: CommentWithAuthor[],
  commentId: string,
  body: string,
  editedAt: string
): CommentWithAuthor[] =>
  list.map((c) =>
    c.id === commentId
      ? { ...c, body, edited_at: editedAt }
      : c.replies?.length
        ? {
            ...c,
            replies: editCommentBody(c.replies, commentId, body, editedAt),
          }
        : c
  );

const toggleCommentLike = (
  list: CommentWithAuthor[],
  commentId: string,
  currentlyLiked: boolean
): CommentWithAuthor[] =>
  list.map((c) =>
    c.id === commentId
      ? {
          ...c,
          liked_by_user: !currentlyLiked,
          like_count: currentlyLiked ? c.like_count - 1 : c.like_count + 1,
        }
      : c.replies?.length
        ? {
            ...c,
            replies: toggleCommentLike(c.replies, commentId, currentlyLiked),
          }
        : c
  );

// A delete cascade-removes the whole reply subtree, so comment_count drops by it.
const countSubtree = (comment: CommentWithAuthor): number =>
  1 + (comment.replies?.reduce((sum, r) => sum + countSubtree(r), 0) ?? 0);

export default function CommentsScreen() {
  const router = useRouter();
  const { postId, commentCount: commentCountParam } = useLocalSearchParams<{
    postId: string;
    commentCount: string;
  }>();

  const initialCommentCount = Number(commentCountParam) || 0;

  const profile = useRequireProfile();
  const queryClient = useQueryClient();
  const { data: commentsData, isPending: loading } = useGetComments(postId);
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const likeComment = useLikeComment();
  const unlikeComment = useUnlikeComment();
  const { selectedList, clear: clearListSelection } = useListSelectionStore();
  const setCommentCount = useCommentCountStore((s) => s.set);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommentWithAuthor | null>(null);
  const [currentCount, setCurrentCount] = useState(initialCommentCount);

  const comments = commentsData?.data ?? [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: "" },
    mode: "onChange",
  });

  // Clear list selection on unmount
  useEffect(() => {
    return () => clearListSelection();
  }, [clearListSelection]);

  const onSubmit = async (data: CommentForm) => {
    setIsSubmitting(true);

    const optimisticComment: CommentWithAuthor = {
      id: `temp-${Date.now()}`,
      post_id: postId,
      parent_comment_id: replyingTo?.id || null,
      author_id: profile.id,
      body: data.body,
      list_id: selectedList?.id || null,
      edited_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
      },
      like_count: 0,
      liked_by_user: false,
      replies: [],
      attached_list: selectedList,
    };

    const key = queryKeys.comments.byPost(postId);
    queryClient.setQueryData<GetCommentsOutput>(key, (old) => ({
      data: insertComment(old?.data ?? [], optimisticComment),
    }));

    try {
      await createComment.mutateAsync({
        post_id: postId,
        parent_comment_id: replyingTo?.id || null,
        body: data.body,
        list_id: selectedList?.id || null,
      });

      const newCount = currentCount + 1;
      setCurrentCount(newCount);
      setCommentCount(postId, newCount);

      reset();
      setReplyingTo(null);
      clearListSelection();
    } catch (err) {
      queryClient.setQueryData<GetCommentsOutput>(key, (old) =>
        old
          ? { ...old, data: removeComment(old.data, optimisticComment.id) }
          : old
      );
      logger.error("Error creating comment:", err);
      Alert.alert("Error", "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeToggle = useCallback(
    async (commentId: string, currentState: boolean) => {
      const key = queryKeys.comments.byPost(postId);
      const previous = queryClient.getQueryData<GetCommentsOutput>(key);

      queryClient.setQueryData<GetCommentsOutput>(key, (old) =>
        old
          ? {
              ...old,
              data: toggleCommentLike(old.data, commentId, currentState),
            }
          : old
      );

      try {
        if (currentState) await unlikeComment.mutateAsync(commentId);
        else await likeComment.mutateAsync(commentId);
      } catch (err) {
        if (previous) queryClient.setQueryData(key, previous);
        logger.error("Error toggling like:", err);
      }
    },
    [postId, queryClient, likeComment, unlikeComment]
  );

  const handleReply = useCallback((comment: CommentWithAuthor) => {
    setReplyingTo(comment);
  }, []);

  const handleEditComment = useCallback(
    async (commentId: string, newBody: string) => {
      const key = queryKeys.comments.byPost(postId);
      const previous = queryClient.getQueryData<GetCommentsOutput>(key);
      const editedAt = new Date().toISOString();

      queryClient.setQueryData<GetCommentsOutput>(key, (old) =>
        old
          ? {
              ...old,
              data: editCommentBody(old.data, commentId, newBody, editedAt),
            }
          : old
      );

      try {
        await updateComment.mutateAsync({
          commentId,
          input: { body: newBody },
        });
      } catch (err) {
        if (previous) queryClient.setQueryData(key, previous);
        logger.error("Error editing comment:", err);
        Alert.alert("Error", "Failed to edit comment");
        throw err;
      }
    },
    [postId, queryClient, updateComment]
  );

  const handleDeleteComment = useCallback(
    async (comment: CommentWithAuthor) => {
      const key = queryKeys.comments.byPost(postId);
      const previous = queryClient.getQueryData<GetCommentsOutput>(key);
      const removed = countSubtree(comment);

      queryClient.setQueryData<GetCommentsOutput>(key, (old) =>
        old ? { ...old, data: removeComment(old.data, comment.id) } : old
      );

      const prevCount = currentCount;
      const newCount = Math.max(0, prevCount - removed);
      setCurrentCount(newCount);
      setCommentCount(postId, newCount);

      try {
        await deleteComment.mutateAsync(comment.id);
      } catch (err) {
        if (previous) queryClient.setQueryData(key, previous);
        setCurrentCount(prevCount);
        setCommentCount(postId, prevCount);
        logger.error("Error deleting comment:", err);
        Alert.alert("Error", "Failed to delete comment");
      }
    },
    [postId, currentCount, queryClient, deleteComment, setCommentCount]
  );

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const renderComment = useCallback(
    ({ item }: { item: CommentWithAuthor }) => (
      <CommentItem
        comment={item}
        depth={0}
        currentUserId={profile.id}
        onReply={handleReply}
        onLikeToggle={handleLikeToggle}
        onEdit={handleEditComment}
        onDelete={handleDeleteComment}
      />
    ),
    [
      profile.id,
      handleReply,
      handleLikeToggle,
      handleEditComment,
      handleDeleteComment,
    ]
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.hex.cream }}
      edges={["top"]}
    >
      <ScreenHeader title="Comments" onClose={() => router.back()} />

      {loading ? (
        <View className="flex-1 justify-center">
          <LoadingState />
        </View>
      ) : comments.length === 0 ? (
        <View className="flex-1 justify-center">
          <EmptyState message="Start yapping..." />
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-6 pb-4"
          ItemSeparatorComponent={() => (
            <View className="h-px bg-gray-100 my-2" />
          )}
          className="flex-1"
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View className="px-6 py-4 border-t border-gray-200 bg-cream">
          {replyingTo && (
            <View className="flex-row items-center justify-between mb-2 px-3 py-2 bg-blue-50 rounded-lg">
              <Text className="text-sm text-blue-600">
                Replying to {replyingTo.author.full_name}
              </Text>
              <Pressable onPress={handleCancelReply}>
                <Icons.close size={16} color={colors.hex.blue500} />
              </Pressable>
            </View>
          )}

          {selectedList && (
            <View className="flex-row items-center mb-2">
              <View className="flex-1">
                <ListChip list={selectedList} size="small" />
              </View>
              <Pressable onPress={clearListSelection} className="ml-2 p-1">
                <Icons.close size={14} color={colors.hex.gray500} />
              </Pressable>
            </View>
          )}

          <Controller
            control={control}
            name="body"
            render={({ field }) => (
              <CommentInput
                value={field.value}
                onChangeText={field.onChange}
                onSubmit={handleSubmit(onSubmit)}
                placeholder="Add comment..."
                isSubmitting={isSubmitting}
                error={errors.body?.message}
                submitDisabled={!!errors.body}
                rightAction={
                  <Pressable
                    onPress={() => router.push("/select-list")}
                    className="p-4 rounded-lg bg-gray-100 h-15 w-11 items-center justify-center"
                  >
                    <Icons.list size={20} color={colors.hex.blue500} />
                  </Pressable>
                }
              />
            )}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
