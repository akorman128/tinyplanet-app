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
import { useComments } from "@/hooks/useComments";
import { useLikes } from "@/hooks/useLikes";
import { useListSelectionStore } from "@/stores/listSelectionStore";
import { useCommentCountStore } from "@/stores/commentCountStore";
import { CommentWithAuthor } from "@/types/comment";

const commentSchema = z.object({
  body: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment is too long")
    .trim(),
});

type CommentForm = z.infer<typeof commentSchema>;

export default function CommentsScreen() {
  const router = useRouter();
  const { postId, commentCount: commentCountParam } = useLocalSearchParams<{
    postId: string;
    commentCount: string;
  }>();

  const initialCommentCount = Number(commentCountParam) || 0;

  const { getComments, createComment } = useComments();
  const { likeComment, unlikeComment } = useLikes();
  const { selectedList, clear: clearListSelection } = useListSelectionStore();
  const setCommentCount = useCommentCountStore((s) => s.set);

  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommentWithAuthor | null>(null);
  const [currentCount, setCurrentCount] = useState(initialCommentCount);

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

  // Load comments on mount
  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      setLoading(true);
      const result = await getComments(postId);
      setComments(result.data);
    } catch (err) {
      console.error("Error loading comments:", err);
      Alert.alert("Error", "Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CommentForm) => {
    setIsSubmitting(true);

    const optimisticComment: CommentWithAuthor = {
      id: `temp-${Date.now()}`,
      post_id: postId,
      parent_comment_id: replyingTo?.id || null,
      author_id: "current-user",
      body: data.body,
      list_id: selectedList?.id || null,
      edited_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: "current-user",
        full_name: "You",
        avatar_url: "",
      },
      like_count: 0,
      liked_by_user: false,
      replies: [],
      attached_list: selectedList,
    };

    // Optimistic update
    if (replyingTo) {
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === replyingTo.id
            ? {
                ...comment,
                replies: [...(comment.replies || []), optimisticComment],
              }
            : comment
        )
      );
    } else {
      setComments((prev) => [...prev, optimisticComment]);
    }

    try {
      await createComment({
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
      // Revert optimistic update on error
      if (replyingTo) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === replyingTo.id
              ? {
                  ...comment,
                  replies: (comment.replies || []).filter(
                    (r) => r.id !== optimisticComment.id
                  ),
                }
              : comment
          )
        );
      } else {
        setComments((prev) =>
          prev.filter((c) => c.id !== optimisticComment.id)
        );
      }

      console.error("Error creating comment:", err);
      Alert.alert("Error", "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeToggle = useCallback(
    async (commentId: string, currentState: boolean) => {
      const updateCommentLike = (
        comments: CommentWithAuthor[]
      ): CommentWithAuthor[] =>
        comments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              liked_by_user: !currentState,
              like_count: currentState
                ? comment.like_count - 1
                : comment.like_count + 1,
            };
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateCommentLike(comment.replies),
            };
          }
          return comment;
        });

      setComments((prev) => updateCommentLike(prev));

      try {
        if (currentState) {
          await unlikeComment(commentId);
        } else {
          await likeComment(commentId);
        }
      } catch (err) {
        setComments((prev) => updateCommentLike(prev));
        console.error("Error toggling like:", err);
      }
    },
    [likeComment, unlikeComment]
  );

  const handleReply = useCallback((comment: CommentWithAuthor) => {
    setReplyingTo(comment);
  }, []);

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const renderComment = useCallback(
    ({ item }: { item: CommentWithAuthor }) => (
      <CommentItem
        comment={item}
        depth={0}
        onReply={handleReply}
        onLikeToggle={handleLikeToggle}
      />
    ),
    [handleReply, handleLikeToggle]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={["top"]}>
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
        <View className="px-6 py-4 border-t border-gray-200 bg-white">
          {replyingTo && (
            <View className="flex-row items-center justify-between mb-2 px-3 py-2 bg-purple-50 rounded-lg">
              <Text className="text-sm text-purple-700">
                Replying to {replyingTo.author.full_name}
              </Text>
              <Pressable onPress={handleCancelReply}>
                <Icons.close size={16} color={colors.hex.purple600} />
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
                    <Icons.list size={20} color={colors.hex.purple600} />
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
