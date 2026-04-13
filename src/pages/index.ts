import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN') ?? ''

    // Usamos el service_role_key para saltar las reglas RLS y actualizar el estado del usuario
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    if (topic === 'payment') {
      // 1. Obtener detalles del pago desde Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { 'Authorization': `Bearer ${mpAccessToken}` }
      })

      if (!mpResponse.ok) throw new Error('Error al consultar pago en MP')
      const payment = await mpResponse.json()

      // 2. Extraer metadatos (asociados en create-mp-preference)
      const { userId, planId } = JSON.parse(payment.external_reference)

      // 3. Si el pago está aprobado, activar suscripción
      if (payment.status === 'approved') {
        const { error: subError } = await supabaseClient
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            mp_payment_id: id,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })

        if (subError) throw subError
        
        console.log(`✅ Suscripción activada para el usuario: ${userId}`)
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    console.error('❌ Webhook Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})