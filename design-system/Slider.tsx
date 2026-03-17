import React, { useRef } from "react";
import { View, PanResponder, LayoutChangeEvent } from "react-native";
import { Text } from "./Text";
import { colors } from "./colors";

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 22;

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onValueChange,
  formatValue,
}: SliderProps) {
  const displayValue = formatValue ? formatValue(value) : String(value);
  const trackWidth = useRef(0);
  const trackX = useRef(0);

  const clampAndStep = (raw: number) => {
    const stepped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, stepped));
  };

  const valueFromX = (x: number) => {
    const ratio = Math.max(
      0,
      Math.min(1, (x - trackX.current) / trackWidth.current)
    );
    return clampAndStep(min + ratio * (max - min));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        onValueChange(valueFromX(evt.nativeEvent.pageX));
      },
      onPanResponderMove: (evt) => {
        onValueChange(valueFromX(evt.nativeEvent.pageX));
      },
    })
  ).current;

  const fraction = trackWidth.current > 0 ? (value - min) / (max - min) : 0;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
    // measureInWindow gives absolute X for pageX-based calculation
    (e.target as any).measureInWindow?.((x: number) => {
      trackX.current = x;
    });
  };

  return (
    <View className="gap-1 px-4">
      <View className="flex-row justify-between items-center">
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
        <Text className="text-sm text-gray-500">{displayValue}</Text>
      </View>
      <View
        className="justify-center"
        style={{ height: THUMB_SIZE + 8, paddingHorizontal: THUMB_SIZE / 2 }}
        {...panResponder.panHandlers}
      >
        <View
          onLayout={onTrackLayout}
          style={{
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: colors.hex.gray300,
          }}
        >
          {/* Filled track */}
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${fraction * 100}%`,
              borderRadius: TRACK_HEIGHT / 2,
              backgroundColor: colors.hex.purple600,
            }}
          />
        </View>
        {/* Thumb */}
        <View
          style={{
            position: "absolute",
            left:
              THUMB_SIZE / 2 +
              fraction * (trackWidth.current || 0) -
              THUMB_SIZE / 2,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: colors.hex.purple600,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 3,
          }}
        />
      </View>
    </View>
  );
}
