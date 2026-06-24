import { useState } from "react";
import { Alert } from "react-native";

import { useSupabase } from "./useSupabase";
import { postMediaPathsFromUrls } from "@/utils/postMedia";
import { readImageAsArrayBuffer } from "@/utils/imageBytes";

const MAX_PHOTOS = 4;
const MAX_BYTES = 8 * 1024 * 1024;

interface PickedPhoto {
  localUri: string;
}

export function useUploadPostImages() {
  const { supabase, session } = useSupabase();
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const pick = async () => {
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
        // Re-encode to a fresh JPEG: this drops all EXIF/GPS/IPTC/XMP on-device,
        // so location metadata never leaves the phone. The resize bounds the
        // upload size; this single on-device pass is the only compression.
        const out = await ImageManipulator.manipulateAsync(asset.uri, ops, {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        manipulated.push({ localUri: out.uri });
      }

      setPhotos((prev) => [...prev, ...manipulated].slice(0, MAX_PHOTOS));
    } catch (err) {
      Alert.alert("Couldn't add photo", String(err));
    }
  };

  const removeAt = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const publishOne = async (
    photo: PickedPhoto,
    userId: string
  ): Promise<string> => {
    const arrayBuffer = await readImageAsArrayBuffer(photo.localUri, MAX_BYTES);

    const path = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.jpg`;
    const { error } = await supabase.storage
      .from("post-media")
      .upload(path, arrayBuffer, { contentType: "image/jpeg" });
    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("post-media").getPublicUrl(path);
    return publicUrl;
  };

  const publishAll = async (): Promise<string[]> => {
    const userId = session?.user?.id;
    if (!userId) throw new Error("Not authenticated");
    if (photos.length === 0) return [];

    setIsPublishing(true);
    try {
      const results = await Promise.allSettled(
        photos.map((p) => publishOne(p, userId))
      );
      const urls = results
        .filter(
          (r): r is PromiseFulfilledResult<string> => r.status === "fulfilled"
        )
        .map((r) => r.value);

      const failure = results.find((r) => r.status === "rejected");
      if (failure) {
        // Remove any photos that already uploaded so one failure can't strand
        // them as orphans in the public bucket.
        if (urls.length > 0) {
          try {
            await supabase.storage
              .from("post-media")
              .remove(postMediaPathsFromUrls(urls));
          } catch {
            // best-effort
          }
        }
        throw (failure as PromiseRejectedResult).reason;
      }

      return urls;
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    photos,
    pick,
    removeAt,
    publishAll,
    isPublishing,
    MAX_PHOTOS,
  };
}
