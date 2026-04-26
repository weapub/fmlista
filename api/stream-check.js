const SECURITY_CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com https://api.allorigins.win https://api.codetabs.com; font-src 'self' data:; media-src 'self' https: http: blob:; worker-src 'self' blob:; manifest-src 'self'; form-action 'self'"

const AUDIO_CONTENT_TYPE_HINTS = [
  'audio/',
  'application/vnd.apple.mpegurl',
  'application/x-mpegurl',
  'application/octet-stream',
]

function setSecurityHeaders(res) {
  res.setHeader('Content-Security-Policy', SECURITY_CSP)
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
}

function evaluateCompatibility({ contentType, status, protocol }) {
  const normalizedContentType = (contentType || '').toLowerCase()

  if (status >= 400) {
    return {
      compatibility: 'incompatible',
      summary: `El servidor del stream respondio con error HTTP ${status}.`,
    }
  }

  if (!AUDIO_CONTENT_TYPE_HINTS.some((hint) => normalizedContentType.includes(hint))) {
    if (normalizedContentType.includes('text/html')) {
      return {
        compatibility: 'incompatible',
        summary: 'La URL parece una pagina web y no un stream directo de audio.',
      }
    }

    return {
      compatibility: 'warning',
      summary: 'No pudimos confirmar el formato de audio. El stream podria fallar en algunos dispositivos.',
    }
  }

  if (protocol === 'http:') {
    return {
      compatibility: 'warning',
      summary: 'El stream responde, pero usa HTTP. En una web HTTPS puede bloquearse en iPhone/Chrome.',
    }
  }

  return {
    compatibility: 'compatible',
    summary: 'El stream parece compatible para navegadores modernos.',
  }
}

export default async function handler(req, res) {
  try {
    setSecurityHeaders(res)

    const rawUrl = req.query.url
    if (!rawUrl || typeof rawUrl !== 'string') {
      res.status(400).json({ error: 'Missing url' })
      return
    }

    let parsedUrl
    try {
      parsedUrl = new URL(rawUrl)
    } catch {
      res.status(400).json({ error: 'Invalid URL format' })
      return
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      res.status(400).json({ error: 'Unsupported protocol. Only HTTP/HTTPS allowed.' })
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 9000)

    let response
    try {
      response = await fetch(parsedUrl.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent': 'FMListaStreamCheck/1.0',
          'icy-metadata': '1',
          accept: '*/*',
        },
      })
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'name' in error && error.name === 'AbortError'
          ? 'Timeout al contactar el stream.'
          : 'No pudimos conectar con la URL del stream.'

      res.status(200).json({
        ok: false,
        compatibility: 'incompatible',
        summary: message,
        details: {
          url: parsedUrl.toString(),
        },
      })
      return
    } finally {
      clearTimeout(timeout)
    }

    const contentType = response.headers.get('content-type') || ''
    const status = response.status
    const finalUrl = response.url || parsedUrl.toString()
    const finalProtocol = (() => {
      try {
        return new URL(finalUrl).protocol
      } catch {
        return parsedUrl.protocol
      }
    })()

    const evaluation = evaluateCompatibility({
      contentType,
      status,
      protocol: finalProtocol,
    })

    res.status(200).json({
      ok: evaluation.compatibility !== 'incompatible',
      compatibility: evaluation.compatibility,
      summary: evaluation.summary,
      details: {
        status,
        contentType: contentType || 'desconocido',
        finalUrl,
        protocol: finalProtocol,
      },
    })
  } catch {
    setSecurityHeaders(res)
    res.status(500).json({ error: 'Stream check failed' })
  }
}
