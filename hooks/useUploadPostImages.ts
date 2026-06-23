import { useState, useCallback } from "react";
import { Alert } from "react-native";

import { useSupabase } from "./useSupabase";

export const MAX_PHOTOS = 4;

interface PickedPhoto {
  localUri: string;
}

export function useUploadPostImages() {
  const { supabase, session } = useSupabase();
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const pick = useCallback(async () => {
    setIsPicking(true);
    try {
      const ImagePicker = await import("expo-image-picker");
      const ImageManipulator = await import("expo-image-manipulator");

      const remaining = MAX_PHOTOS - photos.length;
      if (remaining <= 0) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 1,
      });
      if (result.canceled) return;

      const manipulated: PickedPhoto[] = [];
      for (const asset of result.assets) {
        const ops =
          asset.width && asset.width > 1600
            ? [{ resize: { width: 1600 } }]
            : [];
        const out = await ImageManipulator.manipulateAsync(asset.uri, ops, {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        manipulated.push({ localUri: out.uri });
      }

      setPhotos((prev) => [...prev, ...manipulated].slice(0, MAX_PHOTOS));
    } catch (err) {
      Alert.alert("Couldn't add photo", String(err));
    } finally {
      setIsPicking(false);
    }
  }, [photos.length]);

  const removeAt = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const reset = useCallback(() => setPhotos([]), []);

  const publishOne = useCallback(
    async (photo: PickedPhoto, userId: string): Promise<string> => {
      const response = await fetch(photo.localUri);
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
        throw new Error("Photo is too large. Please choose a smaller one.");
      }

      const stagingPath = `${userId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.jpg`;
      const { error: upError } = await supabase.storage
        .from("post-media-staging")
        .upload(stagingPath, arrayBuffer, { contentType: "image/jpeg" });
      if (upError) throw upError;

      const { data, error } = await supabase.functions.invoke(
        "strip-image-metadata",
        { body: { stagingPath } }
      );
      if (error) throw error;
      if (!data?.url) throw new Error("Image processing failed");
      return data.url as string;
    },
    [supabase]
  );

  const publishAll = useCallback(async (): Promise<string[]> => {
    const userId = session?.user?.id;
    if (!userId) throw new Error("Not authenticated");
    if (photos.length === 0) return [];

    setIsPublishing(true);
    try {
      return await Promise.all(photos.map((p) => publishOne(p, userId)));
    } finally {
      setIsPublishing(false);
    }
  }, [photos, session?.user?.id, publishOne]);

  return {
    photos,
    pick,
    removeAt,
    reset,
    publishAll,
    isPicking,
    isPublishing,
    MAX_PHOTOS,
  };
}
