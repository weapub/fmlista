import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense, useDeferredValue } from 'react'
import { Link } from 'react-router-dom'
import { Navigation } from '@/components/Navigation'
import { Hero } from '@/components/Hero'
import { AdBanner } from '@/components/AdBanner'
import { Footer } from '@/components/Footer'
import { RadioCardSkeleton } from '@/components/RadioCardSkeleton'
import { useRadioStore } from '@/stores/radioStore'
import { Radio } from '@/types/database'
import { useSeo } from '@/hooks/useSeo'
import { usePageTracking } from '@/hooks/usePageTracking'
import { fetchAppSettings, queryPublicTable } from '@/lib/publicSupabase'

const HomeSections = React.lazy(() => import('./HomeSections'))
const NewsSection = React.lazy(() => import('@/components/NewsSection').then((m) => ({ default: m.NewsSection })))
const WeatherSection = React.lazy(() => import('@/components/WeatherSection').then((m) => ({ default: m.WeatherSection })))
const RADIO_LIST_SELECT = 'id,name,slug,logo_url,cover_url,frequency,location,category,stream_url,created_at'

export const Home: React.FC = () => {
  const [radios, setRadios] = useState<Radio[]>([])
  const [favoriteRadios, setFavoriteRadios] = useState<Radio[]>([])
  const [recentRadios, setRecentRadios] = useState<Radio[]>([])
  const [trendingRadios, setTrendingRadios] = useState<Radio[]>([])
  const [trendingCategory, setTrendingCategory] = useState<string | null>(null)
  const [rankingLimit, setRankingLimit] = useState(3)
  const [programsBannerImage, setProgramsBannerImage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showSecondaryContent, setShowSecondaryContent] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 9
  const loaderRef = useRef<HTMLDivElement>(null)
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://fmlista.com'
  const siteTitle = 'FM Lista | Radios en vivo de Formosa'
  const siteDescription = 'Escucha radios en vivo de Formosa, descubre nuevas emisoras y accede a sus micrositios en un solo lugar.'
  
  const {
    filteredRadios,
    selectedLocation,
    setRadios: setStoreRadios,
  } = useRadioStore()

  useSeo({
    title: siteTitle,
    description: siteDescription,
    url: `${siteUrl}/`,
    image: '/apple-touch-icon.png',
    siteName: 'FM Lista',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'FM Lista',
      url: `${siteUrl}/`,
      description: siteDescription,
      inLanguage: 'es-AR',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  })
  usePageTracking('home')
  
  const fetchRadios = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 0) setIsLoading(true)
      else setIsLoadingMore(true)
      const data = await queryPublicTable<Radio>('radios', {
        select: RADIO_LIST_SELECT,
        order: [{ column: 'created_at', ascending: false }],
        range: { from: pageNum * PAGE_SIZE, to: (pageNum + 1) * PAGE_SIZE - 1 },
      })

      if (data) {
        setRadios(prev => {
          return pageNum === 0 ? data : [...prev, ...data];
        })
        setHasMore(data.length === PAGE_SIZE)
      }
    } catch (error) {
      console.error('Error fetching radios:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  const fetchSpecialSections = useCallback(async () => {
    try {
      const favoriteIds = JSON.parse(localStorage.getItem('radio_favorites') || '[]')
      
      // Consultas paralelas para máxima velocidad
      const [recentRes, trendingRes, favsRes, rankingConfigRes] = await Promise.all([
        queryPublicTable<Radio>('radios', { select: RADIO_LIST_SELECT, order: [{ column: 'created_at', ascending: false }], limit: 6 }),
        // Para tendencias, traemos las últimas 6 de la categoría más popular
        queryPublicTable<Radio>('radios', { select: RADIO_LIST_SELECT, limit: 6 }),
        // Cargar favoritos si existen
        favoriteIds.length > 0 
          ? queryPublicTable<Radio>('radios', { select: RADIO_LIST_SELECT, filters: [{ column: 'id', op: 'in', value: favoriteIds }] })
          : Promise.resolve([]),
        fetchAppSettings(['home_ranking_radios', 'home_ranking_limit', 'home_programs_banner_image'])
      ])

      const parsedRankingLimit = Number(rankingConfigRes.home_ranking_limit)
      if ([3, 5, 10].includes(parsedRankingLimit)) {
        setRankingLimit(parsedRankingLimit)
      } else {
        setRankingLimit(3)
      }

      setProgramsBannerImage(
        typeof rankingConfigRes.home_programs_banner_image === 'string'
          ? rankingConfigRes.home_programs_banner_image
          : ''
      )

      if (recentRes) setRecentRadios(recentRes)
      if (favsRes) setFavoriteRadios(favsRes)
      if (trendingRes) {
        setTrendingRadios(trendingRes)
        // Cálculo simple de categoría tendencia basado en los resultados obtenidos
        const category = trendingRes[0]?.category || null
        setTrendingCategory(category)
      }

      const rawRankingValue = rankingConfigRes.home_ranking_radios
      if (typeof rawRankingValue === 'string' && rawRankingValue.length > 0) {
        try {
          const rankingIds = JSON.parse(rawRankingValue)
          if (Array.isArray(rankingIds) && rankingIds.length > 0) {
            const normalizedIds = rankingIds.filter((id) => typeof id === 'string')
            if (normalizedIds.length > 0) {
              const configuredRadios = await queryPublicTable<Radio>('radios', {
                select: RADIO_LIST_SELECT,
                filters: [{ column: 'id', op: 'in', value: normalizedIds }],
              })

              if (configuredRadios && configuredRadios.length > 0) {
                const byId = new Map(configuredRadios.map((radio) => [radio.id, radio]))
                const orderedConfigured = normalizedIds
                  .map((id) => byId.get(id))
                  .filter(Boolean) as Radio[]

                if (orderedConfigured.length > 0) {
                  setTrendingRadios(orderedConfigured)
                  setTrendingCategory('Ranking manual')
                }
              }
            }
          }
        } catch (parseError) {
          console.warn('No se pudo parsear home_ranking_radios:', parseError)
        }
      }
    } catch (error) {
      console.error('Error fetching special sections:', error)
    }
  }, [])

  useEffect(() => {
    // Disparar carga de datos
    Promise.all([
      fetchRadios(0),
      fetchSpecialSections()
    ])
  }, [fetchRadios, fetchSpecialSections])

  useEffect(() => {
    // Prioriza contenido principal (radios) y difiere bloques secundarios
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let idleId: number | null = null

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number })
        .requestIdleCallback(() => setShowSecondaryContent(true), { timeout: 1200 })
    } else {
      timeoutId = setTimeout(() => setShowSecondaryContent(true), 800)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (idleId !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        ;(window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId)
      }
    }
  }, [])

  // Sincronizar el store de forma segura fuera del render
  useEffect(() => {
    setStoreRadios(radios);
  }, [radios, setStoreRadios]);

  const handleLoadMore = useCallback(() => {
    setPage(prev => {
      const nextPage = prev + 1
      fetchRadios(nextPage)
      return nextPage
    })
  }, [fetchRadios])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, isLoading, handleLoadMore])
  
  const filteredBySearch = useMemo(() =>
    filteredRadios().filter(radio =>
      radio.name.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
      radio.location?.toLowerCase().includes(deferredSearchTerm.toLowerCase())
    ), [filteredRadios, deferredSearchTerm])

  const spotlightLocation = useMemo(() => {
    if (selectedLocation) return selectedLocation

    const counts = filteredBySearch.reduce<Record<string, number>>((acc, radio) => {
      if (!radio.location) return acc
      acc[radio.location] = (acc[radio.location] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  }, [filteredBySearch, selectedLocation])

  const citySpotlightRadios = useMemo(() => {
    if (!spotlightLocation) return []

    return filteredBySearch
      .filter((radio) => radio.location === spotlightLocation)
      .slice(0, 4)
  }, [filteredBySearch, spotlightLocation])

  return (
    <div className="min-h-screen bg-[#f5f5f9] dark:bg-slate-950 pb-32 transition-colors">
      <Navigation />
      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8">
        <Hero searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        {showSecondaryContent && (
          <>
            <Suspense fallback={<div className="mb-8 h-[500px] animate-pulse rounded-2xl bg-white sm:h-[270px] lg:h-[180px] dark:bg-slate-900" />}>
              <WeatherSection className="mb-8" />
            </Suspense>
            <Suspense fallback={<div className="mb-10 h-20 animate-pulse rounded-2xl bg-white dark:bg-slate-900" />}>
              <NewsSection className="mb-10" />
            </Suspense>
            <AdBanner position="home_top" className="mb-12" />
          </>
        )}
        {programsBannerImage && (
          <section className="mb-12">
            <Link
              to="/programas"
              className="group block overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              aria-label="Ir al listado de programas"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="relative">
                <img
                  src={programsBannerImage}
                  alt="Descubre los programas nacionales en streaming"
                  loading="lazy"
                  decoding="async"
                  className="h-40 w-full object-cover sm:h-52 md:h-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-black/15" />
                <div className="absolute inset-0 flex items-end p-5 sm:p-7">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80">Programas</p>
                    <h2 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
                      Ver listado completo
                    </h2>
                    <p className="mt-2 text-sm text-white/85">
                      Clic para explorar los programas destacados en YouTube.
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}
        <Suspense fallback={
          <div className="space-y-8 pt-10">
            <div className="h-32 rounded-3xl bg-white animate-pulse" />
            <div className="h-96 rounded-3xl bg-white animate-pulse" />
          </div>
        }>
          {isLoading ? (
            <div className="space-y-8 pt-10">
              <div className="h-32 rounded-3xl bg-white animate-pulse dark:bg-slate-900" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <RadioCardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : (
            <HomeSections
              citySpotlightLabel={spotlightLocation}
              citySpotlightRadios={citySpotlightRadios}
              favoriteRadios={favoriteRadios}
              trendingRadios={trendingRadios}
              trendingCategory={trendingCategory}
              rankingLimit={rankingLimit}
              recentRadios={recentRadios}
              filteredBySearch={filteredBySearch}
              radiosCount={radios.length}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              loaderRef={loaderRef}
            />
          )}
        </Suspense>
        {showSecondaryContent && <AdBanner position="home_middle" className="mt-6 mb-10" />}
      </main>
      <Footer className="pb-8" />
    </div>
  )
}
