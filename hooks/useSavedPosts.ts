import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import { queryKeys } from "@/lib/queryKeys";
import { PostWithAuthor } from "@/types/post";
import {
  optimisticallyPatchPost,
  restorePostListCaches,
  type PostListCacheSnapshot,
} from "./usePosts";

const PAGE_SIZE = 10;

export interface GetSavedPostsOutput {
  data: PostWithAuthor[];
}

export const useSavePost = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("saved_posts").insert({
        user_id: profile.id,
        post_id: postId,
      });
      if (error) throw error;
    },
    onMutate: (postId): { snapshot: PostListCacheSnapshot } => {
      const snapshot = optimisticallyPatchPost(queryClient, postId, (post) => ({
        ...post,
        saved_by_user: true,
      }));
      return { snapshot };
    },
    onError: (_err, _postId, context) => {
      restorePostListCaches(queryClient, context?.snapshot);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.saved() });
    },
  });
};

export const useUnsavePost = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("user_id", profile.id)
        .eq("post_id", postId);
      if (error) throw error;
    },
    onMutate: (postId): { snapshot: PostListCacheSnapshot } => {
      const snapshot = optimisticallyPatchPost(queryClient, postId, (post) => ({
        ...post,
        saved_by_user: false,
      }));
      return { snapshot };
    },
    onError: (_err, _postId, context) => {
      restorePostListCaches(queryClient, context?.snapshot);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.saved() });
    },
  });
};

export const useGetSavedPosts = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useInfiniteQuery({
    queryKey: queryKeys.posts.saved(),
    queryFn: async ({ pageParam = 0 }) => {
      const { data: posts, error } = await supabase.rpc("get_saved_posts", {
        user_id_param: profile.id,
        limit_param: PAGE_SIZE,
        offset_param: pageParam,
      });
      if (error) throw error;
      return (posts as PostWithAuthor[]) || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.flat().length,
  });
};
