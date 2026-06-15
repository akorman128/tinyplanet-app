import React, { useEffect, useMemo } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Linking,
  Platform,
  Share,
} from "react-native";
import { useRouter, Stack, useLocalSearchParams, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import {
  LoadingState,
  ErrorState,
  Avatar,
  ImageGradient,
  Text,
  Icons,
  colors,
} from "@/design-system";
import {
  useGetHangDetail,
  useDeleteHang,
  useHangRsvpToggle,
  useSubscribeToHangAttendees,
} from "@/hooks/useHangs";
import { queryKeys } from "@/lib/queryKeys";
import { buildStaticMapUrl } from "@/utils/mapSnapshot";
import {
  formatHangWhen,
  formatHangDateLong,
  formatHangTimeRange,
} from "@/utils/hangTime";
import { addHangToCalendar } from "@/utils/addToCalendar";
import { logger } from "@/utils/logger";
import { HangDetail } from "@/types/hang";

const HERO_HEIGHT = 308;

export default function HangDetailScreen() {
  const { hangId } = useLocalSearchParams<{ hangId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const { data: hang, isPending, error } = useGetHangDetail(hangId);
  const deleteHang = useDeleteHang();
  const subscribe = useSubscribeToHangAttendees();

  // Live attendee updates
  useEffect(() => {
    if (!hangId) return;
    const unsub = subscribe(hangId, () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.hangs.detail(hangId),
      });
    });
    return unsub;
  }, [hangId, subscribe, queryClient]);

  if (isPending) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-cream">
          <LoadingState />
        </View>
      </>
    );
  }

  if (error || !hang) {
    return (
      <>
        <Stack.Screen options={{ title: "Hang", headerShown: true }} />
        <View className="flex-1 bg-cream">
          <ErrorState message="This Hang is no longer available." />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <HangDetailContent
        hang={hang}
        insets={insets}
        onBack={() => router.back()}
        onEdit={() =>
          router.push({ pathname: "/edit-hang", params: { hangId: hang.id } })
        }
        onDelete={async () => {
          try {
            await deleteHang.mutateAsync(hang.id);
            router.back();
          } catch (err) {
            logger.error("Error deleting hang:", err);
            Alert.alert("Error", "Failed to delete hang.");
          }
        }}
      />
    </>
  );
}

function HangDetailContent({
  hang,
  insets,
  onBack,
  onEdit,
  onDelete,
}: {
  hang: HangDetail;
  insets: { top: number; bottom: number };
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const heroUrl = useMemo(
    () =>
      buildStaticMapUrl(hang.longitude, hang.latitude, {
        width: 800,
        height: 620,
      }),
    [hang.longitude, hang.latitude]
  );

  const {
    going,
    pending: rsvpPending,
    toggle: handleRsvpToggle,
  } = useHangRsvpToggle(hang.id, { going: hang.viewer_is_going });

  const eyebrowDay = formatHangWhen(hang.starts_at)
    .split(" · ")[0]
    .toUpperCase();

  const handleOpenMaps = async () => {
    const q = `${hang.latitude},${hang.longitude}`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
    if (Platform.OS === "ios") {
      const iosUrl = `comgooglemaps://?q=${q}`;
      if (await Linking.canOpenURL(iosUrl)) {
        Linking.openURL(iosUrl);
        return;
      }
    }
    Linking.openURL(webUrl);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${hang.title} — ${hang.location_name} · ${formatHangWhen(hang.starts_at)}`,
      });
    } catch (err) {
      logger.error("Error sharing hang:", err);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete Hang",
      "Delete this Hang? It will be removed from everyone's feed and map, and all RSVPs will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ height: HERO_HEIGHT }}>
          {heroUrl ? (
            <Image
              source={{ uri: heroUrl }}
              style={{ width: "100%", height: HERO_HEIGHT }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{ height: HERO_HEIGHT }}
              className="bg-coral-tint justify-center items-center"
            >
              <Icons.pin size={36} color={colors.hex.coral} />
            </View>
          )}

          {/* Top + bottom gradients for legibility */}
          <ImageGradient
            stops={[
              { offset: 0, opacity: 0.35 },
              { offset: 0.35, opacity: 0 },
              { offset: 0.6, opacity: 0 },
              { offset: 1, opacity: 0.6 },
            ]}
          />

          {/* Frosted back + share */}
          <View
            className="absolute left-4 right-4 flex-row justify-between"
            style={{ top: insets.top + 8 }}
          >
            <Pressable
              onPress={onBack}
              className="w-10 h-10 rounded-full justify-center items-center"
              style={{ backgroundColor: "rgba(255,255,255,0.85)" }}
            >
              <Icons.arrowLeft size={20} color={colors.hex.gray900} />
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="w-10 h-10 rounded-full justify-center items-center"
              style={{ backgroundColor: "rgba(255,255,255,0.85)" }}
            >
              <Icons.share size={18} color={colors.hex.gray900} />
            </Pressable>
          </View>

          {/* Title + host overlay */}
          <View className="absolute left-5 right-5 bottom-5">
            <Text className="text-xs font-bold tracking-widest text-white/90 mb-1">
              HANG · {eyebrowDay}
            </Text>
            <Text className="text-[27px] font-bold text-white leading-8">
              {hang.title}
            </Text>
            <Link
              href={{ pathname: "/profile", params: { userId: hang.host.id } }}
              asChild
            >
              <Pressable className="flex-row items-center mt-3">
                <Avatar
                  fullName={hang.host.full_name}
                  avatarUrl={hang.host.avatar_url ?? undefined}
                  size="small"
                />
                <Text className="text-sm text-white ml-2">
                  Hosted by {hang.host.full_name}
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Content sheet */}
        <View
          className="bg-white px-5 pt-6"
          style={{
            marginTop: -22,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        >
          {/* Date */}
          <View className="flex-row items-center mb-4">
            <Icons.calendar size={20} color={colors.hex.coral} />
            <View className="ml-3">
              <Text className="text-[15px] font-semibold text-gray-900">
                {formatHangDateLong(hang.starts_at)}
              </Text>
              <Text className="text-sm text-gray-500">
                {formatHangTimeRange(hang.starts_at)}
              </Text>
            </View>
          </View>

          {/* Location */}
          <Pressable
            onPress={handleOpenMaps}
            className="flex-row items-center mb-4"
          >
            <Icons.pin size={20} color={colors.hex.coral} />
            <View className="ml-3 flex-1">
              <Text className="text-[15px] font-semibold text-gray-900">
                {hang.location_name}
              </Text>
              <Text className="text-sm text-gray-500">Open in Maps</Text>
            </View>
            <Icons.chevronRight size={18} color={colors.hex.gray300} />
          </Pressable>

          <View className="h-px bg-gray-100 my-2" />

          {/* Attendees */}
          <View className="flex-row items-center justify-between mt-2 mb-3">
            <Text className="text-base font-semibold text-gray-900">
              Going · {hang.attendee_count}
            </Text>
          </View>
          <View className="flex-row items-center flex-wrap gap-3 mb-2">
            {hang.attendees
              .filter((a) => a.id !== hang.user_id)
              .map((a) => (
                <Link
                  key={a.id}
                  href={{ pathname: "/profile", params: { userId: a.id } }}
                  asChild
                >
                  <Pressable className="items-center" style={{ width: 56 }}>
                    <Avatar
                      fullName={a.full_name}
                      avatarUrl={a.avatar_url ?? undefined}
                      size="small"
                    />
                    <Text
                      className="text-xs text-gray-600 mt-1"
                      numberOfLines={1}
                    >
                      {a.full_name.split(" ")[0]}
                    </Text>
                  </Pressable>
                </Link>
              ))}
          </View>

          {hang.description ? (
            <>
              <View className="h-px bg-gray-100 my-3" />
              <Text className="text-base font-semibold text-gray-900 mb-2">
                About
              </Text>
              <Text className="text-[15px] text-gray-700 leading-6">
                {hang.description}
              </Text>
            </>
          ) : null}

          {/* Quick actions */}
          <View className="flex-row gap-3 mt-5">
            <Pressable
              onPress={() => addHangToCalendar(hang)}
              className="flex-1 flex-row items-center justify-center border border-gray-200 rounded-xl py-3"
            >
              <Icons.calendar size={18} color={colors.hex.coral} />
              <Text className="ml-2 text-sm font-medium text-gray-900">
                Calendar
              </Text>
            </Pressable>
            <Pressable
              onPress={handleOpenMaps}
              className="flex-1 flex-row items-center justify-center border border-gray-200 rounded-xl py-3"
            >
              <Icons.pin size={18} color={colors.hex.coral} />
              <Text className="ml-2 text-sm font-medium text-gray-900">
                Maps
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-100 px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {hang.viewer_is_host ? (
          <View className="flex-row gap-3">
            <Pressable
              onPress={onEdit}
              className="flex-1 flex-row items-center justify-center rounded-xl py-3.5 bg-gray-100"
            >
              <Icons.edit size={18} color={colors.hex.gray900} />
              <Text className="ml-2 font-semibold text-gray-900">Edit</Text>
            </Pressable>
            <Pressable
              onPress={confirmDelete}
              className="flex-1 flex-row items-center justify-center rounded-xl py-3.5"
              style={{ backgroundColor: colors.hex.coralTint }}
            >
              <Icons.trash size={18} color={colors.hex.error} />
              <Text
                className="ml-2 font-semibold"
                style={{ color: colors.hex.error }}
              >
                Delete
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleRsvpToggle}
            disabled={rsvpPending}
            className="flex-row items-center justify-center rounded-xl py-3.5"
            style={{
              backgroundColor: going ? colors.hex.coralTint : colors.hex.coral,
            }}
          >
            <Icons.check
              size={20}
              color={going ? colors.hex.coral : colors.hex.white}
            />
            <Text
              className="ml-2 font-semibold text-base"
              style={{ color: going ? colors.hex.coral : colors.hex.white }}
            >
              {going ? "Going ✓" : "I'm Going"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
