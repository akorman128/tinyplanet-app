import React, { useMemo } from "react";
import { View, Pressable, Image, Alert } from "react-native";
import { useRouter, Link } from "expo-router";
import { Text } from "./Text";
import { Avatar } from "./Avatar";
import { AvatarStack } from "./AvatarStack";
import { ImageGradient } from "./ImageGradient";
import { PostActions } from "./PostActions";
import { Icons } from "./Icons";
import { colors } from "./colors";
import { PostWithAuthor } from "@/types/post";
import { useHangRsvpToggle, useDeleteHang } from "@/hooks/useHangs";
import { useSupabase } from "@/hooks/useSupabase";
import { formatTimeAgo } from "@/utils";
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
    <View className="bg-cream border-b border-gray-200">
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
      <View className="px-5 py-4">
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
        <View className="ml-[52px]">
          {/* Title */}
          <Pressable onPress={openDetail}>
            <Text className="text-lg font-bold text-gray-900">
              {hang.title}
            </Text>
            {hang.description ? (
              <Text className="text-sm text-gray-600 mt-1" numberOfLines={1}>
                {hang.description}
              </Text>
            ) : null}
          </Pressable>

          {/* Attendees + actions */}
          <View className="flex-row items-center justify-between mt-3 mb-3">
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

            <Pressable
              onPress={handleRsvpToggle}
              disabled={rsvpPending || isOwnHang}
              className="flex-row items-center justify-center rounded-lg p-2"
              style={{
                backgroundColor: isOwnHang ? colors.hex.gray300 : colors.black,
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

          <PostActions
            post={post}
            onLike={onLike}
            onSave={onSave}
            onOpenComments={onOpenComments}
          />
        </View>
      </View>
    </View>
  );
}
