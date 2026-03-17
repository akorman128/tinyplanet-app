-- Add list attachments to posts and comments
-- Users can attach lists (own or friends') to posts and comments

-- Add list_id to posts table
ALTER TABLE public.posts
    ADD COLUMN list_id uuid REFERENCES public.lists(id) ON DELETE SET NULL;

-- Add list_id to comments table
ALTER TABLE public.comments
    ADD COLUMN list_id uuid REFERENCES public.lists(id) ON DELETE SET NULL;

-- Create indexes for efficient lookups
CREATE INDEX posts_list_id_idx ON public.posts(list_id);
CREATE INDEX comments_list_id_idx ON public.comments(list_id);

-- Update RLS policies to validate list access
-- Users can only attach lists they can view (own + friends')

-- Helper function to check if user can access a list
CREATE OR REPLACE FUNCTION public.can_access_list(check_list_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF check_list_id IS NULL THEN
        RETURN true;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.lists l
        WHERE l.id = check_list_id
        AND (
            l.user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.friendships f
                WHERE f.status = 'accepted'
                AND ((f.user_a = auth.uid() AND f.user_b = l.user_id)
                     OR (f.user_b = auth.uid() AND f.user_a = l.user_id))
            )
        )
    );
END;
$$;

-- Update post insert policy to validate list access
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
CREATE POLICY "Users can create their own posts"
    ON public.posts FOR INSERT
    WITH CHECK (
        author_id = auth.uid()
        AND public.can_access_list(list_id)
    );

-- Update post update policy to validate list access
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts"
    ON public.posts FOR UPDATE
    USING (author_id = auth.uid())
    WITH CHECK (
        author_id = auth.uid()
        AND public.can_access_list(list_id)
    );

-- Update comment insert policy to validate list access
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments"
    ON public.comments FOR INSERT
    WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_id)
        AND public.can_access_list(list_id)
    );

-- Update comment update policy to validate list access
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments"
    ON public.comments FOR UPDATE
    USING (author_id = auth.uid())
    WITH CHECK (
        author_id = auth.uid()
        AND public.can_access_list(list_id)
    );

-- Grant execute on helper function
GRANT EXECUTE ON FUNCTION public.can_access_list(uuid) TO authenticated;
