import React from "react";
import { View, Switch } from "react-native";
import { Caption } from "./Typography";
import { colors } from "./colors";
import { Icons } from "./Icons";
import type { PlatformStatistics } from "@/types/friendship";

export interface MapLegendProps {
  showLines: boolean;
  onToggleLines: (value: boolean) => void;
  statistics?: PlatformStatistics;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  showLines,
  onToggleLines,
  statistics,
}) => {
  return (
    <View
      className="absolute bottom-4 right-4 bg-white/70 rounded-2xl shadow-lg"
      style={{ zIndex: 10 }}
    >
      {/* Statistics Section - stacked above toggle */}
      {statistics && (
        <View className="p-2 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <Caption>🌎</Caption>
            <Caption className="text-gray-700 font-bold">
              {statistics.total_users.toLocaleString()}
            </Caption>
          </View>
          <View className="flex-row items-center justify-between">
            <Caption>🤝</Caption>
            <Caption className="text-gray-700 font-bold">
              {statistics.connections_count}
            </Caption>
          </View>
        </View>
      )}

      {/* Toggle Section - existing functionality */}
      <View className="flex-row items-center justify-between p-2">
        <Caption className="mr-3">
          <Icons.audience size={20} />
        </Caption>
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
