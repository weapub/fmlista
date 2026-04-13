-- SQL to insert Microsite Plans
-- Updated: 2026-04-13

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
