import React, { useMemo } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { setStringAsync } from "expo-clipboard";
import { useRouter, Stack, useLocalSearchParams, Link } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Mapbox from "@rnmapbox/maps";
import { useGetList, useDeleteList, useRemovePlace } from "@/hooks/useLists";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { ListPlace, ListCategory } from "@/types/list";
import { filterValidPlaces } from "@/utils/mapUtils";
import { ListMiniMap } from "@/components/ListMiniMap";
import {
  LoadingState,
  ErrorState,
  Icons,
  colors,
  PlaceListItem,
  SectionTitle,
  Text,
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
  const { data: listResult, isLoading, error: queryError } = useGetList(listId);
  const deleteList = useDeleteList();
  const removePlace = useRemovePlace();

  const list = listResult?.data ?? null;
  const error = queryError
    ? "Failed to load list"
    : !isLoading && !list
      ? "List not found"
      : null;

  const isOwnList = list?.user_id === profile.id;

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
              await deleteList.mutateAsync(listId);
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
            await removePlace.mutateAsync(placeId);
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
        <Stack.Screen options={{ title: "List" }} />
        <View className="flex-1 bg-cream">
          <LoadingState />
        </View>
      </>
    );
  }

  if (error || !list) {
    return (
      <>
        <Stack.Screen options={{ title: "List" }} />
        <View className="flex-1 bg-cream">
          <ErrorState message={error || "List not found"} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerShadowVisible: false,
          headerTransparent: true,
          headerStyle: {
            backgroundColor: "transparent",
          },
          headerTintColor: colors.black,
          headerRight:
            Platform.OS === "android" && isOwnList
              ? () => (
                  <View className="flex-row items-center gap-4">
                    <Pressable onPress={handleEdit}>
                      <Icons.edit size={22} color={colors.black} />
                    </Pressable>
                    <Pressable onPress={handleDelete}>
                      <Icons.trash size={22} color={colors.hex.error} />
                    </Pressable>
                  </View>
                )
              : undefined,
        }}
      />
      {Platform.OS === "ios" && isOwnList && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button icon="pencil" onPress={handleEdit} />
          <Stack.Toolbar.Button
            icon="trash"
            tintColor={colors.hex.error}
            onPress={handleDelete}
          />
        </Stack.Toolbar>
      )}
      <Link.AppleZoomTarget />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-cream">
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
          <View className="px-6 py-4 bg-cream border-b border-gray-200">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {list.title}
            </Text>
            <View className="bg-blue-100 px-3 py-1 rounded-full self-start mb-2">
              <Text className="text-sm text-blue-600 font-medium">
                {getCategoryLabel(list.category)}
              </Text>
            </View>
            <Text className="text-sm text-gray-600">{list.location_name}</Text>
          </View>

          {/* Places List */}
          <ScrollView className="flex-1 bg-cream">
            <View className="px-6 py-4">
              <SectionTitle className="mb-4">
                Places ({list.places.length})
              </SectionTitle>

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
