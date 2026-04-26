CREATE TABLE IF NOT EXISTS public.streaming_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  youtube_url text NOT NULL,
  youtube_video_id text NOT NULL,
  thumbnail_url text,
  category text NOT NULL DEFAULT 'General',
  channel_name text,
  is_featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_streaming_programs_active ON public.streaming_programs (active);
CREATE INDEX IF NOT EXISTS idx_streaming_programs_category ON public.streaming_programs (category);
CREATE INDEX IF NOT EXISTS idx_streaming_programs_featured ON public.streaming_programs (is_featured);
CREATE INDEX IF NOT EXISTS idx_streaming_programs_display_order ON public.streaming_programs (display_order);
CREATE INDEX IF NOT EXISTS idx_streaming_programs_created_at ON public.streaming_programs (created_at DESC);

ALTER TABLE public.streaming_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active streaming programs" ON public.streaming_programs;
DROP POLICY IF EXISTS "Super admins manage streaming programs" ON public.streaming_programs;

CREATE POLICY "Public read active streaming programs" ON public.streaming_programs
  FOR SELECT
  USING (active = true);

CREATE POLICY "Super admins manage streaming programs" ON public.streaming_programs
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

GRANT SELECT ON public.streaming_programs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.streaming_programs TO authenticated;
GRANT ALL ON public.streaming_programs TO service_role;

