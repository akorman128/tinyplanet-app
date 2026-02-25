import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
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
          <Text style={styles.titleLabel} numberOfLines={1}>
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
    fontWeight: "100",
    color: colors.hex.white,
    textShadowColor: colors.hex.purple800,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
    textAlign: "center" as const,
    fontFamily: Platform.OS === "ios" ? "HelveticaNeue" : undefined,
  },
});
