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
import { useTravelPlan } from "@/hooks/useTravelPlan";
import { useSupabase } from "@/hooks/useSupabase";
import { PostVisibility } from "@/types/post";

export default function EditTravelPlanScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { updateTravelPlan } = useTravelPlan();
  const { supabase } = useSupabase();
  const [travelPlanId, setTravelPlanId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>("friends");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TravelPlanFormData>({
    resolver: zodResolver(travelPlanSchema),
    defaultValues: {
      destination: null,
      startDate: new Date(),
      durationDays: 7,
    },
    mode: "all",
  });

  // Fetch travel plan on mount using post ID
  useEffect(() => {
    const fetchTravelPlan = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!postId) {
          setError("No post ID provided");
          setLoading(false);
          return;
        }

        // Fetch travel plan by post ID using RPC function
        const { data, error: fetchError } = await supabase.rpc(
          "get_travel_plan_by_post_id",
          { p_post_id: postId }
        );

        if (fetchError) throw fetchError;

        if (!data || data.length === 0) {
          setError("Travel plan not found");
          setLoading(false);
          return;
        }

        const travelPlan = data[0];

        // Store the travel plan ID for the update call
        setTravelPlanId(travelPlan.id);

        // Validate coordinates
        if (!travelPlan.longitude || !travelPlan.latitude) {
          setError("Invalid destination coordinates");
          setLoading(false);
          return;
        }

        // Pre-fill form with actual travel plan data
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

        // Trigger validation after reset to properly update form state
        form.trigger();

        // Set default visibility (travel plans are typically friends-only)
        setVisibility("friends");
      } catch (err) {
        console.error("Error fetching travel plan:", err);
        setError("Failed to load travel plan");
      } finally {
        setLoading(false);
      }
    };

    fetchTravelPlan();
  }, [supabase, postId, form]);

  const onSubmit = async (data: TravelPlanFormData) => {
    if (!travelPlanId) {
      Alert.alert("Error", "No travel plan ID found");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTravelPlan({
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
      console.error("Error updating travel plan:", err);
      Alert.alert("Error", "Failed to update travel plan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibilityOptions: {
    value: PostVisibility;
    label: string;
    icon?: any;
  }[] = [
    { value: "public", label: "Public", icon: Icons.globe },
    { value: "friends", label: "Friends", icon: Icons.unlocked },
  ];

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Travel Plan" }} />
        <View className="flex-1 bg-white">
          <LoadingState />
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Travel Plan" }} />
        <View className="flex-1 bg-white">
          <ErrorState message={error} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit Travel Plan" }} />
      <View className="flex-1 bg-white">

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
            disabled={isSubmitting || !form.formState.isValid}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </ScrollView>
      </View>
    </>
  );
}
