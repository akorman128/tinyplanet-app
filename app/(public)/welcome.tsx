import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import { Button, Heading, Subheading, Caption, Text } from "@/design-system";

export default function WelcomePage() {
  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-white"
      contentContainerClassName="flex-1 items-center justify-center px-6"
    >
      <View className="items-center mb-12">
        <Heading className="text-5xl mb-2">Welcome</Heading>
        <Subheading className="text-xl text-center">
          Your planet is waiting for you
        </Subheading>
      </View>

      <View className="w-32 h-32 bg-purple-200 rounded-full items-center justify-center mb-16">
        <Text className="text-6xl">🌍</Text>
      </View>

      <View className="w-full gap-4">
        <Button
          variant="primary"
          className="shadow-lg"
          onPress={() => router.push("/sign-up")}
        >
          Join
        </Button>

        <Button variant="secondary" onPress={() => router.push("/sign-in")}>
          Sign In
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
