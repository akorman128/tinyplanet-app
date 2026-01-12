import React, { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import {
  useRouter,
  Stack,
  useLocalSearchParams,
  useFocusEffect,
} from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Mapbox from "@rnmapbox/maps";
import { useLists } from "@/hooks/useLists";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { ListWithPlaces, ListPlace } from "@/types/list";
import {
  filterValidPlaces,
  calculateMapBounds,
  placesToGeoJSON,
} from "@/utils/mapUtils";
import {
  ScreenHeader,
  LoadingState,
  ErrorState,
  Icons,
  colors,
  PlaceListItem,
} from "@/design-system";

export default function ListDetailScreen() {
  const router = useRouter();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useRequireProfile();
  const { getList, deleteList, removePlace } = useLists();

  const [list, setList] = useState<ListWithPlaces | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnList = useMemo(
    () => list?.user_id === profile.id,
    [list, profile.id]
  );

  useFocusEffect(
    useCallback(() => {
      fetchList();
    }, [listId])
  );

  const fetchList = async () => {
    if (!listId) return;

    try {
      setIsLoading(true);
      setError(null);
      const { data } = await getList(listId);
      if (!data) {
        setError("List not found");
      } else {
        setList(data);
      }
    } catch (err) {
      console.error("Failed to fetch list:", err);
      setError("Failed to load list");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete List",
      "Are you sure you want to delete this list? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteList(listId);
              Alert.alert("Success", "List deleted successfully", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (err) {
              Alert.alert("Error", "Failed to delete list");
            }
          },
        },
      ]
    );
  };

  const handleDeletePlace = (placeId: string) => {
    Alert.alert("Delete Place", "Remove this place from the list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await removePlace(placeId);
            fetchList();
          } catch (err) {
            Alert.alert("Error", "Failed to remove place");
          }
        },
      },
    ]);
  };

  const handleEditPlace = (place: ListPlace) => {
    router.push({
      pathname: "/list/edit-place",
      params: { placeId: place.id, listId },
    });
  };

  // Filter valid places
  const validPlaces = useMemo(
    () => filterValidPlaces(list?.places || []),
    [list]
  );

  // Calculate bounds for camera
  const bounds = useMemo(
    () =>
      calculateMapBounds(
        validPlaces as Array<{ latitude: number; longitude: number }>
      ),
    [validPlaces]
  );

  // Create GeoJSON for places
  const placesGeoJSON = useMemo(
    () => placesToGeoJSON(validPlaces, { truncateName: 15 }),
    [validPlaces]
  );

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-white pt-12">
          <ScreenHeader title="List" showBackButton={true} />
          <LoadingState />
        </View>
      </>
    );
  }

  if (error || !list) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-white pt-12">
          <ScreenHeader title="List" showBackButton={true} />
          <ErrorState message={error || "List not found"} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-white pt-12">
          <ScreenHeader
            title="List"
            showBackButton={true}
            rightComponent={
              isOwnList ? (
                <Pressable onPress={handleDelete}>
                  <Icons.trash size={24} color={colors.hex.error} />
                </Pressable>
              ) : undefined
            }
          />

          {/* Map */}
          {validPlaces.length > 0 ? (
            <View style={{ height: 300 }}>
              <Mapbox.MapView
                style={{ flex: 1 }}
                styleURL={Mapbox.StyleURL.Dark}
                pitchEnabled={false}
                rotateEnabled={true}
                scrollEnabled={true}
                zoomEnabled={true}
              >
                <Mapbox.Camera
                  bounds={bounds ? { ne: bounds.ne, sw: bounds.sw } : undefined}
                  padding={{
                    paddingTop: 50,
                    paddingBottom: 50,
                    paddingLeft: 50,
                    paddingRight: 50,
                  }}
                  animationDuration={0}
                />

                <Mapbox.ShapeSource id="places" shape={placesGeoJSON}>
                  <Mapbox.CircleLayer
                    id="places-circles"
                    style={{
                      circleRadius: 8,
                      circleColor: [
                        "case",
                        ["get", "isAmbiguous"],
                        "#fb923c",
                        colors.hex.purple600,
                      ],
                      circleStrokeColor: "#ffffff",
                      circleStrokeWidth: 2,
                    }}
                  />
                  <Mapbox.SymbolLayer
                    id="places-labels"
                    style={{
                      textField: ["get", "name"],
                      textSize: 12,
                      textColor: "#ffffff",
                      textHaloColor: "rgba(0,0,0,0.75)",
                      textHaloWidth: 1,
                      textOffset: [0, 1.5],
                      textAnchor: "top",
                      textMaxWidth: 10,
                    }}
                  />
                </Mapbox.ShapeSource>
              </Mapbox.MapView>
            </View>
          ) : (
            <View className="h-60 bg-gray-100 items-center justify-center">
              <Text className="text-gray-500">No locations to display</Text>
            </View>
          )}

          {/* List Info */}
          <View className="px-6 py-4 bg-white border-b border-gray-200">
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {list.title}
            </Text>
            <Text className="text-sm text-gray-600">{list.location_name}</Text>
          </View>

          {/* Places List */}
          <ScrollView className="flex-1 bg-white">
            <View className="px-6 py-4">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Places ({list.places.length})
              </Text>

              {list.places.map((place, index) => (
                <PlaceListItem
                  key={place.id}
                  place={place}
                  index={index}
                  swipeable={isOwnList}
                  onEdit={isOwnList ? handleEditPlace : undefined}
                  onDelete={isOwnList ? handleDeletePlace : undefined}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </GestureHandlerRootView>
    </>
  );
}
