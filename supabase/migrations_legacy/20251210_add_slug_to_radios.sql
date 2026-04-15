-- Add slug column to radios table
ALTER TABLE public.radios ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS radios_slug_idx ON public.radios (slug);

-- Add a constraint to ensure slug format (optional but good practice: alphanumeric and hyphens only)
-- We'll rely on frontend validation for user feedback, but DB constraint is safer.
-- valid: "la-docta", "radio1", "fm99"
-- invalid: "Radio One!" (spaces, symbols)
ALTER TABLE public.radios ADD CONSTRAINT slug_format_check CHECK (slug ~* '^[a-z0-9-]+$');
