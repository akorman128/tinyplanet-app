import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Pressable, Switch } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
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
  const {
    showConnectionLines,
    setShowConnectionLines,
    mapFilter,
    setMapFilter,
  } = useMapStore();
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
        <MapView mapFilter={mapFilter} />

        {/* Top Overlay: Black header with gradient fade */}
        <View
          className="absolute top-0 left-0 right-0 z-10"
          pointerEvents="box-none"
        >
          <View
            className="bg-black px-5"
            style={{ paddingTop: insets.top + 12 }}
          >
            <View className="flex-row items-center gap-3">
              {/* Profile Button */}
              <TouchableOpacity
                className="w-12 h-12 rounded-full justify-center items-center"
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
                className="flex-1 flex-row items-center bg-white/15 rounded-full h-12 px-4"
                onPress={() => router.push("/search")}
              >
                <Icons.search size={16} color={colors.hex.gray300} />
                <Body className="ml-2 text-gray-400">Search by name...</Body>
              </Pressable>

              {/* Stats Toggle */}
              <TouchableOpacity
                className="w-10 h-10 rounded-full bg-white/15 justify-center items-center"
                onPress={() => setShowStats(!showStats)}
              >
                <Icons.chevronDown
                  size={16}
                  color={colors.hex.gray300}
                  style={{
                    transform: [{ rotate: showStats ? "180deg" : "0deg" }],
                  }}
                />
              </TouchableOpacity>
            </View>

            {showStats && statistics && (
              <View className="bg-white/15 rounded-xl px-4 py-2 mt-2 self-end">
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
                    <Caption className="text-white">🌎</Caption>
                    <Caption className="ml-1 font-bold text-white">
                      {statistics.total_users.toLocaleString()}
                    </Caption>
                  </View>
                  <View className="flex-row items-center">
                    <Caption className="text-white">🤝</Caption>
                    <Caption className="ml-1 font-bold text-white">
                      {statistics.connections_count}
                    </Caption>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Gradient fade + floating filter badges */}
          <View pointerEvents="box-none">
            <Svg style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
              <Defs>
                <LinearGradient id="headerFade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#000" />
                  <Stop offset="1" stopColor="#000" stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#headerFade)" />
            </Svg>

            {/* Filter Badges */}
            <View className="flex-row gap-2 px-5 pt-2 pb-4">
              {(["friends", "hometown", "lists"] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  className={`px-4 py-1.5 rounded-full ${
                    mapFilter === filter ? "bg-white/20" : "bg-white/10"
                  }`}
                  onPress={() => setMapFilter(filter)}
                >
                  <Caption
                    className={
                      mapFilter === filter
                        ? "font-semibold text-white"
                        : "text-gray-400"
                    }
                  >
                    {filter === "friends"
                      ? "✨ Friends"
                      : filter === "hometown"
                        ? "🏠 Hometowns"
                        : "📋 Lists"}
                  </Caption>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
