import React, { useState, useEffect } from "react";
import { ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, OptionSelector, Icons, ScreenHeader } from "@/design-system";
import { PostForm, postSchema, PostFormData } from "@/components/PostForm";
import { useCreatePost } from "@/hooks/usePosts";
import { PostVisibility } from "@/types/post";
import { useListSelectionStore } from "@/stores/listSelectionStore";
import { logger } from "@/utils/logger";

export default function CreatePostScreen() {
  const router = useRouter();
  const createPost = useCreatePost();
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
    try {
      await createPost.mutateAsync({
        text: data.text,
        visibility,
        list_id: selectedList?.id || null,
      });
      router.back();
    } catch (err) {
      logger.error("Error creating post:", err);
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
      style={{ flex: 1, backgroundColor: "#faf9f5" }}
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
          disabled={createPost.isPending || !!form.formState.errors.text}
        >
          {createPost.isPending ? "Posting..." : "Post"}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
