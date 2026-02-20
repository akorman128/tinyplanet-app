import React, { useEffect, useRef } from "react";
import { View, Pressable, Animated, Easing } from "react-native";
import { Text } from "./Text";
import { colors } from "./colors";

interface VibeDisplayProps {
  topVibes: { emoji: string; count: number }[];
  totalVibeCount?: number;
  onPress?: () => void;
}

export const VibeDisplay: React.FC<VibeDisplayProps> = ({
  topVibes,
  onPress,
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bounceAnim, {
            toValue: -6,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(shadowAnim, {
            toValue: 0.6,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(shadowAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [bounceAnim, shadowAnim]);

  return (
    <View className="items-center w-full">
      <Pressable className="mb-6 items-center w-full" onPress={onPress}>
        <Animated.View
          className="flex-row flex-wrap gap-4 justify-center items-center"
          style={{ transform: [{ translateY: bounceAnim }] }}
        >
          {topVibes.map(({ emoji, count }) => (
            <View key={emoji} className="relative">
              <Text className="text-[32px]">{emoji}</Text>
              {count > 1 && (
                <View
                  className="absolute -top-1 -right-1 rounded-full min-w-[20px] h-5 justify-center items-center px-1.5"
                  style={{ backgroundColor: colors.primary.DEFAULT }}
                >
                  <Text className="text-xs font-bold text-white">{count}</Text>
                </View>
              )}
            </View>
          ))}
        </Animated.View>
        <Animated.View
          className="mt-2 h-1 rounded-full bg-black/8"
          style={{
            width: 120,
            opacity: shadowAnim,
            transform: [{ scaleX: shadowAnim }],
          }}
        />
      </Pressable>
    </View>
  );
};
