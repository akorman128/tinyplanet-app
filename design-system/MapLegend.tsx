import React from "react";
import { View, Switch } from "react-native";
import { Caption } from "./Typography";
import { colors } from "./colors";

export interface MapLegendProps {
  showLines: boolean;
  onToggleLines: (value: boolean) => void;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  showLines,
  onToggleLines,
}) => {
  return (
    <View
      className="absolute bottom-4 right-4 bg-white/70 rounded-2xl shadow-lg"
      style={{ zIndex: 10 }}
    >
      <View className="flex-row items-center justify-between px-2 py-1">
        <Caption className="mr-3">👥</Caption>
        <Switch
          value={showLines}
          onValueChange={onToggleLines}
          trackColor={{
            false: colors.hex.placeholder,
            true: colors.hex.purple600,
          }}
          thumbColor={colors.hex.white}
          ios_backgroundColor={colors.hex.placeholder}
        />
      </View>
    </View>
  );
};
