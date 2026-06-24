import React, { useState } from "react";
import { View, Image, Pressable, StyleSheet } from "react-native";
import { MarkerView } from "@rnmapbox/maps";
import { colors, Text, Icons } from "@/design-system";
import { getInitials } from "@/utils";
import { formatHangWhen } from "@/utils/hangTime";
import { HangMapLocation } from "@/types/hang";

interface HangMarkerProps {
  hang: HangMapLocation;
  onOpenDetail: (hangId: string) => void;
}

const PIN_SIZE = 50;
const AVATAR_SIZE = 36;
const DOT_SIZE = 14;

/**
 * "Quiet" Hang map marker: a calm host-avatar pin with a coral ring + dot.
 * Tapping the pin reveals a preview callout; tapping the callout opens detail.
 */
export const HangMarker = React.memo<HangMarkerProps>(
  ({ hang, onOpenDetail }) => {
    const [selected, setSelected] = useState(false);
    const [imageError, setImageError] = useState(false);

    const togglePreview = () => setSelected((s) => !s);
    const openDetail = () => onOpenDetail(hang.id);

    const showImage = hang.avatar_url && !imageError;

    return (
      <MarkerView
        id={`hang-${hang.id}`}
        coordinate={[hang.longitude, hang.latitude]}
        anchor={{ x: 0.5, y: 1 }}
        allowOverlap={selected}
      >
        <View style={styles.container}>
          {selected && (
            <Pressable style={styles.callout} onPress={openDetail}>
              <Text style={styles.title} numberOfLines={1}>
                {hang.title}
              </Text>
              <View style={styles.timeRow}>
                <Icons.clock size={12} />
                <Text style={styles.timeText}>
                  {formatHangWhen(hang.starts_at)}
                </Text>
              </View>
              <View style={styles.pointer} />
            </Pressable>
          )}

          <Pressable onPress={togglePreview} style={styles.pinWrap}>
            <View style={styles.ring}>
              {showImage ? (
                <Image
                  source={{ uri: hang.avatar_url! }}
                  style={styles.avatar}
                  fadeDuration={0}
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.initials}>
                  <Text style={styles.initialsText}>
                    {getInitials(hang.full_name)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.dot} />
          </Pressable>
        </View>
      </MarkerView>
    );
  }
);

const SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 4,
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  pinWrap: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  ring: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: colors.hex.white,
    borderWidth: 2,
    borderColor: colors.hex.coral,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOW,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  initials: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.hex.gray900,
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.hex.white,
  },
  dot: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.hex.coral,
    borderWidth: 2,
    borderColor: colors.hex.white,
  },
  callout: {
    width: 180,
    backgroundColor: colors.hex.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    ...SHADOW,
  },
  calloutHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.hex.gray900,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.hex.gray600,
    marginLeft: 6,
  },
  pointer: {
    position: "absolute",
    bottom: -7,
    left: "50%",
    marginLeft: -7,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.hex.white,
  },
});
