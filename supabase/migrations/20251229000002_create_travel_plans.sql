-- Enable btree_gist extension for UUID support in GIST exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create travel_plans table for users to share upcoming travel destinations
CREATE TABLE IF NOT EXISTS public.travel_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Destination (PostGIS POINT for consistency with profiles.location)
    destination_location public.geography(POINT, 4326) NOT NULL,
    destination_name text NOT NULL,

    -- Dates
    start_date date NOT NULL,
    duration_days int NOT NULL CHECK (duration_days > 0 AND duration_days <= 31),
    end_date date NOT NULL,

    -- Link to auto-created post
    post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,

    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Constraint: Only one active travel plan per user (prevent overlapping plans)
    CONSTRAINT one_active_plan_per_user EXCLUDE USING gist (
        user_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
    )
);

-- Indexes for better query performance
CREATE INDEX idx_travel_plans_user_id ON public.travel_plans(user_id);
CREATE INDEX idx_travel_plans_post_id ON public.travel_plans(post_id);
CREATE INDEX idx_travel_plans_dates ON public.travel_plans(start_date, end_date);
CREATE INDEX idx_travel_plans_destination ON public.travel_plans USING GIST(destination_location);

-- Enable Row Level Security
ALTER TABLE public.travel_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own travel plans
CREATE POLICY "Users can view own travel plans"
    ON public.travel_plans FOR SELECT
    USING (user_id = auth.uid());

-- Users can view friends' active travel plans
CREATE POLICY "Users can view friends active travel plans"
    ON public.travel_plans FOR SELECT
    USING (
        start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE AND
        EXISTS (
            SELECT 1 FROM public.friendships f
            WHERE f.status = 'accepted'
                AND (
                    (f.user_a = auth.uid() AND f.user_b = user_id) OR
                    (f.user_b = auth.uid() AND f.user_a = user_id)
                )
        )
    );

-- Users can view mutuals' active travel plans
CREATE POLICY "Users can view mutuals active travel plans"
    ON public.travel_plans FOR SELECT
    USING (
        start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE AND
        EXISTS (
            -- Check if mutual friend exists
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

-- Users can insert their own travel plans
CREATE POLICY "Users can create own travel plans"
    ON public.travel_plans FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own travel plans
CREATE POLICY "Users can update own travel plans"
    ON public.travel_plans FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own travel plans
CREATE POLICY "Users can delete own travel plans"
    ON public.travel_plans FOR DELETE
    USING (user_id = auth.uid());

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_travel_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_travel_plans_updated_at
    BEFORE UPDATE ON public.travel_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_travel_plans_updated_at();

-- Grant permissions
ALTER TABLE public.travel_plans OWNER TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.travel_plans TO authenticated;
