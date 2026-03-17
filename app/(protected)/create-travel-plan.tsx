import React, { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  OptionSelector,
  Icons,
  LoadingState,
  ActiveTravelPlanBanner,
  ScreenHeader,
} from "@/design-system";
import {
  TravelPlanForm,
  travelPlanSchema,
  TravelPlanFormData,
} from "@/components/TravelPlanForm";
import {
  useCreateTravelPlan,
  useGetActiveTravelPlan,
  useCancelTravelPlan,
} from "@/hooks/useTravelPlan";
import { PostVisibility } from "@/types/post";
import { CreateTravelPlanInput } from "@/types/travelPlan";

export default function CreateTravelPlanScreen() {
  const router = useRouter();
  const createTravelPlan = useCreateTravelPlan();
  const { data: activeTravelPlanData, isPending: loading } =
    useGetActiveTravelPlan();
  const cancelTravelPlan = useCancelTravelPlan();
  const activeTravelPlan = activeTravelPlanData?.data ?? null;

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

  const handleEditActivePlan = () => {
    if (!activeTravelPlan) return;
    router.replace({
      pathname: "/edit-travel-plan",
      params: { postId: activeTravelPlan.post_id },
    });
  };

  const handleDeleteActivePlan = () => {
    if (!activeTravelPlan) return;

    Alert.alert(
      "Cancel Travel Plan",
      "Are you sure you want to cancel this travel plan? This will also delete the associated post.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelTravelPlan.mutateAsync(activeTravelPlan.id);
              Alert.alert("Success", "Travel plan cancelled");
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to cancel travel plan");
            }
          },
        },
      ]
    );
  };

  const onSubmit = async (data: TravelPlanFormData) => {
    if (!data.destination) return;

    try {
      const input: CreateTravelPlanInput = {
        destination: {
          name: data.destination.name,
          latitude: data.destination.latitude,
          longitude: data.destination.longitude,
        },
        start_date: data.startDate.toISOString().split("T")[0],
        duration_days: data.durationDays,
        post_visibility: visibility,
      };

      await createTravelPlan.mutateAsync(input);
      router.back();
    } catch (err) {
      console.error("Error creating travel plan:", err);
      Alert.alert("Error", "Failed to create travel plan. Please try again.");
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

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#faf9f5" }}
      edges={["top"]}
    >
      <ScreenHeader title="Create Plan" onClose={() => router.back()} />

      <View className="flex-1">
        {loading ? (
          <LoadingState />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-6 pt-2 pb-8"
          >
            {activeTravelPlan ? (
              <ActiveTravelPlanBanner
                travelPlan={activeTravelPlan}
                onEdit={handleEditActivePlan}
                onDelete={handleDeleteActivePlan}
              />
            ) : (
              <>
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
                  disabled={
                    createTravelPlan.isPending || !form.formState.isValid
                  }
                >
                  {createTravelPlan.isPending ? "Creating..." : "Create Plan"}
                </Button>
              </>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
