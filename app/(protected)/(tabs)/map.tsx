import React from "react";
import { View, TouchableOpacity, Pressable, ScrollView } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapView } from "@/components/MapView";
import {
  Avatar,
  Body,
  Caption,
  Icons,
  VerticalToggle,
  colors,
} from "@/design-system";
import { useProfileStore } from "@/stores/profileStore";
import { useMapStore, type MapFilter } from "@/stores/mapStore";

const MAP_FILTERS: readonly { key: MapFilter; label: string }[] = [
  { key: "friends", label: "✨ Friends" },
  { key: "travel_plans", label: "🚀 Travel Plans" },
  { key: "hangs", label: "🎉 Hangs" },
  { key: "hometown", label: "🏠 Hometowns" },
  { key: "lists", label: "📋 Lists" },
];

export default function MapTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profileState } = useProfileStore();
  const {
    showConnectionLines,
    setShowConnectionLines,
    mapFilter,
    setMapFilter,
    requestRecenter,
  } = useMapStore();

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
            <View className="flex-row items-center gap-2 px-5 pt-2 pb-2">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {MAP_FILTERS.map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    className={`px-4 py-2 mb-1 rounded-full shadow-sm ${
                      mapFilter === key
                        ? "bg-gray-800 border-gray-800"
                        : "bg-white/90 border-gray-200"
                    }`}
                    onPress={() => setMapFilter(key)}
                  >
                    <Caption
                      className={
                        mapFilter === key
                          ? "font-semibold text-white"
                          : "font-medium text-gray-700"
                      }
                    >
                      {label}
                    </Caption>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Animated.View>

        {/* Right-side map controls */}
        <View
          className="absolute right-4 z-20 items-center gap-3"
          style={{ top: insets.top + 120 }}
        >
          {/* Connection-lines toggle (vertical) */}
          <VerticalToggle
            value={showConnectionLines}
            onValueChange={setShowConnectionLines}
            accessibilityLabel="Toggle connection lines"
          />

          {/* Recenter on user location */}
          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-white/90 border border-gray-200 shadow-sm justify-center items-center"
            onPress={requestRecenter}
            accessibilityLabel="Recenter on my location"
          >
            <Icons.profileActive size={20} color={colors.hex.gray600} />
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
