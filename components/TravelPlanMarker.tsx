import React from "react";
import { ShapeSource, CircleLayer, SymbolLayer } from "@rnmapbox/maps";
import { colors } from "@/design-system";

interface TravelPlanMarkerProps {
  shape: GeoJSON.FeatureCollection;
  onPress: (event: { features: GeoJSON.Feature[] }) => void;
}

export const TravelPlanMarker = React.memo<TravelPlanMarkerProps>(
  ({ shape, onPress }) => {
    return (
      <ShapeSource
        id="travel-plan-destinations"
        shape={shape}
        onPress={onPress}
      >
        <CircleLayer
          id="travel-plan-marker-circles"
          style={{
            circleRadius: 16,
            circleColor: colors.hex.white,
            circleOpacity: 0.9,
            circleStrokeWidth: 3,
            circleStrokeColor: colors.hex.white,
          }}
        />
        <SymbolLayer
          id="travel-plan-markers"
          style={{
            iconImage: "rocketIcon",
            iconSize: 0.15,
            iconAllowOverlap: true,
            iconIgnorePlacement: true,
            iconOpacity: 1,
          }}
        />
        <SymbolLayer
          id="travel-plan-labels"
          style={{
            textField: ["get", "title"],
            textSize: 12,
            textColor: colors.black,
            textHaloColor: colors.black,
            textHaloWidth: 8,
            textHaloBlur: 0,
            textOffset: [0, 2],
            textAnchor: "top",
            textFont: [
              "Roboto Medium",
              "Noto Sans Regular",
              "Arial Unicode MS Regular",
            ],
            textAllowOverlap: true,
          }}
        />
      </ShapeSource>
    );
  }
);
