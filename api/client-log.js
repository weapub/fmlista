const SECURITY_CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com https://api.allorigins.win https://api.codetabs.com; font-src 'self' data:; media-src 'self' https: http: blob:; worker-src 'self' blob:; manifest-src 'self'; form-action 'self'"

function setSecurityHeaders(res) {
  res.setHeader('Content-Security-Policy', SECURITY_CSP)
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
}

export default async function handler(req, res) {
  setSecurityHeaders(res)

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const {
      source = 'unknown',
      message = 'Unknown client error',
      stack = '',
      url = '',
      userAgent = '',
      timestamp = '',
      metadata = {},
    } = req.body || {}

    // Centralized production log line (Vercel Runtime logs).
    console.error('[client-error]', {
      source,
      message,
      stack,
      url,
      userAgent,
      timestamp,
      metadata,
    })

    res.status(204).end()
  } catch (error) {
    console.error('[client-error-handler-failed]', error)
    res.status(500).json({ error: 'Failed to process client log' })
  }
}
