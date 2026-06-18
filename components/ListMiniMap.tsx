import React, { useMemo, ReactNode } from "react";
import { View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { ListPlace } from "@/types/list";
import { colors, Text } from "@/design-system";
import {
  filterValidPlaces,
  calculateMapBounds,
  placesToGeoJSON,
} from "@/utils/mapUtils";

interface ListMiniMapProps {
  places: ListPlace[];
  height?: number;
  styleURL?: string;
  circleRadius?: number;
  padding?: number;
  rotateEnabled?: boolean;
  truncateName?: number;
  children?: ReactNode;
}

export function ListMiniMap({
  places,
  height = 200,
  styleURL = Mapbox.StyleURL.Dark,
  circleRadius = 6,
  padding = 40,
  rotateEnabled = false,
  truncateName,
  children,
}: ListMiniMapProps) {
  // Filter places with valid coordinates
  const validPlaces = useMemo(() => filterValidPlaces(places), [places]);

  // Calculate bounds for camera
  const bounds = useMemo(
    () =>
      calculateMapBounds(
        validPlaces as { latitude: number; longitude: number }[]
      ),
    [validPlaces]
  );

  // Create GeoJSON for places
  const placesGeoJSON = useMemo(
    () =>
      placesToGeoJSON(validPlaces, truncateName ? { truncateName } : undefined),
    [validPlaces, truncateName]
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
    <View
      className="rounded-lg overflow-hidden"
      style={{ height, position: "relative" }}
    >
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL={styleURL}
        pitchEnabled={false}
        rotateEnabled={rotateEnabled}
        scrollEnabled={true}
        zoomEnabled={true}
        logoEnabled={false}
        scaleBarEnabled={false}
      >
        <Mapbox.Camera
          bounds={bounds ? { ne: bounds.ne, sw: bounds.sw } : undefined}
          padding={{
            paddingTop: padding,
            paddingBottom: padding,
            paddingLeft: padding,
            paddingRight: padding,
          }}
          animationDuration={0}
        />

        <Mapbox.ShapeSource id="places" shape={placesGeoJSON}>
          <Mapbox.CircleLayer
            id="places-circles"
            style={{
              circleRadius: circleRadius,
              circleColor: [
                "case",
                ["get", "isAmbiguous"],
                "#fb923c",
                colors.hex.blue500,
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
      {children}
    </View>
  );
}
