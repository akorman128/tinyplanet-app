import { useQuery, UseQueryResult, useMutation, useQueryClient } from "@tanstack/react-query";

import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import { queryKeys } from "@/lib/queryKeys";
import {
  Post,
  PostWithAuthor,
  CreatePostInput,
  UpdatePostInput,
} from "../types/post";

// --- Types ---

export interface GetPostOutput {
  data: PostWithAuthor;
}

interface CreatePostOutput {
  data: Post;
}

interface UpdatePostOutput {
  data: Post;
}

// --- Mutation hooks ---

export const useCreatePost = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePostInput): Promise<CreatePostOutput> => {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: profile.id,
          text: input.text,
          visibility: input.visibility,
          media_urls: input.media_urls || [],
          list_id: input.list_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
};

export const useUpdatePost = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      input,
    }: {
      postId: string;
      input: UpdatePostInput;
    }): Promise<UpdatePostOutput> => {
      const updates: {
        edited_at: string;
        text?: string;
        visibility?: "friends" | "mutuals" | "public";
        media_urls?: string[];
        list_id?: string | null;
      } = {
        edited_at: new Date().toISOString(),
      };

      if (input.text !== undefined) updates.text = input.text;
      if (input.visibility !== undefined) updates.visibility = input.visibility;
      if (input.media_urls !== undefined) updates.media_urls = input.media_urls;
      if (input.list_id !== undefined) updates.list_id = input.list_id;

      const { data, error } = await supabase
        .from("posts")
        .update(updates)
        .eq("id", postId)
        .eq("author_id", profile.id)
        .select()
        .single();

      if (error) throw error;
      return { data };
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.detail(postId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
};

export const useDeletePost = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("author_id", profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
};

export const useGetPost = (postId?: string): UseQueryResult<GetPostOutput> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.posts.detail(postId!),
    queryFn: async () => {
      const { data: post, error: postError } = await supabase
        .from("posts")
        .select(
          `
          *,
          author:profiles!posts_author_id_fkey(id, full_name, avatar_url)
        `
        )
        .eq("id", postId!)
        .single();

      if (postError) throw postError;

      const { count: likeCount, error: likeCountError } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId!);

      if (likeCountError) throw likeCountError;

      const { count: commentCount, error: commentCountError } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId!);

      if (commentCountError) throw commentCountError;

      const { data: userLike, error: userLikeError } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId!)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (userLikeError) throw userLikeError;

      let attachedList = null;
      if (post.list_id) {
        const { data: listData, error: listError } = await supabase
          .from("lists")
          .select(
            `
            id,
            title,
            location_name,
            user_id,
            owner:profiles!lists_user_id_fkey(full_name)
          `
          )
          .eq("id", post.list_id)
          .single();

        if (!listError && listData) {
          const { count: placeCount } = await supabase
            .from("list_places")
            .select("*", { count: "exact", head: true })
            .eq("list_id", listData.id);

          const owner = listData.owner as
            | { full_name: string }
            | { full_name: string }[]
            | null;
          const ownerFullName = Array.isArray(owner)
            ? owner[0]?.full_name
            : owner?.full_name;
          const ownerName =
            listData.user_id === profile.id ? "You" : ownerFullName || "Unknown";
          attachedList = {
            id: listData.id,
            title: listData.title,
            location_name: listData.location_name,
            place_count: placeCount || 0,
            owner_name: ownerName,
          };
        }
      }

      const postWithAuthor: PostWithAuthor = {
        ...post,
        author: post.author,
        like_count: likeCount || 0,
        comment_count: commentCount || 0,
        liked_by_user: !!userLike,
        saved_by_user: false,
        attached_list: attachedList,
      };

      return { data: postWithAuthor };
    },
    enabled: !!postId,
  });
};
