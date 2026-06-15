import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

export interface GradientStop {
  offset: number;
  opacity: number;
}

interface ImageGradientProps {
  /** Vertical (top→bottom) gradient stops. */
  stops: GradientStop[];
  color?: string;
}

/**
 * A vertical legibility gradient that fills its (relatively-positioned) parent —
 * used to darken the bottom (or top) of a map image so overlaid text stays readable.
 */
export function ImageGradient({
  stops,
  color = "#000000",
}: ImageGradientProps) {
  // useId can contain ":" which is invalid inside an SVG url(#…) reference.
  const id = `grad${React.useId().replace(/:/g, "")}`;

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {stops.map((s, i) => (
            <Stop
              key={i}
              offset={String(s.offset)}
              stopColor={color}
              stopOpacity={s.opacity}
            />
          ))}
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
