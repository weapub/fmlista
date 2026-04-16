import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jfztzmfywnmitrcsuzca.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmenR6bWZ5d25taXRyY3N1emNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzA5ODYsImV4cCI6MjA4MDc0Njk4Nn0.npXWMVy41SFsOk5h0Sl0BI4ltvX4MLO3bg1yKsfoAT8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const RESERVED_SLUGS = new Set([
  'admin',
  'login',
  'planes',
  'library',
  'api',
])

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getProtocol(req) {
  const forwarded = req.headers['x-forwarded-proto']
  if (typeof forwarded === 'string') return forwarded.split(',')[0]
  return 'https'
}

function getHost(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'fmlista.com'
  return Array.isArray(host) ? host[0] : host
}

function getBaseUrl(req) {
  return `${getProtocol(req)}://${getHost(req)}`
}

function getPath(req) {
  const path = req.query.path
  if (Array.isArray(path)) return path[0] || '/'
  return path || '/'
}

function getSubdomain(host) {
  const normalizedHost = (host || '').split(':')[0].toLowerCase()
  const parts = normalizedHost.split('.')

  if (
    normalizedHost === 'localhost' ||
    normalizedHost.startsWith('localhost.') ||
    parts.length < 3
  ) {
    return null
  }

  const candidate = parts[0]
  if (!candidate || candidate === 'www' || RESERVED_SLUGS.has(candidate)) {
    return null
  }

  return candidate
}

function toAbsoluteUrl(baseUrl, value) {
  if (!value) return `${baseUrl}/apple-touch-icon.png`
  if (/^https?:\/\//i.test(value)) return value
  return new URL(value, baseUrl).toString()
}

function buildHomeSeo(baseUrl) {
  return {
    title: 'FM Lista | Radios en vivo de Formosa',
    description:
      'Escucha radios en vivo de Formosa, descubre nuevas emisoras y accede a sus micrositios en un solo lugar.',
    image: `${baseUrl}/apple-touch-icon.png`,
    canonical: `${baseUrl}/`,
    type: 'website',
  }
}

function buildRadioSeo(baseUrl, radio, canonical) {
  const description =
    radio.description ||
    `Escucha ${radio.name} en vivo${radio.frequency ? ` en ${radio.frequency}` : ''}${radio.location ? ` desde ${radio.location}` : ''}.`
  const image = toAbsoluteUrl(baseUrl, radio.cover_url || radio.logo_url)

  return {
    title: `${radio.name} en vivo | ${radio.frequency || 'FM Lista'}`,
    description,
    image,
    canonical,
    type: 'website',
  }
}

function renderHtml({ title, description, image, canonical, type }) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="index,follow" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:site_name" content="FM Lista" />
    <meta property="og:locale" content="es_AR" />
    <meta property="og:type" content="${escapeHtml(type)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
  </head>
  <body>
    <main style="font-family: Arial, sans-serif; padding: 24px; color: #1f2937;">
      <h1 style="margin-bottom: 12px;">${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p style="margin-top: 16px;">
        <a href="${escapeHtml(canonical)}">Abrir sitio</a>
      </p>
    </main>
  </body>
</html>`
}

async function resolveRadioSeo(req, baseUrl, path) {
  const host = getHost(req)
  const subdomainSlug = getSubdomain(host)
  const pathname = path.startsWith('/') ? path : `/${path}`
  const segments = pathname.split('/').filter(Boolean)

  let radio = null
  let canonical = `${baseUrl}${pathname}`

  if (subdomainSlug) {
    const { data } = await supabase.from('radios').select('*').eq('slug', subdomainSlug).maybeSingle()
    radio = data
    canonical = `${baseUrl}/`
  } else if (segments[0] === 'radio' && segments[1]) {
    const { data } = await supabase.from('radios').select('*').eq('id', segments[1]).maybeSingle()
    radio = data
  } else if (segments[0] && !RESERVED_SLUGS.has(segments[0])) {
    const { data } = await supabase.from('radios').select('*').eq('slug', segments[0]).maybeSingle()
    radio = data
  }

  return radio ? buildRadioSeo(baseUrl, radio, canonical) : buildHomeSeo(baseUrl)
}

export default async function handler(req, res) {
  try {
    const baseUrl = getBaseUrl(req)
    const path = getPath(req)
    const seo = await resolveRadioSeo(req, baseUrl, path)

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(renderHtml(seo))
  } catch (error) {
    const fallback = buildHomeSeo(getBaseUrl(req))
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(renderHtml(fallback))
  }
}
