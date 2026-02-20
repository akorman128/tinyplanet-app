import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";

import {
  Avatar,
  GlassInfoCard,
  GlassInfoItem,
  Badge,
  LoadingState,
  ErrorState,
  Heading,
  Icons,
  colors,
  SocialMediaLinks,
  Text,
} from "@/design-system";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { useProfile } from "@/hooks/useProfile";
import { useVibe } from "@/hooks/useVibe";
import { useTravelPlan } from "@/hooks/useTravelPlan";
import { reverseGeocode } from "@/utils/reverseGeocode";
import { formatBirthday } from "@/utils";
import { Profile } from "@/types/profile";
import { TravelPlan } from "@/types/travelPlan";
import { VibeDisplay } from "@/design-system/VibeDisplay";
import { FriendStatusSection } from "@/components/FriendStatusSection";

function ProfileNavItem({
  icon,
  label,
  onPress,
  position,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  position: "first" | "middle" | "last";
}) {
  const rounded =
    position === "first"
      ? "rounded-t-lg"
      : position === "last"
        ? "rounded-b-lg"
        : "";
  return (
    <Pressable
      onPress={onPress}
      className={`w-full px-4 py-3 bg-gray-100 flex-row items-center justify-between ${rounded}`}
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className="text-base font-semibold text-black">{label}</Text>
      </View>
      <Icons.chevronRight size={20} color={colors.black} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const profile = useRequireProfile();
  const { getProfile } = useProfile();
  const { getTopVibes, isLoaded: vibeIsLoaded } = useVibe();
  const { getActiveTravelPlan } = useTravelPlan();

  const [otherUserProfile, setOtherUserProfile] = useState<Profile | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [humanReadableLocation, setHumanReadableLocation] = useState<
    string | null
  >(null);
  const [geocoding, setGeocoding] = useState(false);
  const [topVibes, setTopVibes] = useState<{ emoji: string; count: number }[]>(
    []
  );
  const [totalVibeCount, setTotalVibeCount] = useState(0);
  const [activeTravelPlan, setActiveTravelPlan] = useState<TravelPlan | null>(
    null
  );

  const isViewingOwnProfile = !userId;
  const displayProfile = useMemo(
    () => (isViewingOwnProfile ? profile : otherUserProfile),
    [isViewingOwnProfile, profile, otherUserProfile]
  );
  const mutualCount =
    (!isViewingOwnProfile && displayProfile?.mutual_friend_count) || 0;

  // Fetch other user's profile if userId is provided
  const fetchOtherUserProfile = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const profile = await getProfile({ userId });
      setOtherUserProfile(profile);
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    fetchOtherUserProfile();
  }, [fetchOtherUserProfile]);

  // Fetch secondary data in parallel when displayProfile is available
  useEffect(() => {
    if (!displayProfile?.id) return;

    const promises: Promise<void>[] = [];

    if (vibeIsLoaded) {
      promises.push(
        (async () => {
          try {
            const result = await getTopVibes({
              userId: displayProfile.id,
              limit: 5,
            });
            setTopVibes(result.data);
            setTotalVibeCount(result.totalCount);
          } catch {
            // Silently fail for vibes
          }
        })()
      );
    }

    if (displayProfile.latitude != null && displayProfile.longitude != null) {
      promises.push(
        (async () => {
          setGeocoding(true);
          try {
            const result = await reverseGeocode(
              displayProfile.longitude!,
              displayProfile.latitude!,
              (freshData) => {
                setHumanReadableLocation(freshData.formattedAddress);
              }
            );
            setHumanReadableLocation(result.formattedAddress);
          } catch {
            setHumanReadableLocation(
              `${displayProfile.latitude!.toFixed(4)}, ${displayProfile.longitude!.toFixed(4)}`
            );
          } finally {
            setGeocoding(false);
          }
        })()
      );
    } else {
      setHumanReadableLocation(null);
    }

    if (isViewingOwnProfile) {
      promises.push(
        (async () => {
          try {
            const { data } = await getActiveTravelPlan();
            setActiveTravelPlan(data);
          } catch (err) {
            console.error("Error loading travel plan:", err);
          }
        })()
      );
    }

    Promise.allSettled(promises);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayProfile?.id, vibeIsLoaded]);

  const handleVibePress = () => {
    if (displayProfile?.id) {
      router.push({
        pathname: "/all-vibes",
        params: { userId: displayProfile.id },
      });
    }
  };

  const handleMutualsPress = () => {
    if (userId) {
      router.push({ pathname: "/mutuals", params: { userId } });
    }
  };

  // Loading state
  if (loading || (!isViewingOwnProfile && !otherUserProfile)) {
    return (
      <>
        <Stack.Screen options={{ title: "Profile" }} />
        <View className="flex-1 bg-white">
          <LoadingState />
        </View>
      </>
    );
  }

  // Error state
  if (error || !displayProfile) {
    return (
      <>
        <Stack.Screen options={{ title: "Profile" }} />
        <View className="flex-1 bg-white">
          <ErrorState message={error || "Profile not found"} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerShadowVisible: false,
          headerRight: isViewingOwnProfile
            ? () => (
                <View className="flex-row items-center gap-2">
                  <Pressable onPress={() => router.push("/edit-profile")}>
                    <Icons.edit size={24} color={colors.black} />
                  </Pressable>
                  <Pressable onPress={() => router.push("/settings")}>
                    <Icons.settings size={24} color={colors.black} />
                  </Pressable>
                </View>
              )
            : undefined,
        }}
      />
      <View className="flex-1 bg-white">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-2  items-center"
        >
          <View className="mb-4">
            <Avatar
              fullName={displayProfile.full_name}
              avatarUrl={displayProfile.avatar_url}
              size="large"
            />
          </View>

          <View className="flex-row items-center justify-center mb-2">
            <Heading className="text-black text-center">
              {displayProfile.full_name}
            </Heading>
          </View>

          <VibeDisplay
            topVibes={topVibes}
            totalVibeCount={totalVibeCount}
            onPress={handleVibePress}
          />

          <SocialMediaLinks
            website={displayProfile.website}
            instagram={displayProfile.instagram}
            x={displayProfile.x}
            letterboxd={displayProfile.letterboxd}
            beli={displayProfile.beli}
          />

          <View className="flex-row items-center justify-center gap-2 mb-6">
            {!isViewingOwnProfile && userId && (
              <FriendStatusSection
                userId={userId}
                onError={(errorMessage) => setError(errorMessage)}
              />
            )}

            {!isViewingOwnProfile && mutualCount > 0 && (
              <Pressable onPress={handleMutualsPress}>
                <Badge variant="secondary" size="small">
                  {mutualCount === 1 ? "1 mutual" : `${mutualCount} mutuals`}
                </Badge>
              </Pressable>
            )}
            {!isViewingOwnProfile && userId && (
              <Pressable onPress={() => router.push(`/chat/${userId}`)}>
                <Badge variant="default" size="small">
                  Message
                </Badge>
              </Pressable>
            )}
          </View>

          {activeTravelPlan && (
            <View className="w-full mb-6 px-4 py-3 bg-purple-100 rounded-lg border border-purple-200 flex-col justify-between">
              <Text className="text-base font-semibold text-purple-900 mb-1">
                🚀 {activeTravelPlan.destination_name}
              </Text>
              <Text className="text-sm font-semibold text-purple-900">
                {new Date(activeTravelPlan.start_date).toLocaleDateString()} →{" "}
                {new Date(activeTravelPlan.end_date).toLocaleDateString()}
              </Text>
            </View>
          )}

          <View className="w-full mb-6">
            <ProfileNavItem
              icon={<Icons.posts size={32} color={colors.black} />}
              label="Posts"
              onPress={() =>
                router.push({
                  pathname: "/user-posts",
                  params: { userId: displayProfile.id },
                })
              }
              position="first"
            />
            <ProfileNavItem
              icon={<Icons.list size={32} color={colors.black} />}
              label="Lists"
              onPress={() =>
                router.push({
                  pathname: "/user-lists",
                  params: { userId: displayProfile.id },
                })
              }
              position="middle"
            />
            <ProfileNavItem
              icon={<Icons.userList size={32} color={colors.black} />}
              label="Contacts"
              onPress={() =>
                router.push({
                  pathname: "/user-contacts",
                  params: { userId: displayProfile.id },
                })
              }
              position="last"
            />
          </View>

          <GlassInfoCard className="w-full">
            {displayProfile.birthday && (
              <GlassInfoItem
                label="Birthday"
                value={formatBirthday(displayProfile.birthday)}
              />
            )}
            {displayProfile.hometown && (
              <GlassInfoItem label="Hometown" value={displayProfile.hometown} />
            )}
            {displayProfile.latitude !== undefined &&
              displayProfile.longitude !== undefined && (
                <GlassInfoItem
                  label="Current Location"
                  value={humanReadableLocation || "Unknown location"}
                  loading={geocoding}
                />
              )}
          </GlassInfoCard>
        </ScrollView>
      </View>
    </>
  );
}
