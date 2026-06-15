import React from "react";
import { View, Alert } from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { LoadingState, ErrorState } from "@/design-system";
import { HangForm, HangFormData } from "@/components/HangForm";
import { useGetHangDetail, useUpdateHang } from "@/hooks/useHangs";
import { HangDetail } from "@/types/hang";
import { logger } from "@/utils/logger";

function EditHangForm({ hang }: { hang: HangDetail }) {
  const router = useRouter();
  const updateHang = useUpdateHang();

  const onSubmit = async (data: HangFormData) => {
    try {
      await updateHang.mutateAsync({
        hang_id: hang.id,
        title: data.title,
        description: data.description,
        location: {
          name: data.location!.name,
          latitude: data.location!.latitude,
          longitude: data.location!.longitude,
        },
        starts_at: new Date(
          Math.max(data.startsAt.getTime(), Date.now())
        ).toISOString(),
      });
      router.back();
    } catch (error) {
      logger.error("Error updating hang:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update hang"
      );
    }
  };

  return (
    <HangForm
      defaultValues={{
        title: hang.title,
        description: hang.description ?? "",
        location: {
          name: hang.location_name,
          latitude: hang.latitude,
          longitude: hang.longitude,
        },
        startsAt: new Date(hang.starts_at),
      }}
      submitLabel="Save Changes"
      isSubmitting={updateHang.isPending}
      onSubmit={onSubmit}
    />
  );
}

export default function EditHangScreen() {
  const { hangId } = useLocalSearchParams<{ hangId: string }>();
  const { data: hang, isPending, error } = useGetHangDetail(hangId);

  return (
    <>
      <Stack.Screen options={{ title: "Edit Hang" }} />
      <View className="flex-1 bg-cream">
        {isPending ? (
          <LoadingState />
        ) : error || !hang ? (
          <ErrorState message="Hang not found" />
        ) : (
          <EditHangForm hang={hang} />
        )}
      </View>
    </>
  );
}
