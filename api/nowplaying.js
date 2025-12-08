export default async function handler(req, res) {
  try {
    const stream = req.query.stream
    if (!stream || typeof stream !== 'string') {
      res.status(400).json({ error: 'Missing stream' })
      return
    }
    const u = new URL(stream)
    const origin = `${u.protocol}//${u.host}`
    const mount = u.pathname.replace(/;$/, '') // Clean trailing ; for metadata lookup
    const candidates = [
      `${origin}/status-json.xsl`,
      `${origin}/status.xsl`,
      `${origin}${mount}/currentsong`,
      `${origin}/currentsong`,
    ]
    let title = ''
    for (const url of candidates) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000)
        const r = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)
        
        if (!r.ok) continue
        
        const contentType = r.headers.get('content-type') || ''
        if (contentType.includes('audio/') || contentType.includes('video/') || contentType.includes('application/ogg')) {
          continue
        }

        const text = await r.text()
        // Try Icecast JSON
        if (url.endsWith('status-json.xsl')) {
          try {
            const json = JSON.parse(text)
            const src = json.icestats?.source
            if (Array.isArray(src)) {
              const match = src.find(s => s.listenurl?.includes(mount) || s.server_name)
              title = match?.title || match?.server_name || ''
            } else if (src) {
              title = src.title || src.server_name || ''
            }
          } catch {}
        } else if (url.includes('currentsong')) {
          title = text.trim()
        } else if (url.endsWith('status.xsl')) {
          // Parse minimal HTML title
          const m = text.match(/Current Song:\s*<[^>]*>([^<]+)<\/[^>]*>/i) || text.match(/Stream Title:\s*([^\n<]+)/i)
          title = (m && m[1]?.trim()) || ''
        }
        if (title) break
      } catch {}
    }
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30')
    res.status(200).json({ title })
  } catch (e) {
    res.status(500).json({ error: 'Failed to resolve now playing' })
  }
}

