import React, { useCallback, useState } from "react";
import { View, Image, Pressable, StyleSheet, Platform } from "react-native";
import { MarkerView } from "@rnmapbox/maps";
import { colors, Text } from "@/design-system";
import { getInitials } from "@/utils";

interface MapMarkerProps {
  id: string;
  coordinate: [number, number];
  name: string;
  avatarUrl?: string;
  type: "friend" | "mutual";
  onPress?: (id: string) => void;
}

const AVATAR_SIZE = 28;
const BORDER_WIDTH = 2;
const OUTER_SIZE = AVATAR_SIZE + BORDER_WIDTH * 2;

export const MapMarker = React.memo<MapMarkerProps>(
  ({ id, coordinate, name, avatarUrl, type, onPress }) => {
    const [imageError, setImageError] = useState(false);

    const borderColor =
      type === "friend" ? colors.hex.purple600 : colors.hex.purple200;

    const handlePress = useCallback(() => {
      onPress?.(id);
    }, [id, onPress]);

    const showImage = avatarUrl && !imageError;

    return (
      <MarkerView id={`marker-${id}`} coordinate={coordinate}>
        <Pressable onPress={handlePress}>
          <View style={[styles.outer, { borderColor }]}>
            {showImage ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.image}
                fadeDuration={0}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.initialsCircle}>
                <Text style={styles.initialsText}>{getInitials(name)}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </MarkerView>
    );
  }
);

const styles = StyleSheet.create({
  outer: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    borderRadius: OUTER_SIZE / 2,
    borderWidth: BORDER_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  initialsCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.hex.purple200,
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.hex.purple600,
    fontFamily: Platform.OS === "ios" ? "HelveticaNeue" : undefined,
  },
});
