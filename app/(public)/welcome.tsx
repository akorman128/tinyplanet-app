import { useEffect } from "react";
import { View, Image } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { Button, Heading, Subheading, Caption } from "@/design-system";

export default function WelcomePage() {
  const reducedMotion = useReducedMotion();
  const float = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      float.value = 0;
      return;
    }
    float.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [float, reducedMotion]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -10 * float.value }],
  }));

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-cream"
      contentContainerClassName="flex-1 items-center justify-center px-6"
    >
      <View className="items-center mb-12">
        <Heading className="text-5xl mb-2">Welcome</Heading>
        <Subheading className="text-xl text-center">
          Your planet is waiting for you
        </Subheading>
      </View>

      <View className="mb-16">
        <Animated.View style={floatStyle}>
          <Image
            source={require("../../assets/heart-planet.png")}
            className="w-48 h-48"
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <View className="w-full gap-2">
        <Button
          variant="primary"
          className="shadow-lg"
          onPress={() => router.push("/sign-up")}
        >
          Join
        </Button>

        <Button variant="secondary" onPress={() => router.push("/sign-in")}>
          Login
        </Button>
      </View>

      <View className="mt-8">
        <Caption className="text-center">
          Made with ❤️ for friends who are family
        </Caption>
      </View>
    </KeyboardAwareScrollView>
  );
}
