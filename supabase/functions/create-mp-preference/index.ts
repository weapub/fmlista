import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type RequestBody = {
  planId?: string
  invoiceId?: string
  radioId?: string
  description?: string
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

function getBaseUrl(req: Request) {
  const envBaseUrl = Deno.env.get("SITE_URL") || Deno.env.get("PUBLIC_SITE_URL")
  if (envBaseUrl) return envBaseUrl.replace(/\/$/, "")

  const origin = req.headers.get("origin")
  if (origin) return origin.replace(/\/$/, "")

  const referer = req.headers.get("referer")
  if (referer) return new URL(referer).origin

  return "http://localhost:5173"
}

async function getAuthenticatedUser(
  supabase: ReturnType<typeof createClient>,
  req: Request,
) {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return { user: null, role: null }

  const token = authHeader.replace(/^Bearer\s+/i, "")
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) return { user: null, role: null }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  return { user, role: profile?.role ?? null }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN") ?? ""

    if (!supabaseUrl || !supabaseServiceRoleKey || !mpAccessToken) {
      return jsonResponse({ error: "Missing required environment variables" }, 500)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const body = (await req.json()) as RequestBody
    const { planId, invoiceId, radioId } = body

    if (!planId && !invoiceId) {
      return jsonResponse({ error: "planId or invoiceId is required" }, 400)
    }

    const baseUrl = getBaseUrl(req)
    const notificationUrl = `${supabaseUrl}/functions/v1/payment-webhook`
    const { user, role } = await getAuthenticatedUser(supabase, req)
    const isSuperAdmin = role === "super_admin"

    let preferencePayload: Record<string, unknown>

    if (invoiceId) {
      if (!user) {
        return jsonResponse({ error: "Authentication required" }, 401)
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select(`
          id,
          amount,
          currency,
          status,
          notes,
          radio_id,
          radios (
            name,
            user_id
          )
        `)
        .eq("id", invoiceId)
        .single()

      if (invoiceError || !invoice) {
        return jsonResponse({ error: "Invoice not found" }, 404)
      }

      const invoiceRadio = Array.isArray(invoice.radios) ? invoice.radios[0] : invoice.radios
      if (!isSuperAdmin && invoiceRadio?.user_id !== user.id) {
        return jsonResponse({ error: "Invoice does not belong to the authenticated user" }, 403)
      }

      if (invoice.status === "paid") {
        return jsonResponse({ error: "Invoice is already paid" }, 409)
      }

      if (Number(invoice.amount) <= 0) {
        return jsonResponse({ error: "Invoice amount must be greater than zero" }, 400)
      }

      const externalReference = {
        invoiceId: invoice.id,
        radioId: invoice.radio_id,
        userId: invoiceRadio?.user_id ?? user.id,
      }

      preferencePayload = {
        items: [
          {
            title: body.description || `Pago de factura - ${invoiceRadio?.name || "FM Lista"}`,
            description: invoice.notes || body.description || "Pago de factura",
            quantity: 1,
            currency_id: invoice.currency || "ARS",
            unit_price: Number(invoice.amount),
          },
        ],
        external_reference: JSON.stringify(externalReference),
        notification_url: notificationUrl,
        back_urls: {
          success: `${baseUrl}/admin/payments?status=payment_success`,
          failure: `${baseUrl}/admin/payments?status=payment_error`,
          pending: `${baseUrl}/admin/payments?status=payment_pending`,
        },
        auto_return: "approved",
        metadata: externalReference,
        payer: user.email ? { email: user.email } : undefined,
      }
    } else {
      if (!planId) {
        return jsonResponse({ error: "planId is required" }, 400)
      }

      if (!user) {
        return jsonResponse({ error: "Authentication required" }, 401)
      }

      const [{ data: plan, error: planError }, { data: userRadios }] = await Promise.all([
        supabase
          .from("plans")
          .select("id, name, price, currency, interval, type, active")
          .eq("id", planId)
          .single(),
        supabase
          .from("radios")
          .select("id, name, user_id")
          .eq("user_id", user.id),
      ])

      if (planError || !plan || !plan.active) {
        return jsonResponse({ error: "Plan not found" }, 404)
      }

      if (Number(plan.price) <= 0) {
        return jsonResponse({ error: "Plan price must be greater than zero" }, 400)
      }

      let selectedRadio = null

      if (radioId) {
        const { data: radio, error: radioError } = await supabase
          .from("radios")
          .select("id, name, user_id")
          .eq("id", radioId)
          .maybeSingle()

        if (radioError || !radio) {
          return jsonResponse({ error: "Radio not found" }, 404)
        }

        if (!isSuperAdmin && radio.user_id !== user.id) {
          return jsonResponse({ error: "Radio does not belong to the authenticated user" }, 403)
        }

        selectedRadio = radio
      } else if ((userRadios ?? []).length === 1) {
        selectedRadio = userRadios?.[0] ?? null
      } else if ((userRadios ?? []).length > 1) {
        return jsonResponse({ error: "radioId is required when the user has multiple radios" }, 400)
      }

      if (!selectedRadio) {
        return jsonResponse({ error: "No radio available for this subscription" }, 400)
      }

      const intervalLabel = plan.interval === "yearly" ? "anual" : "mensual"
      const externalReference = {
        userId: user.id,
        planId: plan.id,
        radioId: selectedRadio.id,
      }

      preferencePayload = {
        items: [
          {
            title: body.description || plan.name,
            description: `${plan.name} - Suscripcion ${intervalLabel}`,
            quantity: 1,
            currency_id: plan.currency || "ARS",
            unit_price: Number(plan.price),
          },
        ],
        external_reference: JSON.stringify(externalReference),
        notification_url: notificationUrl,
        back_urls: {
          success: `${baseUrl}/planes?status=payment_success`,
          failure: `${baseUrl}/planes?status=payment_error`,
          pending: `${baseUrl}/planes?status=payment_pending`,
        },
        auto_return: "approved",
        metadata: externalReference,
        payer: user.email ? { email: user.email } : undefined,
      }
    }

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(preferencePayload),
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error("Mercado Pago preference creation failed:", mpData)
      return jsonResponse(
        { error: "Failed to create Mercado Pago preference", details: mpData },
        502,
      )
    }

    return jsonResponse({
      id: mpData.id,
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("create-mp-preference error:", message)
    return jsonResponse({ error: message }, 400)
  }
})
