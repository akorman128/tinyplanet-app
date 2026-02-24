import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { MarkerView } from "@rnmapbox/maps";
import { Icons, colors, Text } from "@/design-system";

interface HometownMarkerProps {
  id: string;
  coordinate: [number, number];
  name: string;
  hometownName?: string;
  onPress?: (id: string) => void;
}

const ICON_SIZE = 24;
const AMBER = "#f59e0b";

export const HometownMarker = React.memo<HometownMarkerProps>(
  ({ id, coordinate, name, hometownName, onPress }) => {
    const handlePress = () => {
      onPress?.(id);
    };

    return (
      <MarkerView id={`hometown-${id}`} coordinate={coordinate}>
        <Pressable onPress={handlePress} style={styles.container}>
          <View style={styles.iconCircle}>
            <Icons.home size={14} color="#fff" />
          </View>
          <Text style={styles.nameLabel} numberOfLines={1}>
            {name}
          </Text>
          {hometownName && (
            <Text style={styles.hometownLabel} numberOfLines={1}>
              {hometownName}
            </Text>
          )}
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
    backgroundColor: AMBER,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  nameLabel: {
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
  hometownLabel: {
    fontSize: 9,
    fontWeight: "100",
    color: AMBER,
    textShadowColor: colors.hex.purple800,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
    textAlign: "center" as const,
    fontFamily: Platform.OS === "ios" ? "HelveticaNeue" : undefined,
  },
});
