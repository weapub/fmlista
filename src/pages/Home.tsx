import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { RadioCard } from '@/components/RadioCard'
import { Navigation } from '@/components/Navigation'
import { Hero } from '@/components/Hero'
import { NewsSection } from '@/components/NewsSection'
import { useRadioStore } from '@/stores/radioStore'
import { supabase } from '@/lib/supabase'
import { Radio } from '@/types/database'
<<<<<<< HEAD
import { Radio as RadioIcon, Search, Star } from 'lucide-react'
import { AdBanner } from '@/components/AdBanner'
import { Footer } from '@/components/Footer'
=======
import { Radio as RadioIcon, Search, ChevronDown, Loader2, Heart } from 'lucide-react'

const RadioCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse border border-gray-100">
    <div className="w-full h-32 bg-gray-200" />
    <div className="p-4">
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="space-y-2 pt-2">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
        <div className="h-10 bg-gray-200 rounded-md w-full mt-4" />
      </div>
    </div>
  </div>
);
>>>>>>> 4e19e3a (Mejoras de rendimiento, scroll infinito, favoritos y compartir)

export const Home: React.FC = () => {
  const [radios, setRadios] = useState<Radio[]>([])
  const [favoriteRadios, setFavoriteRadios] = useState<Radio[]>([])
  const [recentRadios, setRecentRadios] = useState<Radio[]>([])
  const [trendingRadios, setTrendingRadios] = useState<Radio[]>([])
  const [trendingCategory, setTrendingCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 9
  const loaderRef = useRef<HTMLDivElement>(null)
  
  const { filteredRadios, setRadios: setStoreRadios, currentRadio, selectedLocation, selectedCategory } = useRadioStore()
  
<<<<<<< HEAD
  useEffect(() => {
    // Force re-evaluation of filtered radios when filters change
  }, [selectedLocation, selectedCategory])

  useEffect(() => {
    const fetchRadios = async () => {
      try {
        setIsLoading(true)
        const data = await api.getRadios()
        // Mock featured radios for demo purposes if not present in DB
        const dataWithFeatured = data.map(r => ({
          ...r,
          is_featured: r.is_featured ?? (Math.random() > 0.85) // 15% chance if undefined
        }))
        setRadios(dataWithFeatured)
        setStoreRadios(dataWithFeatured)
      } catch (error) {
        // Ignore transient network errors during dev refresh
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRadios()
  }, [setStoreRadios])
  
  const visibleRadios = filteredRadios()

  const filteredBySearch = visibleRadios.filter(radio =>
    radio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    radio.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const featuredRadios = visibleRadios.filter(r => r.is_featured).slice(0, 3)

  const recentRadios = [...visibleRadios]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)
  const categoryCounts = visibleRadios.reduce<Record<string, number>>((acc, r) => {
    if (r.category) acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {})
  const trendingCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  const trendingRadios = trendingCategory
    ? visibleRadios.filter(r => r.category === trendingCategory).slice(0, 6)
    : visibleRadios.slice(0, 6)
  
  const hasActiveFilters = searchTerm !== '' || selectedLocation !== null || selectedCategory !== null

  useEffect(() => {
    if (document.body.classList.contains('tv-mode')) {
      const focusableElements = document.querySelectorAll('.focusable');
      if (focusableElements.length > 0 && !document.activeElement?.classList.contains('focusable')) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isLoading, filteredBySearch]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300">
      <Navigation />
      <div className="container mx-auto px-4 py-0">
        <AdBanner position="home_top" />
        <Hero searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        
        {isLoading ? (
          <div className="animate-pulse max-w-[896px] mx-auto">
            <div className="h-16 bg-white rounded-lg shadow-sm mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-lg shadow-sm"></div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Breaking News Ticker */}
            <div className="mb-8">
              <NewsSection />
            </div>
=======
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
          const newList = pageNum === 0 ? data : [...prev, ...data]
          setStoreRadios(newList)
          return newList
        })
        setHasMore(data.length === PAGE_SIZE)
      }
    } catch (error) {
      console.error('Error fetching radios:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [setStoreRadios])

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
      radio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      radio.location?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [filteredRadios, searchTerm])

  const recentRadios = useMemo(() => 
    [...radios]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6), [radios])

  const { trendingCategory, trendingRadios } = useMemo(() => {
    const categoryCounts = radios.reduce<Record<string, number>>((acc, r) => {
      if (r.category) acc[r.category] = (acc[r.category] || 0) + 1
      return acc
    }, {})
    const category = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    const radioList = category
      ? radios.filter(r => r.category === category).slice(0, 6)
      : radios.slice(0, 6)
    return { trendingCategory: category, trendingRadios: radioList }
  }, [radios])
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="h-48 bg-gray-200 rounded-xl mb-12 animate-pulse"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <RadioCardSkeleton key={i} />
            ))}
          </div>
        </div>
        
        <AudioPlayer />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Hero searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        
        {/* Mis Favoritos */}
        {favoriteRadios.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center space-x-2 mb-4">
              <Heart className="w-6 h-6 text-red-500 fill-current" />
              <h2 className="text-2xl font-bold text-gray-900">Mis Favoritos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteRadios.map(radio => (
                <RadioCard key={`fav-${radio.id}`} radio={radio} />
              ))}
            </div>
          </div>
        )}

        {/* Tendencias */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900">Tendencias</h2>
            {trendingCategory && (
              <span className="text-sm text-gray-500">Categoría: {trendingCategory}</span>
            )}
          </div>
          {trendingRadios.length === 0 ? (
            <p className="text-gray-600">Sin emisoras</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingRadios.map(radio => (
                <RadioCard key={radio.id} radio={radio} />
              ))}
            </div>
          )}
        </div>

        {/* Agregadas recientemente */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Agregadas recientemente</h2>
          {recentRadios.length === 0 ? (
            <p className="text-gray-600">Sin emisoras recientes</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentRadios.map(radio => (
                <RadioCard key={radio.id} radio={radio} />
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Mostrando {filteredBySearch.length} de {radios.length} emisoras
          </p>
        </div>
        
        {/* Radio Grid */}
        {filteredBySearch.length === 0 ? (
          <div className="text-center py-12">
            <RadioIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron emisoras</h3>
            <p className="text-gray-600">
              Intenta ajustar tus filtros o término de búsqueda
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBySearch.map((radio) => (
                <RadioCard key={radio.id} radio={radio} />
              ))}
            </div>
            
            {hasMore && (
              <div ref={loaderRef} className="mt-12 pb-12">
                {isLoadingMore && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <RadioCardSkeleton key={`more-${i}`} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
>>>>>>> 4e19e3a (Mejoras de rendimiento, scroll infinito, favoritos y compartir)

            {/* Destacadas */}
            {featuredRadios.length > 0 && !hasActiveFilters && (
              <div className="mb-8 max-w-[896px] mx-auto">
                <div className="flex items-center space-x-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Destacadas</h2>
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-200 dark:border-yellow-800 font-medium">
                    Sponsoreado
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredRadios.map(radio => (
                    <RadioCard key={radio.id} radio={radio} isFeatured={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Tendencias */}
            {!hasActiveFilters && (
              <div className="mb-8 max-w-[896px] mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tendencias</h2>
                  {trendingCategory && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">Categoría: {trendingCategory}</span>
                  )}
                </div>
                {trendingRadios.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">Sin emisoras</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {trendingRadios.map(radio => (
                      <RadioCard key={radio.id} radio={radio} isFeatured={radio.is_featured} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Agregadas recientemente */}
            {!hasActiveFilters && (
              <div className="mb-8 max-w-[896px] mx-auto">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Agregadas recientemente</h2>
                {recentRadios.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">Sin emisoras recientes</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recentRadios.map(radio => (
                      <RadioCard key={radio.id} radio={radio} isFeatured={radio.is_featured} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Results count */}
            <div className="mb-6 max-w-[896px] mx-auto">
              <p className="text-gray-600 dark:text-gray-400">
                Mostrando {filteredBySearch.length} de {visibleRadios.length} emisoras
              </p>
            </div>

            <AdBanner position="home_middle" />
            
            {/* Radio Grid */}
            {filteredBySearch.length === 0 ? (
              <div className="text-center py-12">
                <RadioIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No se encontraron emisoras</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Intenta ajustar tus filtros o término de búsqueda
                </p>
              </div>
            ) : (
              <div className="max-w-[896px] mx-auto mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredBySearch.map((radio) => (
                    <RadioCard key={radio.id} radio={radio} isFeatured={radio.is_featured} />
                  ))}
                </div>
              </div>
            )}

            {/* Noticias de Formosa - Removed bottom section */}
            {/* <div className="mt-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Noticias de Formosa</h2>
              <p className="text-gray-600 mb-4">Actualidad desde los diarios más populares de la provincia.</p>
              <NewsSection />
            </div> */}
          </>
        )}
      </div>
      <Footer className={currentRadio ? 'pb-32' : 'pb-8'} />
    </div>
  )
}
