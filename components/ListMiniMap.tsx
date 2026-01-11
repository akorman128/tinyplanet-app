import React, { useMemo } from "react";
import { View, Text } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { ListPlace } from "@/types/list";
import { colors } from "@/design-system";

interface ListMiniMapProps {
  places: ListPlace[];
  height?: number;
}

export function ListMiniMap({ places, height = 200 }: ListMiniMapProps) {
  // Filter places with valid coordinates
  const validPlaces = useMemo(
    () =>
      places.filter(
        (place) =>
          place.latitude !== null &&
          place.longitude !== null &&
          !isNaN(place.latitude) &&
          !isNaN(place.longitude)
      ),
    [places]
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

  if (validPlaces.length === 0) {
    return (
      <View
        className="bg-gray-100 rounded-lg items-center justify-center"
        style={{ height }}
      >
        <Text className="text-gray-500 text-sm">No locations to display</Text>
      </View>
    );
  }

  return (
    <View className="rounded-lg overflow-hidden" style={{ height }}>
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL={Mapbox.StyleURL.Dark}
        pitchEnabled={false}
        rotateEnabled={false}
        scrollEnabled={true}
        zoomEnabled={true}
      >
        <Mapbox.Camera
          bounds={bounds ? { ne: bounds.ne, sw: bounds.sw } : undefined}
          padding={{ paddingTop: 40, paddingBottom: 40, paddingLeft: 40, paddingRight: 40 }}
          animationDuration={0}
        />

        {validPlaces.map((place, index) => {
          const isAmbiguous = place.status === "ambiguous";
          const markerColor = isAmbiguous ? "#fb923c" : colors.hex.purple600;

          return (
            <Mapbox.PointAnnotation
              key={place.id}
              id={`place-${place.id}`}
              coordinate={[place.longitude!, place.latitude!]}
            >
              <View
                className="w-3 h-3 rounded-full border-2 border-white"
                style={{ backgroundColor: markerColor }}
              />
            </Mapbox.PointAnnotation>
          );
        })}
      </Mapbox.MapView>
    </View>
  );
}
