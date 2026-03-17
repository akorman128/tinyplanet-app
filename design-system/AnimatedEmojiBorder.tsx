import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { SPEED_TO_DURATION } from "@/utils/themeDefaults";

const DEFAULT_EMOJIS = ["🫦", "🕶️", "👠"];
const CELL_SIZE = 20;
const STRIP_THICKNESS = 34;
const SEQUENCE_PX = (emojis: string[]) => emojis.length * CELL_SIZE;

function EmojiCells({
  count,
  horizontal,
  emojis,
}: {
  count: number;
  horizontal: boolean;
  emojis: string[];
}) {
  const cells = Array.from({ length: count }, (_, i) => (
    <Text
      key={i}
      style={{
        fontSize: CELL_SIZE - 4,
        width: horizontal ? CELL_SIZE : STRIP_THICKNESS,
        height: horizontal ? STRIP_THICKNESS : CELL_SIZE,
        textAlign: "center",
        lineHeight: horizontal ? STRIP_THICKNESS : CELL_SIZE,
      }}
    >
      {emojis[i % emojis.length]}
    </Text>
  ));
  return <>{cells}</>;
}

function HorizontalStrip({
  width,
  scrollDirection,
  top,
  bottom,
  emojis,
  duration,
  reducedMotion,
}: {
  width: number;
  scrollDirection: "left" | "right";
  top?: number;
  bottom?: number;
  emojis: string[];
  duration: number;
  reducedMotion: boolean;
}) {
  const offset = useSharedValue(0);
  const seqPx = SEQUENCE_PX(emojis);
  const emojiCount = Math.ceil((width + 2 * seqPx) / CELL_SIZE);

  React.useEffect(() => {
    if (reducedMotion) {
      offset.value = 0;
      return;
    }
    const target = scrollDirection === "left" ? -seqPx : seqPx;
    offset.value = withRepeat(
      withTiming(target, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, [scrollDirection, offset, seqPx, duration, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        height: STRIP_THICKNESS,
        top,
        bottom,
        overflow: "hidden",
      }}
      pointerEvents="none"
    >
      <Animated.View
        style={[{ flexDirection: "row", marginLeft: -seqPx }, animatedStyle]}
      >
        <EmojiCells count={emojiCount} horizontal emojis={emojis} />
      </Animated.View>
    </View>
  );
}

function VerticalStrip({
  height,
  scrollDirection,
  left,
  right,
  emojis,
  duration,
  reducedMotion,
}: {
  height: number;
  scrollDirection: "up" | "down";
  left?: number;
  right?: number;
  emojis: string[];
  duration: number;
  reducedMotion: boolean;
}) {
  const offset = useSharedValue(0);
  const seqPx = SEQUENCE_PX(emojis);
  const emojiCount = Math.ceil((height + 2 * seqPx) / CELL_SIZE);

  React.useEffect(() => {
    if (reducedMotion) {
      offset.value = 0;
      return;
    }
    const target = scrollDirection === "up" ? -seqPx : seqPx;
    offset.value = withRepeat(
      withTiming(target, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, [scrollDirection, offset, seqPx, duration, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        width: STRIP_THICKNESS,
        left,
        right,
        overflow: "hidden",
      }}
      pointerEvents="none"
    >
      <Animated.View style={[{ marginTop: -seqPx }, animatedStyle]}>
        <EmojiCells count={emojiCount} horizontal={false} emojis={emojis} />
      </Animated.View>
    </View>
  );
}

export interface AnimatedEmojiBorderProps {
  children: React.ReactNode;
  emojis?: string[];
  speed?: "slow" | "medium" | "fast";
  direction?: "clockwise" | "counterclockwise";
  reducedMotion?: boolean;
}

export function AnimatedEmojiBorder({
  children,
  emojis = DEFAULT_EMOJIS,
  speed = "medium",
  direction = "clockwise",
  reducedMotion = false,
}: AnimatedEmojiBorderProps) {
  const { width, height } = useWindowDimensions();
  const duration = SPEED_TO_DURATION[speed];

  // Clockwise: top→right, right→down, bottom→left, left→up
  // Counterclockwise: reverse
  const cw = direction === "clockwise";

  return (
    <View style={{ flex: 1 }}>
      {children}
      <HorizontalStrip
        width={width}
        scrollDirection={cw ? "right" : "left"}
        top={0}
        emojis={emojis}
        duration={duration}
        reducedMotion={reducedMotion}
      />
      <HorizontalStrip
        width={width}
        scrollDirection={cw ? "left" : "right"}
        bottom={0}
        emojis={emojis}
        duration={duration}
        reducedMotion={reducedMotion}
      />
      <VerticalStrip
        height={height}
        scrollDirection={cw ? "down" : "up"}
        right={0}
        emojis={emojis}
        duration={duration}
        reducedMotion={reducedMotion}
      />
      <VerticalStrip
        height={height}
        scrollDirection={cw ? "up" : "down"}
        left={0}
        emojis={emojis}
        duration={duration}
        reducedMotion={reducedMotion}
      />
    </View>
  );
}
