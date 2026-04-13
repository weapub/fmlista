-- Update plans table to support microsite type
-- Created: 2026-04-13

-- Drop the existing constraint and create a new one with microsite included
ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_type_check;

ALTER TABLE public.plans ADD CONSTRAINT plans_type_check 
  CHECK (type IN ('streaming', 'ads', 'premium_feature', 'microsite'));
