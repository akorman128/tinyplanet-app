import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import { queryKeys } from "@/lib/queryKeys";
import {
  optimisticallyPatchPost,
  restorePostListCaches,
  type PostListCacheSnapshot,
} from "./usePosts";

export const useLikePost = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("likes").insert({
        user_id: profile.id,
        post_id: postId,
        comment_id: null,
      });
      if (error) throw error;
    },
    onMutate: (postId): { snapshot: PostListCacheSnapshot } => {
      const snapshot = optimisticallyPatchPost(queryClient, postId, (post) => ({
        ...post,
        liked_by_user: true,
        like_count: post.like_count + 1,
      }));
      return { snapshot };
    },
    onError: (_err, _postId, context) => {
      restorePostListCaches(queryClient, context?.snapshot);
    },
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.detail(postId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
};

export const useUnlikePost = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", profile.id)
        .eq("post_id", postId);
      if (error) throw error;
    },
    onMutate: (postId): { snapshot: PostListCacheSnapshot } => {
      const snapshot = optimisticallyPatchPost(queryClient, postId, (post) => ({
        ...post,
        liked_by_user: false,
        like_count: Math.max(0, post.like_count - 1),
      }));
      return { snapshot };
    },
    onError: (_err, _postId, context) => {
      restorePostListCaches(queryClient, context?.snapshot);
    },
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.detail(postId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
};

export const useLikeComment = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("likes").insert({
        user_id: profile.id,
        post_id: null,
        comment_id: commentId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
    },
  });
};

export const useUnlikeComment = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", profile.id)
        .eq("comment_id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
    },
  });
};
