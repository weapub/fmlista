-- Create missing billing tables/columns required by payment history flows.

ALTER TABLE public.radios
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_email text;

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  radio_id uuid REFERENCES public.radios(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'ARS',
  due_date timestamptz NOT NULL,
  paid_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'void', 'overdue')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Radio admins view own invoices" ON public.invoices;

CREATE POLICY "Super admins manage all invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Radio admins view own invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.radios
      WHERE radios.id = invoices.radio_id
        AND radios.user_id = auth.uid()
    )
  );
