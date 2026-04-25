const SECURITY_CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://api.open-meteo.com https://api.allorigins.win https://api.codetabs.com; font-src 'self' data:; media-src 'self' https: http: blob:; worker-src 'self' blob:; manifest-src 'self'; form-action 'self'"

function setSecurityHeaders(res) {
  res.setHeader('Content-Security-Policy', SECURITY_CSP)
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
}

export default async function handler(req, res) {
  try {
    setSecurityHeaders(res)
    const url = req.query.url
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Missing url' })
      return
    }
    const allowed = [
      'https://www.lamananaonline.com.ar/feed/',
      'https://diarioformosa.net/feed/',
      'https://www.expresdiario.com.ar/feed/',
      'https://tn.com.ar/rss',
      'https://www.infobae.com/arc/outboundfeeds/rss/?outputType=xml',
      'https://www.pagina12.com.ar/rss/portada'
    ]
    if (!allowed.includes(url)) {
      res.status(403).json({ error: 'URL not allowed' })
      return
    }
    const r = await fetch(url)
    if (!r.ok) {
      res.status(r.status).json({ error: `Upstream ${r.status}` })
      return
    }
    const text = await r.text()
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.status(200).send(text)
  } catch (e) {
    setSecurityHeaders(res)
    res.status(500).json({ error: 'Proxy fetch failed' })
  }
}
