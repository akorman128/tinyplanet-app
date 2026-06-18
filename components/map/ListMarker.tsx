import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { MarkerView } from "@rnmapbox/maps";
import { colors, Text } from "@/design-system";

interface ListMarkerProps {
  id: string;
  coordinate: [number, number];
  title: string;
  onPress?: (id: string) => void;
}

const ICON_SIZE = 24;

export const ListMarker = React.memo<ListMarkerProps>(
  ({ id, coordinate, title, onPress }) => {
    const handlePress = () => {
      onPress?.(id);
    };

    return (
      <MarkerView id={`list-${id}`} coordinate={coordinate}>
        <Pressable onPress={handlePress} style={styles.container}>
          <View style={styles.iconCircle}>
            <Text style={styles.emoji}>📋</Text>
          </View>
          <Text
            className="font-thin"
            style={styles.titleLabel}
            numberOfLines={1}
          >
            {title}
          </Text>
        </Pressable>
      </MarkerView>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: colors.hex.white,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 13,
    lineHeight: 16,
  },
  titleLabel: {
    marginTop: 2,
    fontSize: 10,
    color: colors.hex.black,
    textAlign: "center" as const,
  },
});
