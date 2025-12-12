import React, { useState, useEffect } from 'react'
import { RadioCard } from '@/components/RadioCard'
import { Navigation } from '@/components/Navigation'
import { Hero } from '@/components/Hero'
import { NewsSection } from '@/components/NewsSection'
import { useRadioStore } from '@/stores/radioStore'
import { api } from '@/lib/api'
import { Radio } from '@/types/database'
import { Radio as RadioIcon, Search, Star } from 'lucide-react'
import { AdBanner } from '@/components/AdBanner'
import { Footer } from '@/components/Footer'

export const Home: React.FC = () => {
  const [radios, setRadios] = useState<Radio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const { filteredRadios, setRadios: setStoreRadios, currentRadio, selectedLocation, selectedCategory } = useRadioStore()
  
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
