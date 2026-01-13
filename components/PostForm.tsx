import React from "react";
import { View, Text, Pressable } from "react-native";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { z } from "zod";
import { Input, Icons, colors, ListChip } from "@/design-system";
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
}

export function PostForm({
  control,
  errors,
  selectedList,
  onAttachList,
  onRemoveList,
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

      {/* Selected List Display */}
      {selectedList && (
        <View className="mt-3 flex-row items-center">
          <View className="flex-1">
            <ListChip list={selectedList} />
          </View>
          <Pressable onPress={onRemoveList} className="ml-2 p-1">
            <Icons.close size={16} color={colors.hex.gray500} />
          </Pressable>
        </View>
      )}

      {/* Attach List Button */}
      {onAttachList && (
        <Pressable onPress={onAttachList} className="mt-3 flex-row items-center">
          <Icons.list size={20} color={colors.hex.purple600} />
          <Text className="ml-2 text-purple-600 font-medium">
            {selectedList ? "Change List" : "Attach a List"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
