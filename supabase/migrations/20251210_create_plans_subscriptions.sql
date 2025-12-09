-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('streaming', 'ads', 'premium_feature')),
    price numeric NOT NULL,
    currency text DEFAULT 'ARS',
    description text,
    features jsonb DEFAULT '[]'::jsonb,
    interval text CHECK (interval IN ('monthly', 'yearly', 'one_time')),
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) NOT NULL,
    plan_id uuid REFERENCES public.plans(id) NOT NULL,
    status text NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    current_period_start timestamp with time zone DEFAULT now(),
    current_period_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Add radio_id to advertisements
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS radio_id uuid REFERENCES public.radios(id);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for Plans
CREATE POLICY "Public read access to active plans" ON public.plans
    FOR SELECT USING (active = true);

CREATE POLICY "Super admin manage plans" ON public.plans
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.users WHERE role = 'super_admin')
    );

-- Policies for Subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admin view all subscriptions" ON public.subscriptions
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM public.users WHERE role = 'super_admin')
    );

-- Seed Plans
INSERT INTO public.plans (name, type, price, description, features, interval) VALUES
('Plan Streaming Básico', 'streaming', 5000, 'Audio MP3 128kbps', '["Listeners ilimitados", "AutoDJ 5GB", "Soporte 24/7"]', 'monthly'),
('Plan Streaming Pro', 'streaming', 8000, 'Audio AAC+ 128kbps + App', '["Listeners ilimitados", "AutoDJ 15GB", "Soporte Prioritario", "App Android"]', 'monthly'),
('Plan Publicidad Home', 'ads', 15000, 'Banner en página de inicio', '["Posición Top", "Rotación garantizada", "Reporte de clicks"]', 'monthly'),
('Suscripción Premium Radio', 'premium_feature', 3000, 'Control total de tu micrositio', '["Sube tus propias publicidades", "Estadísticas avanzadas", "Sin anuncios de terceros"]', 'monthly');
