import React, { useState } from "react";
import { View, TouchableOpacity, Platform } from "react-native";
import { Controller, useForm, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { z } from "zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Input, Button, FormField, Text, colors } from "@/design-system";
import {
  LocationSearchInput,
  LocationSearchValue,
} from "@/components/LocationSearchInput";
import { HANG_MAX_ADVANCE_MS } from "@/utils/hangTime";

export const hangSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(80, "Title is too long")
    .trim(),
  description: z.string().max(500, "Description is too long").optional(),
  location: z
    .object({
      name: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    })
    .nullable()
    .refine((val) => val !== null, { message: "Location is required" }),
  // No "in the past" refine: the default is the live "now", which would go
  // stale while the form is open. The picker's minimumDate blocks picking the
  // past, and the submit handler clamps the value to >= now.
  startsAt: z
    .date()
    .refine((d) => d.getTime() <= Date.now() + HANG_MAX_ADVANCE_MS, {
      message: "Hangs can be at most 7 days in advance",
    }),
});

export type HangFormData = z.infer<typeof hangSchema>;

interface HangFormProps {
  defaultValues: DefaultValues<HangFormData>;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (data: HangFormData) => void | Promise<void>;
  /**
   * When provided, the location field shows a "use current location" button
   * that resolves the device's location into a value for the field.
   */
  onResolveCurrentLocation?: () => Promise<LocationSearchValue | null>;
}

const formatWhen = (date: Date) =>
  date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export function HangForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onResolveCurrentLocation,
}: HangFormProps) {
  const [showPicker, setShowPicker] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<HangFormData>({
    resolver: zodResolver(hangSchema),
    defaultValues,
    mode: "all",
  });

  return (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerClassName="px-6 pt-6 pb-12"
      enableOnAndroid
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-5">
        {/* Title */}
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="What's the plan?"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Sunset picnic"
              maxLength={80}
              showCharacterCount
              error={errors.title?.message}
            />
          )}
        />

        {/* Description */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Details"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Bring snacks and a blanket…"
              multiline
              maxLength={500}
              showCharacterCount
              className="min-h-[96px]"
              textAlignVertical="top"
              error={errors.description?.message}
            />
          )}
        />

        {/* Location */}
        <Controller
          control={control}
          name="location"
          render={({ field: { onChange, value } }) => (
            <LocationSearchInput
              label="📍 Where"
              placeholder="Search for a place…"
              value={value}
              onChange={onChange}
              onUseCurrentLocation={
                onResolveCurrentLocation
                  ? async () => {
                      const resolved = await onResolveCurrentLocation();
                      if (resolved) onChange(resolved);
                    }
                  : undefined
              }
              error={errors.location?.message}
            />
          )}
        />

        {/* Date & time */}
        <Controller
          control={control}
          name="startsAt"
          render={({ field: { value, onChange } }) => (
            <FormField label="🕒 When" error={errors.startsAt?.message}>
              <TouchableOpacity onPress={() => setShowPicker((s) => !s)}>
                <View
                  className={`py-4 px-4 rounded-xl  bg-white ${
                    errors.startsAt ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <Text className="text-base text-gray-900">
                    {formatWhen(value)}
                  </Text>
                </View>
              </TouchableOpacity>

              {showPicker && (
                <View className="bg-white rounded-xl p-4 gap-4 mt-2">
                  <DateTimePicker
                    value={value}
                    mode="datetime"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={new Date()}
                    maximumDate={new Date(Date.now() + HANG_MAX_ADVANCE_MS)}
                    onChange={(_event, date) => {
                      if (Platform.OS === "android") setShowPicker(false);
                      if (date) onChange(date);
                    }}
                    textColor={colors.hex.black}
                  />
                  {Platform.OS === "ios" && (
                    <Button onPress={() => setShowPicker(false)}>Done</Button>
                  )}
                </View>
              )}
            </FormField>
          )}
        />
      </View>

      <View className="mt-6">
        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isSubmitting}
        >
          {submitLabel}
        </Button>
      </View>
    </KeyboardAwareScrollView>
  );
}
