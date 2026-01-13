import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { setStringAsync } from "expo-clipboard";
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
import { ListWithPlaces, ListPlace, ListCategory } from "@/types/list";
import { filterValidPlaces } from "@/utils/mapUtils";
import { ListMiniMap } from "@/components/ListMiniMap";
import {
  ScreenHeader,
  LoadingState,
  ErrorState,
  Icons,
  colors,
  PlaceListItem,
} from "@/design-system";

const CATEGORY_LABELS: Record<ListCategory, string> = {
  nightlife: "Nightlife",
  eat_drink: "Eat & Drink",
  activities: "Activities",
  explore: "Explore",
  shop: "Shop",
  work: "Work",
};

const getCategoryLabel = (category: ListCategory): string => {
  return CATEGORY_LABELS[category] || category;
};

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

  const handleCopyList = async () => {
    if (!list) return;
    const text = list.places
      .map((place, i) => `${i + 1}. ${place.resolved_name}`)
      .join("\n");
    const fullText = `${list.title}\n\n${text}`;
    await setStringAsync(fullText);
    Alert.alert("Copied!", "List copied to clipboard");
  };

  const handleOpenMaps = async () => {
    if (validPlaces.length === 0) return;

    const origin = `${validPlaces[0].latitude},${validPlaces[0].longitude}`;
    const destination = `${validPlaces[validPlaces.length - 1].latitude},${validPlaces[validPlaces.length - 1].longitude}`;

    // Build web URL (used as fallback and for Android)
    let webUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (validPlaces.length > 2) {
      const waypoints = validPlaces
        .slice(1, -1)
        .map((p) => `${p.latitude},${p.longitude}`)
        .join("|");
      webUrl += `&waypoints=${waypoints}`;
    }

    if (Platform.OS === "ios") {
      // Build iOS Google Maps app URL with waypoints chained via +to:
      let iosDestination = destination;
      if (validPlaces.length > 2) {
        const waypointChain = validPlaces
          .slice(1, -1)
          .map((p) => `${p.latitude},${p.longitude}`)
          .join("+to:");
        iosDestination = `${waypointChain}+to:${destination}`;
      }
      const iosUrl = `comgooglemaps://?saddr=${origin}&daddr=${iosDestination}&directionsmode=driving`;

      const canOpen = await Linking.canOpenURL(iosUrl);
      if (canOpen) {
        Linking.openURL(iosUrl);
        return;
      }
    }

    Linking.openURL(webUrl);
  };

  const handleEdit = () => {
    router.push({
      pathname: "/list/edit-list",
      params: { listId },
    });
  };

  // Filter valid places (needed for handleOpenMaps)
  const validPlaces = useMemo(
    () => filterValidPlaces(list?.places || []),
    [list]
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
                <View className="flex-row items-center gap-4">
                  <Pressable onPress={handleEdit}>
                    <Icons.edit size={22} color={colors.black} />
                  </Pressable>
                  <Pressable onPress={handleDelete}>
                    <Icons.trash size={22} color={colors.hex.error} />
                  </Pressable>
                </View>
              ) : undefined
            }
          />

          {/* Map */}
          <ListMiniMap
            places={list.places}
            height={300}
            styleURL={Mapbox.StyleURL.Street}
            circleRadius={8}
            padding={50}
            rotateEnabled={true}
            truncateName={15}
          >
            {validPlaces.length > 0 && (
              <View
                style={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                <Pressable
                  onPress={handleCopyList}
                  className="w-10 h-10 rounded-full bg-white justify-center items-center"
                  style={{
                    shadowColor: "#000",
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <Icons.copy size={18} color="#374151" />
                </Pressable>
                <Pressable
                  onPress={handleOpenMaps}
                  className="w-10 h-10 rounded-full bg-white justify-center items-center"
                  style={{
                    shadowColor: "#000",
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <Icons.pin size={18} color="#374151" />
                </Pressable>
              </View>
            )}
          </ListMiniMap>

          {/* List Info */}
          <View className="px-6 py-4 bg-white border-b border-gray-200">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {list.title}
            </Text>
            <View className="bg-purple-100 px-3 py-1 rounded-full self-start mb-2">
              <Text className="text-sm text-purple-700 font-medium">
                {getCategoryLabel(list.category)}
              </Text>
            </View>
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
