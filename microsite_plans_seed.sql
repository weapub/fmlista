-- SQL to insert Microsite Plans
-- Run this in your Supabase SQL Editor

INSERT INTO public.plans (name, type, price, currency, description, features, interval, active)
VALUES 
(
  'Microsite Básico',
  'microsite',
  2000,
  'ARS',
  'Mejora la presencia de tu radio con un diseño personalizado básico.',
  ARRAY['Personalización de colores', 'Banner de cabecera propio', 'Enlaces a redes sociales destacados', 'Soporte por email'],
  'monthly',
  true
),
(
  'Microsite Profesional',
  'microsite',
  4500,
  'ARS',
  'Todo lo necesario para una imagen profesional y atractiva.',
  ARRAY['Todo lo del plan Básico', 'Galería de fotos (hasta 20)', 'Sección de programación semanal', 'Botón de WhatsApp flotante', 'Soporte prioritario'],
  'monthly',
  true
),
(
  'Microsite Full',
  'microsite',
  8000,
  'ARS',
  'La experiencia definitiva para tus oyentes con todas las funciones.',
  ARRAY['Todo lo del plan Profesional', 'Blog de noticias integrado', 'Integración chat en vivo', 'Analytics avanzados de visitas', 'Dominio personalizado (.com.ar)'],
  'monthly',
  true
);
