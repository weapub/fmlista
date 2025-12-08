import React, { useState, useEffect } from 'react'
import { RadioCard } from '@/components/RadioCard'
import { AudioPlayer } from '@/components/AudioPlayer'
import { FilterBar } from '@/components/FilterBar'
import { Navigation } from '@/components/Navigation'
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <RadioIcon className="w-12 h-12 text-secondary-500 mr-3" />
            <h1 className="text-4xl font-bold text-primary-500">FM Lista</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre y escucha tus emisoras de radio FM favoritas. Explora estaciones de todo el país con información detallada y programación.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
            />
          </div>
        </div>
        
        {/* Filters */}
        <div className="mb-8">
          <FilterBar />
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
      </div>
      
      {/* Audio Player */}
      <AudioPlayer />
    </div>
  )
}