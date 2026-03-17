import { Stack } from "expo-router";

export default function SignInLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitle: true,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="phone-number"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="verify-otp"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
