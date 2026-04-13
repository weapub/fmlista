#!/usr/bin/env node

/**
 * Script para ejecutar planes anuales en Supabase
 * Uso: node add-yearly-plans.js
 * 
 * Requiere variables de entorno:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_KEY (o SUPABASE_ANON_KEY)
 */

import { createClient } from '@supabase/supabase-js';

// Obtener credenciales
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno SUPABASE_URL y SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const yearlyPlans = [
  {
    name: 'Plan Streaming Básico',
    type: 'streaming',
    price: 48000,
    currency: 'ARS',
    description: 'Audio MP3 128kbps',
    features: ['Oyentes ilimitados', 'AutoDJ 5GB', 'Estadísticas básicas', 'Soporte por email'],
    interval: 'yearly',
    active: true,
  },
  {
    name: 'Plan Streaming Pro',
    type: 'streaming',
    price: 76800,
    currency: 'ARS',
    description: 'Audio AAC+ 128kbps + App',
    features: ['Calidad HD AAC+', 'AutoDJ 15GB', 'App Android incluida', 'Soporte prioritario'],
    interval: 'yearly',
    active: true,
  },
  {
    name: 'Plan Publicidad Home',
    type: 'ads',
    price: 144000,
    currency: 'ARS',
    description: 'Banner en página de inicio',
    features: ['Posición Top', 'Rotación garantizada', 'Reporte de clicks'],
    interval: 'yearly',
    active: true,
  },
  {
    name: 'Suscripción Premium Radio',
    type: 'premium_feature',
    price: 28800,
    currency: 'ARS',
    description: 'Control total de tu micrositio',
    features: ['Sube tus propias publicidades', 'Estadísticas avanzadas', 'Sin anuncios de terceros'],
    interval: 'yearly',
    active: true,
  },
  {
    name: 'Microsite Básico',
    type: 'microsite',
    price: 19200,
    currency: 'ARS',
    description: 'Mejora la presencia de tu radio con un diseño personalizado básico.',
    features: ['Personalización de colores', 'Banner de cabecera propio', 'Enlaces a redes sociales destacados', 'Soporte por email'],
    interval: 'yearly',
    active: true,
  },
  {
    name: 'Microsite Profesional',
    type: 'microsite',
    price: 43200,
    currency: 'ARS',
    description: 'Todo lo necesario para una imagen profesional y atractiva.',
    features: ['Todo lo del plan Básico', 'Galería de fotos (hasta 20)', 'Sección de programación semanal', 'Botón de WhatsApp flotante', 'Soporte prioritario'],
    interval: 'yearly',
    active: true,
  },
  {
    name: 'Microsite Full',
    type: 'microsite',
    price: 76800,
    currency: 'ARS',
    description: 'La experiencia definitiva para tus oyentes con todas las funciones.',
    features: ['Todo lo del plan Profesional', 'Blog de noticias integrado', 'Integración chat en vivo', 'Analytics avanzados de visitas', 'Dominio personalizado (.com.ar)'],
    interval: 'yearly',
    active: true,
  },
];

async function addYearlyPlans() {
  try {
    console.log('📤 Insertando planes anuales en Supabase...\n');

    const { data, error } = await supabase
      .from('plans')
      .insert(yearlyPlans)
      .select();

    if (error) {
      console.error('❌ Error al insertar planes:', error.message);
      process.exit(1);
    }

    console.log(`✅ Se insertaron ${data.length} planes anuales exitosamente:\n`);
    data.forEach(plan => {
      console.log(`   • ${plan.name} (${plan.type}) - $${plan.price} ARS`);
    });

    console.log('\n🎉 ¡Planes anuales listos! El toggle de periodicidad ya funciona.');
  } catch (err) {
    console.error('❌ Error inesperado:', err.message);
    process.exit(1);
  }
}

addYearlyPlans();
