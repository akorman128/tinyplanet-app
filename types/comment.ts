import { AttachedList } from "./post";

export interface Comment {
  id: string;
  post_id: string;
  parent_comment_id: string | null;
  author_id: string;
  body: string;
  list_id: string | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  like_count: number;
  liked_by_user: boolean;
  replies?: CommentWithAuthor[];
  attached_list: AttachedList | null;
}

export interface CreateCommentInput {
  post_id: string;
  parent_comment_id?: string | null;
  body: string;
  list_id?: string | null;
}

export interface UpdateCommentInput {
  body: string;
  list_id?: string | null;
}
