import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  OptionSelector,
  LoadingState,
  ErrorState,
  Icons,
  colors,
} from "@/design-system";
import { PostForm, postSchema, PostFormData } from "@/components/PostForm";
import { useGetPost, useUpdatePost } from "@/hooks/usePosts";
import { PostVisibility } from "@/types/post";

export default function EditPostScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const {
    data: postData,
    isPending: loading,
    error: queryError,
  } = useGetPost(postId);
  const updatePost = useUpdatePost();

  const [visibility, setVisibility] = useState<PostVisibility>("public");

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { text: "" },
    mode: "onChange",
  });

  // Pre-fill form when post data loads
  useEffect(() => {
    if (postData?.data) {
      form.reset({ text: postData.data.text });
      setVisibility(postData.data.visibility);
    }
  }, [postData]);

  const onSubmit = async (data: PostFormData) => {
    if (!postId) return;

    try {
      await updatePost.mutateAsync({
        postId,
        input: {
          text: data.text,
          visibility,
        },
      });

      router.back();
    } catch (err) {
      console.error("Error updating post:", err);
      Alert.alert("Error", "Failed to update post. Please try again.");
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

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Post" }} />
        <View className="flex-1 bg-cream">
          <LoadingState />
        </View>
      </>
    );
  }

  if (queryError) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Post" }} />
        <View className="flex-1 bg-cream">
          <ErrorState message={queryError.message} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit Post" }} />
      <View className="flex-1 bg-cream">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-6 pb-8"
        >
          <PostForm control={form.control} errors={form.formState.errors} />

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
            disabled={updatePost.isPending || !!form.formState.errors.text}
          >
            {updatePost.isPending ? "Saving..." : "Save"}
          </Button>
        </ScrollView>
      </View>
    </>
  );
}
