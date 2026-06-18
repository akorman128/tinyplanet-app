import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { hapticSelection } from "@/utils/haptics";

interface PledgeToggleProps {
  label: string;
  value: boolean;
  onToggle: () => void;
  reducedMotion?: boolean;
}

const KNOB_TRAVEL = 19;

export function PledgeToggle({
  label,
  value,
  onToggle,
  reducedMotion = false,
}: PledgeToggleProps) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = value ? 1 : 0;
      return;
    }
    progress.value = withTiming(value ? 1 : 0, { duration: 220 });
  }, [value, reducedMotion, progress]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * KNOB_TRAVEL }],
  }));

  const handlePress = () => {
    hapticSelection();
    onToggle();
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={handlePress}
      className={`flex-row items-center gap-3.5 rounded-2xl border px-4 py-4 ${
        value
          ? "border-blue-500/70 bg-blue-500/15"
          : "border-blue-400/30 bg-blue-500/10"
      }`}
    >
      <View
        className={`h-7 w-12 justify-center rounded-full px-[3px] ${
          value ? "bg-blue-500" : "bg-blue-200/20"
        }`}
      >
        <Animated.View
          className="h-[21px] w-[21px] rounded-full bg-cream"
          style={knobStyle}
        />
      </View>
      <Text className="flex-1 text-[14.5px] font-medium leading-5 text-cream">
        {label}
      </Text>
    </Pressable>
  );
}
