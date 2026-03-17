-- Create enum for post visibility
CREATE TYPE public.post_visibility AS ENUM (
    'friends',
    'mutuals',
    'public'
);

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text text NOT NULL,
    visibility public.post_visibility DEFAULT 'friends'::public.post_visibility NOT NULL,
    media_urls text[] DEFAULT ARRAY[]::text[],
    edited_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create comments table with nested reply support
CREATE TABLE IF NOT EXISTS public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body text NOT NULL,
    edited_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create likes table (supports both posts and comments)
CREATE TABLE IF NOT EXISTS public.likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT like_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    CONSTRAINT unique_post_like UNIQUE (user_id, post_id),
    CONSTRAINT unique_comment_like UNIQUE (user_id, comment_id)
);

-- Create indexes for better query performance
CREATE INDEX posts_author_id_idx ON public.posts(author_id);
CREATE INDEX posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX comments_post_id_idx ON public.comments(post_id);
CREATE INDEX comments_parent_comment_id_idx ON public.comments(parent_comment_id);
CREATE INDEX comments_author_id_idx ON public.comments(author_id);
CREATE INDEX likes_post_id_idx ON public.likes(post_id);
CREATE INDEX likes_comment_id_idx ON public.likes(comment_id);
CREATE INDEX likes_user_id_idx ON public.likes(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Triggers to automatically update updated_at
CREATE TRIGGER posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
-- Everyone can read posts based on visibility rules (we'll handle this in app logic for friends/mutuals)
CREATE POLICY "Users can view posts based on visibility"
    ON public.posts FOR SELECT
    USING (
        visibility = 'public' OR
        author_id = auth.uid() OR
        (visibility = 'friends' AND EXISTS (
            SELECT 1 FROM public.friendships
            WHERE status = 'accepted'
            AND ((user_a = auth.uid() AND user_b = posts.author_id) OR
                 (user_b = auth.uid() AND user_a = posts.author_id))
        )) OR
        (visibility = 'mutuals' AND EXISTS (
            SELECT 1 FROM public.friendships f1
            JOIN public.friendships f2 ON f1.user_a = f2.user_a OR f1.user_a = f2.user_b OR f1.user_b = f2.user_a OR f1.user_b = f2.user_b
            WHERE f1.status = 'accepted' AND f2.status = 'accepted'
            AND ((f1.user_a = auth.uid() OR f1.user_b = auth.uid()) AND
                 (f2.user_a = posts.author_id OR f2.user_b = posts.author_id))
        ))
    );

-- Users can create their own posts
CREATE POLICY "Users can create their own posts"
    ON public.posts FOR INSERT
    WITH CHECK (author_id = auth.uid());

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
    ON public.posts FOR UPDATE
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
    ON public.posts FOR DELETE
    USING (author_id = auth.uid());

-- RLS Policies for comments
-- Users can view comments on posts they can see
CREATE POLICY "Users can view comments on visible posts"
    ON public.comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE posts.id = comments.post_id
        )
    );

-- Users can create comments on posts they can see
CREATE POLICY "Users can create comments"
    ON public.comments FOR INSERT
    WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE posts.id = post_id
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
    ON public.comments FOR UPDATE
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
    ON public.comments FOR DELETE
    USING (author_id = auth.uid());

-- RLS Policies for likes
-- Users can view all likes
CREATE POLICY "Users can view likes"
    ON public.likes FOR SELECT
    USING (true);

-- Users can create their own likes
CREATE POLICY "Users can create their own likes"
    ON public.likes FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
    ON public.likes FOR DELETE
    USING (user_id = auth.uid());

-- Grant permissions
ALTER TABLE public.posts OWNER TO postgres;
ALTER TABLE public.comments OWNER TO postgres;
ALTER TABLE public.likes OWNER TO postgres;
ALTER TYPE public.post_visibility OWNER TO postgres;

GRANT ALL ON TABLE public.posts TO authenticated;
GRANT ALL ON TABLE public.comments TO authenticated;
GRANT ALL ON TABLE public.likes TO authenticated;
