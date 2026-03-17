import React from "react";
import {
  View,
  TouchableOpacity,
  Pressable,
  Switch,
  ScrollView,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapView } from "@/components/MapView";
import { Avatar, Body, Caption, Icons, colors } from "@/design-system";
import { useProfileStore } from "@/stores/profileStore";
import { useMapStore } from "@/stores/mapStore";
import { useGetPlatformStatistics } from "@/hooks/useFriends";

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
  const { data: statsData } = useGetPlatformStatistics();
  const statistics = statsData?.data ?? null;
  const [showStats, setShowStats] = React.useState(false);

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1">
        <MapView mapFilter={mapFilter} />

        {/* Top Overlay: Black header with gradient fade */}
        <Animated.View
          className="absolute top-0 left-0 right-0 z-10"
          entering={FadeIn.duration(500).delay(200)}
          pointerEvents="box-none"
        >
          <View
            className="bg-cream px-5"
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
                className="flex-1 flex-row items-center bg-black/5 rounded-full h-12 px-4"
                onPress={() => router.push("/search")}
              >
                <Icons.search size={16} color={colors.hex.gray300} />
                <Body className="ml-2 text-gray-400">Search friends...</Body>
              </Pressable>
            </View>
          </View>

          {/* Gradient fade + floating filter badges */}
          <View pointerEvents="box-none" className="pb-22">
            <Svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              pointerEvents="none"
            >
              <Defs>
                <LinearGradient id="headerFade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#faf9f5" stopOpacity={1} />
                  <Stop offset="0.4" stopColor="#faf9f5" stopOpacity={1} />
                  <Stop offset="1" stopColor="#faf9f5" stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#headerFade)" />
            </Svg>

            {/* Filter Badges */}
            <View className="relative flex-row items-center gap-2 px-5 pt-2 pb-2">
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-white/90 border border-gray-200 justify-center items-center"
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {(["friends", "hometown", "lists"] as const).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    className={`px-4 py-2 rounded-full border ${
                      mapFilter === filter
                        ? "bg-purple-600 border-purple-600"
                        : "bg-white/90 border-gray-200"
                    }`}
                    onPress={() => setMapFilter(filter)}
                  >
                    <Caption
                      className={
                        mapFilter === filter
                          ? "font-semibold text-white"
                          : "font-medium text-gray-700"
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
              </ScrollView>

              {showStats && statistics && (
                <View className="absolute top-full left-0 mt-4 ml-4 rounded-xl overflow-hidden bg-white/70 px-4 py-2">
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
                      <Caption className="text-gray-700">🌎</Caption>
                      <Caption className="ml-1 font-bold text-gray-700">
                        {statistics.total_users.toLocaleString()}
                      </Caption>
                    </View>
                    <View className="flex-row items-center">
                      <Caption className="text-gray-700">🤝</Caption>
                      <Caption className="ml-1 font-bold text-gray-700">
                        {statistics.connections_count}
                      </Caption>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </GestureHandlerRootView>
  );
}
