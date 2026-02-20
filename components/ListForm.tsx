import React, { useEffect, useState } from "react";
import { View, TextInput, ScrollView, Pressable } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/design-system/Input";
import { Button } from "@/design-system/Button";
import { Select, SelectOption } from "@/design-system/Select";
import { colors } from "@/design-system/colors";
import { Heading, Label, Caption, Meta, Text } from "@/design-system";
import { CreateListInput, ListCategory } from "@/types/list";
import { LocationSearchInput } from "./LocationSearchInput";

const CATEGORY_OPTIONS: SelectOption<ListCategory>[] = [
  { value: "nightlife", label: "Nightlife" },
  { value: "eat_drink", label: "Eat & Drink" },
  { value: "activities", label: "Activities" },
  { value: "explore", label: "Explore" },
  { value: "shop", label: "Shop" },
  { value: "work", label: "Work" },
];

const listSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  category: z.enum([
    "nightlife",
    "eat_drink",
    "activities",
    "explore",
    "shop",
    "work",
  ]),
  location: z
    .object({
      name: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    })
    .nullable()
    .refine((val) => val !== null, {
      message: "Location is required",
    }),
  note: z.string().max(500, "Note too long").optional(),
  places: z.string().optional(),
});

type ListFormData = z.infer<typeof listSchema>;

interface ListFormProps {
  onSubmit: (data: CreateListInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialPlaces?: string;
}

export function ListForm({
  onSubmit,
  onCancel,
  isLoading,
  initialPlaces = "",
}: ListFormProps) {
  const [showPlaces, setShowPlaces] = useState(!!initialPlaces);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      category: "eat_drink",
      location: null,
      note: "",
      places: "",
    },
  });

  // Update places field when initialPlaces changes (for share extension)
  useEffect(() => {
    if (initialPlaces) {
      setValue("places", initialPlaces);
      setShowPlaces(true);
    }
  }, [initialPlaces, setValue]);

  const handleFormSubmit = async (data: ListFormData) => {
    if (!data.location) {
      return;
    }

    // Parse places (one per line) - now optional
    const placesList = data.places
      ? data.places
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      : [];

    await onSubmit({
      title: data.title.trim(),
      category: data.category,
      location: data.location,
      places: placesList,
      note: data.note?.trim() || undefined,
    });
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-6">
      <View className="mb-6">
        <Heading className="mb-2">
          Create List
        </Heading>
        <Caption className="text-gray-600">
          📍 Add your favorite places in a city. Places will be automatically
          located on a map.
        </Caption>
      </View>
      <View className="gap-2">
        {/* Title Input */}
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Title"
              placeholder="Best Coffee Shops"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.title?.message}
              maxLength={100}
            />
          )}
        />

        {/* Category Selector */}
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <Select
              label="Category"
              options={CATEGORY_OPTIONS}
              value={value}
              onChange={onChange}
              placeholder="Select a category"
            />
          )}
        />

        {/* Notes Input */}
        <Controller
          control={control}
          name="note"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Note"
              placeholder="Add a note"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.note?.message}
              multiline
              numberOfLines={3}
            />
          )}
        />

        {/* Location Input */}
        <Controller
          control={control}
          name="location"
          render={({ field: { onChange, value } }) => (
            <LocationSearchInput
              label="Location"
              placeholder="Search for a city..."
              value={value}
              onChange={onChange}
              error={errors.location?.message}
            />
          )}
        />

        {/* Places Input */}
        <View>
          <Label className="mb-2">
            Places (one per line)
          </Label>
          <Controller
            control={control}
            name="places"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Blue Bottle Coffee&#10;Stumptown Coffee Roasters&#10;Devoción"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="font-sans bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base"
                placeholderTextColor="#9CA3AF"
                style={{ minHeight: 120 }}
              />
            )}
          />
          <View className="flex-row items-center gap-1 bg-gray-100 p-2 mt-2 rounded-lg">
            <Meta className="mt-1">
              💡 This will take a bit depending on the number of places. Results
              vary, but you can correct manually.
            </Meta>
          </View>
        </View>

        {/* Buttons */}
        <View className="flex-row gap-2 mb-8">
          <View className="flex-1">
            <Button variant="secondary" onPress={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button
              variant="primary"
              onPress={handleSubmit(handleFormSubmit)}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create List"}
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
