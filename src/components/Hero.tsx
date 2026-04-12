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
    <div className="relative rounded-[2rem] overflow-hidden mb-10 shadow-2xl shadow-indigo-500/10">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary-600 via-primary-700 to-indigo-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_30%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.14),_transparent_25%)]" />
      {heroImage && (
        <div className="absolute inset-0 opacity-60">
          <img src={heroImage} alt="Hero Background" loading="lazy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-950/45" />
        </div>
      )}
      
      <div className="relative px-6 py-10 md:px-12 md:py-16 text-white text-center">
        <div className="mx-auto max-w-5xl">
          <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.24em] text-white/80 shadow-sm backdrop-blur-sm">
            Más de 200 radios de Formosa disponibles</span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Todas las radios de Formosa en una app moderna y fácil de usar</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-white/85 sm:text-base md:text-lg">Encuentra tu emisora preferida, explora categorías, escucha en vivo y descubre nuevas señales con una experiencia fluida en móvil y desktop.</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:items-center">
            <div className="relative w-full sm:w-auto">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por radio, categoría o ubicación"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true)
                }}
                className="w-full rounded-full border border-white/20 bg-white/95 py-3 pl-12 pr-14 text-gray-900 shadow-xl shadow-slate-950/10 placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/25"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/90 text-slate-900 shadow-sm transition-colors ${showFilters ? 'bg-white text-secondary-600' : 'hover:bg-white'}`}
                title="Filtros"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <Link to="/planes" className="inline-flex items-center justify-center rounded-full bg-white/95 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-950/10 transition hover:bg-white">
                <Radio className="mr-2 h-4 w-4" />Planes de streaming
              </Link>
              <Link to="/planes" className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                <Megaphone className="mr-2 h-4 w-4" />Publicitar
              </Link>
            </div>
          </div>

          {showSuggestions && (
            <div className="mx-auto mt-4 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
              <ul>
                {suggestions.map((radio) => (
                  <li
                    key={radio.id}
                    onClick={() => handleSuggestionClick(radio)}
                    className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left text-sm text-white transition hover:bg-white/10"
                  >
                    <div>
                      <div className="font-semibold">{radio.name}</div>
                      {radio.location && <div className="text-xs text-white/60">{radio.location}</div>}
                    </div>
                    <Search className="h-4 w-4 text-white/60" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-left shadow-lg shadow-slate-950/10 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/15">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Explora rápido</h3>
              <p className="mt-3 text-sm text-white/80">Filtra por categoría, ubicación o frecuencia con un solo clic.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-left shadow-lg shadow-slate-950/10 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/15">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Reproduce al instante</h3>
              <p className="mt-3 text-sm text-white/80">Selecciona cualquier emisora y comienza a escuchar sin esperas.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-left shadow-lg shadow-slate-950/10 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/15">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Diseño responsivo</h3>
              <p className="mt-3 text-sm text-white/80">Navega cómodo desde móvil, tablet o desktop.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

