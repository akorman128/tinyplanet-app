import { View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const TRACK_WIDTH = 24;
const TRACK_HEIGHT = 48;
const THUMB_SIZE = 18;
const THUMB_GAP = 3;

export interface VerticalToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel: string;
  className?: string;
}

// Vertical on/off toggle built from plain Views so the thumb stays centered
// within its pill on every platform. A rotated native <Switch> cannot: its
// intrinsic layout box differs per platform and is wider than the pill, so
// flex-centering the rotated control leaves the thumb off-center.
export function VerticalToggle({
  value,
  onValueChange,
  accessibilityLabel,
  className = "",
}: VerticalToggleProps) {
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
      accessibilityLabel={accessibilityLabel}
      onPress={() => onValueChange(!value)}
      className={`w-12 h-16 rounded-full bg-white/90 border border-gray-200 shadow-sm items-center justify-center ${className}`}
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
