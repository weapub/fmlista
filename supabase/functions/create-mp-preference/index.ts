import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Inicializar cliente de Supabase con el token del usuario para validar identidad
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')!
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // 1. Obtener y validar al usuario
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('No autorizado')

    // 2. Parsear el cuerpo de la petición
    const { planId } = await req.json()

    // 3. Buscar el plan en la DB (para asegurar que el precio es el real)
    const { data: plan, error: planError } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) throw new Error('El plan seleccionado no existe o no está activo')

    // 4. Configurar Mercado Pago
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpAccessToken) throw new Error('Token de Mercado Pago no configurado')

    // 5. Crear la preferencia de pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: plan.id,
            title: `Suscripción: ${plan.name}`,
            description: plan.description,
            quantity: 1,
            unit_price: plan.price,
            currency_id: plan.currency || 'ARS',
          },
        ],
        payer: {
          email: user.email,
        },
        back_urls: {
          success: `${req.headers.get('origin')}/admin?status=payment_success`,
          failure: `${req.headers.get('origin')}/planes?status=payment_error`,
          pending: `${req.headers.get('origin')}/admin?status=payment_pending`,
        },
        auto_return: 'approved',
        // Referencia externa para que el Webhook sepa a quién activar el servicio
        external_reference: JSON.stringify({ userId: user.id, planId: plan.id }),
        // URL de notificación (Webhook) - Deberás crear otra función para esto
        notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      }),
    })

    const preference = await response.json()

    if (!response.ok) throw new Error(preference.message || 'Error al crear preferencia')

    return new Response(
      JSON.stringify({ init_point: preference.init_point }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})