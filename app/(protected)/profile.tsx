import React from "react";
import { View, Pressable, ScrollView } from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { Body } from "@/design-system/Typography";
import {
  LoadingState,
  ErrorState,
  Icons,
  colors,
  MenuRow,
  ActiveTravelPlanBanner,
} from "@/design-system";
import { useProfileScreen } from "@/hooks/useProfileScreen";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ProfileInfoCard } from "@/components/ProfileInfoCard";

export default function ProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  const {
    displayProfile,
    isViewingOwnProfile,
    topVibes,
    totalVibeCount,
    humanReadableLocation,
    geocoding,
    activeTravelPlan,
    mutualCount,
    loading,
    error,
    setError,
  } = useProfileScreen(userId);

  // Loading state
  if (loading || (!isViewingOwnProfile && !displayProfile)) {
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
          <ProfileHeader
            profile={displayProfile}
            topVibes={topVibes}
            totalVibeCount={totalVibeCount}
            isViewingOwnProfile={isViewingOwnProfile}
            userId={userId}
            mutualCount={mutualCount}
            onVibePress={() =>
              router.push({
                pathname: "/all-vibes",
                params: { userId: displayProfile.id },
              })
            }
            onMutualsPress={() =>
              router.push({ pathname: "/mutuals", params: { userId: userId! } })
            }
            onMessagePress={() => router.push(`/chat/${userId}`)}
            onError={setError}
          />

          {activeTravelPlan && (
            <ActiveTravelPlanBanner
              travelPlan={activeTravelPlan}
              variant="compact"
            />
          )}

          <View className="w-full mb-6">
            <MenuRow
              icon={<Body>✨</Body>}
              label="Friends"
              onPress={() => router.push("/friends")}
              position="standalone"
            />
            <MenuRow
              icon={<Body>💌</Body>}
              label="Posts"
              onPress={() =>
                router.push({
                  pathname: "/user-posts",
                  params: { userId: displayProfile.id },
                })
              }
              position="first"
            />
            <MenuRow
              icon={<Body>📋</Body>}
              label="Lists"
              onPress={() =>
                router.push({
                  pathname: "/user-lists",
                  params: { userId: displayProfile.id },
                })
              }
              position="middle"
            />
            <MenuRow
              icon={<Body>☎️</Body>}
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

          <ProfileInfoCard
            birthday={displayProfile.birthday}
            hometown={displayProfile.hometown}
            hasLocation={
              displayProfile.latitude !== undefined &&
              displayProfile.longitude !== undefined
            }
            humanReadableLocation={humanReadableLocation}
            geocoding={geocoding}
          />
        </ScrollView>
      </View>
    </>
  );
}
