-- Add scheduling columns to advertisements table
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS start_date timestamp with time zone;
ALTER TABLE public.advertisements ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;

-- Add index for performance when filtering by dates
CREATE INDEX IF NOT EXISTS idx_advertisements_date_range 
ON public.advertisements(start_date, end_date);

-- Add comment explaining the schedule behavior
COMMENT ON COLUMN public.advertisements.start_date IS 'Fecha y hora desde cuando el anuncio será visible (NULL = inmediatamente)';
COMMENT ON COLUMN public.advertisements.end_date IS 'Fecha y hora hasta cuando el anuncio será visible (NULL = indefinidamente)';
