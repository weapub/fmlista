export default async function handler(req, res) {
  try {
    const url = req.query.url
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Missing url' })
      return
    }
    const allowed = [
      'https://www.lamananaonline.com.ar/feed/',
      'https://diarioformosa.net/feed/',
      'https://www.expresdiario.com.ar/feed/'
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
    res.status(500).json({ error: 'Proxy fetch failed' })
  }
}

