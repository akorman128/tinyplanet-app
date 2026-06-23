import { Alert } from "react-native";
import { useMutation } from "@tanstack/react-query";

import { useSupabase } from "./useSupabase";
import { useUpdateProfile } from "./useProfile";
import { readImageAsArrayBuffer } from "@/utils/imageBytes";

type AvatarSource = "camera" | "library";

export function useUploadAvatar() {
  const { supabase, session } = useSupabase();
  const updateProfile = useUpdateProfile();

  return useMutation({
    mutationFn: async (source: AvatarSource): Promise<string> => {
      const userId = session?.user?.id;
      if (!userId) throw new Error("Not authenticated");

      // Lazy-load native modules to avoid crashing if not linked in current dev client
      const ImagePicker = await import("expo-image-picker");
      const ImageManipulator = await import("expo-image-manipulator");

      // 1. Pick image
      const pickerOptions: import("expo-image-picker").ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 1,
      };

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled) throw new Error("CANCELLED");

      const uri = result.assets[0].uri;

      // 2. Resize to 500x500
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 500, height: 500 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 3. Read as ArrayBuffer + guard size.
      const arrayBuffer = await readImageAsArrayBuffer(
        manipulated.uri,
        2 * 1024 * 1024
      );

      // 4. Upload to Supabase Storage
      const filePath = `${userId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, arrayBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 5. Get public URL with cache-buster
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // 6. Update profile (reuses useUpdateProfile for optimistic updates + rollback)
      await updateProfile.mutateAsync({
        updateData: { avatar_url: avatarUrl },
      });

      return avatarUrl;
    },
    onError: (error: Error) => {
      if (error.message !== "CANCELLED") {
        Alert.alert("Upload failed", error.message);
      }
    },
  });
}
