import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  OptionSelector,
  LoadingState,
  ErrorState,
  Icons,
} from "@/design-system";
import {
  TravelPlanForm,
  travelPlanSchema,
  TravelPlanFormData,
} from "@/components/TravelPlanForm";
import {
  useUpdateTravelPlan,
  useGetTravelPlanByPostId,
} from "@/hooks/useTravelPlan";
import { PostVisibility } from "@/types/post";
import { logger } from "@/utils/logger";

export default function EditTravelPlanScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const updateTravelPlan = useUpdateTravelPlan();
  const {
    data: travelPlan,
    isPending: loading,
    error: queryError,
  } = useGetTravelPlanByPostId(postId);
  const travelPlanId = travelPlan?.id ?? null;

  const [visibility, setVisibility] = useState<PostVisibility>("friends");

  const form = useForm<TravelPlanFormData>({
    resolver: zodResolver(travelPlanSchema),
    defaultValues: {
      destination: null,
      startDate: new Date(),
      durationDays: 7,
    },
    mode: "all",
  });

  // Pre-fill form when travel plan data loads
  useEffect(() => {
    if (!travelPlan) return;

    // Validate coordinates
    if (!travelPlan.longitude || !travelPlan.latitude) return;

    form.reset({
      destination: {
        name: travelPlan.destination_name,
        latitude: travelPlan.latitude,
        longitude: travelPlan.longitude,
      },
      startDate: new Date(travelPlan.start_date),
      durationDays: travelPlan.duration_days,
      text: "", // Leave empty - user can add new text if desired
    });

    form.trigger();
    setVisibility("friends");
  }, [travelPlan]);

  const onSubmit = async (data: TravelPlanFormData) => {
    if (!travelPlanId) {
      Alert.alert("Error", "No travel plan ID found");
      return;
    }

    try {
      await updateTravelPlan.mutateAsync({
        travel_plan_id: travelPlanId,
        destination: {
          name: data.destination!.name,
          latitude: data.destination!.latitude,
          longitude: data.destination!.longitude,
        },
        start_date: data.startDate.toISOString().split("T")[0],
        duration_days: data.durationDays,
        post_visibility: visibility,
        text: data.text || undefined,
      });

      // Navigate back after successful update
      router.back();
    } catch (err) {
      logger.error("Error updating travel plan:", err);
      Alert.alert("Error", "Failed to update travel plan. Please try again.");
    }
  };

  const visibilityOptions: {
    value: PostVisibility;
    label: string;
    icon?: (props: { size?: number; color?: string }) => React.JSX.Element;
  }[] = [
    { value: "public", label: "Public", icon: Icons.globe },
    { value: "friends", label: "Friends", icon: Icons.unlocked },
  ];

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Travel Plan" }} />
        <View className="flex-1 bg-cream">
          <LoadingState />
        </View>
      </>
    );
  }

  if (queryError) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Travel Plan" }} />
        <View className="flex-1 bg-cream">
          <ErrorState
            message={queryError.message ?? "Failed to load travel plan"}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit Travel Plan" }} />
      <View className="flex-1 bg-cream">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-6 pb-8"
        >
          <TravelPlanForm
            control={form.control}
            errors={form.formState.errors}
            activeTravelPlan={null}
            isEditingActivePlan={false}
            onCancelEdit={() => {}}
          />

          <OptionSelector
            label="Who can see this?"
            options={visibilityOptions}
            value={visibility}
            onChange={setVisibility}
            className="mt-6 mb-6"
          />

          <Button
            variant="primary"
            onPress={form.handleSubmit(onSubmit)}
            disabled={updateTravelPlan.isPending || !form.formState.isValid}
          >
            {updateTravelPlan.isPending ? "Saving..." : "Save"}
          </Button>
        </ScrollView>
      </View>
    </>
  );
}
