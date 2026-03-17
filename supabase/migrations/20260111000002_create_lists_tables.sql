-- Create lists tables for user-created location lists

-- Lists table (parent container)
CREATE TABLE IF NOT EXISTS public.lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- List metadata
    title text NOT NULL,
    city text NOT NULL,
    state_region text,
    country text NOT NULL,

    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- List places table (individual places in a list)
CREATE TABLE IF NOT EXISTS public.list_places (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,

    -- Original input
    original_text text NOT NULL,

    -- Resolved data (from LLM + Mapbox)
    resolved_name text NOT NULL,
    location public.geography(POINT, 4326),
    confidence numeric(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    status text NOT NULL CHECK (status IN ('resolved', 'ambiguous', 'unresolved')),
    alternatives jsonb DEFAULT '[]'::jsonb,

    -- Order within list
    position int NOT NULL DEFAULT 0,

    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_lists_user_id ON public.lists(user_id);
CREATE INDEX idx_lists_city ON public.lists(city);
CREATE INDEX idx_list_places_list_id ON public.list_places(list_id);
CREATE INDEX idx_list_places_location ON public.list_places USING GIST(location);

-- Enable RLS
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_places ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lists
CREATE POLICY "Users can view own lists"
    ON public.lists FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view friends lists"
    ON public.lists FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.friendships f
            WHERE f.status = 'accepted'
                AND ((f.user_a = auth.uid() AND f.user_b = user_id) OR
                     (f.user_b = auth.uid() AND f.user_a = user_id))
        )
    );

CREATE POLICY "Users can create own lists"
    ON public.lists FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own lists"
    ON public.lists FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own lists"
    ON public.lists FOR DELETE
    USING (user_id = auth.uid());

-- RLS Policies for list_places (inherit from parent list)
CREATE POLICY "Users can view places in accessible lists"
    ON public.list_places FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.lists l
            WHERE l.id = list_id
                AND (l.user_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM public.friendships f
                    WHERE f.status = 'accepted'
                        AND ((f.user_a = auth.uid() AND f.user_b = l.user_id) OR
                             (f.user_b = auth.uid() AND f.user_a = l.user_id))
                ))
        )
    );

CREATE POLICY "Users can insert places in own lists"
    ON public.list_places FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.lists l
            WHERE l.id = list_id AND l.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update places in own lists"
    ON public.list_places FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.lists l
            WHERE l.id = list_id AND l.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete places in own lists"
    ON public.list_places FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.lists l
            WHERE l.id = list_id AND l.user_id = auth.uid()
        )
    );

-- Updated_at triggers
CREATE TRIGGER trigger_update_lists_updated_at
    BEFORE UPDATE ON public.lists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_travel_plans_updated_at();

CREATE TRIGGER trigger_update_list_places_updated_at
    BEFORE UPDATE ON public.list_places
    FOR EACH ROW
    EXECUTE FUNCTION public.update_travel_plans_updated_at();

-- Grants
ALTER TABLE public.lists OWNER TO postgres;
ALTER TABLE public.list_places OWNER TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.list_places TO authenticated;
