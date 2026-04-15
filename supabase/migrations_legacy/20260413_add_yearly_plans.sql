-- Migration: Add Yearly Plans with 20% discount
-- Created: 2026-04-13

-- Asegurar que la columna existe
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Streaming Plans (Yearly)
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active, is_featured)
VALUES 
(
  'Streaming Básico',
  'streaming',
  48000,
  'ARS',
  'Perfecto para radios que están arrancando o quieren migrar a digital sin complicaciones.',
  ARRAY['Streaming de audio HD', 'Hasta 50 oyentes simultáneos', 'Player embebible', 'Estadísticas básicas', '– Streaming de video', '– Soporte prioritario', '– App Android incluida', '– Estadísticas avanzadas', '– Oyentes ilimitados', '– Grabación de programas', '– App iOS'],
  'yearly',
  true,
  false
),
(
  'Streaming Pro',
  'streaming',
  76800,
  'ARS',
  'La opción equilibrada para emisoras en crecimiento con App propia.',
  ARRAY['Todo lo del plan Básico', 'Streaming en HD AAC+', 'Hasta 500 oyentes', 'App Android incluida', 'Estadísticas avanzadas', 'Soporte prioritario', '– Streaming de video', '– Oyentes ilimitados', '– Grabación de programas', '– App iOS'],
  'yearly',
  true,
  true -- is_featured
),
(
  'Streaming Full',
  'streaming',
  115200,
  'ARS',
  'La experiencia completa para tu radio con video y soporte VIP.',
  ARRAY['Todo lo del plan Pro', 'Oyentes ilimitados', 'Streaming de video HD', 'App Android + iOS', 'Grabación de programas', 'Soporte 24/7 VIP'],
  'yearly',
  true,
  false
)
ON CONFLICT(id) DO NOTHING;

-- Ads Plans (Yearly)
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active, is_featured)
VALUES 
(
  'Publicidad Home',
  'ads',
  144000,
  'ARS',
  'Banner en página de inicio',
  ARRAY['Posición Top', 'Rotación garantizada', 'Reporte de clicks', '– Ubicación estratégica', '– Alta visibilidad', '– Reporte mensual', '– 100% de impresiones', '– Botón de acción directo', '– Reporte detallado'],
  'yearly',
  true,
  false
),
(
  'Banner Lateral / Player',
  'ads',
  96000,
  'ARS',
  'Presencia constante en el reproductor y barra lateral.',
  ARRAY['Ubicación estratégica', 'Alta visibilidad', 'Reporte mensual', '– Posición Top', '– Rotación garantizada', '– Reporte de clicks', '– 100% de impresiones', '– Botón de acción directo', '– Reporte detallado'],
  'yearly',
  true,
  false
),
(
  'Pop-up de Bienvenida',
  'ads',
  192000,
  'ARS',
  'Impacto total al abrir la plataforma o micrositio.',
  ARRAY['100% de impresiones', 'Botón de acción directo', 'Reporte detallado', '– Posición Top', '– Rotación garantizada', '– Reporte de clicks', '– Ubicación estratégica', '– Alta visibilidad', '– Reporte mensual'],
  'yearly',
  true,
  false
)
ON CONFLICT(id) DO NOTHING;

-- Premium Feature Plans (Yearly)
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active, is_featured)
VALUES 
(
  'Microsite Básico',
  'microsite',
  19200,
  'ARS',
  'Mejora la presencia de tu radio con un diseño personalizado básico.',
  ARRAY['Personalización de colores', 'Banner de cabecera propio', 'Enlaces a redes sociales destacados', 'Soporte por email', '– Galería de fotos', '– Programación semanal', '– Botón de WhatsApp flotante', '– Blog de noticias', '– Integración chat en vivo', '– Analytics de visitas', '– Dominio personalizado (.com.ar)', '– Sube tus propias publicidades', '– Estadísticas avanzadas', '– Sin anuncios de terceros'],
  'yearly',
  true,
  false
)
ON CONFLICT(id) DO NOTHING;

-- Microsite Plans (Yearly)
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active, is_featured)
VALUES 
(
  'Microsite Profesional',
  'microsite',
  43200,
  'ARS',
  'Todo lo necesario para una imagen profesional y atractiva.',
  ARRAY['Todo lo del plan Básico', 'Galería de fotos (hasta 20)', 'Sección de programación semanal', 'Botón de WhatsApp flotante', 'Soporte prioritario', '– Blog de noticias', '– Integración chat en vivo', '– Analytics de visitas', '– Dominio personalizado (.com.ar)', '– Sube tus propias publicidades', '– Estadísticas avanzadas', '– Sin anuncios de terceros'],
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
  ARRAY['Todo lo del plan Profesional', 'Blog de noticias integrado', 'Integración chat en vivo', 'Analytics avanzados de visitas', 'Dominio personalizado (.com.ar)', 'Sube tus propias publicidades', 'Estadísticas avanzadas', 'Sin anuncios de terceros', 'Soporte 24/7 VIP'],
  'yearly',
  true,
  false
),
(
  'Suscripción Premium Radio', -- Este plan se mantiene para la sección de "premium_feature" si se desea mantener esa categoría, aunque sus features se integran en Microsite Full.
  'premium_feature',
  28800,
  'ARS',
  'Control total de tu micrositio',
  ARRAY['Sube tus propias publicidades', 'Estadísticas avanzadas', 'Sin anuncios de terceros'],
  'yearly',
  true,
  false
)
ON CONFLICT(id) DO NOTHING;
