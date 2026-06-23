import React from "react";
import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { z } from "zod";
import { Input, Icons, colors, ListChip, Text } from "@/design-system";
import { AttachedList } from "@/types/post";

// Post schema
export const postSchema = z.object({
  text: z.string().min(1, "Post cannot be empty").max(500, "Post is too long"),
});

export type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
  control: Control<PostFormData>;
  errors: FieldErrors<PostFormData>;
  selectedList?: AttachedList | null;
  onAttachList?: () => void;
  onRemoveList?: () => void;
  photos?: { localUri: string }[];
  onAddPhoto?: () => void;
  onRemovePhoto?: (index: number) => void;
  canAddPhoto?: boolean;
}

export function PostForm({
  control,
  errors,
  selectedList,
  onAttachList,
  onRemoveList,
  photos = [],
  onAddPhoto,
  onRemovePhoto,
  canAddPhoto = true,
}: PostFormProps) {
  return (
    <View>
      <Controller
        control={control}
        name="text"
        render={({ field }) => (
          <Input
            {...field}
            placeholder="What's on your mind?"
            multiline
            maxLength={1000}
            showCharacterCount
            error={errors.text?.message}
            className="min-h-[120px]"
            textAlignVertical="top"
          />
        )}
      />

      {/* Photos */}
      {onAddPhoto && (
        <View className="mt-3">
          {photos.length > 0 && (
            <View className="flex-row flex-wrap">
              {photos.map((photo, index) => (
                <View key={photo.localUri} className="mr-2 mb-2">
                  <Image
                    source={{ uri: photo.localUri }}
                    style={{ width: 72, height: 72, borderRadius: 8 }}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={() => onRemovePhoto?.(index)}
                    hitSlop={8}
                    className="absolute -top-1.5 -right-1.5 bg-gray-900 rounded-full p-0.5"
                  >
                    <Icons.close size={14} color={colors.hex.cream} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {canAddPhoto && (
            <Pressable
              onPress={onAddPhoto}
              className="flex-row items-center mt-1"
            >
              <Icons.addImage size={20} color={colors.hex.purple600} />
              <Text className="ml-2 text-purple-600 font-medium">
                Add photo
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Selected List Display */}
      {selectedList && (
        <View className="mt-2 flex-row items-center">
          <View className="flex-1">
            <ListChip size="medium" list={selectedList} />
          </View>
          <Pressable onPress={onRemoveList} className="ml-2 p-1">
            <Icons.close size={16} color={colors.hex.gray500} />
          </Pressable>
        </View>
      )}

      {/* Attach List Button */}

      {!selectedList && (
        <Pressable onPress={onAttachList} className="flex-row items-center">
          <Icons.list size={20} color={colors.hex.blue500} />

          <Text className="ml-2 text-blue-500 font-medium">Attach a List</Text>
        </Pressable>
      )}
    </View>
  );
}
