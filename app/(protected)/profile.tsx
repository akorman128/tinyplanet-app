import React, { useCallback } from "react";
import {
  View,
  Pressable,
  ScrollView,
  Platform,
  ActionSheetIOS,
  Alert,
} from "react-native";
import { useRouter, Stack, useLocalSearchParams, Link } from "expo-router";
import { Body } from "@/design-system/Typography";
import {
  LoadingState,
  ErrorState,
  Icons,
  colors,
  MenuRow,
  ActiveTravelPlanBanner,
  ThemedProfileContainer,
} from "@/design-system";
import { useProfileScreen } from "@/hooks/useProfileScreen";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ProfileInfoCard } from "@/components/ProfileInfoCard";
import { useFontLoader } from "@/hooks/useFontLoader";
import { useReducedMotion } from "react-native-reanimated";
import {
  useBlockUser,
  useUnblockUser,
  useGetBlockStatus,
} from "@/hooks/useBlock";

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

  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const { data: blockStatus } = useGetBlockStatus(
    !isViewingOwnProfile ? userId : undefined
  );
  const isBlocked = blockStatus?.isBlocked ?? false;

  const handleBlockAction = useCallback(() => {
    if (!userId || !displayProfile) return;
    const name = displayProfile.full_name;

    if (isBlocked) {
      // Unblock
      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          { options: ["Cancel", "Unblock"], cancelButtonIndex: 0 },
          (idx) => {
            if (idx === 1) unblockUser.mutate({ targetUserId: userId });
          }
        );
      } else {
        Alert.alert("Unblock", `Unblock ${name}?`, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unblock",
            onPress: () => unblockUser.mutate({ targetUserId: userId }),
          },
        ]);
      }
    } else {
      // Block
      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ["Cancel", "Block User"],
            cancelButtonIndex: 0,
            destructiveButtonIndex: 1,
          },
          (idx) => {
            if (idx === 1) blockUser.mutate({ targetUserId: userId });
          }
        );
      } else {
        Alert.alert(
          `Block ${name}?`,
          "They won't see your location and you won't see theirs.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Block",
              onPress: () => blockUser.mutate({ targetUserId: userId }),
              style: "destructive",
            },
          ]
        );
      }
    }
  }, [userId, displayProfile, isBlocked, blockUser, unblockUser]);

  const savedTheme = displayProfile?.theme_settings ?? null;
  const reducedMotion = useReducedMotion() ?? false;

  const { loaded: fontLoaded } = useFontLoader(savedTheme?.fontFamily);

  // Loading state
  if (loading || (!isViewingOwnProfile && !displayProfile)) {
    return (
      <>
        <Stack.Screen options={{ title: "Profile" }} />
        <View className="flex-1 bg-cream">
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
        <View className="flex-1 bg-cream">
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
          headerTransparent: true,
          headerStyle: {
            backgroundColor: savedTheme?.backgroundColor ?? colors.hex.cream,
          },
          headerTintColor: savedTheme?.fontColor ?? colors.black,
          headerRight:
            Platform.OS === "android" && isViewingOwnProfile
              ? () => (
                  <View className="flex-row items-center gap-2">
                    <Pressable onPress={() => router.push("/edit-profile")}>
                      <Icons.edit
                        size={24}
                        color={savedTheme?.fontColor ?? colors.black}
                      />
                    </Pressable>
                    <Pressable onPress={() => router.push("/settings")}>
                      <Icons.settings
                        size={24}
                        color={savedTheme?.fontColor ?? colors.black}
                      />
                    </Pressable>
                  </View>
                )
              : Platform.OS === "android" && !isViewingOwnProfile && userId
                ? () => (
                    <Pressable onPress={handleBlockAction}>
                      <Icons.dots
                        size={24}
                        color={savedTheme?.fontColor ?? colors.black}
                      />
                    </Pressable>
                  )
                : undefined,
        }}
      />
      {isViewingOwnProfile && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="pencil"
            onPress={() => router.push("/edit-profile")}
          />
          <Stack.Toolbar.Button
            icon="gearshape"
            onPress={() => router.push("/settings")}
          />
        </Stack.Toolbar>
      )}
      {!isViewingOwnProfile && userId && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button icon="ellipsis" onPress={handleBlockAction} />
        </Stack.Toolbar>
      )}
      <Link.AppleZoomTarget />
      <ThemedProfileContainer
        theme={savedTheme}
        fontLoaded={fontLoaded}
        reducedMotion={reducedMotion}
      >
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="px-6 pt-4 items-center"
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
              router.push({
                pathname: "/mutuals",
                params: { userId: userId! },
              })
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

          <View className="w-full mb-2">
            {isViewingOwnProfile && (
              <MenuRow
                icon={<Body>✨</Body>}
                label="Friends"
                onPress={() => router.push("/friends")}
                position="standalone"
              />
            )}
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
            {isViewingOwnProfile && (
              <MenuRow
                icon={<Body>🎨</Body>}
                label="Theme"
                onPress={() => router.push("/theme-editor")}
                position="standalone"
              />
            )}
          </View>

          <ProfileInfoCard
            hometown={displayProfile.hometown}
            hasLocation={
              displayProfile.latitude !== undefined &&
              displayProfile.longitude !== undefined
            }
            humanReadableLocation={humanReadableLocation}
            geocoding={geocoding}
          />
        </ScrollView>
      </ThemedProfileContainer>

    </>
  );
}
