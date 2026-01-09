import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ScreenHeader,
  Button,
  OptionSelector,
  LoadingState,
  ErrorState,
  Icons,
  colors,
} from "@/design-system";
import { PostForm, postSchema, PostFormData } from "@/components/PostForm";
import { usePosts } from "@/hooks/usePosts";
import { PostVisibility } from "@/types/post";

export default function EditPostScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { getPost, updatePost } = usePosts();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { text: "" },
    mode: "onChange",
  });

  // Fetch post data on mount
  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError("No post ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { data: post } = await getPost(postId);

        // Pre-fill form with post data
        form.reset({ text: post.text });
        setVisibility(post.visibility);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, getPost]);

  const onSubmit = async (data: PostFormData) => {
    if (!postId) return;

    setIsSubmitting(true);
    try {
      await updatePost(postId, {
        text: data.text,
        visibility,
      });

      // Navigate back after successful update
      router.back();
    } catch (err) {
      console.error("Error updating post:", err);
      Alert.alert("Error", "Failed to update post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibilityOptions: {
    value: PostVisibility;
    label: string;
    icon?: any;
  }[] = [
    { value: "public", label: "Public", icon: Icons.globe },
    { value: "friends", label: "Friends", icon: Icons.unlocked },
  ];

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-white pt-12">
          <ScreenHeader title="Edit Post" showBackButton={true} />
          <LoadingState />
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-white pt-12">
          <ScreenHeader title="Edit Post" showBackButton={true} />
          <ErrorState message={error} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white pt-12">
        <ScreenHeader title="Edit Post" showBackButton={true} />

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
            disabled={isSubmitting || !!form.formState.errors.text}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </ScrollView>
      </View>
    </>
  );
}
