import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense, useDeferredValue } from 'react'
import { Navigation } from '@/components/Navigation'
import { Hero } from '@/components/Hero'
import { AdBanner } from '@/components/AdBanner'
import { NewsSection } from '@/components/NewsSection'
import { useRadioStore } from '@/stores/radioStore'
import { supabase } from '@/lib/supabase'
import { Radio } from '@/types/database'
import { useSeo } from '@/hooks/useSeo'

const HomeSections = React.lazy(() => import('./HomeSections'))

const RadioCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm overflow-hidden animate-pulse border border-slate-100 dark:border-slate-800">
    <div className="p-5 flex items-center gap-5">
      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex-shrink-0" />
      <div className="space-y-3">
        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full w-32" />
        <div className="space-y-2 pt-2">
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-48" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-24" />
        </div>
      </div>
      <div className="ml-auto w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl" />
    </div>
  </div>
);

export const Home: React.FC = () => {
  const [radios, setRadios] = useState<Radio[]>([])
  const [favoriteRadios, setFavoriteRadios] = useState<Radio[]>([])
  const [recentRadios, setRecentRadios] = useState<Radio[]>([])
  const [trendingRadios, setTrendingRadios] = useState<Radio[]>([])
  const [trendingCategory, setTrendingCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 9
  const loaderRef = useRef<HTMLDivElement>(null)
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://fmlista.com'
  const siteTitle = 'FM Lista | Radios en vivo de Formosa'
  const siteDescription = 'Escucha radios en vivo de Formosa, descubre nuevas emisoras y accede a sus micrositios en un solo lugar.'
  
  const { filteredRadios, setRadios: setStoreRadios } = useRadioStore()

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
  
  const fetchRadios = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 0) setIsLoading(true)
      else setIsLoadingMore(true)

      const { data, error } = await supabase
        .from('radios')
        .select('*')
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)
        .order('created_at', { ascending: false })

      if (error) throw error

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
      const [recentRes, trendingRes, favsRes] = await Promise.all([
        supabase.from('radios').select('*').order('created_at', { ascending: false }).limit(6),
        // Para tendencias, traemos las últimas 6 de la categoría más popular
        supabase.from('radios').select('*').limit(6),
        // Cargar favoritos si existen
        favoriteIds.length > 0 
          ? supabase.from('radios').select('*').in('id', favoriteIds)
          : Promise.resolve({ data: [] })
      ])

      if (recentRes.data) setRecentRadios(recentRes.data)
      if (favsRes.data) setFavoriteRadios(favsRes.data)
      if (trendingRes.data) {
        setTrendingRadios(trendingRes.data)
        // Cálculo simple de categoría tendencia basado en los resultados obtenidos
        const category = trendingRes.data[0]?.category || null
        setTrendingCategory(category)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f9] dark:bg-slate-950 transition-colors">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="h-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl mb-12 animate-pulse shadow-sm"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(6)].map((_, i) => (
              <RadioCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#f5f5f9] dark:bg-slate-950 pb-32 transition-colors">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Hero searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <NewsSection className="mb-10" />
        <AdBanner position="home_top" className="mb-12" />
        <Suspense fallback={
          <div className="space-y-8 pt-10">
            <div className="h-32 rounded-3xl bg-white animate-pulse" />
            <div className="h-96 rounded-3xl bg-white animate-pulse" />
          </div>
        }>
          <HomeSections
            favoriteRadios={favoriteRadios}
            trendingRadios={trendingRadios}
            trendingCategory={trendingCategory}
            recentRadios={recentRadios}
            filteredBySearch={filteredBySearch}
            radiosCount={radios.length}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loaderRef={loaderRef}
          />
        </Suspense>
      </div>
    </div>
  )
}
