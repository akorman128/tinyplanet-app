-- Update foreign key references from auth.users to public.profiles
-- This ensures consistency with other user-related tables (friendships, vibes, invite_codes)

-- Drop existing foreign key constraints on posts table
ALTER TABLE public.posts
    DROP CONSTRAINT IF EXISTS posts_author_id_fkey;

-- Drop existing foreign key constraints on comments table
ALTER TABLE public.comments
    DROP CONSTRAINT IF EXISTS comments_author_id_fkey;

-- Drop existing foreign key constraints on likes table
ALTER TABLE public.likes
    DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

-- Add new foreign key constraints referencing profiles table
ALTER TABLE public.posts
    ADD CONSTRAINT posts_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.comments
    ADD CONSTRAINT comments_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.likes
    ADD CONSTRAINT likes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
