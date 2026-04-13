-- Add Yearly Plans with 20% discount
-- Run this in your Supabase SQL Editor

-- Streaming Plans (Yearly)
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active)
VALUES 
(
  'Plan Streaming Básico',
  'streaming',
  48000,
  'ARS',
  'Audio MP3 128kbps',
  ARRAY['Listeners ilimitados', 'AutoDJ 5GB', 'Soporte 24/7'],
  'yearly',
  true
),
(
  'Streaming Pro',
  'streaming',
  76800,
  'ARS',
  'La opción equilibrada para emisoras en crecimiento con App propia.',
  ARRAY['Todo lo del plan Básico', 'Streaming en HD AAC+', 'Hasta 500 oyentes', 'App Android incluida', 'Estadísticas avanzadas', 'Soporte prioritario', '– Streaming de video'],
  'yearly',
  true
),
(
  'Streaming Full',
  'streaming',
  115200,
  'ARS',
  'Potencia total con video, oyentes ilimitados y soporte VIP.',
  ARRAY['Todo lo del plan Pro', 'Oyentes ilimitados', 'Streaming de video HD', 'App Android + iOS', 'Grabación de programas', 'Soporte 24/7 VIP'],
  'yearly',
  true
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
