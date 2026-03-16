import { useInfiniteQuery } from "@tanstack/react-query";
import { useSupabase } from "./useSupabase";
import { useProfileStore } from "../stores/profileStore";
import { queryKeys } from "@/lib/queryKeys";
import { PostWithAuthor } from "../types/post";

export interface GetFeedOutput {
  data: PostWithAuthor[];
}
export interface GetUserPostsOutput {
  data: PostWithAuthor[];
}

const PAGE_SIZE = 10;

export const useGetFeed = () => {
  const { supabase } = useSupabase();
  const { profileState } = useProfileStore();

  return useInfiniteQuery({
    queryKey: queryKeys.posts.feed(),
    queryFn: async ({ pageParam = 0 }) => {
      const { data: posts, error } = await supabase.rpc("get_feed_posts", {
        user_id_param: profileState!.id,
        limit_param: PAGE_SIZE,
        offset_param: pageParam,
      });
      if (error) throw error;
      return (posts as PostWithAuthor[]) || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.flat().length,
    enabled: !!profileState?.id,
  });
};

export const useGetUserPosts = (userId?: string) => {
  const { supabase } = useSupabase();
  const { profileState } = useProfileStore();

  return useInfiniteQuery({
    queryKey: queryKeys.posts.userPosts(userId!),
    queryFn: async ({ pageParam = 0 }) => {
      const { data: posts, error } = await supabase.rpc("get_user_posts", {
        user_id_param: profileState!.id,
        target_user_id: userId!,
        limit_param: PAGE_SIZE,
        offset_param: pageParam,
      });
      if (error) throw error;
      return (posts as PostWithAuthor[]) || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.flat().length,
    enabled: !!userId && !!profileState?.id,
  });
};
