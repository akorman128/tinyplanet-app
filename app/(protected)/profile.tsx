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
  AvatarStack,
  Caption,
} from "@/design-system";
import { useProfileScreen } from "@/hooks/useProfileScreen";
import { useGetMutualsBetweenUsers } from "@/hooks/useFriends";
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
    loading,
    error,
    setError,
  } = useProfileScreen(userId);

  const { data: mutuals = [] } = useGetMutualsBetweenUsers(
    !isViewingOwnProfile ? userId : undefined
  );

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
      // Unhide
      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          { options: ["Cancel", "Unhide"], cancelButtonIndex: 0 },
          (idx) => {
            if (idx === 1) unblockUser.mutate({ targetUserId: userId });
          }
        );
      } else {
        Alert.alert("Unhide", `Unhide ${name}?`, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unhide",
            onPress: () => unblockUser.mutate({ targetUserId: userId }),
          },
        ]);
      }
    } else {
      // Hide
      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: `Hide ${name}?`,
            message: "This removes you from their map and hides their updates.",
            options: ["Cancel", "Hide User"],
            cancelButtonIndex: 0,
            destructiveButtonIndex: 1,
          },
          (idx) => {
            if (idx === 1) blockUser.mutate({ targetUserId: userId });
          }
        );
      } else {
        Alert.alert(
          `Hide ${name}?`,
          "This removes you from their map and hides their updates.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Hide",
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
            onVibePress={() =>
              router.push({
                pathname: "/all-vibes",
                params: { userId: displayProfile.id },
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

          {!isViewingOwnProfile && mutuals.length > 0 && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/mutuals",
                  params: { userId: userId! },
                })
              }
              className="w-full flex-row items-center justify-start gap-2 mb-4 ml-2"
            >
              <AvatarStack
                people={mutuals}
                size="medium"
                borderColor={savedTheme?.backgroundColor ?? colors.hex.cream}
              />
              <Caption>
                {mutuals.length === 1
                  ? "1 mutual"
                  : `${mutuals.length} mutuals`}
              </Caption>
            </Pressable>
          )}

          <View className="w-full mb-2">
            {isViewingOwnProfile && (
              <MenuRow
                icon={<Body>✨</Body>}
                label="Friends"
                onPress={() => router.push("/friends")}
                position="first"
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
              position="standalone"
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
