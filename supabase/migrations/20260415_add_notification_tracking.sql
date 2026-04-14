-- Agregar columna para rastrear la última notificación enviada y evitar spam
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS last_notification_date timestamptz;