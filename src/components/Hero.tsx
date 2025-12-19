import React, { useEffect, useState } from 'react'
import { Search, Filter, Radio, Megaphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useRadioStore } from '@/stores/radioStore'

interface HeroProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export const Hero: React.FC<HeroProps> = ({ searchTerm, onSearchChange }) => {
  const [locations, setLocations] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [heroImage, setHeroImage] = useState<string>('')
  const { selectedCategory, selectedLocation, setSelectedCategory, setSelectedLocation, radios, setCurrentRadio } = useRadioStore()
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Suggestions logic
  const suggestions = React.useMemo(() => {
    if (!searchTerm) return []
    const term = searchTerm.toLowerCase()
    return radios
      .filter(r => r.name.toLowerCase().includes(term) || r.location?.toLowerCase().includes(term))
      .slice(0, 5) // Limit to 5 suggestions
  }, [searchTerm, radios])

  useEffect(() => {
    if (suggestions.length > 0 && searchTerm) {
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [suggestions, searchTerm])

  const handleSuggestionClick = (radio: typeof radios[0]) => {
    onSearchChange(radio.name)
    setShowSuggestions(false)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, locs] = await Promise.all([api.getCategories(), api.getLocations()])
        setCategories(cats)
        setLocations(locs)

        // Fetch hero image
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'app_hero_image')
          .single();
        
        if (data?.value) {
          setHeroImage(data.value);
        }
      } catch (e) {
        console.error('Error loading hero data:', e)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="relative rounded-2xl overflow-hidden mb-8">
      {heroImage ? (
        <>
          <div className="absolute inset-0">
            <img src={heroImage} alt="Hero Background" className="w-full h-full object-cover" />
          </div>
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black/50" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-500 via-primary-600 to-primary-800" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0, transparent 35%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.12) 0, transparent 40%), radial-gradient(circle at 40% 80%, rgba(255,255,255,0.1) 0, transparent 35%)'
          }} />
        </>
      )}
      
      <div className="relative px-6 py-10 md:px-10 md:py-16 text-white text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-3">Todas las radios de Formosa en una App</h1>
        <p className="text-white/90 max-w-2xl mx-auto mb-6">Conectate con tu radio favorita, enviá mensajes y participa en vivo.</p>

        <div className="flex justify-center">
          <div className="relative w-full md:max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o ubicación"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true)
              }}
              className="w-full pl-12 pr-12 py-3 rounded-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none shadow-sm"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${
                showFilters 
                  ? 'text-secondary-500 bg-secondary-50' 
                  : 'text-gray-400 hover:text-secondary-500 hover:bg-gray-50'
              }`}
              title="Filtros"
            >
              <Filter className="w-5 h-5" />
            </button>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden z-50 text-left">
                <ul>
                  {suggestions.map((radio) => (
                    <li 
                      key={radio.id}
                      onClick={() => handleSuggestionClick(radio)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 border-gray-100 flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-medium text-gray-900 block">{radio.name}</span>
                        {radio.location && (
                          <span className="text-xs text-gray-500">{radio.location}</span>
                        )}
                      </div>
                      <div className="text-gray-400 group-hover:text-secondary-500">
                        <Search className="w-4 h-4" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowFilters(false)}
            />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 text-left text-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Categoría</label>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary-500 text-gray-900 bg-white"
                  >
                    <option value="">Todas</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Ubicación</label>
                  <select
                    value={selectedLocation || ''}
                    onChange={(e) => setSelectedLocation(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary-500 text-gray-900 bg-white"
                  >
                    <option value="">Todas</option>
                    {locations.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedLocation(null)}
              className={`px-3 py-1 rounded-full text-sm ${selectedLocation ? 'bg-white/20' : 'bg-white text-gray-900'}`}
            >Todas</button>
            {locations.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedLocation(city)}
                className={`px-3 py-1 rounded-full text-sm ${selectedLocation === city ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/25'}`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link 
            to="/planes" 
            className="flex items-center gap-1.5 px-4 py-2 border border-white/40 text-white rounded-full hover:bg-white/10 transition-colors text-xs font-medium tracking-wide backdrop-blur-sm"
          >
            <Radio className="w-3.5 h-3.5" />
            PLANES DE STREAMING
          </Link>
          <Link 
            to="/admin/ads" 
            className="flex items-center gap-1.5 px-4 py-2 border border-white/40 text-white rounded-full hover:bg-white/10 transition-colors text-xs font-medium tracking-wide backdrop-blur-sm"
          >
            <Megaphone className="w-3.5 h-3.5" />
            PUBLICITAR
          </Link>
        </div>
      </div>
    </div>
  )
}

