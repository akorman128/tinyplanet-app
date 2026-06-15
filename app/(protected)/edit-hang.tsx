import React from "react";
import { View, Alert } from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, LoadingState, ErrorState } from "@/design-system";
import { HangForm, hangSchema, HangFormData } from "@/components/HangForm";
import { useGetHangDetail, useUpdateHang } from "@/hooks/useHangs";
import { HangDetail } from "@/types/hang";
import { logger } from "@/utils/logger";

function EditHangForm({ hang }: { hang: HangDetail }) {
  const router = useRouter();
  const updateHang = useUpdateHang();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<HangFormData>({
    resolver: zodResolver(hangSchema),
    defaultValues: {
      title: hang.title,
      description: hang.description ?? "",
      location: {
        name: hang.location_name,
        latitude: hang.latitude,
        longitude: hang.longitude,
      },
      startsAt: new Date(hang.starts_at),
    },
    mode: "all",
  });

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
          disabled={!isValid || updateHang.isPending}
        >
          Save Changes
        </Button>
      </View>
    </KeyboardAwareScrollView>
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
