-- Hangs: lightweight real-world meetups. Mirrors the travel_plans pattern — a
-- structured row that links to an auto-created post (for feed/visibility reuse) and
-- shows on the map. A hang stays "active" (visible) until starts_at + 3 hours, then is
-- hidden (expired). hang_attendees is the binary "Going" RSVP join table.

-- ========================================
-- hangs table
-- ========================================
CREATE TABLE IF NOT EXISTS public.hangs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- host
    title text NOT NULL,
    description text,
    location public.geography(POINT, 4326) NOT NULL,
    location_name text NOT NULL,
    starts_at timestamp with time zone NOT NULL,

    -- Link to auto-created post (feed/visibility vehicle)
    post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,

    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_hangs_user_id ON public.hangs(user_id);
CREATE INDEX idx_hangs_post_id ON public.hangs(post_id);
CREATE INDEX idx_hangs_starts_at ON public.hangs(starts_at);
CREATE INDEX idx_hangs_location ON public.hangs USING GIST(location);

ALTER TABLE public.hangs ENABLE ROW LEVEL SECURITY;

-- Host can view their own hangs (including expired ones — history)
CREATE POLICY "Users can view own hangs"
    ON public.hangs FOR SELECT
    USING (user_id = auth.uid());

-- Friends can view active (non-expired) hangs
CREATE POLICY "Users can view friends active hangs"
    ON public.hangs FOR SELECT
    USING (
        starts_at + interval '3 hours' >= now() AND
        EXISTS (
            SELECT 1 FROM public.friendships f
            WHERE f.status = 'accepted'
                AND (
                    (f.user_a = auth.uid() AND f.user_b = user_id) OR
                    (f.user_b = auth.uid() AND f.user_a = user_id)
                )
        )
    );

-- Mutuals can view active (non-expired) hangs
CREATE POLICY "Users can view mutuals active hangs"
    ON public.hangs FOR SELECT
    USING (
        starts_at + interval '3 hours' >= now() AND
        EXISTS (
            SELECT 1
            FROM public.friendships f1
            INNER JOIN public.friendships f2
                ON ((f1.user_a = f2.user_a OR f1.user_a = f2.user_b OR f1.user_b = f2.user_a OR f1.user_b = f2.user_b))
            WHERE f1.status = 'accepted' AND f2.status = 'accepted'
                AND (
                    (f1.user_a = auth.uid() OR f1.user_b = auth.uid()) AND
                    (f2.user_a = user_id OR f2.user_b = user_id) AND
                    f1.user_a != f2.user_a AND f1.user_b != f2.user_b
                )
        )
    );

CREATE POLICY "Users can create own hangs"
    ON public.hangs FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own hangs"
    ON public.hangs FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own hangs"
    ON public.hangs FOR DELETE
    USING (user_id = auth.uid());

CREATE TRIGGER hangs_updated_at
    BEFORE UPDATE ON public.hangs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.hangs OWNER TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hangs TO authenticated;

-- ========================================
-- hang_attendees table (binary "Going" RSVP)
-- ========================================
CREATE TABLE IF NOT EXISTS public.hang_attendees (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    hang_id uuid NOT NULL REFERENCES public.hangs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'going',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT unique_hang_attendee UNIQUE (hang_id, user_id)
);

CREATE INDEX idx_hang_attendees_hang_id ON public.hang_attendees(hang_id);
CREATE INDEX idx_hang_attendees_user_id ON public.hang_attendees(user_id);

ALTER TABLE public.hang_attendees ENABLE ROW LEVEL SECURITY;

-- Visible to anyone who can see the parent hang (transitively filtered by hangs RLS)
CREATE POLICY "Users can view attendees of visible hangs"
    ON public.hang_attendees FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.hangs h WHERE h.id = hang_id)
    );

-- Users can RSVP themselves to an active (non-expired) hang they can see
CREATE POLICY "Users can RSVP to active hangs"
    ON public.hang_attendees FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.hangs h
            WHERE h.id = hang_id AND h.starts_at + interval '3 hours' >= now()
        )
    );

-- Users can remove their own RSVP
CREATE POLICY "Users can remove own RSVP"
    ON public.hang_attendees FOR DELETE
    USING (user_id = auth.uid());

ALTER TABLE public.hang_attendees OWNER TO postgres;
GRANT SELECT, INSERT, DELETE ON TABLE public.hang_attendees TO authenticated;

-- Enable Realtime so the detail screen receives live attendee changes
ALTER PUBLICATION supabase_realtime ADD TABLE hang_attendees;
