import React, { useEffect, useState } from "react";
import { Tabs, useRouter, usePathname } from "expo-router";
import { Navigation } from "@/design-system";
import { useProfileStore } from "@/stores/profileStore";
import { useMapStore } from "@/stores/mapStore";
import { useFriends } from "@/hooks/useFriends";
import type { PlatformStatistics } from "@/types/friendship";

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { profileState } = useProfileStore();
  const { showConnectionLines, setShowConnectionLines } = useMapStore();
  const { getPlatformStatistics } = useFriends();
  const [statistics, setStatistics] = useState<PlatformStatistics | null>(null);

  useEffect(() => {
    getPlatformStatistics().then((result) => {
      setStatistics(result.data);
    });
  }, [getPlatformStatistics]);

  // Determine active tab index from pathname
  const getActiveIndex = () => {
    if (pathname.includes("/map")) return 0;
    if (pathname.includes("/feed")) return 1;
    if (pathname.includes("/messages")) return 2;
    return 0; // Default to map
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

      <Navigation
        activeTabIndex={getActiveIndex()}
        onMapPress={() => router.push("/(protected)/(tabs)/map")}
        onFeedPress={() => router.push("/(protected)/(tabs)/feed")}
        onMessagesPress={() => router.push("/(protected)/(tabs)/messages")}
        onProfilePress={() => router.push("/profile")}
        onSearchPress={() => router.push("/search")}
        profileFullName={profileState?.full_name}
        profileAvatarUrl={profileState?.avatar_url}
        statistics={statistics || undefined}
        showLines={showConnectionLines}
        onToggleLines={setShowConnectionLines}
      />
    </>
  );
}
