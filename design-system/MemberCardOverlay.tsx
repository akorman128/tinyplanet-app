import { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useProfileStore } from "@/stores/profileStore";
import { hapticSuccess } from "@/utils";
import { formatMemberSince } from "@/utils/formatMemberSince";
import { useShakeDetection } from "@/hooks/useShakeDetection";
import { resolveMemberCardColors } from "./memberCardColors";
import { MemberCard } from "./MemberCard";

const COOLDOWN_MS = 2500;
const FLICK_DISTANCE = 120;
const FLICK_SPEED = 800;
const { height: SCREEN_H } = Dimensions.get("window");
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export function MemberCardOverlay() {
  const profile = useProfileStore((s) => s.profileState);
  const reducedMotion = useReducedMotion() ?? false;

  const [visible, setVisible] = useState(false);
  const [cooling, setCooling] = useState(false);

  const progress = useSharedValue(0); // 0 = hidden, 1 = fully revealed
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  const reveal = useCallback(() => {
    dragX.value = 0;
    dragY.value = 0;
    setVisible(true);
    progress.value = reducedMotion
      ? 1
      : withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    hapticSuccess();
  }, [progress, dragX, dragY, reducedMotion]);

  const finishDismiss = useCallback(() => {
    setVisible(false);
    setCooling(true);
  }, []);

  const dismiss = useCallback(() => {
    progress.value = withTiming(0, { duration: 220 }, (done) => {
      if (done) runOnJS(finishDismiss)();
    });
  }, [progress, finishDismiss]);

  // Cooldown after dismiss before shakes can re-trigger.
  useEffect(() => {
    if (!cooling) return;
    const id = setTimeout(() => setCooling(false), COOLDOWN_MS);
    return () => clearTimeout(id);
  }, [cooling]);

  useShakeDetection({
    enabled: !!profile && !visible && !cooling,
    onShake: reveal,
  });

  const flick = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          dragX.value = e.translationX;
          dragY.value = e.translationY;
        })
        .onEnd((e) => {
          const dist = Math.hypot(e.translationX, e.translationY);
          const speed = Math.hypot(e.velocityX, e.velocityY);
          if (dist > FLICK_DISTANCE || speed > FLICK_SPEED) {
            dragX.value = withTiming(e.translationX + e.velocityX * 0.2, {
              duration: 250,
            });
            dragY.value = withTiming(
              e.translationY + e.velocityY * 0.2 + SCREEN_H * 0.3,
              { duration: 250 }
            );
            progress.value = withTiming(0, { duration: 250 }, (done) => {
              if (done) runOnJS(finishDismiss)();
            });
          } else {
            dragX.value = withSpring(0);
            dragY.value = withSpring(0);
          }
        }),
    [dragX, dragY, progress, finishDismiss]
  );

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: dragX.value },
      {
        translateY:
          dragY.value +
          (reducedMotion ? 0 : interpolate(progress.value, [0, 1], [20, 0])),
      },
      {
        scale: reducedMotion
          ? 1
          : interpolate(progress.value, [0, 1], [0.8, 1]),
      },
      {
        rotateZ: `${
          reducedMotion ? 0 : interpolate(progress.value, [0, 1], [-6, 0])
        }deg`,
      },
    ],
  }));

  if (!profile) return null;

  const colors = resolveMemberCardColors(profile.theme_settings);
  const name = profile.full_name || "Member";
  const since = formatMemberSince(profile.created_at);

  // While hidden, render nothing (the shake hook above stays mounted and active).
  // This avoids an absolute-fill overlay swallowing touches when idle.
  const showDevTrigger = __DEV__ && !visible;
  if (!visible && !showDevTrigger) return null;

  return (
    <GestureHandlerRootView style={styles.root} pointerEvents="box-none">
      {visible ? (
        <>
          <AnimatedBlurView
            intensity={40}
            tint="dark"
            style={[StyleSheet.absoluteFill, backdropStyle]}
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
          <Animated.View style={styles.center} pointerEvents="box-none">
            <GestureDetector gesture={flick}>
              <Animated.View style={cardStyle}>
                <MemberCard
                  colors={colors}
                  name={name}
                  since={since}
                  reducedMotion={reducedMotion}
                />
              </Animated.View>
            </GestureDetector>
          </Animated.View>
        </>
      ) : null}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 9999, elevation: 9999 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  devTrigger: {
    position: "absolute",
    right: 12,
    bottom: 96,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  devTriggerText: { fontSize: 18 },
});
