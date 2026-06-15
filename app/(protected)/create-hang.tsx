import React from "react";
import { View, Alert } from "react-native";
import { useRouter, Stack } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/design-system";
import { HangForm, hangSchema, HangFormData } from "@/components/HangForm";
import { useCreateHang } from "@/hooks/useHangs";
import { useLocationStore } from "@/stores/locationStore";
import { logger } from "@/utils/logger";

export default function CreateHangScreen() {
  const router = useRouter();
  const createHang = useCreateHang();
  const currentLocation = useLocationStore((s) => s.currentLocation);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<HangFormData>({
    resolver: zodResolver(hangSchema),
    defaultValues: {
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
    },
    mode: "all",
  });

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
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-6 pb-12"
          enableOnAndroid
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
        >
          <HangForm control={control} errors={errors} />

          <View className="mt-6">
            <Button
              variant="coral"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || createHang.isPending}
            >
              Create Hang
            </Button>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </>
  );
}
