import React, { useEffect, useState, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

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
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        setLoading(true)
        if (import.meta.env.DEV) {
          // Mock data for dev to test layout
           const mockItems = Array(10).fill(0).map((_, i) => ({
             title: `Noticia de prueba ${i + 1} - Un titular lo suficientemente largo para probar el scroll horizontal`,
             link: `https://example.com/news/${i}`,
             pubDate: new Date().toISOString(),
             source: ['La Mañana', 'Diario Formosa', 'Expres Diario'][i % 3]
           }))
           setItems(mockItems)
           setLoading(false)
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
        setItems(uniq.slice(0, 15))
        setError(null)
      } catch (e) {
        setError('No se pudo cargar noticias en este momento')
      } finally {
        setLoading(false)
      }
    }
    fetchFeeds()
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (loading) {
    return (
      <div className="w-full h-12 bg-gray-100 rounded animate-pulse" />
    )
  }

  if (error) return null

  return (
    <>
      <div className="relative group bg-white border-y border-gray-200 py-2">
        <div className="container mx-auto px-4 flex items-center">
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded mr-3 uppercase tracking-wider whitespace-nowrap">
            Último Momento
          </span>
          
          <button 
            onClick={() => scroll('left')}
            className="p-1 hover:bg-gray-100 rounded-full mr-2 hidden md:block"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide flex items-center space-x-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {items.map((item, index) => (
              <button
                key={`${item.link}-${index}`}
                onClick={() => setSelectedUrl(item.link)}
                className="inline-flex items-center space-x-2 text-sm text-gray-700 hover:text-primary-600 transition-colors flex-shrink-0"
              >
                <span className="font-semibold text-primary-500 text-xs">[{item.source}]</span>
                <span>{item.title}</span>
              </button>
            ))}
          </div>

          <button 
            onClick={() => scroll('right')}
            className="p-1 hover:bg-gray-100 rounded-full ml-2 hidden md:block"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Internal Browser Modal */}
      {selectedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-white w-full h-full max-w-6xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-4 overflow-hidden">
                <button 
                  onClick={() => setSelectedUrl(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
                <div className="flex flex-col">
                  <h3 className="text-sm font-medium text-gray-900 truncate max-w-md">
                    {items.find(i => i.link === selectedUrl)?.title}
                  </h3>
                  <a 
                    href={selectedUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-primary-600 flex items-center space-x-1"
                  >
                    <span>{selectedUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="flex space-x-2">
                 <a 
                    href={selectedUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors hidden sm:block"
                  >
                    Abrir en navegador
                  </a>
              </div>
            </div>
            <div className="flex-1 bg-gray-100 relative">
               <iframe
                 src={selectedUrl}
                 className="w-full h-full border-0"
                 title="News Preview"
                 sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
               />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

