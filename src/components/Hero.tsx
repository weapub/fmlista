import React, { useEffect, useState, useMemo } from 'react'
import { Search, Filter, Radio, Megaphone, MapPin, Tag, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useRadioStore } from '@/stores/radioStore'
import { cn } from '@/lib/utils'

interface HeroProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export const Hero: React.FC<HeroProps> = ({ searchTerm, onSearchChange }) => {
  const [showFilters, setShowFilters] = useState(false)
  const [heroImage, setHeroImage] = useState<string>('')
  const { 
    radios, 
    selectedLocation, 
    selectedCategory, 
    setSelectedLocation, 
    setSelectedCategory 
  } = useRadioStore()
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Lógica para el efecto de escritura (Typing Effect)
  const [text, setText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [loopNum, setLoopNum] = useState(0)
  const [typingSpeed, setTypingSpeed] = useState(100)
  const phrases = ["en alta definición.", "vayas donde vayas.", "como nunca antes.", "en tiempo real."]

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % phrases.length
      const fullText = phrases[i]

      setText(isDeleting ? fullText.substring(0, text.length - 1) : fullText.substring(0, text.length + 1))
      setTypingSpeed(isDeleting ? 50 : 100)

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 2000)
      } else if (isDeleting && text === '') {
        setIsDeleting(false)
        setLoopNum(loopNum + 1)
      }
    }

    const timer = setTimeout(handleTyping, typingSpeed)
    return () => clearTimeout(timer)
  }, [text, isDeleting, loopNum, typingSpeed])

  // Obtener opciones únicas para los filtros
  const categories = useMemo(() => 
    Array.from(new Set(radios.map(r => r.category).filter(Boolean))).sort()
  , [radios])

  const locations = useMemo(() => 
    Array.from(new Set(radios.map(r => r.location).filter(Boolean))).sort()
  , [radios])

  // Suggestions logic
  const suggestions = useMemo(() => {
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
    <div className="relative rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl shadow-[#696cff]/20">
      {/* Base Gradient background con colores del Theme Sneat */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#696cff] via-[#787bff] to-[#5f61e6]" />
      
      {/* Mesh Gradient Accents para profundidad */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/20 rounded-full blur-[100px]" />
      </div>

      {heroImage && (
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <img src={heroImage} alt="Hero Background" loading="lazy" className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className="relative px-6 py-12 md:px-16 md:py-20 text-white text-center">
        <div className="mx-auto max-w-5xl">
          <span className="inline-flex rounded-full bg-white/20 border border-white/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-sm backdrop-blur-md">
            LA RED DE RADIOS MÁS GRANDE DE LA PROVINCIA</span>
          <h1 className="mt-8 text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] min-h-[1.2em]">
            Tu frecuencia, <br className="sm:hidden" />
            <span className="text-white/70"> {text}</span>
            <span className="inline-block w-[3px] h-[0.9em] bg-white/50 ml-1 align-middle animate-pulse" />
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base md:text-xl text-white/80 font-medium leading-relaxed text-pretty">Accedé al ecosistema sonoro más completo de Formosa. Una experiencia digital fluida, diseñada para que tu emisora favorita te acompañe en cada momento.</p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center sm:items-center">
            <div className="relative w-full sm:w-auto group">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white z-20" strokeWidth={3} />
              <input
                type="text"
                placeholder="Busca emisoras o ciudades..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true)
                }}
                className="w-full sm:min-w-[400px] rounded-2xl border border-white/30 bg-white/10 backdrop-blur-xl py-4 pl-14 pr-12 text-white shadow-2xl placeholder:text-white/40 focus:bg-white/20 focus:outline-none focus:ring-4 focus:ring-[#696cff]/30 transition-all font-bold text-lg relative z-10"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all z-20",
                  showFilters || selectedLocation || selectedCategory 
                    ? 'bg-white text-[#696cff] shadow-lg' 
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                )}
                title="Filtros"
              >
                <Filter className="w-5 h-5" />
                {(selectedLocation || selectedCategory) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#696cff] animate-pulse" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/planes" className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-bold text-[#696cff] shadow-xl hover:shadow-2xl transition-all active:scale-95">
                <Radio className="mr-2 h-4 w-4" />Streaming
              </Link>
              <Link to="/planes" className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 backdrop-blur-md px-6 py-4 text-sm font-bold text-white transition-all hover:bg-white/20 active:scale-95">
                <Megaphone className="mr-2 h-4 w-4" />Publicidad
              </Link>
            </div>
          </div>

          {showSuggestions && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-4 w-full max-w-xl z-50 overflow-hidden rounded-[2rem] border border-white/20 bg-[#1e293b]/90 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
              <ul>
                {suggestions.map((radio) => (
                  <li
                    key={radio.id}
                    onClick={() => handleSuggestionClick(radio)}
                    className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left text-sm text-white transition hover:bg-white/10"
                  >
                    <div>
                      <div className="font-bold text-lg">{radio.name}</div>
                      {radio.location && <div className="text-xs text-white/50 font-medium">{radio.location}</div>}
                    </div>
                    <Search className="h-5 w-5 text-[#696cff]" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Panel de Filtros Flotante */}
          {showFilters && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-4 w-full max-w-2xl z-40 p-6 rounded-[2rem] border border-white/20 bg-[#1e293b]/95 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h3 className="text-white font-bold">Filtros de búsqueda</h3>
                {(selectedLocation || selectedCategory) && (
                  <button 
                    onClick={() => { setSelectedCategory(null); setSelectedLocation(null); }}
                    className="text-[10px] uppercase tracking-widest font-black text-[#696cff] hover:text-white transition-colors"
                  >
                    Limpiar Filtros
                  </button>
                )}
                <button onClick={() => setShowFilters(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
                {/* Columna de Géneros */}
                <div>
                  <div className="flex items-center gap-2 mb-4 text-white/60 font-bold text-[10px] uppercase tracking-widest">
                    <Tag className="w-3.5 h-3.5 text-[#696cff]" />
                    Géneros Musicales
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        !selectedCategory ? "bg-[#696cff] text-white shadow-lg shadow-[#696cff]/20" : "bg-white/5 text-white/60 hover:bg-white/10"
                      )}
                    >
                      Todos
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                          selectedCategory === cat ? "bg-[#696cff] text-white shadow-lg shadow-[#696cff]/20" : "bg-white/5 text-white/60 hover:bg-white/10"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Columna de Ciudades */}
                <div>
                  <div className="flex items-center gap-2 mb-4 text-white/60 font-bold text-[10px] uppercase tracking-widest">
                    <MapPin className="w-3.5 h-3.5 text-[#696cff]" />
                    Ubicación
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setSelectedLocation(null)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        !selectedLocation ? "bg-[#696cff] text-white shadow-lg shadow-[#696cff]/20" : "bg-white/5 text-white/60 hover:bg-white/10"
                      )}
                    >
                      Todas
                    </button>
                    {locations.map(loc => (
                      <button
                        key={loc}
                        onClick={() => setSelectedLocation(loc)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                          selectedLocation === loc ? "bg-[#696cff] text-white shadow-lg shadow-[#696cff]/20" : "bg-white/5 text-white/60 hover:bg-white/10"
                        )}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-pretty">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md transition-all hover:bg-white/10 group cursor-default">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Sonido Cristalino</h3>
              <p className="mt-2 text-sm text-white/80 font-medium leading-relaxed">Streaming de alta fidelidad optimizado para el menor consumo de datos.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md transition-all hover:bg-white/10 group cursor-default">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Sin Fronteras</h3>
              <p className="mt-2 text-sm text-white/80 font-medium leading-relaxed">Sintonizá desde cualquier dispositivo, en cualquier lugar del mundo.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md transition-all hover:bg-white/10 group cursor-default sm:col-span-2 lg:col-span-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Curaduría Local</h3>
              <p className="mt-2 text-sm text-white/80 font-medium leading-relaxed">Descubrí nuevas voces y géneros con nuestro buscador inteligente por ciudad.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
