import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const EMOJIS = ["🫦", "🕶️", "👠"];
const CELL_SIZE = 20;
const STRIP_THICKNESS = 34;
const CYCLE_DURATION = 2500;
/** Pixels per one full emoji cycle (4 emojis) */
const SEQUENCE_PX = EMOJIS.length * CELL_SIZE;

function EmojiCells({
  count,
  horizontal,
}: {
  count: number;
  horizontal: boolean;
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
      {EMOJIS[i % EMOJIS.length]}
    </Text>
  ));
  return <>{cells}</>;
}

function HorizontalStrip({
  width,
  scrollDirection,
  top,
  bottom,
}: {
  width: number;
  scrollDirection: "left" | "right";
  top?: number;
  bottom?: number;
}) {
  const offset = useSharedValue(0);
  const emojiCount = Math.ceil((width + 2 * SEQUENCE_PX) / CELL_SIZE);

  React.useEffect(() => {
    const target = scrollDirection === "left" ? -SEQUENCE_PX : SEQUENCE_PX;
    offset.value = withRepeat(
      withTiming(target, { duration: CYCLE_DURATION, easing: Easing.linear }),
      -1,
      false
    );
  }, [scrollDirection, offset]);

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
        style={[
          { flexDirection: "row", marginLeft: -SEQUENCE_PX },
          animatedStyle,
        ]}
      >
        <EmojiCells count={emojiCount} horizontal />
      </Animated.View>
    </View>
  );
}

function VerticalStrip({
  height,
  scrollDirection,
  left,
  right,
}: {
  height: number;
  scrollDirection: "up" | "down";
  left?: number;
  right?: number;
}) {
  const offset = useSharedValue(0);
  const emojiCount = Math.ceil((height + 2 * SEQUENCE_PX) / CELL_SIZE);

  React.useEffect(() => {
    const target = scrollDirection === "up" ? -SEQUENCE_PX : SEQUENCE_PX;
    offset.value = withRepeat(
      withTiming(target, { duration: CYCLE_DURATION, easing: Easing.linear }),
      -1,
      false
    );
  }, [scrollDirection, offset]);

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
      <Animated.View style={[{ marginTop: -SEQUENCE_PX }, animatedStyle]}>
        <EmojiCells count={emojiCount} horizontal={false} />
      </Animated.View>
    </View>
  );
}

export interface AnimatedEmojiBorderProps {
  children: React.ReactNode;
}

export function AnimatedEmojiBorder({ children }: AnimatedEmojiBorderProps) {
  const { width, height } = useWindowDimensions();

  return (
    <View style={{ flex: 1 }}>
      {children}
      <HorizontalStrip width={width} scrollDirection="left" bottom={0} />
      <VerticalStrip height={height} scrollDirection="up" left={0} />
      <VerticalStrip height={height} scrollDirection="down" right={0} />
    </View>
  );
}
