import { Stack } from "expo-router";

export default function ProtectedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#ffffff" },
        headerTitleStyle: { fontWeight: "bold", fontSize: 20, color: "#111827" },
        headerTintColor: "#111827",
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-post"
        options={{ presentation: "modal", title: "New Post" }}
      />
      <Stack.Screen
        name="create-travel-plan"
        options={{ presentation: "modal", title: "New Travel Plan" }}
      />
    </Stack>
  );
}
