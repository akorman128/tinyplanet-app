import React from "react";
import { Pressable, View, ViewStyle } from "react-native";
import { useRouter, Href } from "expo-router";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Body, Subheading, shadow } from "@/design-system";
import { hapticMedium } from "@/utils";

const ANIMATION_DURATION = 250;
const STAGGER_OFFSET = 0.15;

const ITEM_SHADOW: ViewStyle = shadow.md;

const MENU_ITEMS = [
  {
    label: "Travel Plan",
    emoji: "\u2708",
    route: "/create-travel-plan" as const,
  },
  { label: "List", emoji: "\ud83d\udccb", route: "/create-list" as const },
  {
    label: "Post",
    emoji: "\ud83d\udc8c",
    route: "/create-post" as const,
  },
  { label: "Hang", emoji: "\ud83c\udf89", route: "/create-hang" as const },
  { label: "Intro", emoji: "\ud83e\udd1d", route: "/create-intro" as const },
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
      <View className="mr-3 px-3 py-1.5">
        <Subheading className="text-white font-bold">{item.label}</Subheading>
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

export default function SearchScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const progress = useSharedValue(0);

  useFocusEffect(
    React.useCallback(() => {
      progress.value = 0;
      progress.value = withTiming(1, { duration: ANIMATION_DURATION });
    }, [progress])
  );

  React.useEffect(() => {
    return (
      navigation as {
        addListener: (event: string, callback: () => void) => () => void;
      }
    ).addListener("tabPress", () => {
      if (navigation.isFocused()) {
        setTimeout(() => router.back(), 0);
      }
    });
  }, [navigation, router]);

  const dismiss = () => {
    router.back();
  };

  const handleItemPress = (route: string) => {
    hapticMedium();
    router.back();
    router.push(route as Href);
  };

  return (
    <View className="flex-1 bg-black/50">
      <Pressable className="flex-1" onPress={dismiss} />

      <View className="absolute bottom-24 right-5 items-end gap-3">
        {MENU_ITEMS.map((item, index) => (
          <MenuItem
            key={item.route}
            item={item}
            index={index}
            total={MENU_ITEMS.length}
            progress={progress}
            onPress={() => handleItemPress(item.route)}
          />
        ))}
      </View>
    </View>
  );
}
