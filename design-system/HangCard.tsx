import React, { useMemo } from "react";
import { View, Pressable, Image, Alert } from "react-native";
import { useRouter, Link } from "expo-router";
import { Text } from "./Text";
import { Avatar } from "./Avatar";
import { AvatarStack } from "./AvatarStack";
import { ImageGradient } from "./ImageGradient";
import { Icons } from "./Icons";
import { colors } from "./colors";
import { PostWithAuthor } from "@/types/post";
import { useLikePost, useUnlikePost } from "@/hooks/useLikes";
import { useSavePost, useUnsavePost } from "@/hooks/useSavedPosts";
import { useHangRsvpToggle, useDeleteHang } from "@/hooks/useHangs";
import { useSupabase } from "@/hooks/useSupabase";
import { formatTimeAgo, hapticLight } from "@/utils";
import { buildStaticMapUrl } from "@/utils/mapSnapshot";
import { formatHangWhen } from "@/utils/hangTime";
import { logger } from "@/utils/logger";

interface HangCardProps {
  post: PostWithAuthor;
  onLike: (postId: string, updates: Partial<PostWithAuthor>) => void;
  onSave: (postId: string, updates: Partial<PostWithAuthor>) => void;
  onDelete: (postId: string) => void;
  onOpenComments: (postId: string, commentCount: number) => void;
}

const BANNER_HEIGHT = 152;

/**
 * Media-forward "Scene" feed card for a Hang. Leads with a static map of the
 * location and surfaces an "I'm Going" RSVP CTA alongside the usual post actions.
 */
export function HangCard({
  post,
  onLike,
  onSave,
  onDelete,
  onOpenComments,
}: HangCardProps) {
  const hang = post.hang;
  const router = useRouter();
  const { session } = useSupabase();
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();
  const deleteHang = useDeleteHang();

  const isOwnHang = session?.user?.id === post.author.id;
  // Host is always "going" — they manage the hang, they don't RSVP.
  const {
    going,
    count: goingCount,
    pending: rsvpPending,
    toggle: handleRsvpToggle,
  } = useHangRsvpToggle(
    hang?.id ?? "",
    { going: hang?.viewer_is_going ?? false, count: hang?.attendee_count ?? 0 },
    { disabled: isOwnHang }
  );

  const isLiking = likePost.isPending || unlikePost.isPending;
  const isSaving = savePost.isPending || unsavePost.isPending;

  const bannerUrl = useMemo(
    () =>
      hang
        ? buildStaticMapUrl(hang.longitude, hang.latitude, {
            width: 780,
            height: 304,
          })
        : null,
    [hang?.longitude, hang?.latitude]
  );
  const whenLabel = useMemo(
    () => (hang ? formatHangWhen(hang.starts_at) : ""),
    [hang?.starts_at]
  );

  if (!hang) return null;

  const openDetail = () =>
    router.push({ pathname: "/hang/[hangId]", params: { hangId: hang.id } });

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

  const handleOptions = () => {
    if (!isOwnHang) return;
    Alert.alert("Hang Options", "Choose an action", [
      {
        text: "Edit Hang",
        onPress: () =>
          router.push({ pathname: "/edit-hang", params: { hangId: hang.id } }),
      },
      {
        text: "Delete Hang",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Delete Hang",
            "Delete this Hang? It will be removed from everyone's feed and map.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  try {
                    await deleteHang.mutateAsync(hang.id);
                    onDelete(post.id);
                  } catch (err) {
                    logger.error("Error deleting hang:", err);
                    Alert.alert("Error", "Failed to delete hang.");
                  }
                },
              },
            ]
          );
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View className="bg-white border-b border-gray-200">
      {/* Map banner */}
      <Pressable onPress={openDetail} style={{ height: BANNER_HEIGHT }}>
        {bannerUrl ? (
          <Image
            source={{ uri: bannerUrl }}
            style={{ width: "100%", height: BANNER_HEIGHT }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{ height: BANNER_HEIGHT }}
            className="bg-coral-tint justify-center items-center"
          >
            <Icons.pin size={28} color={colors.hex.coral} />
          </View>
        )}

        {/* Legibility gradient (transparent → dark at bottom) */}
        <ImageGradient
          stops={[
            { offset: 0.35, opacity: 0 },
            { offset: 1, opacity: 0.5 },
          ]}
        />

        {/* Time bottom-left */}
        <View className="absolute bottom-3 left-3 flex-row items-center">
          <Icons.clock size={14} color={colors.hex.white} />
          <Text className="text-xs font-medium text-white ml-1.5">
            {whenLabel}
          </Text>
        </View>

        {/* Place bottom-right */}
        <View className="absolute bottom-3 right-3 max-w-[55%]">
          <Text className="text-xs font-medium text-white" numberOfLines={1}>
            {hang.location_name}
          </Text>
        </View>
      </Pressable>

      {/* Body */}
      <View className="p-4">
        {/* Host row */}
        <View className="flex-row items-center mb-3">
          <Link
            href={{ pathname: "/profile", params: { userId: post.author.id } }}
            asChild
          >
            <Pressable>
              <Avatar
                fullName={post.author.full_name}
                avatarUrl={post.author.avatar_url}
                size="small"
              />
            </Pressable>
          </Link>
          <View className="flex-1 ml-3">
            <Text className="text-[15px] font-semibold text-gray-900">
              {post.author.full_name}
            </Text>
            <Text className="text-xs text-gray-500">
              {isOwnHang ? "You're hosting" : "invited you"} ·{" "}
              {formatTimeAgo(post.created_at)}
            </Text>
          </View>
          <Pressable onPress={handleOptions} hitSlop={8}>
            <Icons.dots size={20} color={colors.hex.gray500} />
          </Pressable>
        </View>

        {/* Title */}
        <Pressable onPress={openDetail}>
          <Text className="text-lg font-bold text-gray-900">{hang.title}</Text>
          {hang.description ? (
            <Text className="text-sm text-gray-600 mt-1" numberOfLines={1}>
              {hang.description}
            </Text>
          ) : null}
        </Pressable>

        {/* Attendees + actions */}
        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row items-center">
            {hang.attendees.length > 0 && (
              <AvatarStack
                people={hang.attendees}
                total={hang.attendee_count}
                size={26}
              />
            )}
            <Text className="text-sm text-gray-500 ml-2">
              {goingCount} going
            </Text>
          </View>

          <View className="flex-row items-center gap-4">
            <Pressable
              className="flex-row items-center"
              onPress={handleLikeToggle}
              disabled={isLiking}
            >
              <Icons.heartOutline
                size={20}
                color={
                  post.liked_by_user ? colors.hex.error : colors.hex.gray500
                }
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

            <Pressable
              className="flex-row items-center"
              onPress={() => onOpenComments(post.id, post.comment_count)}
            >
              <Icons.comment size={20} color={colors.hex.gray500} />
              {post.comment_count > 0 && (
                <Text className="text-sm text-gray-500 ml-1">
                  {post.comment_count}
                </Text>
              )}
            </Pressable>

            <Pressable onPress={handleSaveToggle} disabled={isSaving}>
              <Icons.bookmark
                size={20}
                color={
                  post.saved_by_user ? colors.hex.purple600 : colors.hex.gray500
                }
                fill={post.saved_by_user ? colors.hex.purple600 : "none"}
              />
            </Pressable>
          </View>
        </View>

        {/* RSVP CTA */}
        <Pressable
          onPress={handleRsvpToggle}
          disabled={rsvpPending || isOwnHang}
          className="mt-4 flex-row items-center justify-center rounded-xl py-3"
          style={{
            backgroundColor: isOwnHang
              ? colors.hex.gray300
              : going
                ? colors.hex.coralTint
                : colors.hex.coral,
          }}
        >
          <Icons.check
            size={18}
            color={
              isOwnHang
                ? colors.hex.gray600
                : going
                  ? colors.hex.coral
                  : colors.hex.white
            }
          />
          <Text
            className="ml-2 font-semibold"
            style={{
              color: isOwnHang
                ? colors.hex.gray600
                : going
                  ? colors.hex.coral
                  : colors.hex.white,
            }}
          >
            {isOwnHang ? "You're going" : going ? "Going" : "I'm Going"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
