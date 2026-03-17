-- Create contacts table for user-imported phone contacts

CREATE TABLE IF NOT EXISTS public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Contact fields
    name text NOT NULL,
    phone text,
    email text,
    company text,
    note text,

    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_name ON public.contacts(name);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own contacts
CREATE POLICY "Users can view own contacts"
    ON public.contacts FOR SELECT
    USING (user_id = auth.uid());

-- RLS: Friends can view each other's contacts
CREATE POLICY "Users can view friends contacts"
    ON public.contacts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.friendships f
            WHERE f.status = 'accepted'
            AND ((f.user_a = auth.uid() AND f.user_b = user_id)
              OR (f.user_b = auth.uid() AND f.user_a = user_id))
        )
    );

-- RLS: Users can create their own contacts
CREATE POLICY "Users can create own contacts"
    ON public.contacts FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- RLS: Users can update their own contacts
CREATE POLICY "Users can update own contacts"
    ON public.contacts FOR UPDATE
    USING (user_id = auth.uid());

-- RLS: Users can delete their own contacts
CREATE POLICY "Users can delete own contacts"
    ON public.contacts FOR DELETE
    USING (user_id = auth.uid());

-- Updated_at trigger (reuse existing function)
CREATE TRIGGER trigger_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_travel_plans_updated_at();

-- Grants
ALTER TABLE public.contacts OWNER TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contacts TO authenticated;
