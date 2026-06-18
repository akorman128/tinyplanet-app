import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";
import { router } from "expo-router";

import { useSignupStore } from "@/stores/signupStore";
import { useLocation } from "@/hooks/useLocation";
import { hapticSuccess } from "@/utils/haptics";
import {
  OnboardingBackground,
  PledgeToggle,
  ProgressDots,
} from "@/design-system";
import {
  ONBOARDING_SCREENS,
  PLEDGE_LABELS,
  PledgeKey,
  Consents,
  activeIndexFromOffset,
  ctaForIndex,
  isAdvanceDisabled,
  isEnterEnabled,
  isLastIndex,
  isPledgeScreen,
  lightsForIndex,
  maxReachableIndex,
} from "@/components/onboarding/onboardingScreens";

const COUNT = ONBOARDING_SCREENS.length;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const reducedMotion = useReducedMotion() ?? false;
  const { setSignupData } = useSignupStore();
  const { getCurrentLocation } = useLocation();

  const scrollRef = useRef<ScrollView>(null);
  const navigated = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [optOutOpen, setOptOutOpen] = useState(false);
  const [consents, setConsents] = useState<Consents>({
    pledgeFamily: false,
    pledgeLocation: false,
  });

  const goTo = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(COUNT - 1, i));
      scrollRef.current?.scrollTo({ x: next * W, animated: !reducedMotion });
      setActiveIndex(next);
    },
    [W, reducedMotion]
  );

  const handleBack = useCallback(() => {
    if (activeIndex > 0) {
      goTo(activeIndex - 1);
    } else {
      router.back();
    }
  }, [activeIndex, goTo]);

  const togglePledge = useCallback(
    (key: PledgeKey) => {
      const turningOn = !consents[key];
      setConsents((c) => ({ ...c, [key]: !c[key] }));
      // Accepting the location terms triggers the OS location prompt and
      // captures coords for the profile (no-op re-confirm if already granted).
      if (key === "pledgeLocation" && turningOn) {
        void getCurrentLocation().then((coords) => {
          if (coords.latitude !== 0 || coords.longitude !== 0) {
            setSignupData({ location: coords });
          }
        });
      }
    },
    [consents, getCurrentLocation, setSignupData]
  );

  const handleEnter = useCallback(() => {
    if (navigated.current || !isEnterEnabled(consents)) return;
    navigated.current = true;
    setSignupData({ consents });
    hapticSuccess();
    router.push("/sign-up/phone-number");
  }, [consents, setSignupData]);

  const handleAdvance = useCallback(() => {
    if (isLastIndex(activeIndex)) {
      handleEnter();
    } else {
      goTo(activeIndex + 1);
    }
  }, [activeIndex, goTo, handleEnter]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const landed = activeIndexFromOffset(
        e.nativeEvent.contentOffset.x,
        W,
        COUNT
      );
      // Don't let a forward swipe slip past an un-toggled Deal screen.
      const max = maxReachableIndex(consents);
      if (landed > max) {
        goTo(max);
        return;
      }
      setActiveIndex(landed);
    },
    [W, consents, goTo]
  );

  // Android hardware back mirrors the in-screen chevron.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (optOutOpen) {
        setOptOutOpen(false);
        return true;
      }
      if (activeIndex > 0) {
        goTo(activeIndex - 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [optOutOpen, activeIndex, goTo]);

  const advanceDisabled = isAdvanceDisabled(activeIndex, consents);
  const showOptOut = isPledgeScreen(activeIndex);

  return (
    <View className="flex-1 bg-purple-900">
      <OnboardingBackground
        activeLights={lightsForIndex(activeIndex)}
        ignited={false}
        reducedMotion={reducedMotion}
      />

      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <View className="px-[30px] pt-[18px]">
          <ProgressDots count={COUNT} activeIndex={activeIndex} />
        </View>

        <Pressable
          onPress={handleBack}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="absolute left-[20px] z-20"
          style={{ top: insets.top + 12 }}
        >
          <Text className="text-[26px] leading-none text-purple-200">‹</Text>
        </Pressable>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          className="flex-1"
        >
          {ONBOARDING_SCREENS.map((screen) => (
            <View
              key={screen.id}
              style={{ width: W }}
              className="px-[30px] pt-12"
            >
              <Text
                className="text-purple-300 font-semibold"
                style={{ fontSize: 12, letterSpacing: 2.4 }}
              >
                {screen.eyebrow.toUpperCase()}
              </Text>
              <Text
                className="mt-[18px] text-cream font-semibold"
                style={{ fontSize: 38, lineHeight: 40, letterSpacing: -0.3 }}
              >
                {screen.title}
              </Text>
              <Text
                className="mt-[18px] text-purple-200"
                style={{ fontSize: 16.5, lineHeight: 24, maxWidth: 320 }}
              >
                {screen.body}
              </Text>

              {screen.pledge && (
                <View className="mt-8">
                  <PledgeToggle
                    label={PLEDGE_LABELS[screen.pledge]}
                    value={consents[screen.pledge]}
                    onToggle={() => togglePledge(screen.pledge as PledgeKey)}
                    reducedMotion={reducedMotion}
                  />
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View className="items-center gap-4 px-[30px] pt-2">
          <Pressable
            disabled={advanceDisabled}
            onPress={handleAdvance}
            accessibilityRole="button"
            accessibilityState={{ disabled: advanceDisabled }}
            className={`w-full items-center rounded-2xl py-[17px] ${
              advanceDisabled ? "bg-purple-200/10" : "bg-purple-600"
            }`}
          >
            <Text
              className={`text-base font-semibold ${
                advanceDisabled ? "text-purple-400" : "text-white"
              }`}
            >
              {ctaForIndex(activeIndex)}
            </Text>
          </Pressable>

          {showOptOut && (
            <Pressable onPress={() => setOptOutOpen(true)} hitSlop={8}>
              <Text className="text-[13.5px] font-medium text-purple-200 underline">
                {"This isn't for me"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {optOutOpen && (
        <View
          className="absolute inset-0 z-30 items-center justify-center px-9"
          style={{ backgroundColor: "rgba(18,13,46,0.9)" }}
        >
          <View className="items-center">
            <Text
              className="mb-3 text-center text-cream font-semibold"
              style={{ fontSize: 28 }}
            >
              {"No hard feelings."}
            </Text>
            <Text
              className="mb-7 text-center text-purple-200"
              style={{ fontSize: 15.5, lineHeight: 24, maxWidth: 280 }}
            >
              {
                "Tiny Planet only works if everyone's all in. Come back when you're ready."
              }
            </Text>
            <Pressable
              onPress={() => setOptOutOpen(false)}
              className="rounded-2xl bg-purple-600 px-7 py-3.5"
            >
              <Text className="text-base font-semibold text-white">
                {"Actually, I'm in"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
