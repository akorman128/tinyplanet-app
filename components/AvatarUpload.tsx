import React from "react";
import { Pressable, View, ActivityIndicator, Platform, ActionSheetIOS, Alert } from "react-native";
import { Avatar } from "@/design-system";
import { Icons } from "@/design-system/Icons";
import { useUploadAvatar } from "@/hooks/useUploadAvatar";

interface AvatarUploadProps {
  fullName: string;
  avatarUrl?: string;
}

export function AvatarUpload({ fullName, avatarUrl }: AvatarUploadProps) {
  const { mutate, isPending } = useUploadAvatar();

  const showOptions = () => {
    if (isPending) return;

    const options = ["Take Photo", "Choose from Library", "Cancel"];
    const cancelButtonIndex = 2;

    const handleSelection = (index: number) => {
      if (index === 0) mutate("camera");
      else if (index === 1) mutate("library");
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex },
        handleSelection
      );
    } else {
      Alert.alert("Change Photo", undefined, [
        { text: "Take Photo", onPress: () => mutate("camera") },
        { text: "Choose from Library", onPress: () => mutate("library") },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  return (
    <Pressable onPress={showOptions} disabled={isPending}>
      <Avatar fullName={fullName} avatarUrl={avatarUrl} size="large" />
      <View className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-black items-center justify-center border-2 border-white">
        {isPending ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Icons.edit size={14} color="white" />
        )}
      </View>
    </Pressable>
  );
}
