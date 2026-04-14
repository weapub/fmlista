-- 1. Vincular radios con un usuario administrador (propietario)
ALTER TABLE public.radios ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 2. Asegurar que radio_id sea único en subscriptions para permitir el 'upsert'
-- Sin esto, el comando .upsert() del frontend fallará.
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_radio_id_key;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_radio_id_key UNIQUE (radio_id);

-- 2. Configurar RLS para la tabla de Facturas (invoices)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existen para evitar conflictos
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Super admins manage all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Radio admins view own invoices" ON public.invoices;

-- Política para Super Administradores (acceso total)
CREATE POLICY "Super admins manage all invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Política para Radio Admins (solo lectura de sus propias facturas)
CREATE POLICY "Radio admins view own invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.radios 
      WHERE radios.id = invoices.radio_id AND radios.user_id = auth.uid()
    )
  );

-- 3. Configurar RLS para la tabla de Suscripciones (subscriptions)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage everything" ON public.subscriptions;
DROP POLICY IF EXISTS "Super admins manage all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Radio admins view own subscriptions" ON public.subscriptions;

CREATE POLICY "Super admins manage all subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Radio admins view own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.radios 
      WHERE radios.id = subscriptions.radio_id AND radios.user_id = auth.uid()
    )
  );