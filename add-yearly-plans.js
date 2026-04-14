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
import 'dotenv/config';

// Obtener credenciales
const supabaseUrl = process.env.SUPABASE_URL;
// Priorizar SERVICE_ROLE_KEY para operaciones de limpieza (Delete)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const yearlyPlans = [
  {
    name: 'Streaming Básico',
    type: 'streaming',
    price: 48000,
    currency: 'ARS',
    description: 'Perfecto para radios que están arrancando o quieren migrar a digital sin complicaciones.',
    features: ['Streaming de audio HD', 'Hasta 50 oyentes simultáneos', 'Player embebible en tu web', 'Estadísticas básicas de audiencia', '– Streaming de video', '– Soporte prioritario'],
    interval: 'yearly',
    active: true,
    is_featured: false,
  },
  {
    name: 'Streaming Profesional',
    type: 'streaming',
    price: 76800, // $8.000/mes - 20%
    currency: 'ARS',
    description: 'Para radios establecidas que quieren crecer, con video y herramientas avanzadas.',
    features: ['Todo lo del plan Básico', 'Oyentes ilimitados', 'Streaming de video HD', 'App Android personalizada', 'Panel de estadísticas avanzado', 'Soporte prioritario 24/7'],
    interval: 'yearly',
    active: true,
    is_featured: true,
  },
  {
    name: 'Streaming Full',
    type: 'streaming',
    price: 115200,
    currency: 'ARS',
    description: 'La experiencia definitiva para tu radio con soporte VIP y máxima calidad.',
    features: ['Todo lo del plan Pro', 'Calidad de audio 320kbps', 'App Android + iOS', 'Grabación de programas', 'Soporte VIP dedicado', 'Hosting de archivos 50GB'],
    interval: 'yearly',
    active: true,
    is_featured: false,
  },
  {
    name: 'Publicidad Home',
    type: 'ads',
    price: 144000,
    currency: 'ARS',
    description: 'Tu aviso en la pantalla principal, visto por todos los usuarios.',
    features: ['Banner en pantalla de inicio', 'Posición superior destacada', 'Rotación garantizada', 'Estadísticas de clics'],
    interval: 'yearly',
    active: true,
    is_featured: false,
  },
  {
    name: 'Publicidad Premium Radio',
    type: 'ads',
    price: 28800,
    currency: 'ARS',
    description: 'Patrociná directamente una radio y conectá con su audiencia fiel.',
    features: ['Logo en micrositio de la radio', 'Menciones automáticas al aire', 'Audiencia segmentada', 'Métricas de engagement'],
    interval: 'yearly',
    active: true,
    is_featured: false,
  },
  {
    name: 'Publicidad Exclusiva',
    type: 'ads',
    price: 336000,
    currency: 'ARS',
    description: 'Ocupá el 100% del espacio publicitario. Sin competencia, máxima visibilidad.',
    features: ['100% de exclusividad mensual', 'Notificaciones push a usuarios', 'Reporte detallado de impacto', 'Diseño de banner incluido'],
    interval: 'yearly',
    active: true,
    is_featured: false,
  },
  {
    name: 'Microsite Básico',
    type: 'microsite',
    price: 19200,
    currency: 'ARS',
    description: 'Presencia digital lista para usar. Ideal para mostrar lo esencial.',
    features: ['Página dentro de FM Lista', 'Logo, redes y descripción', 'Player integrado', 'Grilla de programación'],
    interval: 'yearly',
    active: true,
    is_featured: false,
  },
  {
    name: 'Micrositio Profesional',
    type: 'microsite',
    price: 43200,
    currency: 'ARS',
    description: 'Todo lo que tu radio necesita para destacarse y fidelizar oyentes.',
    features: ['Todo del plan Básico', 'Sección de noticias propias', 'Galería de fotos y videos', 'Formulario de contacto', 'Botón de WhatsApp flotante'],
    interval: 'yearly',
    active: true,
    is_featured: true,
  },
  {
    name: 'Micrositio Full',
    type: 'microsite',
    price: 76800,
    currency: 'ARS',
    description: 'La experiencia completa. Tu radio con su propia identidad digital.',
    features: ['Todo del plan Pro', 'Diseño 100% personalizado', 'Dominio propio .com.ar', 'Analytics avanzado', 'Sin anuncios de terceros'],
    interval: 'yearly',
    active: true,
    is_featured: false,
  },
];

async function addYearlyPlans() {
  try {
    console.log('🔄 Generando planes mensuales automáticamente...');
    
    // Generamos los planes mensuales basados en la fórmula: (anual / 0.8 / 12)
    const allPlans = [];
    yearlyPlans.forEach(plan => {
      allPlans.push(plan); // Mantener el plan anual original
      
      const monthlyPrice = Math.round((plan.price / 0.8) / 12);
      allPlans.push({
        ...plan,
        price: monthlyPrice,
        interval: 'monthly'
      });
    });

    console.log('🗑️ Limpiando planes existentes en Supabase...');
    
    // Eliminamos todos los registros actuales para asegurar una sincronización limpia
    const { error: deleteError } = await supabase
      .from('plans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Condición para borrar todo

    if (deleteError) {
      console.error('❌ Error al limpiar planes:', deleteError.message);
      process.exit(1);
    }

    console.log('📤 Insertando nuevos planes en Supabase...\n');

    const insertedData = [];
    const total = allPlans.length;

    for (let i = 0; i < total; i++) {
      const plan = allPlans[i];
      // Mostrar contador de progreso en tiempo real
      process.stdout.write(`   [${i + 1}/${total}] Sincronizando: ${plan.name} (${plan.interval})... `);
      
      const { data, error } = await supabase
        .from('plans')
        .insert(plan)
        .select()
        .single();

      if (error) {
        process.stdout.write('❌\n');
        console.error(`\n❌ Error al insertar el plan ${plan.name}:`, error.message);
        process.exit(1);
      }

      insertedData.push(data);
      process.stdout.write('✅\n');
    }

    console.log(`\n✅ ¡Sincronización finalizada! Se procesaron ${insertedData.length} planes:\n`);
    insertedData.forEach(plan => {
      console.log(`   • ${plan.name} (${plan.type}) - $${plan.price} ARS / ${plan.interval}`);
    });

    console.log('\n🎉 ¡Planes anuales listos! El toggle de periodicidad ya funciona.');
  } catch (err) {
    console.error('❌ Error inesperado:', err.message);
    process.exit(1);
  }
}

addYearlyPlans();
