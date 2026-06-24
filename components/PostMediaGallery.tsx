import React, { useState } from "react";
import { View, Image } from "react-native";

interface PostMediaGalleryProps {
  urls: string[];
}

export function PostMediaGallery({ urls }: PostMediaGalleryProps) {
  const [width, setWidth] = useState(0);

  if (!urls || urls.length === 0) return null;

  const gridItemSize = (width - 4) / 2;

  return (
    <View
      className="mb-2"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 &&
        (urls.length === 1 ? (
          <Image
            source={{ uri: urls[0] }}
            style={{ width, height: width * 0.75, borderRadius: 12 }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-row flex-wrap" style={{ gap: 4 }}>
            {urls.map((url) => (
              <Image
                key={url}
                source={{ uri: url }}
                style={{
                  width: gridItemSize,
                  height: gridItemSize,
                  borderRadius: 8,
                }}
                resizeMode="cover"
              />
            ))}
          </View>
        ))}
    </View>
  );
}
