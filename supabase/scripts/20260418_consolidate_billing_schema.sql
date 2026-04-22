-- Consolidate billing schema so subscriptions, admin views and webhooks
-- all rely on the same columns across fresh and existing environments.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS radio_id uuid REFERENCES public.radios(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS next_billing_date timestamptz,
  ADD COLUMN IF NOT EXISTS last_payment_date timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS mp_payment_id text,
  ADD COLUMN IF NOT EXISTS last_notification_date timestamptz;

ALTER TABLE public.subscriptions
  ALTER COLUMN updated_at SET DEFAULT now();

UPDATE public.subscriptions
SET next_billing_date = COALESCE(next_billing_date, current_period_end)
WHERE next_billing_date IS NULL
  AND current_period_end IS NOT NULL;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_radio_id_key;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_radio_id_key UNIQUE (radio_id);

CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text NOT NULL UNIQUE,
  topic text,
  status text,
  invoice_id uuid,
  plan_id uuid,
  radio_id uuid,
  user_id uuid,
  raw_payload jsonb,
  processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage payment events" ON public.payment_events;

CREATE POLICY "Super admins manage payment events" ON public.payment_events
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE OR REPLACE VIEW public.radio_subscription_status AS
SELECT
  r.id,
  r.user_id,
  r.name,
  r.slug,
  r.frequency,
  r.logo_url,
  r.cover_url,
  r.description,
  r.stream_url,
  r.location,
  r.category,
  r.created_at,
  r.updated_at,
  s.id AS subscription_id,
  s.status AS subscription_status,
  s.next_billing_date,
  s.current_period_end,
  s.plan_id,
  p.name AS plan_name,
  p.interval AS plan_interval,
  p.type AS plan_type
FROM public.radios r
LEFT JOIN public.subscriptions s ON s.radio_id = r.id
LEFT JOIN public.plans p ON p.id = s.plan_id;

GRANT SELECT ON public.radio_subscription_status TO authenticated;
