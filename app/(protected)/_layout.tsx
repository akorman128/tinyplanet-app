// global.css is imported here (a provider-free layout) rather than the root
// app/_layout.tsx. Importing it in the provider-heavy root forces Metro's Fast
// Refresh to re-execute the whole root module on every UI edit, which tore down
// the Fabric view tree and blacked out the app until a full restart. Keeping it
// in this minimal layout lets Fast Refresh patch surgically. See uniwind FAQ.
import "../../global.css";
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
