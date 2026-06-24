import React, { useState, useEffect } from "react";
import { ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  OptionSelector,
  Icons,
  ScreenHeader,
  colors,
} from "@/design-system";
import { PostForm, postSchema, PostFormData } from "@/components/PostForm";
import { useCreatePost } from "@/hooks/usePosts";
import { useUploadPostImages } from "@/hooks/useUploadPostImages";
import { useSupabase } from "@/hooks/useSupabase";
import { PostVisibility } from "@/types/post";
import { useListSelectionStore } from "@/stores/listSelectionStore";
import { postMediaPathsFromUrls } from "@/utils/postMedia";
import { logger } from "@/utils/logger";

export default function CreatePostScreen() {
  const router = useRouter();
  const createPost = useCreatePost();
  const { supabase } = useSupabase();
  const photos = useUploadPostImages();
  const { selectedList, clear: clearListSelection } = useListSelectionStore();

  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { text: "" },
    mode: "onChange",
  });

  // Clear list selection on unmount
  useEffect(() => {
    return () => clearListSelection();
  }, [clearListSelection]);

  const onSubmit = async (data: PostFormData) => {
    let mediaUrls: string[] = [];
    try {
      mediaUrls = await photos.publishAll();
    } catch (err) {
      logger.error("Error uploading photos:", err);
      Alert.alert("Error", "Failed to upload photos. Please try again.");
      return;
    }

    try {
      await createPost.mutateAsync({
        text: data.text,
        visibility,
        media_urls: mediaUrls,
        list_id: selectedList?.id || null,
      });
      router.dismissTo("/feed");
    } catch (err) {
      logger.error("Error creating post:", err);
      if (mediaUrls.length > 0) {
        try {
          await supabase.storage
            .from("post-media")
            .remove(postMediaPathsFromUrls(mediaUrls));
        } catch {
          // Best-effort cleanup of orphaned media.
        }
      }
      Alert.alert("Error", "Failed to create post. Please try again.");
    }
  };

  const visibilityOptions: {
    value: PostVisibility;
    label: string;
    icon?: (props: { size?: number; color?: string }) => React.JSX.Element;
  }[] = [
    { value: "public", label: "Public", icon: Icons.globe },
    { value: "friends", label: "Friends", icon: Icons.unlocked },
  ];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.hex.cream }}
      edges={["top"]}
    >
      <ScreenHeader title="New Post" onClose={() => router.back()} />
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-3 pb-8">
        <PostForm
          control={form.control}
          errors={form.formState.errors}
          selectedList={selectedList}
          onAttachList={() => router.push("/select-list")}
          onRemoveList={clearListSelection}
          photos={photos.photos}
          onAddPhoto={photos.pick}
          onRemovePhoto={photos.removeAt}
          canAddPhoto={
            photos.photos.length < photos.MAX_PHOTOS && !photos.isPublishing
          }
          photosBusy={photos.isPublishing}
        />

        <OptionSelector
          label="Who can see this?"
          options={visibilityOptions}
          value={visibility}
          onChange={setVisibility}
          className="mt-6 mb-6"
        />

        <Button
          variant="primary"
          onPress={form.handleSubmit(onSubmit)}
          disabled={
            createPost.isPending ||
            photos.isPublishing ||
            !!form.formState.errors.text
          }
        >
          {photos.isPublishing
            ? "Uploading photos..."
            : createPost.isPending
              ? "Posting..."
              : "Post"}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
