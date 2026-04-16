import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type ReminderRequest = {
  force?: boolean
  daysAhead?: number
}

type ReminderRecord = {
  id: string
  radio_id: string
  next_billing_date: string
  last_notification_date?: string | null
  status: string
  plans?: { name?: string | null; price?: number | string | null; currency?: string | null } | null
  radios?: { name?: string | null; contact_email?: string | null } | null
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

  return "http://localhost:5173"
}

async function getInvocationRole(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  serviceRoleKey: string,
) {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return { isServiceRole: false, role: null }

  const token = authHeader.replace(/^Bearer\s+/i, "")
  if (token === serviceRoleKey) {
    return { isServiceRole: true, role: "service_role" }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { isServiceRole: false, role: null }
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  return { isServiceRole: false, role: profile?.role ?? null }
}

function shouldSendReminder(
  record: ReminderRecord,
  daysAhead: number,
  force: boolean,
) {
  if (!record.next_billing_date) return false
  if (!["active", "past_due"].includes(record.status)) return false

  const dueDate = new Date(record.next_billing_date)
  const now = new Date()
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + daysAhead)

  if (Number.isNaN(dueDate.getTime())) return false
  if (dueDate > maxDate) return false

  if (force) return true

  if (!record.last_notification_date) return true

  const lastNotificationDate = new Date(record.last_notification_date)
  if (Number.isNaN(lastNotificationDate.getTime())) return true

  return lastNotificationDate.toDateString() !== now.toDateString()
}

function formatAmount(amount: number | string | null | undefined, currency?: string | null) {
  const value = Number(amount ?? 0)
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency || "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

function buildReminderEmail(record: ReminderRecord, baseUrl: string) {
  const radioName = record.radios?.name || "tu emisora"
  const planName = record.plans?.name || "Plan FM Lista"
  const dueDate = new Date(record.next_billing_date)
  const formattedDate = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(dueDate)
  const formattedAmount = formatAmount(record.plans?.price, record.plans?.currency)
  const paymentUrl = `${baseUrl}/admin/payments`
  const subject =
    record.status === "past_due"
      ? `Tu plan ${planName} tiene un pago vencido`
      : `Recordatorio de vencimiento de ${planName}`

  const text = [
    `Hola ${radioName},`,
    "",
    record.status === "past_due"
      ? `Tenemos registrado un pago vencido de tu ${planName}.`
      : `Te recordamos que el pago de tu ${planName} vence el ${formattedDate}.`,
    `Importe: ${formattedAmount}.`,
    "",
    `Podes revisar y abonar desde tu panel: ${paymentUrl}`,
    "",
    "Gracias por usar FM Lista.",
  ].join("\n")

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">Hola ${radioName}</h2>
      <p>
        ${
          record.status === "past_due"
            ? `Tenemos registrado un pago vencido de tu <strong>${planName}</strong>.`
            : `Te recordamos que el pago de tu <strong>${planName}</strong> vence el <strong>${formattedDate}</strong>.`
        }
      </p>
      <p><strong>Importe:</strong> ${formattedAmount}</p>
      <p>
        Podes revisar y abonar desde tu panel:
        <a href="${paymentUrl}" style="color: #4f46e5;">${paymentUrl}</a>
      </p>
      <p>Gracias por usar FM Lista.</p>
    </div>
  `

  return { subject, text, html }
}

async function sendEmail(
  resendApiKey: string,
  fromEmail: string,
  to: string,
  subject: string,
  html: string,
  text: string,
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html,
      text,
    }),
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "No se pudo enviar el email")
  }

  return payload
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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? ""
    const fromEmail = Deno.env.get("BILLING_FROM_EMAIL") ?? ""

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Missing Supabase environment variables" }, 500)
    }

    if (!resendApiKey || !fromEmail) {
      return jsonResponse(
        { error: "Missing email provider configuration", hint: "Configure RESEND_API_KEY and BILLING_FROM_EMAIL" },
        500,
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { isServiceRole, role } = await getInvocationRole(supabase, req, serviceRoleKey)

    if (!isServiceRole && role !== "super_admin") {
      return jsonResponse({ error: "Unauthorized" }, 401)
    }

    let body: ReminderRequest = {}
    try {
      body = (await req.json()) as ReminderRequest
    } catch {
      body = {}
    }

    const force = body.force === true
    const daysAhead = Math.max(0, Math.min(Number(body.daysAhead ?? 3), 30))
    const baseUrl = getBaseUrl(req)

    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        id,
        radio_id,
        next_billing_date,
        last_notification_date,
        status,
        radios (name, contact_email),
        plans (name, price, currency)
      `)
      .in("status", ["active", "past_due"])
      .not("next_billing_date", "is", null)
      .order("next_billing_date", { ascending: true })

    if (error) throw error

    const records = ((data ?? []) as ReminderRecord[]).filter((record) =>
      shouldSendReminder(record, daysAhead, force),
    )

    let processed = 0
    let sent = 0
    let skipped = 0
    const errors: Array<{ subscriptionId: string; email?: string | null; error: string }> = []

    for (const record of records) {
      processed += 1
      const email = record.radios?.contact_email?.trim()

      if (!email) {
        skipped += 1
        errors.push({
          subscriptionId: record.id,
          error: "La radio no tiene contact_email configurado",
        })
        continue
      }

      try {
        const { subject, html, text } = buildReminderEmail(record, baseUrl)
        await sendEmail(resendApiKey, fromEmail, email, subject, html, text)

        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({ last_notification_date: new Date().toISOString() })
          .eq("id", record.id)

        if (updateError) throw updateError

        sent += 1
      } catch (error) {
        skipped += 1
        errors.push({
          subscriptionId: record.id,
          email,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return jsonResponse({
      success: true,
      processed,
      sent,
      skipped,
      daysAhead,
      force,
      errors,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("send-billing-reminders error:", message)
    return jsonResponse({ error: message }, 400)
  }
})
