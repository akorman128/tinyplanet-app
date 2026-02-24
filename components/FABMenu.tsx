import React, { useCallback } from "react";
import { Pressable, View, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Icons, Body, Subheading } from "@/design-system";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ANIMATION_DURATION = 250;
const STAGGER_OFFSET = 0.15;

const ITEM_SHADOW: ViewStyle = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 4,
  elevation: 4,
};

const FAB_SHADOW: ViewStyle = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
};

const MENU_ITEMS = [
  { label: "Travel Plan", emoji: "✈", route: "/create-travel-plan" as const },
  { label: "List", emoji: "📋", route: "/create-list" as const },
  { label: "Post", emoji: "💌", route: "/create-post" as const },
];

function useItemStyle(
  progress: SharedValue<number>,
  index: number,
  total: number
) {
  return useAnimatedStyle(() => {
    const staggerStart = (total - 1 - index) * STAGGER_OFFSET;
    const staggerEnd = Math.min(staggerStart + 0.5, 1);
    return {
      opacity: interpolate(
        progress.value,
        [staggerStart, staggerEnd],
        [0, 1],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            progress.value,
            [staggerStart, staggerEnd],
            [0.3, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });
}

export function FABMenu() {
  const router = useRouter();
  const progress = useSharedValue(0);

  const toggle = useCallback(() => {
    progress.value = withTiming(progress.value > 0.5 ? 0 : 1, {
      duration: ANIMATION_DURATION,
    });
  }, [progress]);

  const close = useCallback(() => {
    progress.value = withTiming(0, { duration: ANIMATION_DURATION });
  }, [progress]);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` },
    ],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    pointerEvents: progress.value > 0.01 ? "auto" : "none",
  }));

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={overlayStyle}
        className="absolute inset-0 bg-black/70 z-10"
      >
        <Pressable className="flex-1" onPress={close} />
      </Animated.View>

      {/* Menu items */}
      <View className="absolute bottom-28 right-5 z-20 items-end gap-3">
        {MENU_ITEMS.map((item, index) => (
          <MenuItem
            key={item.route}
            item={item}
            index={index}
            total={MENU_ITEMS.length}
            progress={progress}
            onPress={() => {
              close();
              router.push(item.route);
            }}
          />
        ))}
      </View>

      {/* FAB */}
      <AnimatedPressable
        onPress={toggle}
        className="absolute bottom-8 right-5 w-14 h-14 rounded-full bg-purple-600 justify-center items-center z-20"
        style={FAB_SHADOW}
      >
        <Animated.View style={fabStyle}>
          <Icons.plus size={28} color="white" />
        </Animated.View>
      </AnimatedPressable>
    </>
  );
}

function MenuItem({
  item,
  index,
  total,
  progress,
  onPress,
}: {
  item: (typeof MENU_ITEMS)[number];
  index: number;
  total: number;
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const animatedStyle = useItemStyle(progress, index, total);

  return (
    <Animated.View style={animatedStyle} className="flex-row items-center">
      <View className="mr-3   px-3 py-1.5 ">
        <Subheading className="text-white  font-bold ">{item.label}</Subheading>
      </View>
      <Pressable
        onPress={onPress}
        className="w-14 h-14 rounded-full bg-white/90 justify-center items-center shadow-lg"
        style={ITEM_SHADOW}
      >
        <Body>{item.emoji}</Body>
      </Pressable>
    </Animated.View>
  );
}
