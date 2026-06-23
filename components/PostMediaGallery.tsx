import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";

interface PostMediaGalleryProps {
  urls: string[];
}

export function PostMediaGallery({ urls }: PostMediaGalleryProps) {
  if (!urls || urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <View className="mb-2">
        <Image
          source={{ uri: urls[0] }}
          style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 12 }}
          contentFit="cover"
        />
      </View>
    );
  }

  return (
    <View className="mb-2 flex-row flex-wrap" style={{ gap: 4 }}>
      {urls.map((url) => (
        <Image
          key={url}
          source={{ uri: url }}
          style={{ width: "49%", aspectRatio: 1, borderRadius: 8 }}
          contentFit="cover"
        />
      ))}
    </View>
  );
}
