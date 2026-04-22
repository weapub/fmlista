const AFIP_IMAGE_URL = 'https://www.afip.gob.ar/images/f960/DATAWEB.jpg'

const SECURITY_CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://api.open-meteo.com https://api.allorigins.win; font-src 'self' data:; media-src 'self' https: http: blob:; worker-src 'self' blob:; manifest-src 'self'; form-action 'self'"

function setSecurityHeaders(res) {
  res.setHeader('Content-Security-Policy', SECURITY_CSP)
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
}

export default async function handler(_req, res) {
  try {
    setSecurityHeaders(res)
    const upstream = await fetch(AFIP_IMAGE_URL)
    if (!upstream.ok) {
      res.status(upstream.status).end()
      return
    }

    const buffer = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
    res.status(200).send(buffer)
  } catch {
    setSecurityHeaders(res)
    res.status(500).end()
  }
}
