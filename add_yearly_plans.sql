-- Add Yearly Plans with 20% discount
-- Run this in your Supabase SQL Editor

ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_type_check;
ALTER TABLE public.plans ADD CONSTRAINT plans_type_check
  CHECK (type IN ('streaming', 'ads', 'premium_feature', 'microsite'));

DELETE FROM public.plans
WHERE interval = 'yearly'
  AND name IN (
    'Streaming Básico',
    'Streaming Profesional',
    'Streaming Full',
    'Plan Publicidad Home',
    'Suscripción Premium Radio',
    'Microsite Básico',
    'Microsite Profesional',
    'Microsite Full'
  );

-- Streaming Plans (Yearly)
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active, is_featured)
VALUES 
(
  'Streaming Básico',
  'streaming',
  48000,
  'ARS',
  'Perfecto para radios que están arrancando o quieren migrar a digital.',
  ARRAY['Streaming de audio HD', 'Hasta 50 oyentes simultáneos', 'Player embebible en tu web', 'Estadísticas básicas de audiencia', '– Streaming de video', '– Soporte prioritario'],
  'yearly',
  true,
  false
),
(
  'Streaming Profesional',
  'streaming',
  76800,
  'ARS',
  'Para radios establecidas que quieren crecer, con video y herramientas avanzadas.',
  ARRAY['Todo lo del plan Básico', 'Oyentes ilimitados', 'Streaming de video HD', 'App Android personalizada', 'Panel de estadísticas avanzado', 'Soporte prioritario 24/7'],
  'yearly',
  true,
  true
),
(
  'Streaming Full',
  'streaming',
  115200,
  'ARS',
  'La experiencia definitiva para tu radio con soporte VIP.',
  ARRAY['Todo lo del plan Pro', 'Calidad de audio 320kbps', 'App Android + iOS', 'Grabación de programas', 'Soporte VIP dedicado', 'Hosting de archivos 50GB'],
  'yearly',
  true,
  false
)
ON CONFLICT DO NOTHING;

-- Ads Plans (Yearly)
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active)
VALUES 
(
  'Plan Publicidad Home',
  'ads',
  144000,
  'ARS',
  'Banner en página de inicio',
  ARRAY['Posición Top', 'Rotación garantizada', 'Reporte de clicks'],
  'yearly',
  true
)
ON CONFLICT DO NOTHING;

-- Premium Feature Plans (Yearly)
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active)
VALUES 
(
  'Suscripción Premium Radio',
  'premium_feature',
  28800,
  'ARS',
  'Control total de tu micrositio',
  ARRAY['Sube tus propias publicidades', 'Estadísticas avanzadas', 'Sin anuncios de terceros'],
  'yearly',
  true
)
ON CONFLICT DO NOTHING;

-- Microsite Plans (Yearly)
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active)
VALUES 
(
  'Microsite Básico',
  'microsite',
  19200,
  'ARS',
  'Mejora la presencia de tu radio con un diseño personalizado básico.',
  ARRAY['Personalización de colores', 'Banner de cabecera propio', 'Enlaces a redes sociales destacados', 'Soporte por email'],
  'yearly',
  true
),
(
  'Microsite Profesional',
  'microsite',
  43200,
  'ARS',
  'Todo lo necesario para una imagen profesional y atractiva.',
  ARRAY['Todo lo del plan Básico', 'Galería de fotos (hasta 20)', 'Sección de programación semanal', 'Botón de WhatsApp flotante', 'Soporte prioritario'],
  'yearly',
  true,
  true
),
(
  'Microsite Full',
  'microsite',
  76800,
  'ARS',
  'La experiencia definitiva para tus oyentes con todas las funciones.',
  ARRAY['Todo lo del plan Profesional', 'Blog de noticias integrado', 'Integración chat en vivo', 'Analytics avanzados de visitas', 'Dominio personalizado (.com.ar)'],
  'yearly',
  true
)
ON CONFLICT DO NOTHING;
