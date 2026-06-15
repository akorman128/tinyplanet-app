import React from "react";
import { View, Alert } from "react-native";
import { useRouter, Stack } from "expo-router";
import { HangForm, HangFormData } from "@/components/HangForm";
import { useCreateHang } from "@/hooks/useHangs";
import { useLocationStore } from "@/stores/locationStore";
import { logger } from "@/utils/logger";

export default function CreateHangScreen() {
  const router = useRouter();
  const createHang = useCreateHang();
  const currentLocation = useLocationStore((s) => s.currentLocation);

  const onSubmit = async (data: HangFormData) => {
    try {
      await createHang.mutateAsync({
        title: data.title,
        description: data.description,
        location: {
          name: data.location!.name,
          latitude: data.location!.latitude,
          longitude: data.location!.longitude,
        },
        // Clamp to now in case the "now" default went stale while the form was open.
        starts_at: new Date(
          Math.max(data.startsAt.getTime(), Date.now())
        ).toISOString(),
      });
      router.back();
    } catch (error) {
      logger.error("Error creating hang:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create hang"
      );
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Create Hang" }} />
      <View className="flex-1 bg-cream">
        <HangForm
          defaultValues={{
            title: "",
            description: "",
            location: currentLocation
              ? {
                  name: "Current location",
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }
              : null,
            startsAt: new Date(),
          }}
          submitLabel="Hang"
          isSubmitting={createHang.isPending}
          onSubmit={onSubmit}
        />
      </View>
    </>
  );
}
