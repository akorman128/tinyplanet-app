import React from "react";
import { View, Text, Pressable } from "react-native";
import { colors } from "@/design-system";

interface VibeDisplayProps {
  topVibes: { emoji: string; count: number }[];
  totalVibeCount?: number;
  onPress?: () => void;
}

export const VibeDisplay: React.FC<VibeDisplayProps> = ({
  topVibes,
  totalVibeCount,
  onPress,
}) => {
  return (
    <View className="mb-6 items-center w-full">
      <Pressable className="mb-6 items-center w-full" onPress={onPress}>
        <Text
          className="text-sm font-semibold uppercase mb-2"
          style={{ color: colors.hex.placeholder, letterSpacing: 0.5 }}
        >
          Vibe ({totalVibeCount && totalVibeCount > 10 ? "10+" : totalVibeCount}
          )
        </Text>
        <View className="flex-row flex-wrap gap-4 justify-center items-center">
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
        </View>
      </Pressable>
    </View>
  );
};
