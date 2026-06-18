import React from "react";
import { View, Linking } from "react-native";
import { Stack, router } from "expo-router";
import { Button, Slider, MenuRow } from "@/design-system";
import { Body } from "@/design-system/Typography";
import { useSupabase } from "@/hooks/useSupabase";
import { useLocationStore } from "@/stores/locationStore";

function formatPrivacyRadius(value: number): string {
  if (value === 0) return "Exact";
  return `~${value.toFixed(1)} mi`;
}

export default function MutualsScreen() {
  const { signOut } = useSupabase();
  const locationPrivacyRadiusMiles = useLocationStore(
    (state) => state.locationPrivacyRadiusMiles
  );
  const setLocationPrivacyRadius = useLocationStore(
    (state) => state.setLocationPrivacyRadius
  );

  return (
    <>
      <Stack.Screen options={{ title: "Settings" }} />
      <View className="flex-1 bg-cream">
        <View className="w-full py-4 px-6 flex flex-col gap-4">
          <Slider
            label="Location Privacy"
            value={locationPrivacyRadiusMiles}
            min={0}
            max={1}
            step={0.1}
            onValueChange={setLocationPrivacyRadius}
            formatValue={formatPrivacyRadius}
          />
          <MenuRow
            icon={<Body>🚫</Body>}
            label="Hidden Users"
            onPress={() => router.push("/blocked-users")}
            position="standalone"
          />
          <View className="flex flex-col gap-2">
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
      </View>
    </>
  );
}
