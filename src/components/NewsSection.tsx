import React, { useEffect, useState } from 'react'

interface NewsItem {
  title: string
  link: string
  pubDate?: string
  source?: string
}

const FEEDS = [
  { url: 'https://www.lamananaonline.com.ar/feed/', source: 'La Mañana' },
  { url: 'https://diarioformosa.net/feed/', source: 'Diario Formosa' },
  { url: 'https://www.expresdiario.com.ar/feed/', source: 'Expres Diario' }
]

async function fetchTextWithFallback(targetUrl: string): Promise<string> {
  const originless = targetUrl.replace(/^https?:\/\//, '')
  const candidates = [
    targetUrl,
    `https://r.jina.ai/http/${originless}`,
    `https://r.jina.ai/https/${originless}`,
    `https://cors.isomorphic-git.org/https://${originless}`,
  ]
  for (const u of candidates) {
    try {
      const res = await fetch(u, { cache: 'no-store' })
      if (res.ok) {
        return await res.text()
      }
    } catch {
      // ignore and try next
    }
  }
  return ''
}

export const NewsSection: React.FC = () => {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        setLoading(true)
        if (import.meta.env.DEV) {
          setError('Las noticias se muestran en producción')
          setItems([])
          return
        }
        const results = await Promise.allSettled(
          FEEDS.map(async (feed) => {
            try {
              const proxy = `/api/rss?url=${encodeURIComponent(feed.url)}`
              const text = await fetchTextWithFallback(proxy)
              if (!text) return [] as NewsItem[]
              const parser = new DOMParser()
              const xml = parser.parseFromString(text, 'application/xml')
              const rssItems = Array.from(xml.getElementsByTagName('item'))
              const atomEntries = Array.from(xml.getElementsByTagName('entry'))
              const nodes = rssItems.length ? rssItems : atomEntries
              return nodes.slice(0, 6).map((n) => {
                const title = n.getElementsByTagName('title')[0]?.textContent || ''
                let link = n.getElementsByTagName('link')[0]?.textContent || ''
                if (!link) {
                  const l = n.getElementsByTagName('link')[0]
                  link = l?.getAttribute('href') || ''
                }
                const pubDate =
                  n.getElementsByTagName('pubDate')[0]?.textContent ||
                  n.getElementsByTagName('updated')[0]?.textContent ||
                  n.getElementsByTagName('published')[0]?.textContent || ''
                return { title, link, pubDate, source: feed.source } as NewsItem
              })
            } catch {
              return [] as NewsItem[]
            }
          })
        )

        const merged: NewsItem[] = []
        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            merged.push(...r.value)
          }
        })
        const uniq = Array.from(new Map(merged.map(i => [i.link, i])).values())
        uniq.sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime())
        setItems(uniq.slice(0, 9))
        setError(null)
      } catch (e) {
        setError('No se pudo cargar noticias en este momento')
      } finally {
        setLoading(false)
      }
    }
    fetchFeeds()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse h-32" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <p className="text-red-600 mb-3">{error}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'La Mañana Online', link: 'https://www.lamananaonline.com.ar/' },
            { title: 'Diario Formosa', link: 'https://diarioformosa.net/' },
            { title: 'Expres Diario', link: 'https://www.expresdiario.com.ar/' }
          ].map((s) => (
            <a key={s.link} href={s.link} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <h3 className="text-gray-900 font-medium">{s.title}</h3>
              <p className="text-xs text-gray-500 mt-1">Abrir sitio</p>
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((item) => (
        <a
          key={item.link}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
        >
          <p className="text-sm text-gray-500 mb-1">{item.source}</p>
          <h3 className="text-gray-900 font-medium line-clamp-2">{item.title}</h3>
          {item.pubDate && (
            <p className="text-xs text-gray-400 mt-2">{new Date(item.pubDate).toLocaleString()}</p>
          )}
        </a>
      ))}
    </div>
  )
}

