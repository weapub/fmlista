-- ========================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ========================================

-- Step 1: Update plans table constraint to support microsite
ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_type_check;
ALTER TABLE public.plans ADD CONSTRAINT plans_type_check 
  CHECK (type IN ('streaming', 'ads', 'premium_feature', 'microsite'));

-- Step 2: Add is_featured column if missing
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Step 3: Clear old plans
DELETE FROM public.plans WHERE type IN ('streaming', 'ads', 'microsite') AND active = true;

-- ============================================
-- STREAMING PLANS (Monthly)
-- ============================================
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active)
VALUES 
(
  'Streaming Básico',
  'streaming',
  5000,
  'ARS',
  'Perfecto para radios que están arrancando o quieren migrar a digital sin complicaciones.',
  ARRAY[
    'Streaming de audio HD',
    'Hasta 50 oyentes simultáneos',
    'Player embebible en tu web',
    'Estadísticas básicas de audiencia',
    '– Streaming de video',
    '– Soporte prioritario'
  ],
  'monthly',
  true
),
(
  'Streaming Pro',
  'streaming',
  8000,
  'ARS',
  'Para radios establecidas que quieren crecer, con video y herramientas avanzadas incluidas.',
  ARRAY[
    'Streaming de audio y video HD',
    'Oyentes ilimitados',
    'Player embebible personalizado',
    'Panel de estadísticas avanzado',
    'Soporte prioritario 24/7',
    'App en FM Lista destacada'
  ],
  'monthly',
  true
);

-- ============================================
-- STREAMING PLANS (Yearly - 20% discount)
-- ============================================
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active, is_featured)
VALUES 
(
  'Streaming Básico',
  'streaming',
  48000,
  'ARS',
  'Perfecto para radios que están arrancando o quieren migrar a digital sin complicaciones.',
  ARRAY[
    'Streaming de audio HD',
    'Hasta 50 oyentes simultáneos',
    'Player embebible en tu web',
    'Estadísticas básicas de audiencia',
    '– Streaming de video',
    '– Soporte prioritario'
  ],
  'yearly',
  true,
  false
),
(
  'Streaming Pro',
  'streaming',
  64000,
  'ARS',
  'Para radios establecidas que quieren crecer, con video y herramientas avanzadas incluidas.',
  ARRAY[
    'Streaming de audio y video HD',
    'Oyentes ilimitados',
    'Player embebible personalizado',
    'Panel de estadísticas avanzado',
    'Soporte prioritario 24/7',
    'App en FM Lista destacada'
  ],
  'yearly',
  true,
  false
);

-- ============================================
-- PUBLICIDAD/ADS PLANS (Monthly)
-- ============================================
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active)
VALUES 
(
  'Publicidad Home',
  'ads',
  15000,
  'ARS',
  'Tu aviso en la pantalla principal de la app, vista por todos los usuarios desde que la abren.',
  ARRAY[
    'Banner en pantalla de inicio',
    'Rotación con otras marcas',
    'Estadísticas de impresiones',
    'Link a tu web o WhatsApp'
  ],
  'monthly',
  true
),
(
  'Premium Radio',
  'ads',
  3000,
  'ARS',
  'Patrocinás directamente una radio y quedás asociado a su audiencia fiel. Mayor recordación de marca.',
  ARRAY[
    'Logo en la página de la radio',
    'Mención al aire (opcional)',
    'Audiencia segmentada y fiel',
    'Métricas de engagement',
    'Renovación mensual sin contratos'
  ],
  'monthly',
  true
),
(
  'Publicidad Exclusiva',
  'ads',
  35000,
  'ARS',
  'Ocupás el 100% del espacio publicitario en la app durante el mes. Sin competencia, máxima visibilidad.',
  ARRAY[
    'Banner exclusivo en toda la app',
    'Sin rotación con otras marcas',
    'Notificación push a usuarios',
    'Reporte mensual detallado',
    'Asesoramiento creativo incluido'
  ],
  'monthly',
  true
);

-- ============================================
-- PUBLICIDAD/ADS PLANS (Yearly - 20% discount)
-- ============================================
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active, is_featured)
VALUES 
(
  'Publicidad Home',
  'ads',
  144000,
  'ARS',
  'Tu aviso en la pantalla principal de la app, vista por todos los usuarios desde que la abren.',
  ARRAY[
    'Banner en pantalla de inicio',
    'Rotación con otras marcas',
    'Estadísticas de impresiones',
    'Link a tu web o WhatsApp'
  ],
  'yearly',
  true,
  false
),
(
  'Premium Radio',
  'ads',
  28800,
  'ARS',
  'Patrocinás directamente una radio y quedás asociado a su audiencia fiel. Mayor recordación de marca.',
  ARRAY[
    'Logo en la página de la radio',
    'Mención al aire (opcional)',
    'Audiencia segmentada y fiel',
    'Métricas de engagement',
    'Renovación mensual sin contratos'
  ],
  'yearly',
  true,
  false
),
(
  'Publicidad Exclusiva',
  'ads',
  336000,
  'ARS',
  'Ocupás el 100% del espacio publicitario en la app durante el mes. Sin competencia, máxima visibilidad.',
  ARRAY[
    'Banner exclusivo en toda la app',
    'Sin rotación con otras marcas',
    'Notificación push a usuarios',
    'Reporte mensual detallado',
    'Asesoramiento creativo incluido'
  ],
  'yearly',
  true,
  false
);

-- ============================================
-- MICROSITIO PLANS (Monthly)
-- ============================================
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active)
VALUES 
(
  'Micrositio Básico',
  'microsite',
  2000,
  'ARS',
  'Presencia digital lista para usar. Ideal para radios que quieren mostrar lo esencial sin esfuerzo.',
  ARRAY[
    'Página dentro de FM Lista',
    'Logo, descripción y redes sociales',
    'Player integrado',
    'Grilla de programación básica',
    '– Noticias y contenido propio',
    '– Galería de fotos'
  ],
  'monthly',
  true
),
(
  'Micrositio Profesional',
  'microsite',
  4500,
  'ARS',
  'Todo lo que tu radio necesita para destacarse, generar contenido y fidelizar oyentes.',
  ARRAY[
    'Todo del plan Básico',
    'Sección de noticias y novedades',
    'Galería de fotos y videos',
    'Grilla de programación completa',
    'Formulario de contacto',
    'Perfil destacado en búsquedas'
  ],
  'monthly',
  true
),
(
  'Micrositio Full',
  'microsite',
  8000,
  'ARS',
  'La experiencia completa. Tu radio con su propia identidad digital, estadísticas y todo personalizado.',
  ARRAY[
    'Todo del plan Profesional',
    'Diseño personalizado con tu marca',
    'Analytics detallado de oyentes',
    'Integración con redes sociales',
    'Acceso anticipado a novedades',
    'Soporte dedicado vía WhatsApp'
  ],
  'monthly',
  true
);

-- ============================================
-- MICROSITIO PLANS (Yearly - 20% discount)
-- ============================================
INSERT INTO public.plans (name, type, price, currency, description, features, interval, active, is_featured)
VALUES 
(
  'Micrositio Básico',
  'microsite',
  19200,
  'ARS',
  'Presencia digital lista para usar. Ideal para radios que quieren mostrar lo esencial sin esfuerzo.',
  ARRAY[
    'Página dentro de FM Lista',
    'Logo, descripción y redes sociales',
    'Player integrado',
    'Grilla de programación básica',
    '– Noticias y contenido propio',
    '– Galería de fotos'
  ],
  'yearly',
  true,
  false
),
(
  'Micrositio Profesional',
  'microsite',
  43200,
  'ARS',
  'Todo lo que tu radio necesita para destacarse, generar contenido y fidelizar oyentes.',
  ARRAY[
    'Todo del plan Básico',
    'Sección de noticias y novedades',
    'Galería de fotos y videos',
    'Grilla de programación completa',
    'Formulario de contacto',
    'Perfil destacado en búsquedas'
  ],
  'yearly',
  true,
  false
),
(
  'Micrositio Full',
  'microsite',
  76800,
  'ARS',
  'La experiencia completa. Tu radio con su propia identidad digital, estadísticas y todo personalizado.',
  ARRAY[
    'Todo del plan Profesional',
    'Diseño personalizado con tu marca',
    'Analytics detallado de oyentes',
    'Integración con redes sociales',
    'Acceso anticipado a novedades',
    'Soporte dedicado vía WhatsApp'
  ],
  'yearly',
  true,
  false
);

-- Verify plans were created
SELECT type, interval, COUNT(*) as count, MIN(price) as min_price, MAX(price) as max_price
FROM public.plans
WHERE type IN ('streaming', 'ads', 'microsite') AND active = true
GROUP BY type, interval
ORDER BY type, interval;
