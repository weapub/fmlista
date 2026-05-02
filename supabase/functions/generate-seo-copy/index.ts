import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type RequestBody = {
  name?: string
  frequency?: string
  location?: string
  category?: string
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

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>,
) {
  return jsonResponse(
    {
      ok: false,
      code,
      error: message,
      ...details,
    },
    status,
  )
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
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
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY") ?? ""
    const openAiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini"

    if (!supabaseUrl || !supabaseServiceRoleKey || !openAiApiKey) {
      return errorResponse(
        "MISSING_ENV",
        "Missing required environment variables",
        500,
        {
          has_supabase_url: Boolean(supabaseUrl),
          has_service_role_key: Boolean(supabaseServiceRoleKey),
          has_openai_api_key: Boolean(openAiApiKey),
        },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const authHeader = req.headers.get("Authorization")

    if (!authHeader) {
      return errorResponse("AUTH_REQUIRED", "Authentication required", 401)
    }

    const token = authHeader.replace(/^Bearer\s+/i, "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return errorResponse("INVALID_TOKEN", "Invalid authentication token", 401, {
        auth_error: authError?.message ?? null,
      })
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile || !["radio_admin", "super_admin"].includes(profile.role)) {
      return errorResponse("FORBIDDEN_ROLE", "User role is not allowed for SEO generation", 403, {
        role: profile?.role ?? null,
        user_id: user.id,
      })
    }

    const body = (await req.json()) as RequestBody
    const name = (body.name || "").trim()

    if (!name) {
      return errorResponse("MISSING_NAME", "Radio name is required", 400)
    }

    const prompt = `
Eres un asistente SEO para micrositios de radios de Argentina.
Devuelve solo JSON valido con esta estructura exacta:
{
  "seo_title": "string",
  "seo_description": "string",
  "seo_keywords": ["string", "string", "..."]
}

Reglas:
- Idioma: español (Argentina).
- seo_title: max 60 caracteres, claro y orientado a busqueda.
- seo_description: entre 140 y 160 caracteres.
- seo_keywords: entre 8 y 12 keywords, sin hashtags.
- Incluye ciudad, frecuencia y categoria si existen.
- Evita frases genericas o repetitivas.

Datos de la radio:
- Nombre: ${name}
- Frecuencia: ${(body.frequency || "").trim() || "No especificada"}
- Ciudad: ${(body.location || "").trim() || "No especificada"}
- Categoria: ${(body.category || "").trim() || "No especificada"}
- Descripcion actual: ${(body.description || "").trim() || "No especificada"}
    `.trim()

    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openAiModel,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: "Responde solamente con JSON valido, sin markdown.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!openAiRes.ok) {
      const detailsText = await openAiRes.text()
      return errorResponse("OPENAI_REQUEST_FAILED", "OpenAI request failed", 502, {
        status: openAiRes.status,
        details: detailsText,
        model: openAiModel,
      })
    }

    const openAiData = await openAiRes.json()
    const rawContent = openAiData?.choices?.[0]?.message?.content

    if (!rawContent || typeof rawContent !== "string") {
      return errorResponse("OPENAI_INVALID_PAYLOAD", "Invalid OpenAI response payload", 502, {
        model: openAiModel,
      })
    }

    const parsed = safeJsonParse<{
      seo_title?: string
      seo_description?: string
      seo_keywords?: string[]
    }>(rawContent)

    if (!parsed) {
      return errorResponse("OPENAI_PARSE_FAILED", "Could not parse AI JSON response", 502, {
        raw_content: rawContent,
      })
    }

    const seoTitle = (parsed.seo_title || "").trim()
    const seoDescription = (parsed.seo_description || "").trim()
    const seoKeywords = Array.isArray(parsed.seo_keywords)
      ? parsed.seo_keywords.map((item) => String(item).trim()).filter(Boolean)
      : []

    return jsonResponse({
      ok: true,
      seo_title: seoTitle,
      seo_description: seoDescription,
      seo_keywords: seoKeywords,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return errorResponse("UNHANDLED_EXCEPTION", message, 500)
  }
})
