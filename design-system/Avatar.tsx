import React, { useState } from "react";
import { View, Image, Platform } from "react-native";
import { Text } from "./Text";
import { getInitials } from "@/utils";
import { colors } from "./colors";

export interface AvatarProps {
  fullName: string;
  avatarUrl?: string;
  size?: "map" | "small" | "medium" | "large";
  onImageLoad?: () => void;
}

const sizeConfig = {
  map: {
    container: "w-6 h-6",
    fontSize: "text-[10px]",
    pixels: 24,
    fontPixels: 10,
  },
  small: {
    container: "w-10 h-10",
    fontSize: "text-base",
    pixels: 40,
    fontPixels: 16,
  },
  medium: {
    container: "w-[55px] h-[55px]",
    fontSize: "text-xl",
    pixels: 60,
    fontPixels: 24,
  },
  large: {
    container: "w-20 h-20",
    fontSize: "text-[32px]",
    pixels: 80,
    fontPixels: 32,
  },
};

export const Avatar = React.memo<AvatarProps>(
  ({ fullName, avatarUrl, size = "large", onImageLoad }) => {
    const config = sizeConfig[size];
    const initials = getInitials(fullName);
    const [imageError, setImageError] = useState(false);

    if (avatarUrl && !imageError) {
      return (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: config.pixels,
            height: config.pixels,
            borderRadius: config.pixels / 2,
          }}
          fadeDuration={0}
          onLoad={onImageLoad}
          onError={() => setImageError(true)}
        />
      );
    }

    // Use inline styles for "map" size since it renders inside
    // PointAnnotation's offscreen bitmap where NativeWind doesn't apply
    if (size === "map") {
      return (
        <View
          style={{
            width: config.pixels,
            height: config.pixels,
            borderRadius: config.pixels / 2,
            backgroundColor: colors.hex.purple200,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: config.fontPixels,
              fontWeight: "600",
              color: colors.hex.purple600,
              fontFamily: Platform.OS === "ios" ? "HelveticaNeue" : undefined,
            }}
          >
            {initials}
          </Text>
        </View>
      );
    }

    return (
      <View
        className={`${config.container} rounded-full bg-purple-600 justify-center items-center shadow-xl border-4 border-white`}
      >
        <Text className={`${config.fontSize} font-semibold text-white `}>
          {initials}
        </Text>
      </View>
    );
  }
);
