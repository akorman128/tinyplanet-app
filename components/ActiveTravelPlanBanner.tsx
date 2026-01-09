import React from "react";
import { View, Text } from "react-native";
import { Button } from "@/design-system";
import { TravelPlan } from "@/types/travelPlan";

interface ActiveTravelPlanBannerProps {
  travelPlan: TravelPlan;
  onEdit: () => void;
  onDelete: () => void;
}

export function ActiveTravelPlanBanner({
  travelPlan,
  onEdit,
  onDelete,
}: ActiveTravelPlanBannerProps) {
  return (
    <View className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-semibold text-purple-900">
          Active Travel Plan
        </Text>
        <Text className="text-xs text-purple-700">
          {new Date(travelPlan.start_date).toLocaleDateString()} -{" "}
          {new Date(travelPlan.end_date).toLocaleDateString()}
        </Text>
      </View>

      <Text className="text-lg font-medium text-gray-900 mb-1">
        {travelPlan.destination_name}
      </Text>
      <Text className="text-sm text-gray-600 mb-4">
        {travelPlan.duration_days} days
      </Text>

      <View className="flex-row gap-2">
        <Button variant="secondary" onPress={onEdit} className="flex-1">
          Edit
        </Button>
        <Button variant="secondary" onPress={onDelete} className="flex-1">
          Delete
        </Button>
      </View>
    </View>
  );
}

