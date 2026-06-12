import React from "react";
import { ShapeSource, CircleLayer, SymbolLayer } from "@rnmapbox/maps";
import { colors } from "@/design-system";

interface UserLocationMarkerProps {
  coordinate: [number, number];
}

export const UserLocationMarker = React.memo<UserLocationMarkerProps>(
  ({ coordinate }) => {
    return (
      <ShapeSource
        id="user-location"
        shape={{
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: coordinate,
          },
          properties: {
            name: "You",
          },
        }}
      >
        <CircleLayer
          id="user-marker"
          style={{
            circleRadius: 10,
            circleColor: "#53d769",
            circleOpacity: 0.85,
            circleStrokeWidth: 3,
            circleStrokeColor: colors.white,
          }}
        />
        <CircleLayer
          id="user-marker-center"
          style={{
            circleRadius: 3,
            circleColor: colors.white,
          }}
        />
        <SymbolLayer
          id="user-label"
          style={{
            textField: ["get", "name"],
            textSize: 12,
            textColor: colors.black,
            textHaloColor: colors.black,
            textHaloWidth: 0.5,
            textHaloBlur: 1,
            textOffset: [0, 1.5],
            textAnchor: "top",
            textFont: [
              "Roboto Medium",
              "Noto Sans Regular",
              "Arial Unicode MS Regular",
            ],
          }}
        />
      </ShapeSource>
    );
  }
);
