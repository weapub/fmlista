-- Migración para el sistema de gestión de cobros

-- 1. Agregar teléfono de contacto a las radios si no existe
ALTER TABLE public.radios ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE public.radios ADD COLUMN IF NOT EXISTS contact_email text;

-- 2. Tabla de Suscripciones
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  radio_id uuid REFERENCES public.radios(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.plans(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled')),
  start_date timestamptz DEFAULT now(),
  next_billing_date timestamptz NOT NULL,
  last_payment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Tabla de Facturas / Cobros
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

-- Habilitar RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Nota: Se asume que existen políticas para que solo el rol 'service_role' o 'admin' vea todo.
CREATE POLICY "Admins can manage everything" ON public.subscriptions 
  USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Admins can manage invoices" ON public.invoices 
  USING (auth.jwt() ->> 'role' = 'service_role');