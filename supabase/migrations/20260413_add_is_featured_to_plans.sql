-- Add is_featured column to plans table if it doesn't exist
-- Created: 2026-04-13

ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
