-- Create saved_posts table for bookmarking posts
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT unique_saved_post UNIQUE (user_id, post_id)
);

-- Create indexes for better query performance
CREATE INDEX saved_posts_user_id_idx ON public.saved_posts(user_id);
CREATE INDEX saved_posts_post_id_idx ON public.saved_posts(post_id);
CREATE INDEX saved_posts_created_at_idx ON public.saved_posts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_posts
-- Users can view only their own saved posts
CREATE POLICY "Users can view their own saved posts"
    ON public.saved_posts FOR SELECT
    USING (user_id = auth.uid());

-- Users can save posts they can see
CREATE POLICY "Users can save posts"
    ON public.saved_posts FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE posts.id = post_id
        )
    );

-- Users can delete their own saved posts
CREATE POLICY "Users can delete their own saved posts"
    ON public.saved_posts FOR DELETE
    USING (user_id = auth.uid());

-- Grant permissions
ALTER TABLE public.saved_posts OWNER TO postgres;
GRANT ALL ON TABLE public.saved_posts TO authenticated;

-- Create optimized function to get saved posts with aggregated counts
CREATE OR REPLACE FUNCTION get_saved_posts(
  user_id_param UUID,
  limit_param INT,
  offset_param INT
)
RETURNS TABLE (
  id UUID,
  text TEXT,
  media_urls TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  author_id UUID,
  visibility TEXT,
  author JSONB,
  like_count BIGINT,
  comment_count BIGINT,
  liked_by_user BOOLEAN,
  saved_by_user BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.text,
    p.media_urls,
    p.created_at,
    p.updated_at,
    p.edited_at,
    p.author_id,
    p.visibility::TEXT,
    jsonb_build_object(
      'id', prof.id,
      'full_name', prof.full_name,
      'avatar_url', prof.avatar_url
    ) as author,
    COUNT(DISTINCT l.id)::BIGINT as like_count,
    COUNT(DISTINCT c.id)::BIGINT as comment_count,
    (COUNT(DISTINCT CASE WHEN l.user_id = user_id_param THEN l.id END) > 0) as liked_by_user,
    true as saved_by_user
  FROM saved_posts sp
  INNER JOIN posts p ON sp.post_id = p.id
  INNER JOIN profiles prof ON p.author_id = prof.id
  LEFT JOIN likes l ON l.post_id = p.id
  LEFT JOIN comments c ON c.post_id = p.id
  WHERE sp.user_id = user_id_param
  GROUP BY p.id, p.text, p.media_urls, p.created_at, p.updated_at, p.edited_at, p.author_id, p.visibility, prof.id, prof.full_name, prof.avatar_url
  ORDER BY sp.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;
