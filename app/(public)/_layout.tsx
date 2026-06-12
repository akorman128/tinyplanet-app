// global.css lives here (a provider-free layout) instead of the root layout so
// Metro Fast Refresh can patch UI edits surgically instead of re-executing the
// provider-heavy root and blacking out the app. See app/(protected)/_layout.tsx.
import "../../global.css";
import { Stack } from "expo-router";

export default function PublicLayout() {
  return (
    <Stack
      initialRouteName="welcome"
      screenOptions={{
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="welcome"
        options={{
          headerShown: false,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          headerShown: false, // Handled by sign-up/_layout.tsx
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="sign-in"
        options={{
          headerShown: false, // Handled by sign-up/_layout.tsx
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
