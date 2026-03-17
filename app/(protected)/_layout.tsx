import { Stack } from "expo-router";

export default function ProtectedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#faf9f5" },
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 20,
          color: "#111827",
        },
        headerTintColor: "#111827",
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="create-list" options={{ headerShown: false }} />
      <Stack.Screen name="create-post" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-travel-plan"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="create-intro" options={{ headerShown: false }} />
      <Stack.Screen name="comments" options={{ headerShown: false }} />
      <Stack.Screen
        name="theme-editor"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          headerShown: false,
          presentation: "transparentModal",
          animation: "fade",
        }}
      />
    </Stack>
  );
}
