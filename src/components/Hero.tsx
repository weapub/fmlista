import React, { useEffect, useMemo, useState } from 'react'
import { Search, Filter, Radio, Megaphone, MapPin, Tag, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useRadioStore } from '@/stores/radioStore'
import { cn } from '@/lib/utils'
import { useDeviceStore } from '@/stores/deviceStore'
import { optimizeSupabaseImageUrl } from '@/lib/imageOptimization'

interface HeroProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export const Hero: React.FC<HeroProps> = ({ searchTerm, onSearchChange }) => {
  const { isTV } = useDeviceStore()
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [heroImage, setHeroImage] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem('app_hero_image_url') || ''
  })
  const {
    radios,
    selectedLocation,
    selectedCategory,
    setSelectedLocation,
    setSelectedCategory,
  } = useRadioStore()
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [text, setText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [loopNum, setLoopNum] = useState(0)
  const [typingSpeed, setTypingSpeed] = useState(100)
  const phrases = ['en alta definición.', 'vayas donde vayas.', 'como nunca antes.', 'en tiempo real.']
  const typingEnabled = !isTV && !isMobileViewport

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const applyViewport = () => setIsMobileViewport(mediaQuery.matches)
    applyViewport()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', applyViewport)
      return () => mediaQuery.removeEventListener('change', applyViewport)
    }

    mediaQuery.addListener(applyViewport)
    return () => mediaQuery.removeListener(applyViewport)
  }, [])

  useEffect(() => {
    if (!typingEnabled) {
      setText('en tiempo real.')
      setIsDeleting(false)
      setLoopNum(0)
      return
    }

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
  }, [typingEnabled, text, isDeleting, loopNum, typingSpeed])

  const categories = useMemo(
    () => Array.from(new Set(radios.map((r) => r.category).filter(Boolean))).sort(),
    [radios]
  )

  const locations = useMemo(
    () => Array.from(new Set(radios.map((r) => r.location).filter(Boolean))).sort(),
    [radios]
  )

  const suggestions = useMemo(() => {
    if (!searchTerm) return []
    const term = searchTerm.toLowerCase()
    return radios
      .filter((r) => r.name.toLowerCase().includes(term) || r.location?.toLowerCase().includes(term))
      .slice(0, 5)
  }, [searchTerm, radios])

  const optimizedHeroImage = useMemo(
    () => optimizeSupabaseImageUrl(heroImage, { width: isTV ? 1920 : 1280, quality: 72 }),
    [heroImage, isTV]
  )

  useEffect(() => {
    if (!optimizedHeroImage || typeof document === 'undefined') return

    const existing = document.head.querySelector('link[data-hero-preload="true"]')
    if (existing) {
      existing.remove()
    }

    const preload = document.createElement('link')
    preload.setAttribute('data-hero-preload', 'true')
    preload.rel = 'preload'
    preload.as = 'image'
    preload.href = optimizedHeroImage
    document.head.appendChild(preload)

    return () => {
      preload.remove()
    }
  }, [optimizedHeroImage])

  useEffect(() => {
    setShowSuggestions(suggestions.length > 0 && !!searchTerm)
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
          .single()

        if (data?.value) {
          setHeroImage(data.value)
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('app_hero_image_url', data.value)
          }
        }
      } catch (e) {
        console.error('Error loading hero data:', e)
      }
    }

    void fetchData()
  }, [])

  return (
    <div className={cn('relative mb-12 overflow-hidden rounded-[2.5rem] shadow-2xl shadow-[#696cff]/20', isTV && 'mb-16 rounded-[3rem]')}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#696cff] via-[#787bff] to-[#5f61e6]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={cn('absolute left-[-10%] top-[-20%] h-[60%] w-[60%] rounded-full bg-white/10', isMobileViewport ? 'opacity-70' : 'animate-pulse blur-[100px]')} />
        <div className={cn('absolute bottom-[-20%] right-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-400/20', isMobileViewport ? 'opacity-70' : 'blur-[100px]')} />
      </div>

      {heroImage && (
        <div className={cn('absolute inset-0', isMobileViewport ? 'opacity-35' : 'mix-blend-overlay opacity-40')}>
          <img
            src={optimizedHeroImage || heroImage}
            alt="Hero Background"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className={cn('relative px-6 py-12 text-center text-white md:px-16 md:py-20', isTV && 'px-10 py-16 md:px-20 md:py-24')}>
        <div className="mx-auto max-w-5xl">
          <span className={cn('inline-flex rounded-full border border-white/20 bg-white/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-sm backdrop-blur-md', isTV && 'px-6 py-2 text-xs')}>
            LA RED DE RADIOS MÁS GRANDE DE LA PROVINCIA
          </span>

          <h1 className={cn('mt-8 min-h-[1.2em] text-4xl font-black leading-[1.1] tracking-tighter md:text-6xl', isTV && 'text-5xl md:text-7xl')}>
            Tu frecuencia, <br className="sm:hidden" />
            <span className="text-white/70"> {text}</span>
            {typingEnabled && <span className="ml-1 inline-block h-[0.9em] w-[3px] animate-pulse align-middle bg-white/50" />}
          </h1>

          <p className={cn('mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-white/80 text-pretty md:text-xl', isTV && 'max-w-4xl text-lg md:text-2xl')}>
            Accedé al ecosistema sonoro más completo de Formosa. Una experiencia digital fluida, diseñada para que tu emisora favorita te acompañe en cada momento.
          </p>

          <div className={cn('mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center', isTV && 'mt-12 gap-6')}>
            <div className="group relative w-full sm:w-auto">
              <Search className={cn('pointer-events-none absolute left-5 top-1/2 z-20 -translate-y-1/2 text-white', isTV ? 'h-6 w-6' : 'h-5 w-5')} strokeWidth={3} />
              <input
                type="text"
                placeholder="Busca emisoras o ciudades..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true)
                }}
                className={cn(
                  'relative z-10 w-full rounded-2xl border border-white/30 bg-white/10 py-4 pl-14 pr-12 text-lg font-bold text-white shadow-2xl backdrop-blur-xl transition-all placeholder:text-white/40 focus:bg-white/20 focus:outline-none focus:ring-4 focus:ring-[#696cff]/30 sm:min-w-[400px]',
                  isTV && 'rounded-[1.75rem] py-5 pl-16 pr-14 text-xl sm:min-w-[620px]'
                )}
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'absolute right-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl transition-all focusable',
                  isTV && 'h-12 w-12 rounded-2xl',
                  showFilters || selectedLocation || selectedCategory
                    ? 'bg-white text-[#696cff] shadow-lg'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                )}
                title="Filtros"
              >
                <Filter className="h-5 w-5" />
                {(selectedLocation || selectedCategory) && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-[#696cff] bg-red-500" />
                )}
              </button>
            </div>

            <div className={cn('flex flex-wrap justify-center gap-3', isTV && 'gap-4')}>
              <Link
                to="/planes"
                className={cn('focusable inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-bold text-[#696cff] shadow-xl transition-all hover:shadow-2xl active:scale-95', isTV && 'px-8 py-5 text-base')}
              >
                <Radio className="mr-2 h-4 w-4" />
                Streaming
              </Link>
              <Link
                to="/planes"
                className={cn('focusable inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95', isTV && 'px-8 py-5 text-base')}
              >
                <Megaphone className="mr-2 h-4 w-4" />
                Publicidad
              </Link>
            </div>
          </div>

          {showSuggestions && (
            <div className={cn('absolute left-1/2 z-50 mt-4 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-[2rem] border border-white/20 bg-[#1e293b]/90 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl', isTV && 'max-w-3xl')}>
              <ul>
                {suggestions.map((radio) => (
                  <li
                    key={radio.id}
                    onClick={() => handleSuggestionClick(radio)}
                    className={cn('flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left text-sm text-white transition hover:bg-white/10', isTV && 'px-7 py-5 text-base')}
                  >
                    <div>
                      <div className={cn('text-lg font-bold', isTV && 'text-2xl')}>{radio.name}</div>
                      {radio.location && <div className={cn('text-xs font-medium text-white/50', isTV && 'text-sm')}>{radio.location}</div>}
                    </div>
                    <Search className={cn('text-[#696cff]', isTV ? 'h-6 w-6' : 'h-5 w-5')} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showFilters && (
            <div className={cn('absolute left-1/2 z-40 mt-4 w-full max-w-2xl -translate-x-1/2 rounded-[2rem] border border-white/20 bg-[#1e293b]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200', isTV && 'max-w-4xl p-8')}>
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className={cn('font-bold text-white', isTV && 'text-2xl')}>Filtros de búsqueda</h3>
                {(selectedLocation || selectedCategory) && (
                  <button
                    onClick={() => {
                      setSelectedCategory(null)
                      setSelectedLocation(null)
                    }}
                    className={cn('font-black uppercase tracking-widest text-[#696cff] transition-colors hover:text-white', isTV ? 'text-xs' : 'text-[10px]')}
                  >
                    Limpiar Filtros
                  </button>
                )}
                <button onClick={() => setShowFilters(false)} className={cn('focusable p-2 text-white/40 transition-colors hover:text-white', isTV && 'p-3')}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-10 text-left md:grid-cols-2">
                <div>
                  <div className={cn('mb-4 flex items-center gap-2 font-bold uppercase tracking-widest text-white/60', isTV ? 'text-xs' : 'text-[10px]')}>
                    <Tag className="h-3.5 w-3.5 text-[#696cff]" />
                    Géneros Musicales
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={cn(
                        'focusable rounded-lg font-bold transition-all',
                        isTV ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
                        !selectedCategory ? 'bg-[#696cff] text-white shadow-lg shadow-[#696cff]/20' : 'bg-white/5 text-white/60 hover:bg-white/10'
                      )}
                    >
                      Todos
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          'focusable rounded-lg font-bold transition-all',
                          isTV ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
                          selectedCategory === cat ? 'bg-[#696cff] text-white shadow-lg shadow-[#696cff]/20' : 'bg-white/5 text-white/60 hover:bg-white/10'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className={cn('mb-4 flex items-center gap-2 font-bold uppercase tracking-widest text-white/60', isTV ? 'text-xs' : 'text-[10px]')}>
                    <MapPin className="h-3.5 w-3.5 text-[#696cff]" />
                    Ubicación
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedLocation(null)}
                      className={cn(
                        'focusable rounded-lg font-bold transition-all',
                        isTV ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
                        !selectedLocation ? 'bg-[#696cff] text-white shadow-lg shadow-[#696cff]/20' : 'bg-white/5 text-white/60 hover:bg-white/10'
                      )}
                    >
                      Todas
                    </button>
                    {locations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setSelectedLocation(loc)}
                        className={cn(
                          'focusable rounded-lg font-bold transition-all',
                          isTV ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
                          selectedLocation === loc ? 'bg-[#696cff] text-white shadow-lg shadow-[#696cff]/20' : 'bg-white/5 text-white/60 hover:bg-white/10'
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

          <div className={cn('mt-16 grid gap-6 text-pretty sm:grid-cols-2 lg:grid-cols-3', isTV && 'mt-20 gap-8')}>
            <div className={cn('group cursor-default rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md transition-all hover:bg-white/10', isTV && 'p-8')}>
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50 transition-colors group-hover:text-white">Sonido Cristalino</h3>
              <p className={cn('mt-2 text-sm font-medium leading-relaxed text-white/80', isTV && 'mt-3 text-base')}>
                Streaming de alta fidelidad optimizado para el menor consumo de datos.
              </p>
            </div>
            <div className={cn('group cursor-default rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md transition-all hover:bg-white/10', isTV && 'p-8')}>
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50 transition-colors group-hover:text-white">Sin Fronteras</h3>
              <p className={cn('mt-2 text-sm font-medium leading-relaxed text-white/80', isTV && 'mt-3 text-base')}>
                Sintonizá desde cualquier dispositivo, en cualquier lugar del mundo.
              </p>
            </div>
            <div className={cn('group cursor-default rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md transition-all hover:bg-white/10 sm:col-span-2 lg:col-span-1', isTV && 'p-8')}>
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50 transition-colors group-hover:text-white">POR LOCALIDAD</h3>
              <p className={cn('mt-2 text-sm font-medium leading-relaxed text-white/80', isTV && 'mt-3 text-base')}>
                Descubrí nuevas voces y géneros con nuestro buscador inteligente por ciudad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
