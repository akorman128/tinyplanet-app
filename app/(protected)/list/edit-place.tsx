import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert, Text } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ScreenHeader,
  Button,
  LoadingState,
  ErrorState,
} from "@/design-system";
import {
  LocationSearchInput,
  LocationSearchValue,
} from "@/components/LocationSearchInput";
import { useLists } from "@/hooks/useLists";
import { ListPlace } from "@/types/list";

export default function EditPlaceScreen() {
  const router = useRouter();
  const { placeId, listId } = useLocalSearchParams<{
    placeId: string;
    listId: string;
  }>();
  const { getList, updatePlace } = useLists();

  const [place, setPlace] = useState<ListPlace | null>(null);
  const [location, setLocation] = useState<LocationSearchValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlace = async () => {
      if (!placeId || !listId) {
        setError("Missing place or list ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { data: list } = await getList(listId);

        if (!list) {
          setError("List not found");
          return;
        }

        const foundPlace = list.places.find((p) => p.id === placeId);
        if (!foundPlace) {
          setError("Place not found");
          return;
        }

        setPlace(foundPlace);

        if (foundPlace.latitude && foundPlace.longitude) {
          setLocation({
            name: foundPlace.resolved_name,
            latitude: foundPlace.latitude,
            longitude: foundPlace.longitude,
          });
        }
      } catch (err) {
        console.error("Error fetching place:", err);
        setError("Failed to load place");
      } finally {
        setLoading(false);
      }
    };

    fetchPlace();
  }, [placeId, listId, getList]);

  const onSubmit = async () => {
    if (!place || !location) return;

    setIsSubmitting(true);
    try {
      await updatePlace({
        place_id: place.id,
        resolved_name: location.name,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
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

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-white pt-12">
          <ScreenHeader title="Edit Location" showBackButton={true} />
          <LoadingState />
        </View>
      </>
    );
  }

  if (error || !place) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-white pt-12">
          <ScreenHeader title="Edit Location" showBackButton={true} />
          <ErrorState message={error || "Place not found"} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white pt-12">
        <ScreenHeader title="Edit Location" showBackButton={true} />

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-6 pb-8"
        >
          <Text className="text-sm text-gray-600 mb-4">
            Editing: {place.resolved_name}
          </Text>

          <LocationSearchInput
            label="Search for location"
            value={location}
            onChange={setLocation}
            placeholder="Search for a more specific location..."
          />

          <View className="mt-6">
            <Button
              variant="primary"
              onPress={onSubmit}
              disabled={!location || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
