import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { View, ActivityIndicator, LayoutChangeEvent } from "react-native";
import Mapbox, { Camera, Images } from "@rnmapbox/maps";
import { MapMarker } from "./MapMarker";
import { HometownMarker } from "./HometownMarker";
import { ListMarker } from "./ListMarker";
import { UserLocationMarker } from "./UserLocationMarker";
import { ConnectionLines } from "./ConnectionLines";
import { TravelPlanMarker } from "./TravelPlanMarker";
import { colors, Text } from "@/design-system";
import { useRouter } from "expo-router";
import { useMapStore } from "@/stores/mapStore";
import { useMapData } from "@/hooks/useMapData";
import {
  buildConnectionLines,
  connectionLinesToGeoJSON,
  travelPlansToGeoJSON,
} from "@/utils/mapUtils";
import type { MapFilter } from "@/stores/mapStore";

interface MapViewProps {
  mapFilter: MapFilter;
}

export const MapView: React.FC<MapViewProps> = React.memo(({ mapFilter }) => {
  const {
    friendLocations,
    hometownLocations,
    travelPlanLocations,
    listLocations,
    userLocation,
    loading,
    error,
  } = useMapData();
  const router = useRouter();
  const showConnectionLines = useMapStore((state) => state.showConnectionLines);
  const recenterRequestId = useMapStore((state) => state.recenterRequestId);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

  // Recenter the camera on the user's location when the recenter button is
  // tapped. userLocation is read from a ref so this fires only on button press,
  // not whenever the location updates.
  const cameraRef = useRef<React.ElementRef<typeof Camera>>(null);
  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;

  useEffect(() => {
    if (recenterRequestId > 0 && userLocationRef.current) {
      cameraRef.current?.setCamera({
        centerCoordinate: userLocationRef.current,
        zoomLevel: 12,
        animationDuration: 1000,
        animationMode: "flyTo",
      });
    }
  }, [recenterRequestId]);

  // GeoJSON transforms
  const connectionLines = useMemo(() => {
    if (!friendLocations || !userLocation) {
      return { userToFriendLines: [], friendToMutualLines: [] };
    }
    return buildConnectionLines(friendLocations, userLocation);
  }, [friendLocations, userLocation]);

  const userToFriendLinesGeoJSON = useMemo(() => {
    if (!showConnectionLines || connectionLines.userToFriendLines.length === 0)
      return null;
    return connectionLinesToGeoJSON(connectionLines.userToFriendLines);
  }, [connectionLines.userToFriendLines, showConnectionLines]);

  const friendToMutualLinesGeoJSON = useMemo(() => {
    if (
      !showConnectionLines ||
      connectionLines.friendToMutualLines.length === 0
    )
      return null;
    return connectionLinesToGeoJSON(connectionLines.friendToMutualLines);
  }, [connectionLines.friendToMutualLines, showConnectionLines]);

  const travelPlanGeoJSON = useMemo(() => {
    if (!travelPlanLocations || travelPlanLocations.length === 0) return null;
    return travelPlansToGeoJSON(travelPlanLocations);
  }, [travelPlanLocations]);

  // Event handlers
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setMapDimensions({ width, height });
  }, []);

  const handleFriendMarkerPress = (userId: string) => {
    router.push({ pathname: "/profile", params: { userId } });
  };

  const handleMarkerPress = useCallback(
    (event: { features: GeoJSON.Feature[] }) => {
      const { features } = event;
      if (features && features.length > 0) {
        const feature = features[0];
        const props = (feature.properties ?? {}) as Record<string, string>;
        const userId = props.user_id || props.id;
        router.push({ pathname: "/profile", params: { userId } });
      }
    },
    [router]
  );

  const handleListMarkerPress = useCallback(
    (listId: string) => {
      router.push({ pathname: "/list/[listId]", params: { listId } });
    },
    [router]
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-cream">
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-cream">
        <Text className="text-error text-base text-center px-6">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" onLayout={handleLayout}>
      {mapDimensions.width > 0 && mapDimensions.height > 0 && (
        <Mapbox.MapView
          style={{ width: mapDimensions.width, height: mapDimensions.height }}
          // styleURL={Mapbox.StyleURL.Dark}
          compassViewPosition={3}
          scaleBarEnabled={false}
          logoEnabled={false}
        >
          <Camera
            ref={cameraRef}
            zoomLevel={12}
            centerCoordinate={userLocation || [0, 0]}
            animationDuration={1000}
            animationMode="flyTo"
          />

          <Images
            images={{
              rocketIcon: require("../assets/rocket.png"),
            }}
          />

          {/* User location marker */}
          {userLocation && <UserLocationMarker coordinate={userLocation} />}

          {/* === Friends filter: Connection lines User → Friends === */}
          {mapFilter === "friends" && userToFriendLinesGeoJSON && (
            <ConnectionLines
              id="user-to-friend"
              shape={userToFriendLinesGeoJSON}
            />
          )}

          {/* Friends filter: Connection lines Friends → Mutuals */}
          {mapFilter === "friends" && friendToMutualLinesGeoJSON && (
            <ConnectionLines
              id="friend-to-mutual"
              shape={friendToMutualLinesGeoJSON}
              dashed
            />
          )}

          {/* Friends filter: Friend and mutual avatar markers */}
          {mapFilter === "friends" &&
            friendLocations &&
            friendLocations.features.map((feature) => (
              <MapMarker
                key={feature.properties.id}
                id={feature.properties.id}
                coordinate={feature.geometry.coordinates}
                name={feature.properties.name}
                avatarUrl={feature.properties.avatar_url}
                type={feature.properties.type as "friend" | "mutual"}
                onPress={handleFriendMarkerPress}
              />
            ))}

          {/* === Travel Plans filter: destination markers === */}
          {mapFilter === "travel_plans" && travelPlanGeoJSON && (
            <TravelPlanMarker
              shape={travelPlanGeoJSON}
              onPress={handleMarkerPress}
            />
          )}

          {/* === Hometown filter === */}
          {mapFilter === "hometown" &&
            hometownLocations &&
            hometownLocations.features.map((feature) => (
              <HometownMarker
                key={`hometown-${feature.properties.id}`}
                id={feature.properties.id}
                coordinate={feature.geometry.coordinates}
                name={feature.properties.name}
                avatarUrl={feature.properties.avatar_url}
                hometownName={feature.properties.hometown_name}
                onPress={handleFriendMarkerPress}
              />
            ))}

          {/* === Lists filter === */}
          {mapFilter === "lists" &&
            listLocations &&
            listLocations.map((list) => (
              <ListMarker
                key={`list-${list.id}`}
                id={list.id}
                coordinate={[list.location.longitude, list.location.latitude]}
                title={list.title}
                onPress={handleListMarkerPress}
              />
            ))}
        </Mapbox.MapView>
      )}
    </View>
  );
});
