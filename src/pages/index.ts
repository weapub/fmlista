import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function validateSignature(secret: string, xSignature: string, id: string): Promise<boolean> {
  try {
    const parts = xSignature.split(',')
    const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1]
    const receivedHash = parts.find(p => p.startsWith('v1='))?.split('=')[1]

    if (!ts || !receivedHash) return false

    const manifest = `id:${id};ts:${ts};`
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )

    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest))
    const generatedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    console.log(`🔍 Firma MP - Recibida: ${receivedHash.substring(0, 8)}... vs Generada: ${generatedHash.substring(0, 8)}...`)
    
    return generatedHash === receivedHash
  } catch (e) {
    console.error('❌ Error validando firma:', e)
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
    const mpWebhookSecret = Deno.env.get('MP_WEBHOOK_SECRET') ?? ''

    // Usamos el service_role_key para saltar las reglas RLS y actualizar el estado del usuario
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    // --- VALIDACIÓN DE FIRMA ---
    const xSignature = req.headers.get('x-signature')

    if (mpWebhookSecret && xSignature && id) {
      const isValid = await validateSignature(mpWebhookSecret, xSignature, id)
      if (!isValid) {
        console.error('❌ Firma de Mercado Pago inválida')
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    if (topic === 'payment') {
      // 1. Obtener detalles del pago desde Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { 'Authorization': `Bearer ${mpAccessToken}` }
      })

      if (!mpResponse.ok) throw new Error('Error al consultar pago en MP')
      const payment = await mpResponse.json()

      // 2. Extraer metadatos con seguridad
      let userId, planId;
      try {
        ({ userId, planId } = JSON.parse(payment.external_reference));
      } catch (e) {
        throw new Error('Metadatos de pago inválidos o faltantes');
      }

      // 3. Si el pago está aprobado, activar suscripción
      if (payment.status === 'approved') {
        // Obtener el plan para determinar la duración (30 días vs 365 días)
        const { data: plan } = await supabaseClient.from('plans').select('interval').eq('id', planId).single();
        
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + (plan?.interval === 'yearly' ? 365 : 30));

        const { error: subError } = await supabaseClient
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            mp_payment_id: id,
            current_period_end: expirationDate.toISOString(),
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