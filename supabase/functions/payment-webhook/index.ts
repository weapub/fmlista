import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type PaymentReference = {
  invoiceId?: string
  planId?: string
  radioId?: string
  userId?: string
}

type MercadoPagoWebhookBody = {
  type?: string
  action?: string
  data?: {
    id?: string | number
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  })
}

async function parseWebhookPayload(req: Request) {
  const clonedReq = req.clone()
  let body: MercadoPagoWebhookBody | null = null

  try {
    body = (await clonedReq.json()) as MercadoPagoWebhookBody
  } catch {
    body = null
  }

  const url = new URL(req.url)
  const topic =
    url.searchParams.get("topic") ||
    url.searchParams.get("type") ||
    body?.type ||
    body?.action?.split(".")[0] ||
    null

  const idFromBody = body?.data?.id ? String(body.data.id) : null
  const id =
    url.searchParams.get("id") ||
    url.searchParams.get("data.id") ||
    idFromBody

  return { topic, id, body }
}

async function validateSignature(secret: string, xSignature: string, id: string): Promise<boolean> {
  try {
    const parts = xSignature.split(",")
    const ts = parts.find((part) => part.startsWith("ts="))?.split("=")[1]
    const receivedHash = parts.find((part) => part.startsWith("v1="))?.split("=")[1]

    if (!ts || !receivedHash) return false

    const manifest = `id:${id};ts:${ts};`
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    )

    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest))
    const generatedHash = Array.from(new Uint8Array(signature))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")

    return generatedHash === receivedHash
  } catch (error) {
    console.error("Error validating Mercado Pago signature:", error)
    return false
  }
}

async function applyPlanSubscriptionUpdate(
  supabaseClient: ReturnType<typeof createClient>,
  ref: PaymentReference,
  paymentId: string,
) {
  if (!ref.planId) return
  if (!ref.radioId) {
    throw new Error("Missing radioId for subscription update")
  }

  const { data: plan } = await supabaseClient
    .from("plans")
    .select("interval")
    .eq("id", ref.planId)
    .maybeSingle()

  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + (plan?.interval === "yearly" ? 365 : 30))

  const { error } = await supabaseClient
    .from("subscriptions")
    .upsert(
      {
        radio_id: ref.radioId,
        user_id: ref.userId ?? null,
        plan_id: ref.planId,
        status: "active",
        mp_payment_id: paymentId,
        current_period_end: nextDate.toISOString(),
        next_billing_date: nextDate.toISOString(),
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "radio_id" },
    )

  if (error) throw error
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN") ?? ""
    const mpWebhookSecret = Deno.env.get("MP_WEBHOOK_SECRET") ?? ""

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const { topic, id, body } = await parseWebhookPayload(req)
    const xSignature = req.headers.get("x-signature")

    if (topic !== "payment" || !id) {
      console.log("Webhook ignored", { topic, body })
      return jsonResponse({ received: true, ignored: true })
    }

    if (mpWebhookSecret && !xSignature) {
      return jsonResponse({ error: "Missing signature" }, 401)
    }

    if (mpWebhookSecret && xSignature) {
      const isValid = await validateSignature(mpWebhookSecret, xSignature, id)
      if (!isValid) {
        return jsonResponse({ error: "Invalid signature" }, 401)
      }
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    })

    if (!mpResponse.ok) throw new Error("Error al consultar pago en MP")
    const payment = await mpResponse.json()

    let paymentReference: PaymentReference = {}
    try {
      paymentReference = JSON.parse(payment.external_reference || "{}")
    } catch {
      paymentReference = {}
    }

    if (!paymentReference.invoiceId && payment.metadata?.invoiceId) {
      paymentReference.invoiceId = String(payment.metadata.invoiceId)
    }
    if (!paymentReference.planId && payment.metadata?.planId) {
      paymentReference.planId = String(payment.metadata.planId)
    }
    if (!paymentReference.radioId && payment.metadata?.radioId) {
      paymentReference.radioId = String(payment.metadata.radioId)
    }
    if (!paymentReference.userId && payment.metadata?.userId) {
      paymentReference.userId = String(payment.metadata.userId)
    }

    if (payment.status === "approved") {
      const { data: existingEvent } = await supabaseClient
        .from("payment_events")
        .select("id")
        .eq("payment_id", id)
        .maybeSingle()

      if (existingEvent) {
        return jsonResponse({ received: true, already_processed: true })
      }

      if (paymentReference.invoiceId) {
        const paidAt = new Date().toISOString()
        const { data: invoice, error: invoiceError } = await supabaseClient
          .from("invoices")
          .update({
            status: "paid",
            paid_at: paidAt,
            notes: paymentReference.invoiceId
              ? `Pagado via MP (ID: ${id})`
              : null,
          })
          .neq("status", "paid")
          .eq("id", paymentReference.invoiceId)
          .select("radio_id, notes")
          .maybeSingle()

        if (invoiceError) throw invoiceError

        if (!invoice) {
          return jsonResponse({ received: true, already_processed: true })
        }

        if (invoice.notes) {
          const invoiceNotes = `${invoice.notes}\nPagado via MP (ID: ${id})`
          const { error: notesError } = await supabaseClient
            .from("invoices")
            .update({ notes: invoiceNotes })
            .eq("id", paymentReference.invoiceId)

          if (notesError) throw notesError
        }

        paymentReference.radioId = paymentReference.radioId || invoice?.radio_id || undefined
      }

      await applyPlanSubscriptionUpdate(supabaseClient, paymentReference, id)

      const { error: eventInsertError } = await supabaseClient.from("payment_events").insert({
        payment_id: id,
        topic,
        status: payment.status,
        invoice_id: paymentReference.invoiceId ?? null,
        plan_id: paymentReference.planId ?? null,
        radio_id: paymentReference.radioId ?? null,
        user_id: paymentReference.userId ?? null,
        raw_payload: payment,
      })

      if (eventInsertError && !("code" in eventInsertError && eventInsertError.code === "23505")) {
        throw eventInsertError
      }

      console.log("Pago aprobado procesado", {
        paymentId: id,
        invoiceId: paymentReference.invoiceId ?? null,
        planId: paymentReference.planId ?? null,
        radioId: paymentReference.radioId ?? null,
      })
    }

    return jsonResponse({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Webhook Error:", message)
    return jsonResponse({ error: message }, 400)
  }
})
