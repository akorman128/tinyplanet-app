import React from "react";
import { View, Pressable } from "react-native";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { z } from "zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Input, Body, Meta, Text, FormField } from "@/design-system";
import { TravelPlan } from "@/types/travelPlan";
import { LocationSearchInput } from "./LocationSearchInput";
// Travel plan schema
export const travelPlanSchema = z.object({
  destination: z
    .object({
      name: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    })
    .nullable()
    .refine((val) => val !== null, { message: "Destination is required" }),
  startDate: z.date(),
  durationDays: z
    .number()
    .int()
    .min(1, "Minimum 1 day")
    .max(31, "Maximum 31 days"),
  text: z.string().max(300, "Message is too long").optional(),
});

export type TravelPlanFormData = z.infer<typeof travelPlanSchema>;

interface TravelPlanFormProps {
  control: Control<TravelPlanFormData>;
  errors: FieldErrors<TravelPlanFormData>;
  activeTravelPlan: TravelPlan | null;
  isEditingActivePlan: boolean;
  onCancelEdit: () => void;
}

export function TravelPlanForm({
  control,
  errors,
  activeTravelPlan,
  isEditingActivePlan,
  onCancelEdit,
}: TravelPlanFormProps) {
  return (
    <>
      {(isEditingActivePlan || !activeTravelPlan) && (
        <>
          {isEditingActivePlan && (
            <View className="mb-4 flex-row items-center justify-between">
              <Body className="font-semibold">Editing Travel Plan</Body>
              <Pressable onPress={onCancelEdit}>
                <Text className="text-purple-600 font-medium">Cancel</Text>
              </Pressable>
            </View>
          )}

          <Controller
            control={control}
            name="destination"
            render={({ field }) => (
              <LocationSearchInput
                value={field.value}
                onChange={field.onChange}
                label="📍 Destination"
                error={errors.destination?.message}
                placeholder="e.g., Paris, France"
              />
            )}
          />

          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <FormField
                label="Start Date"
                error={errors.startDate?.message}
                className="mb-4"
              >
                <DateTimePicker
                  value={field.value}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    if (date) field.onChange(date);
                  }}
                />
              </FormField>
            )}
          />

          {/* Duration */}
          <Controller
            control={control}
            name="durationDays"
            render={({ field }) => (
              <View className="mb-4">
                <Input
                  label="Duration (days)"
                  placeholder="e.g., 7"
                  keyboardType="number-pad"
                  value={field.value?.toString() || ""}
                  onChangeText={(text) => field.onChange(parseInt(text) || 1)}
                  error={errors.durationDays?.message}
                />
                {!errors.durationDays && (
                  <Meta className="mt-1">Maximum 31 days</Meta>
                )}
              </View>
            )}
          />

          {/* Custom Message */}
          <Controller
            control={control}
            name="text"
            render={({ field }) => (
              <Input
                label="Message (optional)"
                placeholder="Add a note about your trip..."
                multiline
                maxLength={300}
                showCharacterCount
                value={field.value || ""}
                onChangeText={field.onChange}
                error={errors.text?.message}
                className="min-h-[120px]"
                textAlignVertical="top"
              />
            )}
          />
        </>
      )}
    </>
  );
}
