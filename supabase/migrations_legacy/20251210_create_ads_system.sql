-- Create advertisements table
CREATE TABLE IF NOT EXISTS public.advertisements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    image_url text NOT NULL,
    link_url text,
    position text NOT NULL CHECK (position IN ('home_top', 'home_middle', 'microsite_top', 'microsite_sidebar')),
    active boolean DEFAULT true,
    clicks integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view active ads
CREATE POLICY "Everyone can view active ads" ON public.advertisements
    FOR SELECT
    USING (active = true);

-- Only super_admin can manage ads
-- (Assuming we use the user metadata or a specific check for super_admin role from the users table logic we established earlier)
-- Since we don't have a direct "is_super_admin" function in the DB usually, we rely on the users table join or role check.
-- For simplicity in this app's context where we check roles in frontend mostly or via simple RLS:
-- We'll allow all authenticated users to read for now (or public), and restrict write.

CREATE POLICY "Super admin can do everything with ads" ON public.advertisements
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.users WHERE role = 'super_admin'
        )
    );

-- Also allow reading for admin panel management (even if inactive)
CREATE POLICY "Super admin can view all ads" ON public.advertisements
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM public.users WHERE role = 'super_admin'
        )
    );
