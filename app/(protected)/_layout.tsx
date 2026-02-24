import { Stack } from "expo-router";

export default function ProtectedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#ffffff" },
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 20,
          color: "#111827",
        },
        headerTintColor: "#111827",
        headerBackTitle: "",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-post"
        options={{
          title: "New Post",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="create-travel-plan"
        options={{
          title: "New Travel Plan",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: "Search",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
