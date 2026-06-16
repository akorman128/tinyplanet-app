import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

interface StarSpec {
  left: number;
  top: number;
  size: number;
  delay: number;
}

// Hand-placed over the 280×360 card for an even spread.
const STARS: StarSpec[] = [
  { left: 14, top: 30, size: 3, delay: 0 },
  { left: 40, top: 64, size: 2, delay: 1200 },
  { left: 70, top: 22, size: 2, delay: 600 },
  { left: 96, top: 50, size: 3, delay: 1900 },
  { left: 128, top: 18, size: 2, delay: 300 },
  { left: 160, top: 42, size: 3, delay: 2200 },
  { left: 196, top: 26, size: 2, delay: 1500 },
  { left: 228, top: 54, size: 3, delay: 800 },
  { left: 250, top: 30, size: 2, delay: 2000 },
  { left: 24, top: 104, size: 2, delay: 1100 },
  { left: 248, top: 110, size: 3, delay: 500 },
  { left: 12, top: 150, size: 2, delay: 1700 },
  { left: 256, top: 158, size: 2, delay: 900 },
  { left: 30, top: 200, size: 3, delay: 2300 },
  { left: 240, top: 210, size: 2, delay: 1400 },
  { left: 18, top: 250, size: 2, delay: 200 },
  { left: 60, top: 236, size: 2, delay: 1800 },
  { left: 210, top: 248, size: 3, delay: 700 },
  { left: 255, top: 240, size: 2, delay: 2100 },
  { left: 44, top: 286, size: 2, delay: 1000 },
  { left: 120, top: 300, size: 2, delay: 400 },
  { left: 230, top: 296, size: 3, delay: 1600 },
  { left: 88, top: 330, size: 2, delay: 2400 },
  { left: 170, top: 336, size: 2, delay: 950 },
  { left: 14, top: 340, size: 2, delay: 1350 },
  { left: 260, top: 330, size: 3, delay: 550 },
];

const PLANET_SIZE = 84;
const ORBIT_OUTER = 168;
const ORBIT_INNER = 124;
const SYSTEM = ORBIT_OUTER;

function Star({
  spec,
  color,
  reducedMotion,
}: {
  spec: StarSpec;
  color: string;
  reducedMotion: boolean;
}) {
  const t = useSharedValue(0.6);
  useEffect(() => {
    if (reducedMotion) {
      t.value = 0.6;
      return;
    }
    t.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [t, spec.delay, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.15, 0.95]),
    transform: [{ scale: interpolate(t.value, [0, 1], [0.7, 1.1]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: spec.left,
          top: spec.top,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function Orbit({
  size,
  color,
  durationMs,
  reverse,
  reducedMotion,
  children,
}: {
  size: number;
  color: string;
  durationMs: number;
  reverse?: boolean;
  reducedMotion: boolean;
  children?: React.ReactNode;
}) {
  const r = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    r.value = withRepeat(
      withTiming(1, { duration: durationMs, easing: Easing.linear }),
      -1,
      false
    );
  }, [r, durationMs, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(reverse ? -1 : 1) * r.value * 360}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
          opacity: 0.3,
          alignItems: "center",
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

function ShootingStar({
  color,
  reducedMotion,
  delayMs,
}: {
  color: string;
  reducedMotion: boolean;
  delayMs: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    p.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(1, { duration: 7000, easing: Easing.in(Easing.ease) }),
        -1,
        false
      )
    );
  }, [p, delayMs, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.05, 0.12, 0.2, 1], [0, 0.9, 0.9, 0, 0]),
    transform: [
      { translateX: interpolate(p.value, [0, 0.2], [-40, 220]) },
      { translateY: interpolate(p.value, [0, 0.2], [-10, 70]) },
      { rotate: "20deg" },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 24,
          left: 0,
          width: 60,
          height: 2,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function MemberCardStarfield({
  color,
  reducedMotion,
}: {
  color: string;
  reducedMotion: boolean;
}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STARS.map((spec, i) => (
        <Star key={i} spec={spec} color={color} reducedMotion={reducedMotion} />
      ))}

      <View
        style={{
          position: "absolute",
          top: 86,
          left: 0,
          right: 0,
          height: SYSTEM,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Orbit
          size={ORBIT_OUTER}
          color={color}
          durationMs={16000}
          reducedMotion={reducedMotion}
        >
          {/* moon rides the outer orbit */}
          <View
            style={{
              position: "absolute",
              top: -5,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: color,
              opacity: 0.9,
            }}
          />
        </Orbit>
        <Orbit
          size={ORBIT_INNER}
          color={color}
          durationMs={24000}
          reverse
          reducedMotion={reducedMotion}
        />
        <Svg width={PLANET_SIZE} height={PLANET_SIZE}>
          <Defs>
            <RadialGradient id="memberPlanet" cx="34%" cy="30%" r="70%">
              <Stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <Stop offset="100%" stopColor={color} stopOpacity={0.12} />
            </RadialGradient>
          </Defs>
          <Circle
            cx={PLANET_SIZE / 2}
            cy={PLANET_SIZE / 2}
            r={PLANET_SIZE / 2 - 3}
            fill="url(#memberPlanet)"
          />
        </Svg>
      </View>

      <ShootingStar
        color={color}
        reducedMotion={reducedMotion}
        delayMs={1500}
      />
      <ShootingStar
        color={color}
        reducedMotion={reducedMotion}
        delayMs={5000}
      />
    </View>
  );
}
