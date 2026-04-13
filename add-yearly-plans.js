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
    features: ['Streaming de audio HD', 'Hasta 50 oyentes simultáneos', 'Player embebible', 'Estadísticas básicas', '– Streaming de video', '– Soporte prioritario', '– App Android incluida', '– Estadísticas avanzadas', '– Oyentes ilimitados', '– Grabación de programas', '– App iOS'],
    interval: 'yearly',
    active: true,
  },
  {
    name: 'Streaming Pro',
    type: 'streaming',
    price: 76800,
    currency: 'ARS',
    description: 'La opción equilibrada para emisoras en crecimiento con App propia.',
    features: ['Todo lo del plan Básico', 'Streaming en HD AAC+', 'Hasta 500 oyentes', 'App Android incluida', 'Estadísticas avanzadas', 'Soporte prioritario', '– Streaming de video', '– Oyentes ilimitados', '– Grabación de programas', '– App iOS'],
    interval: 'yearly',
    active: true,
    is_featured: true,
  },
  {
    name: 'Streaming Full',
    type: 'streaming',
    price: 115200,
    currency: 'ARS',
    description: 'La experiencia completa para tu radio con video y soporte VIP.',
    features: ['Todo lo del plan Pro', 'Oyentes ilimitados', 'Streaming de video HD', 'App Android + iOS', 'Grabación de programas', 'Soporte 24/7 VIP'],
    interval: 'yearly',
    active: true,
  },
  {
    name: 'Publicidad Home',
    type: 'ads',
    price: 144000,
    currency: 'ARS',
    description: 'Banner en página de inicio',
    features: ['Posición Top', 'Rotación garantizada', 'Reporte de clicks', '– Ubicación estratégica', '– Alta visibilidad', '– Reporte mensual', '– 100% de impresiones', '– Botón de acción directo', '– Reporte detallado'],
    interval: 'yearly',
    active: true,
  },
  {
    name: 'Banner Lateral / Player',
    type: 'ads',
    price: 96000,
    currency: 'ARS',
    description: 'Presencia constante en el reproductor y barra lateral.',
    features: ['Ubicación estratégica', 'Alta visibilidad', 'Reporte mensual', '– Posición Top', '– Rotación garantizada', '– Reporte de clicks', '– 100% de impresiones', '– Botón de acción directo', '– Reporte detallado'],
    interval: 'yearly',
    active: true,
  },
  {
    name: 'Pop-up de Bienvenida',
    type: 'ads',
    price: 192000,
    currency: 'ARS',
    description: 'Impacto total al abrir la plataforma o micrositio.',
    features: ['100% de impresiones', 'Botón de acción directo', 'Reporte detallado', '– Posición Top', '– Rotación garantizada', '– Reporte de clicks', '– Ubicación estratégica', '– Alta visibilidad', '– Reporte mensual'],
    interval: 'yearly',
    active: true,
  },
  {
    name: 'Microsite Básico',
    type: 'microsite',
    price: 19200,
    currency: 'ARS',
    description: 'Mejora la presencia de tu radio con un diseño personalizado básico.',
    features: ['Personalización de colores', 'Banner de cabecera propio', 'Enlaces a redes sociales destacados', 'Soporte por email', '– Galería de fotos', '– Programación semanal', '– Botón de WhatsApp flotante', '– Blog de noticias', '– Integración chat en vivo', '– Analytics de visitas', '– Dominio personalizado (.com.ar)', '– Sube tus propias publicidades', '– Estadísticas avanzadas', '– Sin anuncios de terceros'],
    interval: 'yearly',
    active: true,
  },
  {
    name: 'Microsite Profesional',
    type: 'microsite',
    price: 43200,
    currency: 'ARS',
    description: 'Todo lo necesario para una imagen profesional y atractiva.',
    features: ['Todo lo del plan Básico', 'Galería de fotos (hasta 20)', 'Sección de programación semanal', 'Botón de WhatsApp flotante', 'Soporte prioritario', '– Blog de noticias', '– Integración chat en vivo', '– Analytics de visitas', '– Dominio personalizado (.com.ar)', '– Sube tus propias publicidades', '– Estadísticas avanzadas', '– Sin anuncios de terceros'],
    interval: 'yearly',
    active: true,
    is_featured: true,
  },
  {
    name: 'Microsite Full',
    type: 'microsite',
    price: 76800,
    currency: 'ARS',
    description: 'La experiencia definitiva para tus oyentes con todas las funciones.',
    features: ['Todo lo del plan Profesional', 'Blog de noticias integrado', 'Integración chat en vivo', 'Analytics avanzados de visitas', 'Dominio personalizado (.com.ar)', 'Sube tus propias publicidades', 'Estadísticas avanzadas', 'Sin anuncios de terceros', 'Soporte 24/7 VIP'],
    interval: 'yearly',
    active: true,
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
