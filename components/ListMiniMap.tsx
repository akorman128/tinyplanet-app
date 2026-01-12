import React, { useMemo } from "react";
import { View, Text } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { ListPlace } from "@/types/list";
import { colors } from "@/design-system";
import {
  filterValidPlaces,
  calculateMapBounds,
  placesToGeoJSON,
} from "@/utils/mapUtils";

interface ListMiniMapProps {
  places: ListPlace[];
  height?: number;
}

export function ListMiniMap({ places, height = 200 }: ListMiniMapProps) {
  // Filter places with valid coordinates
  const validPlaces = useMemo(() => filterValidPlaces(places), [places]);

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
    () => placesToGeoJSON(validPlaces),
    [validPlaces]
  );

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

        <Mapbox.ShapeSource id="places" shape={placesGeoJSON}>
          <Mapbox.CircleLayer
            id="places-circles"
            style={{
              circleRadius: 6,
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
              textOffset: [0, 1.2],
              textAnchor: "top",
              textMaxWidth: 10,
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>
    </View>
  );
}
