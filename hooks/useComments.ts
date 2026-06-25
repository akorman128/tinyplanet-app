import {
  useQuery,
  UseQueryResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import { queryKeys } from "@/lib/queryKeys";
import {
  optimisticallyPatchPost,
  restorePostListCaches,
  type PostListCacheSnapshot,
} from "./usePosts";
import {
  Comment,
  CommentWithAuthor,
  CreateCommentInput,
  UpdateCommentInput,
} from "../types/comment";

// --- Types ---

export interface GetCommentsOutput {
  data: CommentWithAuthor[];
}

interface CreateCommentOutput {
  data: Comment;
}

interface UpdateCommentOutput {
  data: Comment;
}

// --- Mutation hooks ---

export const useCreateComment = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: CreateCommentInput
    ): Promise<CreateCommentOutput> => {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: input.post_id,
          parent_comment_id: input.parent_comment_id || null,
          author_id: profile.id,
          body: input.body,
          list_id: input.list_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { data };
    },
    onMutate: (input): { snapshot: PostListCacheSnapshot } => {
      const snapshot = optimisticallyPatchPost(
        queryClient,
        input.post_id,
        (post) => ({ ...post, comment_count: post.comment_count + 1 })
      );
      return { snapshot };
    },
    onError: (_err, _input, context) => {
      restorePostListCaches(queryClient, context?.snapshot);
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byPost(input.post_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.detail(input.post_id),
      });
    },
  });
};

export const useUpdateComment = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      input,
    }: {
      commentId: string;
      input: UpdateCommentInput;
    }): Promise<UpdateCommentOutput> => {
      const updates: {
        body: string;
        edited_at: string;
        list_id?: string | null;
      } = {
        body: input.body,
        edited_at: new Date().toISOString(),
      };

      if (input.list_id !== undefined) updates.list_id = input.list_id;

      const { data, error } = await supabase
        .from("comments")
        .update(updates)
        .eq("id", commentId)
        .eq("author_id", profile.id)
        .select()
        .single();

      if (error) throw error;
      return { data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
    },
  });
};

export const useDeleteComment = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("author_id", profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
};

export const useGetComments = (
  postId?: string
): UseQueryResult<GetCommentsOutput> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.comments.byPost(postId!),
    queryFn: async () => {
      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select(
          `
          *,
          author:profiles!comments_author_id_fkey(id, full_name, avatar_url)
        `
        )
        .eq("post_id", postId!)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      const commentIds = comments.map((c) => c.id);

      const { data: likes, error: likesError } = await supabase
        .from("likes")
        .select("comment_id, user_id")
        .in("comment_id", commentIds);

      if (likesError) throw likesError;

      const commentMap = new Map<string, CommentWithAuthor>();
      const rootComments: CommentWithAuthor[] = [];

      const listIds = comments
        .filter((c) => c.list_id)
        .map((c) => c.list_id as string);
      const uniqueListIds = [...new Set(listIds)];

      let listsMap = new Map<
        string,
        {
          id: string;
          title: string;
          location_name: string;
          place_count: number;
          owner_name: string;
        }
      >();

      if (uniqueListIds.length > 0) {
        const { data: listsData } = await supabase
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
          .in("id", uniqueListIds);

        if (listsData) {
          for (const list of listsData) {
            const { count: placeCount } = await supabase
              .from("list_places")
              .select("*", { count: "exact", head: true })
              .eq("list_id", list.id);

            const owner = list.owner as
              | { full_name: string }
              | { full_name: string }[]
              | null;
            const ownerFullName = Array.isArray(owner)
              ? owner[0]?.full_name
              : owner?.full_name;
            const ownerName =
              list.user_id === profile.id ? "You" : ownerFullName || "Unknown";
            listsMap.set(list.id, {
              id: list.id,
              title: list.title,
              location_name: list.location_name,
              place_count: placeCount || 0,
              owner_name: ownerName,
            });
          }
        }
      }

      comments.forEach((comment) => {
        const commentLikes =
          likes?.filter((l) => l.comment_id === comment.id) || [];
        const attachedList = comment.list_id
          ? listsMap.get(comment.list_id) || null
          : null;
        const commentWithAuthor: CommentWithAuthor = {
          ...comment,
          author: comment.author,
          like_count: commentLikes.length,
          liked_by_user: commentLikes.some((l) => l.user_id === profile.id),
          replies: [],
          attached_list: attachedList,
        };

        commentMap.set(comment.id, commentWithAuthor);
      });

      comments.forEach((comment) => {
        const commentWithAuthor = commentMap.get(comment.id)!;
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies!.push(commentWithAuthor);
          }
        } else {
          rootComments.push(commentWithAuthor);
        }
      });

      return { data: rootComments };
    },
    enabled: !!postId,
  });
};
