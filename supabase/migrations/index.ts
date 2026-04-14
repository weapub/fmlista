import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuración: Debes configurar estos Secretos en el dashboard de Supabase (Settings -> API -> Edge Functions)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 1. Calcular fecha objetivo: Suscripciones que vencen en los próximos 3 días
    const today = new Date()
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(today.getDate() + 3)
    
    // Buscamos suscripciones activas cuyo vencimiento se acerca
    const { data: expiringSubscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        next_billing_date,
        last_notification_date,
        radios (name, contact_email),
        plans (name, price)
      `)
      .eq('status', 'active')
      .lte('next_billing_date', threeDaysFromNow.toISOString())
      .filter('next_billing_date', 'gt', today.toISOString())

    if (error) throw error

    const results = []

    for (const sub of expiringSubscriptions || []) {
      // Evitar re-enviar si ya se notificó para este ciclo de facturación
      const alreadyNotified = sub.last_notification_date && 
        new Date(sub.last_notification_date) > new Date(new Date(sub.next_billing_date).getTime() - (7 * 24 * 60 * 60 * 1000))

      if (alreadyNotified) continue;

      const email = sub.radios?.contact_email
      if (!email) continue

      // 2. Enviar Email vía Resend (o el proveedor que prefieras)
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Administración FM Lista <cobros@fmlista.com.ar>',
          to: [email],
          subject: `Recordatorio de pago: ${sub.radios?.name}`,
          html: `
            <h2>¡Hola ${sub.radios?.name}!</h2>
            <p>Te recordamos que tu suscripción al plan <strong>${sub.plans?.name}</strong> vence pronto.</p>
            <p><strong>Fecha de vencimiento:</strong> ${new Date(sub.next_billing_date).toLocaleDateString('es-AR')}</p>
            <p><strong>Monto:</strong> $${sub.plans?.price}</p>
            <p>Podés abonar mediante transferencia o desde tu panel administrativo para evitar interrupciones en el servicio.</p>
            <p>¡Gracias por elegir FM Lista!</p>
          `,
        }),
      })

      if (res.ok) {
        // 3. Registrar la fecha de notificación para no repetir el proceso hoy
        await supabase
          .from('subscriptions')
          .update({ last_notification_date: new Date().toISOString() })
          .eq('id', sub.id)
        
        results.push({ id: sub.id, status: 'sent' })
      }
    }

    return new Response(JSON.stringify({ processed: results.length }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})