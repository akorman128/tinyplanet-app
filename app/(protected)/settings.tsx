import React from "react";
import { View, Linking } from "react-native";
import { Stack, router } from "expo-router";
import { Text, Button } from "@/design-system";
import { useSupabase } from "@/hooks/useSupabase";

export default function MutualsScreen() {
  const { signOut } = useSupabase();
  return (
    <>
      <Stack.Screen options={{ title: "Settings" }} />
      <View className="flex-1 bg-cream">
        <View className="w-full py-4 px-6 flex flex-col gap-2">
          <Button
            size="md"
            variant="primary"
            onPress={() => {
              Linking.openURL("https://app.youform.com/forms/werjra1a");
            }}
          >
            Feedback
          </Button>
          <Button
            size="md"
            variant="secondary"
            onPress={async () => {
              await signOut();
              router.replace("/welcome");
            }}
          >
            Sign Out
          </Button>
        </View>
      </View>
    </>
  );
}
