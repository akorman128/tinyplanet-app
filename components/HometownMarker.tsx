import React, { useState } from "react";
import { View, Image, Pressable, StyleSheet } from "react-native";
import { MarkerView } from "@rnmapbox/maps";
import { colors, Text } from "@/design-system";
import { getInitials } from "@/utils";

interface HometownMarkerProps {
  id: string;
  coordinate: [number, number];
  name: string;
  avatarUrl?: string;
  hometownName?: string;
  onPress?: (id: string) => void;
}

const AVATAR_SIZE = 28;

export const HometownMarker = React.memo<HometownMarkerProps>(
  ({ id, coordinate, name, avatarUrl, hometownName, onPress }) => {
    const [imageError, setImageError] = useState(false);

    const handlePress = () => {
      onPress?.(id);
    };

    const showImage = avatarUrl && !imageError;

    return (
      <MarkerView id={`hometown-${id}`} coordinate={coordinate}>
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
                <Text className="font-semibold" style={styles.initialsText}>
                  {getInitials(name)}
                </Text>
              </View>
            )}
          </View>
          <Text
            className="font-thin"
            style={styles.nameLabel}
            numberOfLines={1}
          >
            {name}
          </Text>
          {hometownName && (
            <Text
              className="font-thin"
              style={styles.hometownLabel}
              numberOfLines={1}
            >
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
    backgroundColor: colors.black,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  initialsText: {
    fontSize: 11,
    color: colors.hex.white,
  },
  nameLabel: {
    marginTop: 2,
    fontSize: 10,
    color: colors.hex.black,
    textAlign: "center" as const,
  },
  hometownLabel: {
    fontSize: 9,
    color: colors.hex.black,
    textAlign: "center" as const,
  },
});
