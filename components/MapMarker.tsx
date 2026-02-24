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

export const MapMarker = React.memo<MapMarkerProps>(
  ({ id, coordinate, name, avatarUrl, type, onPress }) => {
    const [imageError, setImageError] = useState(false);

    const handlePress = useCallback(() => {
      onPress?.(id);
    }, [id, onPress]);

    const showImage = avatarUrl && !imageError;

    return (
      <MarkerView id={`marker-${id}`} coordinate={coordinate}>
        <Pressable onPress={handlePress} style={styles.container}>
          <View style={styles.outer}>
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
          <Text style={styles.nameLabel} numberOfLines={1}>
            {name}
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
  outer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
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
    backgroundColor: colors.hex.purple600,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  initialsText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.hex.white,
    fontFamily: Platform.OS === "ios" ? "HelveticaNeue" : undefined,
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
});
