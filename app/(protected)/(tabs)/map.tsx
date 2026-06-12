import React from "react";
import { View, TouchableOpacity, Pressable, ScrollView } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapView } from "@/components/MapView";
import { Avatar, Body, Caption, Icons, colors } from "@/design-system";
import { useProfileStore } from "@/stores/profileStore";
import { useMapStore } from "@/stores/mapStore";

// Vertical on/off toggle built from plain Views so the thumb stays centered
// within its pill on every platform. A rotated native <Switch> cannot: its
// intrinsic layout box differs per platform and is wider than the pill, so
// flex-centering the rotated control leaves the thumb off-center.
const TRACK_WIDTH = 24;
const TRACK_HEIGHT = 48;
const THUMB_SIZE = 18;
const THUMB_GAP = 3;

function VerticalToggle({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  const thumbStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: withTiming(
            value ? THUMB_GAP : TRACK_HEIGHT - THUMB_SIZE - THUMB_GAP,
            { duration: 180 }
          ),
        },
      ],
    }),
    [value]
  );

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel="Toggle connection lines"
      onPress={() => onValueChange(!value)}
      className="w-12 h-16 rounded-full bg-white/90 border border-gray-200 items-center justify-center"
    >
      <View
        className={`items-center rounded-full ${value ? "bg-gray-800" : "bg-gray-300"}`}
        style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT }}
      >
        <Animated.View
          className="bg-white rounded-full"
          style={[{ width: THUMB_SIZE, height: THUMB_SIZE }, thumbStyle]}
        />
      </View>
    </Pressable>
  );
}

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
                {(["friends", "hometown", "lists"] as const).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    className={`px-4 py-2 rounded-full border ${
                      mapFilter === filter
                        ? "bg-gray-800 border-gray-800"
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
          />

          {/* Recenter on user location */}
          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-white/90 border border-gray-200 justify-center items-center"
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
