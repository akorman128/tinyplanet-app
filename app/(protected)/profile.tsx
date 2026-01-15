import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";

import {
  Avatar,
  GlassInfoCard,
  GlassInfoItem,
  ScreenHeader,
  Badge,
  LoadingState,
  ErrorState,
  Heading,
  Icons,
  colors,
  SocialMediaLinks,
  InfoRow,
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
  const [vibesLoading, setVibesLoading] = useState(false);
  const [mutualCount, setMutualCount] = useState(0);
  const [activeTravelPlan, setActiveTravelPlan] = useState<TravelPlan | null>(
    null
  );

  // Determine which profile to display (memoized)
  const isViewingOwnProfile = useMemo(() => !userId, [userId]);
  const displayProfile = useMemo(
    () => (isViewingOwnProfile ? profile : otherUserProfile),
    [isViewingOwnProfile, profile, otherUserProfile]
  );

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

  // Set mutual count from profile data
  useEffect(() => {
    if (displayProfile && !isViewingOwnProfile) {
      setMutualCount(displayProfile.mutual_friend_count ?? 0);
    } else {
      setMutualCount(0);
    }
  }, [displayProfile, isViewingOwnProfile]);

  // Fetch vibes for the displayed profile
  const fetchVibes = useCallback(async () => {
    if (!displayProfile?.id || !vibeIsLoaded) return;

    setVibesLoading(true);
    try {
      const result = await getTopVibes({
        userId: displayProfile.id,
        limit: 5,
      });
      setTopVibes(result.data);
      setTotalVibeCount(result.totalCount);
    } catch (err) {
      // Silently fail for vibes
    } finally {
      setVibesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayProfile?.id, vibeIsLoaded]);

  useEffect(() => {
    fetchVibes();
  }, [fetchVibes]);

  // Reverse geocode location when it changes
  const geocodeLocation = useCallback(async () => {
    if (!displayProfile?.latitude || !displayProfile?.longitude) {
      setHumanReadableLocation(null);
      return;
    }

    setGeocoding(true);
    try {
      const result = await reverseGeocode(
        displayProfile.longitude,
        displayProfile.latitude,
        (freshData) => {
          setHumanReadableLocation(freshData.formattedAddress);
        }
      );
      setHumanReadableLocation(result.formattedAddress);
    } catch (error) {
      setHumanReadableLocation(
        `${displayProfile.latitude.toFixed(4)}, ${displayProfile.longitude.toFixed(4)}`
      );
    } finally {
      setGeocoding(false);
    }
  }, [displayProfile?.latitude, displayProfile?.longitude]);

  useEffect(() => {
    geocodeLocation();
  }, [geocodeLocation]);

  // Fetch active travel plan for own profile
  const loadActivePlan = useCallback(async () => {
    if (!isViewingOwnProfile) return;

    try {
      const { data } = await getActiveTravelPlan();
      setActiveTravelPlan(data);
    } catch (err) {
      console.error("Error loading travel plan:", err);
    }
  }, [isViewingOwnProfile, getActiveTravelPlan]);

  useEffect(() => {
    loadActivePlan();
  }, [loadActivePlan]);

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
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-white pt-12">
          <ScreenHeader title="Profile" showBackButton={true} />
          <LoadingState />
        </View>
      </>
    );
  }

  // Error state
  if (error || !displayProfile) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-white pt-12">
          <ScreenHeader title="Profile" showBackButton={true} />
          <ErrorState message={error || "Profile not found"} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ headerShown: false, title: profile.full_name }}
      />
      <View className="flex-1 bg-white pt-8">
        {/* Header */}
        <ScreenHeader
          title={"Profile"}
          showBackButton={true}
          rightComponent={
            isViewingOwnProfile ? (
              <View className="flex-row items-center gap-2">
                <Pressable onPress={() => router.push("/edit-profile")}>
                  <Icons.edit size={24} color={colors.black} />
                </Pressable>
                <Pressable onPress={() => router.push("/settings")}>
                  <Icons.settings size={24} color={colors.black} />
                </Pressable>
              </View>
            ) : undefined
          }
        />

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-8 pb-8 items-center"
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

          <SocialMediaLinks
            website={displayProfile.website}
            instagram={displayProfile.instagram}
            x={displayProfile.x}
            letterboxd={displayProfile.letterboxd}
            beli={displayProfile.beli}
          />

          <View className="flex-row items-center justify-center gap-2 mb-2">
            {!isViewingOwnProfile && userId && (
              <FriendStatusSection
                userId={userId}
                onError={(errorMessage) => setError(errorMessage)}
              />
            )}

            {!isViewingOwnProfile && mutualCount > 0 && (
              <Pressable onPress={handleMutualsPress} className="mb-4">
                <Badge variant="secondary" size="small">
                  {mutualCount === 1 ? "1 mutual" : `${mutualCount} mutuals`}
                </Badge>
              </Pressable>
            )}
            {!isViewingOwnProfile && userId && (
              <Pressable
                onPress={() => router.push(`/chat/${userId}`)}
                className="mb-4"
              >
                <Badge variant="default" size="small">
                  Message
                </Badge>
              </Pressable>
            )}
          </View>

          <VibeDisplay
            topVibes={topVibes}
            totalVibeCount={totalVibeCount}
            onPress={handleVibePress}
          />

          {activeTravelPlan && (
            <View className="w-full mb-4 px-4 py-3 bg-purple-50 rounded-lg flex-col  justify-between">
              <Text className="text-base font-semibold text-purple-900 mb-1">
                🚀 {activeTravelPlan.destination_name}
              </Text>
              <Text className="text-sm font-semibold text-purple-900">
                {new Date(activeTravelPlan.start_date).toLocaleDateString()} →{" "}
                {new Date(activeTravelPlan.end_date).toLocaleDateString()}
              </Text>
            </View>
          )}

          {/* Posts Link */}
          {displayProfile && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/user-posts",
                  params: { userId: displayProfile.id },
                })
              }
              className="w-full px-4 py-3 bg-purple-50 rounded-t-lg flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3">
                <Icons.posts size={32} color={colors.hex.purple900} />
                <Text className="text-base font-semibold text-purple-900">
                  Posts
                </Text>
              </View>
              <Icons.chevronRight size={20} color={colors.hex.purple900} />
            </Pressable>
          )}

          {/* Lists Link */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/user-lists",
                params: { userId: displayProfile.id },
              })
            }
            className="w-full mb-4 px-4 py-3 bg-purple-50 rounded-b-lg flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <Icons.list size={32} color={colors.hex.purple900} />
              <Text className="text-base font-semibold text-purple-900">
                Lists
              </Text>
            </View>
            <Icons.chevronRight size={20} color={colors.hex.purple900} />
          </Pressable>

          <GlassInfoCard className="w-full mb-4">
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
