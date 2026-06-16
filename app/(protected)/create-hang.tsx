import React from "react";
import { View, Alert } from "react-native";
import { useRouter, Stack } from "expo-router";
import { HangForm, HangFormData } from "@/components/HangForm";
import { LocationSearchValue } from "@/components/LocationSearchInput";
import { useCreateHang } from "@/hooks/useHangs";
import { useLocation } from "@/hooks/useLocation";
import { reverseGeocode } from "@/utils/reverseGeocode";
import { logger } from "@/utils/logger";

export default function CreateHangScreen() {
  const router = useRouter();
  const createHang = useCreateHang();
  const { getCurrentLocation } = useLocation();

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

  const resolveCurrentLocation =
    async (): Promise<LocationSearchValue | null> => {
      const coords = await getCurrentLocation(true);
      if (coords.latitude === 0 && coords.longitude === 0) {
        Alert.alert(
          "Location unavailable",
          "We couldn't get your current location. Check that location permission is enabled and try again."
        );
        return null;
      }
      const { formattedAddress } = await reverseGeocode(
        coords.longitude,
        coords.latitude
      );
      return {
        name: formattedAddress,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    };

  return (
    <>
      <Stack.Screen options={{ title: "Create Hang" }} />
      <View className="flex-1 bg-cream">
        <HangForm
          defaultValues={{
            title: "",
            description: "",
            location: null,
            startsAt: new Date(),
          }}
          submitLabel="Hang"
          isSubmitting={createHang.isPending}
          onSubmit={onSubmit}
          onResolveCurrentLocation={resolveCurrentLocation}
        />
      </View>
    </>
  );
}
