-- Fix ambiguous post_id column references in RLS policies
-- This fixes the error: "column reference \"post_id\" is ambiguous"

-- Drop and recreate the comments policy with qualified post_id
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments"
    ON public.comments FOR INSERT
    WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE posts.id = comments.post_id  -- Qualified with table name
        )
    );

-- Drop and recreate the saved_posts policy with qualified post_id
DROP POLICY IF EXISTS "Users can save posts they can view" ON public.saved_posts;
CREATE POLICY "Users can save posts they can view"
    ON public.saved_posts FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE posts.id = saved_posts.post_id  -- Qualified with table name
        )
    );
