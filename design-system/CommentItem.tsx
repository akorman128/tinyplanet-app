import React, { useState } from "react";
import { View, Pressable, Alert } from "react-native";
import { Text } from "./Text";
import { Avatar } from "./Avatar";
import { Icons } from "./Icons";
import { Input } from "./Input";
import { colors } from "./colors";
import { ListChip } from "./ListChip";
import { CommentWithAuthor } from "@/types/comment";
import { formatTimeAgo, hapticLight } from "@/utils";

const MAX_COMMENT_LENGTH = 500;

interface CommentItemProps {
  comment: CommentWithAuthor;
  depth: number;
  currentUserId: string;
  onReply: (comment: CommentWithAuthor) => void;
  onLikeToggle: (commentId: string, currentState: boolean) => void;
  onEdit: (commentId: string, newBody: string) => Promise<void>;
  onDelete: (comment: CommentWithAuthor) => void;
}

export function CommentItem({
  comment,
  depth,
  currentUserId,
  onReply,
  onLikeToggle,
  onEdit,
  onDelete,
}: CommentItemProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [isSaving, setIsSaving] = useState(false);

  // A just-posted comment still has a temp id, so it can't be edited or deleted
  // until the create round-trip replaces it with the saved row.
  const canModify =
    comment.author_id === currentUserId && !comment.id.startsWith("temp-");
  const trimmedDraft = draft.trim();
  const saveDisabled = isSaving || trimmedDraft.length === 0;

  const handleLikeToggle = async () => {
    if (isLiking) return;
    hapticLight();

    setIsLiking(true);
    try {
      await onLikeToggle(comment.id, comment.liked_by_user);
    } finally {
      setIsLiking(false);
    }
  };

  const handleReply = () => {
    onReply(comment);
  };

  const startEdit = () => {
    setDraft(comment.body);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft(comment.body);
  };

  const saveEdit = async () => {
    if (!trimmedDraft || trimmedDraft === comment.body) {
      cancelEdit();
      return;
    }

    setIsSaving(true);
    try {
      await onEdit(comment.id, trimmedDraft);
      setIsEditing(false);
    } catch {
      // onEdit surfaces its own error alert; keep the editor open to retry.
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => {
    const hasReplies = (comment.replies?.length ?? 0) > 0;
    Alert.alert(
      "Delete Comment",
      hasReplies
        ? "Deleting this comment will also delete its replies. This can't be undone."
        : "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(comment),
        },
      ]
    );
  };

  const handleOptions = () => {
    Alert.alert("Comment Options", "Choose an action", [
      { text: "Edit", onPress: startEdit },
      { text: "Delete", style: "destructive", onPress: confirmDelete },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Limit visual depth to 1 level
  const visualDepth = Math.min(depth, 1);
  const indentClass =
    visualDepth === 1 ? "ml-10 pl-3 border-l border-gray-200" : "";

  return (
    <View className={`py-3 ${indentClass}`}>
      <View className="flex-row">
        <Avatar
          fullName={comment.author.full_name}
          avatarUrl={comment.author.avatar_url}
          size="small"
        />

        <View className="flex-1 ml-3">
          {/* Author name and timestamp */}
          <View className="flex-row items-center mb-1">
            <Text className="text-sm font-semibold text-gray-900">
              {comment.author.full_name}
            </Text>
            <Text className="text-xs text-gray-500 ml-2">
              {formatTimeAgo(comment.created_at)}
            </Text>
            {comment.edited_at && (
              <Text className="text-xs text-gray-500 ml-1">(edited)</Text>
            )}
            {canModify && !isEditing && (
              <Pressable
                onPress={handleOptions}
                hitSlop={8}
                className="ml-auto"
              >
                <Icons.dots size={18} color={colors.hex.gray500} />
              </Pressable>
            )}
          </View>

          {/* Comment body (or inline editor) */}
          {isEditing ? (
            <View className="mb-2">
              <Input
                value={draft}
                onChangeText={setDraft}
                multiline
                autoFocus
                maxLength={MAX_COMMENT_LENGTH}
                className="max-h-[120px]"
              />
              <View className="flex-row justify-end items-center gap-3 mt-2">
                <Pressable onPress={cancelEdit} disabled={isSaving}>
                  <Text className="text-sm font-medium text-gray-600">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={saveEdit}
                  disabled={saveDisabled}
                  className={`px-4 py-2 rounded-lg ${
                    saveDisabled ? "bg-gray-300" : "bg-blue-500"
                  }`}
                >
                  <Text className="text-sm font-semibold text-white">
                    {isSaving ? "Saving..." : "Save"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text className="text-sm text-gray-900 leading-5 mb-2">
              {comment.body}
            </Text>
          )}

          {/* Attached list */}
          {comment.attached_list && !isEditing && (
            <View className="mb-2">
              <ListChip list={comment.attached_list} size="small" />
            </View>
          )}

          {/* Actions: Like and Reply */}
          {!isEditing && (
            <View className="flex-row items-center gap-4">
              {/* Like button */}
              <Pressable
                className="flex-row items-center"
                onPress={handleLikeToggle}
                disabled={isLiking}
              >
                <Icons.heartOutline
                  size={16}
                  color={
                    comment.liked_by_user
                      ? colors.hex.error
                      : colors.hex.gray500
                  }
                />
                {comment.like_count > 0 && (
                  <Text
                    className={`text-xs ml-1 ${
                      comment.liked_by_user ? "text-red-500" : "text-gray-500"
                    }`}
                  >
                    {comment.like_count}
                  </Text>
                )}
              </Pressable>

              {/* Reply button */}
              <Pressable onPress={handleReply}>
                <Text className="text-xs font-medium text-gray-600">Reply</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Render nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              onReply={onReply}
              onLikeToggle={onLikeToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </View>
      )}
    </View>
  );
}
