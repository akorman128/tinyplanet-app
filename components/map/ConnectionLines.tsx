import React from "react";
import { ShapeSource, LineLayer } from "@rnmapbox/maps";
import { colors } from "@/design-system";

interface ConnectionLinesProps {
  id: string;
  shape: GeoJSON.FeatureCollection;
  dashed?: boolean;
}

export const ConnectionLines = React.memo<ConnectionLinesProps>(
  ({ id, shape, dashed = false }) => {
    return (
      <ShapeSource id={`${id}-lines`} shape={shape}>
        <LineLayer
          id={`${id}-line-layer`}
          style={{
            lineColor: colors.black,
            lineWidth: 2,
            lineOpacity: 0.6,
            ...(dashed ? { lineDasharray: [2, 2] } : {}),
          }}
        />
      </ShapeSource>
    );
  }
);
