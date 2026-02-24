import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Pressable, Switch } from "react-native";
import { useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapView } from "@/components/MapView";
import { Avatar, Body, Caption, Icons, colors } from "@/design-system";
import { useProfileStore } from "@/stores/profileStore";
import { useMapStore } from "@/stores/mapStore";
import { useFriends } from "@/hooks/useFriends";
import type { PlatformStatistics } from "@/types/friendship";

export default function MapTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profileState } = useProfileStore();
  const { showConnectionLines, setShowConnectionLines, mapFilter, setMapFilter } = useMapStore();
  const { getPlatformStatistics } = useFriends();
  const [statistics, setStatistics] = useState<PlatformStatistics | null>(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    getPlatformStatistics().then((result) => {
      setStatistics(result.data);
    });
  }, [getPlatformStatistics]);

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1">
        <MapView />

        {/* Top Overlay: Avatar, Search, Stats */}
        <View
          className="absolute left-5 right-5 z-10"
          style={{ top: insets.top + 12 }}
          pointerEvents="box-none"
        >
          <View className="flex-row items-center gap-3" pointerEvents="box-none">
            {/* Profile Button */}
            <TouchableOpacity
              className="w-12 h-12 rounded-full justify-center items-center shadow-lg"
              onPress={() => router.push("/profile")}
            >
              <Avatar
                fullName={profileState?.full_name ?? ""}
                avatarUrl={profileState?.avatar_url}
                size="small"
              />
            </TouchableOpacity>

            {/* Search Bar */}
            <Pressable
              className="flex-1 flex-row items-center bg-white/80 rounded-full h-12 px-4 shadow-md"
              onPress={() => router.push("/search")}
            >
              <Icons.search size={16} color={colors.hex.gray500} />
              <Body className="ml-2 text-gray-400">Search by name...</Body>
            </Pressable>

            {/* Stats Toggle */}
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-white/80 justify-center items-center shadow-md"
              onPress={() => setShowStats(!showStats)}
            >
              <Icons.chevronDown
                size={16}
                color={colors.hex.gray500}
                style={{
                  transform: [{ rotate: showStats ? "180deg" : "0deg" }],
                }}
              />
            </TouchableOpacity>
          </View>

          {/* Filter Badges */}
          <View className="flex-row gap-2 mt-2">
            {(["friends", "hometown", "lists"] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                className={`px-4 py-1.5 rounded-full shadow-md ${
                  mapFilter === filter ? "bg-white/80" : "bg-white/40"
                }`}
                onPress={() => setMapFilter(filter)}
              >
                <Caption
                  className={
                    mapFilter === filter
                      ? "font-semibold text-gray-900"
                      : "text-gray-600"
                  }
                >
                  {filter === "friends"
                    ? "Friends"
                    : filter === "hometown"
                      ? "Hometown"
                      : "Lists"}
                </Caption>
              </TouchableOpacity>
            ))}
          </View>

          {showStats && statistics && (
            <View className="bg-white/90 rounded-xl px-4 py-2 mt-2 shadow-md self-end">
              <View className="flex-row items-center justify-between px-2 py-1">
                <Caption className="mr-3">🧵</Caption>
                <Switch
                  value={showConnectionLines}
                  onValueChange={setShowConnectionLines}
                  trackColor={{
                    false: colors.hex.placeholder,
                    true: colors.hex.purple600,
                  }}
                  thumbColor={colors.hex.white}
                  ios_backgroundColor={colors.hex.placeholder}
                  style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                />
              </View>
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center">
                  <Caption>🌎</Caption>
                  <Caption className="ml-1 font-bold">
                    {statistics.total_users.toLocaleString()}
                  </Caption>
                </View>
                <View className="flex-row items-center">
                  <Caption>🤝</Caption>
                  <Caption className="ml-1 font-bold">
                    {statistics.connections_count}
                  </Caption>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
