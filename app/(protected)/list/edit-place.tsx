import React, { useState, useEffect, useMemo } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  LoadingState,
  ErrorState,
  Text,
} from "@/design-system";
import {
  LocationSearchInput,
  LocationSearchValue,
} from "@/components/LocationSearchInput";
import { useGetList, useUpdatePlace } from "@/hooks/useLists";
import { ListPlace } from "@/types/list";

export default function EditPlaceScreen() {
  const router = useRouter();
  const { placeId, listId } = useLocalSearchParams<{
    placeId: string;
    listId: string;
  }>();
  const { data: listResult, isLoading: loading, error: queryError } = useGetList(listId);
  const updatePlace = useUpdatePlace();

  const place = useMemo(() => {
    if (!listResult?.data || !placeId) return null;
    return listResult.data.places.find((p) => p.id === placeId) ?? null;
  }, [listResult, placeId]);

  const error = queryError
    ? "Failed to load place"
    : !loading && !listResult?.data
      ? "List not found"
      : !loading && listResult?.data && !place
        ? "Place not found"
        : null;

  const [location, setLocation] = useState<LocationSearchValue | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (place && place.latitude && place.longitude) {
      setLocation({
        name: place.resolved_name,
        latitude: place.latitude,
        longitude: place.longitude,
      });
    }
  }, [place]);

  const handleLocationSelect = async (loc: LocationSearchValue | null) => {
    if (!place || !loc) {
      setLocation(loc);
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePlace.mutateAsync({
        place_id: place.id,
        resolved_name: loc.name,
        location: {
          latitude: loc.latitude,
          longitude: loc.longitude,
        },
        status: "resolved",
        confidence: 1.0,
      });

      router.back();
    } catch (err) {
      console.error("Error updating place:", err);
      Alert.alert("Error", "Failed to update place. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextOnly = async (text: string) => {
    if (!place) return;

    setIsSubmitting(true);
    try {
      await updatePlace.mutateAsync({
        place_id: place.id,
        resolved_name: text,
        status: "unresolved",
        confidence: 0,
      });

      router.back();
    } catch (err) {
      console.error("Error updating place:", err);
      Alert.alert("Error", "Failed to update place. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Location" }} />
        <View className="flex-1 bg-white">
          <LoadingState />
        </View>
      </>
    );
  }

  if (error || !place) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Location" }} />
        <View className="flex-1 bg-white">
          <ErrorState message={error || "Place not found"} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit Location" }} />
      <View className="flex-1 bg-white">

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-6 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-sm text-gray-600 mb-4">
            Original: {place.original_text}
          </Text>

          {isSubmitting && (
            <Text className="text-sm text-gray-500 mb-4">Saving...</Text>
          )}

          <LocationSearchInput
            label="Search for a location"
            value={location}
            onChange={handleLocationSelect}
            onTextOnly={handleTextOnly}
            allowTextOnly={true}
            placeholder={place.resolved_name}
          />
        </ScrollView>
      </View>
    </>
  );
}
