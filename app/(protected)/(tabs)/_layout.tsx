import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Tabs, useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ButtonGroup } from "@/design-system/ButtonGroup";
import { Avatar, Icons } from "@/design-system";
import { useProfileStore } from "@/stores/profileStore";
import { colors } from "@/design-system/colors";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { profileState } = useProfileStore();

  // Determine active tab index from pathname
  const getActiveIndex = () => {
    if (pathname.includes("/map")) return 0;
    if (pathname.includes("/feed")) return 1;
    if (pathname.includes("/messages")) return 2;
    return 0; // Default to map
  };

  const handleProfilePress = () => {
    router.push("/profile");
  };

  const handleSearchPress = () => {
    router.push("/search");
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={() => null} // Hide default tab bar
      >
        <Tabs.Screen name="map" />
        <Tabs.Screen name="feed" />
        <Tabs.Screen name="messages" />
      </Tabs>

      {/* Custom ButtonGroup (Centered Top) */}
      <View
        className="absolute left-0 right-0 flex-row justify-center px-20 z-10"
        style={{ top: insets.top + 20 }}
        pointerEvents="box-none"
      >
        <ButtonGroup
          activeIndex={getActiveIndex()}
          options={[
            {
              icon: Icons.globe,
              onPress: () => router.push("/(protected)/(tabs)/map"),
            },
            {
              icon: Icons.posts,
              onPress: () => router.push("/(protected)/(tabs)/feed"),
            },
            {
              icon: Icons.messageOutline,
              onPress: () => router.push("/(protected)/(tabs)/messages"),
            },
          ]}
        />
      </View>

      {/* Profile Button (Top Left) */}
      <TouchableOpacity
        className="absolute left-5 w-12 h-12 rounded-full justify-center items-center z-10"
        style={{
          top: insets.top + 20,
          backgroundColor: colors.hex.white,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
        onPress={handleProfilePress}
      >
        <Avatar
          fullName={profileState?.full_name || ""}
          avatarUrl={profileState?.avatar_url}
          size="small"
        />
      </TouchableOpacity>

      {/* Search Button (Top Right) */}
      <TouchableOpacity
        className="absolute right-5 w-12 h-12 rounded-full bg-white opacity-70 justify-center items-center z-10"
        style={{
          top: insets.top + 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
        onPress={handleSearchPress}
      >
        <Icons.search size={64} color="black" />
      </TouchableOpacity>
    </>
  );
}
