CREATE TABLE IF NOT EXISTS public.radio_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  frequency text,
  city text,
  province text NOT NULL DEFAULT 'Formosa',
  category text,
  stream_url text,
  website text,
  facebook text,
  instagram text,
  logo_url text,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'verified', 'published')),
  notes text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_radio_catalog_province ON public.radio_catalog (province);
CREATE INDEX IF NOT EXISTS idx_radio_catalog_city ON public.radio_catalog (city);
CREATE INDEX IF NOT EXISTS idx_radio_catalog_status ON public.radio_catalog (status);
CREATE INDEX IF NOT EXISTS idx_radio_catalog_name ON public.radio_catalog (name);

ALTER TABLE public.radio_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage radio catalog" ON public.radio_catalog;

CREATE POLICY "Super admins manage radio catalog" ON public.radio_catalog
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.radio_catalog TO authenticated;
GRANT ALL ON public.radio_catalog TO service_role;
