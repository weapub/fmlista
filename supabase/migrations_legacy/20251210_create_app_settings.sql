-- Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
    key text PRIMARY KEY,
    value text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read settings (needed for logo, etc.)
CREATE POLICY "Everyone can read app_settings" ON public.app_settings
    FOR SELECT
    USING (true);

-- Only super_admin can manage settings
CREATE POLICY "Super admin can manage app_settings" ON public.app_settings
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.users WHERE role = 'super_admin'
        )
    );

-- Insert default values if they don't exist
INSERT INTO public.app_settings (key, value)
VALUES ('app_logo', '/favicon.svg')
ON CONFLICT (key) DO NOTHING;
