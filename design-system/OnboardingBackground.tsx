import { memo, useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

// Brand palette (hex for SVG) — see global.css @theme.
const SKY_TOP = "#002247"; // blue-900
const SKY_MID = "#003875"; // blue-800
const SKY_DEEP = "#001530"; // deep navy (darker than blue-900)
const PLANET_CORE = "#4da2ff"; // blue-400 (lit horizon)
const PLANET_MID = "#007aff"; // blue-500 (brand)
const PLANET_LOW = "#003875"; // blue-800
const PLANET_BASE = "#002247"; // blue-900
const GLOW = "#4da2ff"; // blue-400
const LIGHT = "#c7e2ff"; // blue-200
const YOU = "#f0f7ff"; // blue-50 (near-white)
const STAR = "#faf9f5"; // cream

interface StarSpec {
  left: number;
  top: number;
  size: number;
  delay: number;
  dur: number;
}

interface OnboardingBackgroundProps {
  activeLights: number;
  ignited: boolean;
  reducedMotion: boolean;
}

// Horizon positions as fractions of the frame (x of width, bottom of height).
const LIGHT_SPOTS = [
  { x: 0.24, b: 0.115 },
  { x: 0.7, b: 0.12 },
  { x: 0.4, b: 0.088 },
  { x: 0.58, b: 0.083 },
  { x: 0.15, b: 0.088 },
  { x: 0.82, b: 0.093 },
];

const Star = memo(function Star({
  spec,
  reducedMotion,
}: {
  spec: StarSpec;
  reducedMotion: boolean;
}) {
  const t = useSharedValue(reducedMotion ? 0.6 : 0);

  useEffect(() => {
    if (reducedMotion) {
      t.value = 0.6;
      return;
    }
    t.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, {
          duration: spec.dur,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );
  }, [t, spec.delay, spec.dur, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.18, 0.75]),
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
          backgroundColor: STAR,
        },
        style,
      ]}
    />
  );
});

const PeopleLight = memo(function PeopleLight({
  left,
  bottom,
  on,
  reducedMotion,
}: {
  left: number;
  bottom: number;
  on: boolean;
  reducedMotion: boolean;
}) {
  const p = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      p.value = on ? 1 : 0;
      return;
    }
    p.value = withTiming(on ? 1 : 0, { duration: 600 });
  }, [on, reducedMotion, p]);

  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [
      { translateY: (1 - p.value) * 8 },
      { scale: 0.6 + p.value * 0.4 },
    ],
  }));

  return (
    <Animated.View
      style={[styles.light, { left, bottom, shadowColor: LIGHT }, style]}
    />
  );
});

const YouLight = memo(function YouLight({
  left,
  bottom,
  ignited,
  reducedMotion,
}: {
  left: number;
  bottom: number;
  ignited: boolean;
  reducedMotion: boolean;
}) {
  const drop = useSharedValue(0);

  useEffect(() => {
    if (!ignited) {
      drop.value = 0;
      return;
    }
    if (reducedMotion) {
      drop.value = 1;
      return;
    }
    drop.value = withTiming(1, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
  }, [ignited, reducedMotion, drop]);

  const style = useAnimatedStyle(() => ({
    opacity: ignited ? interpolate(drop.value, [0, 0.7, 1], [0, 1, 1]) : 0,
    transform: [
      { translateY: interpolate(drop.value, [0, 1], [-260, 0]) },
      { scale: interpolate(drop.value, [0, 1], [0.5, 1]) },
    ],
  }));

  return (
    <Animated.View
      style={[styles.youLight, { left, bottom, shadowColor: YOU }, style]}
    />
  );
});

export function OnboardingBackground({
  activeLights,
  ignited,
  reducedMotion,
}: OnboardingBackgroundProps) {
  const { width: W, height: H } = useWindowDimensions();

  const PLANET = W * 2;
  const VISIBLE = H * 0.2;
  const planetLeft = (W - PLANET) / 2;
  const planetBottom = VISIBLE - PLANET;
  const glowW = W * 1.9;
  const glowH = H * 0.5;

  const stars = useMemo<StarSpec[]>(() => {
    const out: StarSpec[] = [];
    for (let i = 0; i < 46; i++) {
      out.push({
        left: Math.random() * W,
        top: Math.random() * H * 0.68,
        size: Math.random() > 0.8 ? 3 : 2,
        delay: Math.random() * 4000,
        dur: 3000 + Math.random() * 4000,
      });
    }
    return out;
  }, [W, H]);

  const ignite = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) {
      ignite.value = ignited ? 1 : 0;
      return;
    }
    ignite.value = withTiming(ignited ? 1 : 0, { duration: 1000 });
  }, [ignited, reducedMotion, ignite]);

  const atmosphereStyle = useAnimatedStyle(() => ({
    opacity: 0.65 + ignite.value * 0.35,
  }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: ignite.value }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={SKY_TOP} />
            <Stop offset="0.38" stopColor={SKY_MID} />
            <Stop offset="1" stopColor={SKY_DEEP} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#sky)" />
      </Svg>

      {stars.map((spec, i) => (
        <Star key={i} spec={spec} reducedMotion={reducedMotion} />
      ))}

      <Animated.View
        style={[
          {
            position: "absolute",
            left: (W - glowW) / 2,
            bottom: -H * 0.06,
            width: glowW,
            height: glowH,
          },
          atmosphereStyle,
        ]}
      >
        <Svg width={glowW} height={glowH}>
          <Defs>
            <RadialGradient id="atmo" cx="50%" cy="100%" rx="55%" ry="70%">
              <Stop offset="0" stopColor={GLOW} stopOpacity="0.55" />
              <Stop offset="0.4" stopColor={GLOW} stopOpacity="0.26" />
              <Stop offset="0.75" stopColor={GLOW} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#atmo)" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            left: (W - glowW) / 2,
            bottom: -H * 0.02,
            width: glowW,
            height: glowH * 0.7,
          },
          haloStyle,
        ]}
      >
        <Svg width={glowW} height={glowH * 0.7}>
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="100%" rx="42%" ry="80%">
              <Stop offset="0" stopColor={LIGHT} stopOpacity="0.6" />
              <Stop offset="0.45" stopColor={GLOW} stopOpacity="0.28" />
              <Stop offset="0.8" stopColor={GLOW} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#halo)" />
        </Svg>
      </Animated.View>

      <View
        style={{
          position: "absolute",
          left: planetLeft,
          bottom: planetBottom,
          width: PLANET,
          height: PLANET,
        }}
      >
        <Svg width={PLANET} height={PLANET}>
          <Defs>
            <RadialGradient id="planet" cx="50%" cy="11%" r="72%">
              <Stop offset="0" stopColor={PLANET_CORE} />
              <Stop offset="0.28" stopColor={PLANET_MID} />
              <Stop offset="0.62" stopColor={PLANET_LOW} />
              <Stop offset="1" stopColor={PLANET_BASE} />
            </RadialGradient>
          </Defs>
          <Circle
            cx={PLANET / 2}
            cy={PLANET / 2}
            r={PLANET / 2}
            fill="url(#planet)"
          />
        </Svg>
      </View>

      {LIGHT_SPOTS.map((spot, i) => (
        <PeopleLight
          key={i}
          left={spot.x * W}
          bottom={spot.b * H}
          on={i < activeLights}
          reducedMotion={reducedMotion}
        />
      ))}
      <YouLight
        left={W / 2 - 6}
        bottom={H * 0.135}
        ignited={ignited}
        reducedMotion={reducedMotion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  light: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: LIGHT,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  youLight: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: YOU,
    shadowOpacity: 0.95,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
    elevation: 9,
  },
});
