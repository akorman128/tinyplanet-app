import React from "react";
import { View } from "react-native";
import { Button } from "./Button";
import { Body, SectionTitle, Meta, Caption } from "./Typography";
import { TravelPlan } from "@/types/travelPlan";

export interface ActiveTravelPlanBannerProps {
  travelPlan: TravelPlan;
  onEdit?: () => void;
  onDelete?: () => void;
  variant?: "default" | "compact";
}

export function ActiveTravelPlanBanner({
  travelPlan,
  onEdit,
  onDelete,
  variant = "default",
}: ActiveTravelPlanBannerProps) {
  if (variant === "compact") {
    return (
      <View className="w-full mb-6 px-4 py-3 bg-purple-100 rounded-lg border border-purple-200 flex-col justify-between">
        <SectionTitle className="text-base text-purple-900 mb-1">
          🚀 {travelPlan.destination_name}
        </SectionTitle>
        <Body className="text-sm font-semibold text-purple-900">
          {new Date(travelPlan.start_date).toLocaleDateString()} →{" "}
          {new Date(travelPlan.end_date).toLocaleDateString()}
        </Body>
      </View>
    );
  }

  return (
    <View className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <View className="flex-row items-center justify-between mb-3">
        <Body className="font-semibold text-purple-900">
          Active Travel Plan
        </Body>
        <Meta className="text-purple-700">
          {new Date(travelPlan.start_date).toLocaleDateString()} -{" "}
          {new Date(travelPlan.end_date).toLocaleDateString()}
        </Meta>
      </View>

      <SectionTitle className="font-medium mb-1">
        {travelPlan.destination_name}
      </SectionTitle>
      <Caption className="text-gray-600 mb-4">
        {travelPlan.duration_days} days
      </Caption>

      {(onEdit || onDelete) && (
        <View className="flex-row gap-2">
          {onEdit && (
            <Button variant="secondary" onPress={onEdit} className="flex-1">
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="secondary" onPress={onDelete} className="flex-1">
              Delete
            </Button>
          )}
        </View>
      )}
    </View>
  );
}
