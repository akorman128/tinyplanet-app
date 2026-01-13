export type PostVisibility = "friends" | "mutuals" | "public";

export interface AttachedList {
  id: string;
  title: string;
  location_name: string;
  place_count: number;
  owner_name: string;
}

export interface Post {
  id: string;
  author_id: string;
  text: string;
  visibility: PostVisibility;
  media_urls: string[];
  list_id: string | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  like_count: number;
  comment_count: number;
  liked_by_user: boolean;
  saved_by_user: boolean;
  attached_list: AttachedList | null;
}

export interface CreatePostInput {
  text: string;
  visibility: PostVisibility;
  media_urls?: string[];
  list_id?: string | null;
}

export interface UpdatePostInput {
  text?: string;
  visibility?: PostVisibility;
  media_urls?: string[];
  list_id?: string | null;
}
