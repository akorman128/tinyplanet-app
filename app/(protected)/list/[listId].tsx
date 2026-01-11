import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import Mapbox from "@rnmapbox/maps";
import { useLists } from "@/hooks/useLists";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { ListWithPlaces, ListPlace } from "@/types/list";
import {
  LocationSearchInput,
  LocationSearchValue,
} from "@/components/LocationSearchInput";
import {
  ScreenHeader,
  LoadingState,
  ErrorState,
  Icons,
  colors,
  Button,
} from "@/design-system";

export default function ListDetailScreen() {
  const router = useRouter();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useRequireProfile();
  const { getList, deleteList, removePlace, updatePlace } = useLists();

  const [list, setList] = useState<ListWithPlaces | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlace, setEditingPlace] = useState<ListPlace | null>(null);
  const [editLocation, setEditLocation] = useState<LocationSearchValue | null>(
    null
  );

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const isOwnList = useMemo(
    () => list?.user_id === profile.id,
    [list, profile.id]
  );

  useEffect(() => {
    fetchList();
  }, [listId]);

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

  const handleEditPress = (place: ListPlace) => {
    setEditingPlace(place);
    setEditLocation(
      place.latitude && place.longitude
        ? {
            name: place.resolved_name,
            latitude: place.latitude,
            longitude: place.longitude,
          }
        : null
    );
    bottomSheetRef.current?.present();
  };

  const handleSaveEdit = async () => {
    if (!editingPlace || !editLocation) return;
    try {
      await updatePlace({
        place_id: editingPlace.id,
        resolved_name: editLocation.name,
        location: {
          latitude: editLocation.latitude,
          longitude: editLocation.longitude,
        },
        status: "resolved",
        confidence: 1.0,
      });
      bottomSheetRef.current?.dismiss();
      setEditingPlace(null);
      fetchList();
    } catch (err) {
      Alert.alert("Error", "Failed to update place");
    }
  };

  const renderRightActions = useCallback(
    (place: ListPlace) => (
      <View className="flex-row items-center">
        <Pressable
          onPress={() => handleEditPress(place)}
          className="justify-center items-center bg-purple-600 w-16 mb-8"
          style={{ height: "100%" }}
        >
          <Icons.edit size={20} color={colors.hex.white} />
        </Pressable>
        <Pressable
          onPress={() => handleDeletePlace(place.id)}
          className="justify-center items-center bg-red-600 w-16 mb-8"
          style={{ height: "100%" }}
        >
          <Icons.trash size={20} color={colors.hex.white} />
        </Pressable>
      </View>
    ),
    []
  );

  // Filter valid places
  const validPlaces = useMemo(
    () =>
      list?.places.filter(
        (place) =>
          place.latitude !== null &&
          place.longitude !== null &&
          !isNaN(place.latitude) &&
          !isNaN(place.longitude)
      ) || [],
    [list]
  );

  // Calculate bounds for camera
  const bounds = useMemo(() => {
    if (validPlaces.length === 0) return null;

    const lats = validPlaces.map((p) => p.latitude!);
    const lngs = validPlaces.map((p) => p.longitude!);

    return {
      ne: [Math.max(...lngs), Math.max(...lats)],
      sw: [Math.min(...lngs), Math.min(...lats)],
    };
  }, [validPlaces]);

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
        <BottomSheetModalProvider>
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
                    bounds={
                      bounds ? { ne: bounds.ne, sw: bounds.sw } : undefined
                    }
                    padding={{
                      paddingTop: 50,
                      paddingBottom: 50,
                      paddingLeft: 50,
                      paddingRight: 50,
                    }}
                    animationDuration={0}
                  />

                  {validPlaces.map((place) => {
                    const isAmbiguous = place.status === "ambiguous";
                    const markerColor = isAmbiguous
                      ? "#fb923c"
                      : colors.hex.purple600;

                    return (
                      <Mapbox.PointAnnotation
                        key={place.id}
                        id={`place-${place.id}`}
                        coordinate={[place.longitude!, place.latitude!]}
                      >
                        <View
                          className="w-4 h-4 rounded-full border-2 border-white"
                          style={{ backgroundColor: markerColor }}
                        />
                      </Mapbox.PointAnnotation>
                    );
                  })}
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
              <Text className="text-sm text-gray-600">
                {list.location_name}
              </Text>
            </View>

            {/* Places List */}
            <ScrollView className="flex-1 bg-white">
              <View className="px-6 py-4">
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  Places ({list.places.length})
                </Text>

                {list.places.map((place, index) => {
                  const isAmbiguous = place.status === "ambiguous";
                  const isUnresolved = place.status === "unresolved";

                  const placeContent = (
                    <View className="mb-4 pb-4 border-b border-gray-100 bg-white">
                      <View className="flex-row items-start justify-between mb-1">
                        <Text className="text-base font-semibold text-gray-900 flex-1">
                          {index + 1}. {place.resolved_name}
                        </Text>
                        {(isAmbiguous || isUnresolved) && (
                          <View
                            className={`px-2 py-1 rounded ${
                              isUnresolved ? "bg-red-100" : "bg-orange-100"
                            }`}
                          >
                            <Text
                              className={`text-xs ${
                                isUnresolved
                                  ? "text-red-700"
                                  : "text-orange-700"
                              }`}
                            >
                              {isUnresolved ? "Unresolved" : "Ambiguous"}
                            </Text>
                          </View>
                        )}
                      </View>

                      {place.original_text !== place.resolved_name && (
                        <Text className="text-sm text-gray-600 mb-1">
                          Original: {place.original_text}
                        </Text>
                      )}

                      {place.confidence !== null && (
                        <Text className="text-xs text-gray-500">
                          Confidence: {(place.confidence * 100).toFixed(0)}%
                        </Text>
                      )}
                    </View>
                  );

                  if (isOwnList) {
                    return (
                      <ReanimatedSwipeable
                        key={place.id}
                        renderRightActions={() => renderRightActions(place)}
                        overshootRight={false}
                      >
                        {placeContent}
                      </ReanimatedSwipeable>
                    );
                  }

                  return <View key={place.id}>{placeContent}</View>;
                })}
              </View>
            </ScrollView>

            {/* Edit Place Bottom Sheet */}
            <BottomSheetModal
              ref={bottomSheetRef}
              snapPoints={["50%"]}
              enablePanDownToClose
              backdropComponent={(props) => (
                <BottomSheetBackdrop
                  {...props}
                  disappearsOnIndex={-1}
                  appearsOnIndex={0}
                />
              )}
              backgroundStyle={{
                backgroundColor: colors.hex.white,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
              handleIndicatorStyle={{
                backgroundColor: colors.hex.placeholder,
                width: 40,
                height: 4,
              }}
            >
              <View className="px-6 py-4">
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  Edit Location
                </Text>
                {editingPlace && (
                  <Text className="text-sm text-gray-600 mb-4">
                    Editing: {editingPlace.resolved_name}
                  </Text>
                )}
                <LocationSearchInput
                  label="Search for location"
                  value={editLocation}
                  onChange={setEditLocation}
                  placeholder="Search for a more specific location..."
                  types="poi,poi.landmark,address"
                />
                <View className="mt-4">
                  <Button onPress={handleSaveEdit} disabled={!editLocation}>
                    Save Changes
                  </Button>
                </View>
              </View>
            </BottomSheetModal>
          </View>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </>
  );
}
