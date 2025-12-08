import React, { useState, useEffect } from 'react'
import { RadioCard } from '@/components/RadioCard'
import { AudioPlayer } from '@/components/AudioPlayer'
import { Navigation } from '@/components/Navigation'
import { Hero } from '@/components/Hero'
import { NewsSection } from '@/components/NewsSection'
import { useRadioStore } from '@/stores/radioStore'
import { api } from '@/lib/api'
import { Radio } from '@/types/database'
import { Radio as RadioIcon, Search } from 'lucide-react'

export const Home: React.FC = () => {
  const [radios, setRadios] = useState<Radio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const { filteredRadios, setRadios: setStoreRadios } = useRadioStore()
  
  useEffect(() => {
    const fetchRadios = async () => {
      try {
        setIsLoading(true)
        const data = await api.getRadios()
        setRadios(data)
        setStoreRadios(data)
      } catch (error) {
        console.error('Error fetching radios:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRadios()
  }, [setStoreRadios])
  
  const filteredBySearch = filteredRadios().filter(radio =>
    radio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    radio.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const recentRadios = [...radios]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)
  const categoryCounts = radios.reduce<Record<string, number>>((acc, r) => {
    if (r.category) acc[r.category] = (acc[r.category] || 0) + 1
    return acc
  }, {})
  const trendingCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  const trendingRadios = trendingCategory
    ? radios.filter(r => r.category === trendingCategory).slice(0, 6)
    : radios.slice(0, 6)
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="animate-pulse">
              <div className="h-12 w-64 bg-gray-200 rounded mx-auto mb-4"></div>
              <div className="h-6 w-96 bg-gray-200 rounded mx-auto"></div>
            </div>
          </div>
          
          <div className="animate-pulse">
            <div className="h-16 bg-white rounded-lg shadow-sm mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-lg shadow-sm"></div>
              ))}
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBySearch.map((radio) => (
              <RadioCard key={radio.id} radio={radio} />
            ))}
          </div>
        )}

        {/* Noticias de Formosa */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Noticias de Formosa</h2>
          <p className="text-gray-600 mb-4">Actualidad desde los diarios más populares de la provincia.</p>
          <NewsSection />
        </div>
      </div>
      
      {/* Audio Player */}
      <AudioPlayer />
    </div>
  )
}
