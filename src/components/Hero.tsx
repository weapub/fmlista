import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Search, Filter, Radio, MapPin, Tag, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useRadioStore } from '@/stores/radioStore'
import { cn } from '@/lib/utils'
import { useDeviceStore } from '@/stores/deviceStore'
import { optimizeSupabaseImageUrl } from '@/lib/imageOptimization'
import { fetchAppSettings } from '@/lib/publicSupabase'

interface HeroProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export const Hero: React.FC<HeroProps> = ({ searchTerm, onSearchChange }) => {
  const HERO_FALLBACK_IMAGE = '/live-on-air-radio-podcast-600nw.png'
  const navigate = useNavigate()
  const { isTV } = useDeviceStore()
  const searchAreaRef = useRef<HTMLDivElement | null>(null)
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 768px)').matches
  })
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
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isSearchPinned, setIsSearchPinned] = useState(false)
  const [showAllCities, setShowAllCities] = useState(false)
  const [isHeroBackdropBroken, setIsHeroBackdropBroken] = useState(false)
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const [text, setText] = useState('en tiempo real.')
  const [isDeleting, setIsDeleting] = useState(false)
  const [loopNum, setLoopNum] = useState(0)
  const [typingSpeed, setTypingSpeed] = useState(100)
  const phrases = ['en alta definiciÃ³n.', 'vayas donde vayas.', 'como nunca antes.', 'en tiempo real.']
  const typingEnabled = !isTV && !isMobileViewport
  const notifySearchFocus = () => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new Event('hero-search-focus'))
  }
  const notifySearchBlur = () => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new Event('hero-search-blur'))
  }

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

  useEffect(() => {
    if (typeof window === 'undefined' || !isMobileViewport || isInputFocused) {
      setIsSearchPinned(false)
      return
    }

    const onScroll = () => {
      setIsSearchPinned(window.scrollY > 260)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isMobileViewport, isInputFocused])

  const categories = useMemo(
    () => Array.from(new Set(radios.map((r) => r.category).filter(Boolean))).sort(),
    [radios]
  )

  const locations = useMemo(
    () => Array.from(new Set(radios.map((r) => r.location).filter(Boolean))).sort(),
    [radios]
  )

  const locationCounts = useMemo(() => {
    const counts = new Map<string, number>()
    radios.forEach((radio) => {
      if (!radio.location) return
      counts.set(radio.location, (counts.get(radio.location) ?? 0) + 1)
    })
    return counts
  }, [radios])

  const topLocations = useMemo(
    () => Array.from(locationCounts.entries()).sort((a, b) => b[1] - a[1]).map(([city]) => city),
    [locationCounts]
  )

  const quickCities = useMemo(() => topLocations.slice(0, 8), [topLocations])
  const extraCities = useMemo(() => topLocations.slice(8), [topLocations])
  const cityTags = useMemo(() => {
    if (!searchTerm.trim()) return locations.slice(0, 8)
    const term = searchTerm.toLowerCase()
    return locations.filter((loc) => loc.toLowerCase().includes(term)).slice(0, 8)
  }, [locations, searchTerm])

  const suggestions = useMemo(() => {
    if (!deferredSearchTerm) return []
    const term = deferredSearchTerm.toLowerCase()
    return radios
      .filter((r) => r.name.toLowerCase().includes(term) || r.location?.toLowerCase().includes(term))
      .slice(0, 5)
  }, [deferredSearchTerm, radios])
  const citySuggestions = useMemo(() => {
    if (!deferredSearchTerm.trim()) return []
    const term = deferredSearchTerm.toLowerCase()
    return locations.filter((loc) => loc.toLowerCase().includes(term)).slice(0, 4)
  }, [locations, deferredSearchTerm])

  const mergedSuggestions = useMemo(
    () => [
      ...citySuggestions.map((city) => ({ type: 'city' as const, city })),
      ...suggestions.map((radio) => ({ type: 'radio' as const, radio })),
    ],
    [citySuggestions, suggestions]
  )

  const recentSuggestions = useMemo(() => {
    if (!recentSearches.length) return []
    const term = deferredSearchTerm.trim().toLowerCase()
    if (!term) return recentSearches.slice(0, 6)
    return recentSearches.filter((value) => value.toLowerCase().includes(term)).slice(0, 6)
  }, [recentSearches, deferredSearchTerm])

  const optimizedHeroImage = useMemo(
    () => optimizeSupabaseImageUrl(heroImage, { width: isTV ? 1920 : 1280, quality: 72 }),
    [heroImage, isTV]
  )
  const normalizedHeroImage = useMemo(() => {
    const value = heroImage.trim()
    if (!value || value === 'null' || value === 'undefined') return ''
    return value
  }, [heroImage])
  const heroBackdrop = isHeroBackdropBroken
    ? HERO_FALLBACK_IMAGE
    : optimizedHeroImage || normalizedHeroImage || HERO_FALLBACK_IMAGE

  useEffect(() => {
    setIsHeroBackdropBroken(false)
  }, [optimizedHeroImage, normalizedHeroImage])

  useEffect(() => {
    const hasLiveSuggestions = suggestions.length > 0 || citySuggestions.length > 0
    const hasRecentSuggestions = recentSuggestions.length > 0
    setShowSuggestions(isInputFocused && (hasLiveSuggestions || hasRecentSuggestions))
  }, [suggestions, citySuggestions, recentSuggestions, isInputFocused])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('fm_recent_searches')
      if (!raw) return
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter(Boolean).slice(0, 6))
      }
    } catch (error) {
      console.error('Error loading recent searches:', error)
    }
  }, [])

  useEffect(() => {
    if (!showSuggestions || mergedSuggestions.length === 0) {
      setActiveSuggestionIndex(-1)
      return
    }
    if (activeSuggestionIndex >= mergedSuggestions.length) {
      setActiveSuggestionIndex(0)
    }
  }, [showSuggestions, mergedSuggestions, activeSuggestionIndex])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowSuggestions(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleSuggestionClick = (radio: typeof radios[0]) => {
    saveRecentSearch(radio.name)
    notifySearchBlur()
    onSearchChange(radio.name)
    setShowSuggestions(false)
    const targetPath = radio.slug ? `/${radio.slug}` : `/radio/${radio.id}`
    navigate(targetPath)
  }

  const handleCityTagClick = (city: string) => {
    saveRecentSearch(city)
    notifySearchBlur()
    onSearchChange(city)
    setShowSuggestions(false)
    navigate(`/ciudad/${encodeURIComponent(city)}`)
  }

  const handleCitySelectChange = (city: string) => {
    if (!city) return
    handleCityTagClick(city)
  }

  const saveRecentSearch = (value: string) => {
    const normalized = value.trim()
    if (normalized.length < 2) return

    setRecentSearches((prev) => {
      const next = [normalized, ...prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 6)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('fm_recent_searches', JSON.stringify(next))
      }
      return next
    })
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || mergedSuggestions.length === 0) {
      if (event.key === 'ArrowDown' && searchTerm.trim()) {
        setShowSuggestions(true)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveSuggestionIndex((prev) => (prev + 1) % mergedSuggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSuggestionIndex((prev) => (prev <= 0 ? mergedSuggestions.length - 1 : prev - 1))
      return
    }

    if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
      event.preventDefault()
      const selected = mergedSuggestions[activeSuggestionIndex]
      if (selected.type === 'city') {
        handleCityTagClick(selected.city)
      } else {
        handleSuggestionClick(selected.radio)
      }
      return
    }

    if (event.key === 'Escape') {
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)
    }

    if (event.key === 'Enter' && activeSuggestionIndex < 0 && searchTerm.trim()) {
      saveRecentSearch(searchTerm)
    }
  }

  const handleRecentSuggestionClick = (term: string) => {
    const normalized = term.trim().toLowerCase()
    if (!normalized) return

    saveRecentSearch(term)
    onSearchChange(term)

    const matchedCity = locations.find((loc) => loc.toLowerCase() === normalized)
    if (matchedCity) {
      notifySearchBlur()
      setShowSuggestions(false)
      navigate(`/ciudad/${encodeURIComponent(matchedCity)}`)
      return
    }

    const matchedRadio = radios.find((radio) => radio.name.toLowerCase() === normalized)
    if (matchedRadio) {
      handleSuggestionClick(matchedRadio)
      return
    }

    setShowSuggestions(false)
    notifySearchBlur()
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settings = await fetchAppSettings(['app_hero_image'])
        const heroImageValue = String(settings.app_hero_image ?? '').trim()

        if (heroImageValue) {
          setHeroImage(heroImageValue)
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('app_hero_image_url', heroImageValue)
          }
        }
      } catch (e) {
        console.error('Error loading hero data:', e)
      }
    }

    void fetchData()
  }, [])

  return (
    <div
      className={cn(
        'relative left-1/2 mb-12 w-screen -translate-x-1/2 overflow-hidden shadow-[0_24px_80px_rgba(3,7,18,0.35)]',
        isTV && 'mb-16'
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#172554] to-[#1e3a8a]" />
      <div className="absolute inset-0 bg-black/35" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[-24%] h-[58%] w-[58%] rounded-full bg-white/[0.06] opacity-70 md:opacity-90 md:blur-[110px]" />
        <div className="absolute bottom-[-24%] right-[-12%] h-[46%] w-[46%] rounded-full bg-blue-300/[0.08] opacity-70 md:opacity-90 md:blur-[110px]" />
      </div>

      <div className="absolute inset-0 opacity-25 md:opacity-30">
        <img
          src={heroBackdrop}
          alt="Hero Background"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover grayscale"
          onError={() => setIsHeroBackdropBroken(true)}
        />
      </div>

      <div
        className={cn(
          'relative mx-auto max-w-6xl px-6 py-12 text-center text-white md:px-16 md:py-20',
          isTV && 'px-10 py-16 md:px-20 md:py-24'
        )}
      >
        <div className="mx-auto max-w-5xl">
          <span className={cn('inline-flex rounded-full border border-white/25 bg-white/[0.08] px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/95 shadow-sm', isTV && 'px-6 py-2 text-xs')}>
            Radios de Formosa en vivo
          </span>

          <h1 className={cn('mx-auto mt-7 max-w-4xl text-4xl font-black leading-[1.05] tracking-[-0.03em] md:text-6xl', isTV && 'max-w-5xl text-5xl md:text-7xl')}>
            Elegí tu radio de Formosa y escuchá en vivo
          </h1>

          <p className={cn('mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/90 text-pretty md:text-xl', isTV && 'max-w-4xl text-lg md:text-2xl')}>
            Encontrá emisoras por nombre o ciudad en segundos.
          </p>

          <div className={cn('mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row', isTV && 'mt-8 gap-4')}>
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('hero-search') as HTMLInputElement | null
                input?.focus()
              }}
              className={cn(
                'inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#1e3a8a] shadow-lg shadow-black/20 transition-transform hover:scale-[1.01] hover:bg-white/95',
                isTV && 'px-8 py-3.5 text-base'
              )}
            >
              Escuchar ahora
            </button>
            <button
              type="button"
              onClick={() => {
                const fallbackCity = topLocations[0] ?? locations[0]
                if (!fallbackCity) return
                navigate(`/ciudad/${encodeURIComponent(fallbackCity)}`)
              }}
              className={cn(
                'inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/[0.02] px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white/90 transition-colors hover:bg-white/[0.08]',
                isTV && 'px-8 py-3.5 text-base'
              )}
            >
              Ver ciudades
            </button>
          </div>

          <div className={cn('mx-auto mt-6 grid max-w-xl grid-cols-2 gap-2 rounded-2xl border border-white/15 bg-white/[0.04] p-3', isTV && 'max-w-2xl gap-3 p-4')}>
            <div className="rounded-xl bg-white/[0.06] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Emisoras</p>
              <p className={cn('mt-1 text-xl font-black text-white', isTV && 'text-2xl')}>{radios.length}+</p>
            </div>
            <div className="rounded-xl bg-white/[0.06] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Ciudades</p>
              <p className={cn('mt-1 text-xl font-black text-white', isTV && 'text-2xl')}>{locations.length}</p>
            </div>
          </div>

          <div
            ref={searchAreaRef}
            className={cn(
              'relative mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center',
              isTV && 'mt-12 gap-6',
              isMobileViewport && isSearchPinned && 'fixed inset-x-3 top-3 z-[75] mt-0 rounded-2xl border border-white/20 bg-[#0f172a]/85 p-2 shadow-2xl backdrop-blur-xl'
            )}
          >
            <div className="group relative w-full sm:w-auto">
              <Search className={cn('pointer-events-none absolute left-5 top-1/2 z-20 -translate-y-1/2 text-white', isTV ? 'h-6 w-6' : 'h-5 w-5')} strokeWidth={3} />
              <input
                id="hero-search"
                type="text"
                placeholder="Buscar emisora o ciudad"
                value={searchTerm}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
                aria-controls="hero-search-suggestions"
                aria-activedescendant={
                  activeSuggestionIndex >= 0 ? `hero-suggestion-${activeSuggestionIndex}` : undefined
                }
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => {
                  notifySearchFocus()
                  setIsInputFocused(true)
                  if (suggestions.length > 0 || citySuggestions.length > 0 || recentSuggestions.length > 0) setShowSuggestions(true)
                }}
                onBlur={() => {
                  // Delay corto para no cortar taps en sugerencias
                  window.setTimeout(() => {
                    setIsInputFocused(false)
                    notifySearchBlur()
                  }, 120)
                }}
                onKeyDown={handleInputKeyDown}
                className={cn(
                  'relative z-10 w-full rounded-2xl border border-white/30 bg-white/[0.08] py-4 pl-14 pr-12 text-lg font-bold text-white shadow-xl transition-all placeholder:text-white/65 focus:bg-white/[0.14] focus:outline-none focus:ring-4 focus:ring-white/25 sm:min-w-[400px]',
                  isMobileViewport && isSearchPinned && 'py-3 text-base',
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

            {showSuggestions && (
              <div
                id="hero-search-suggestions"
                role="listbox"
                className={cn(
                  'absolute left-1/2 top-full z-[90] mt-1 w-full -translate-x-1/2 overflow-hidden rounded-[2rem] border border-white/20 bg-[#1e293b]/90 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl',
                  isMobileViewport
                    ? 'max-h-[32vh] w-[calc(100%-0.5rem)] max-w-xl overflow-y-auto rounded-2xl'
                    : 'max-w-xl',
                  isTV && !isMobileViewport && 'max-w-3xl'
                )}
              >
                {citySuggestions.length > 0 && (
                  <div className={cn('border-b border-white/10 px-3 py-2', isMobileViewport && 'px-2 py-1.5')}>
                    <p className="px-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Ciudades</p>
                    <ul>
                      {citySuggestions.map((city) => (
                        <li
                          key={`city-${city}`}
                          id={`hero-suggestion-${citySuggestions.findIndex((item) => item === city)}`}
                          role="option"
                          aria-selected={activeSuggestionIndex === citySuggestions.findIndex((item) => item === city)}
                          onClick={() => handleCityTagClick(city)}
                          className={cn(
                            'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm text-white transition hover:bg-white/10',
                            activeSuggestionIndex === citySuggestions.findIndex((item) => item === city) &&
                              'bg-white/15',
                            isMobileViewport && 'gap-2 px-3 py-2 text-xs',
                            isTV && !isMobileViewport && 'px-6 py-4 text-base'
                          )}
                        >
                          <div className="min-w-0">
                            <div className={cn('truncate font-bold', isTV && 'text-xl')}>{city}</div>
                            <div className={cn('text-xs text-white/55', isMobileViewport && 'text-[11px]', isTV && !isMobileViewport && 'text-sm')}>Ver radios de esta ciudad</div>
                          </div>
                          <Search className={cn('text-[#696cff]', isTV ? 'h-6 w-6' : 'h-5 w-5')} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {suggestions.length > 0 && (
                  <div className={cn('px-3 py-2', isMobileViewport && 'px-2 py-1.5')}>
                    <p className="px-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Emisoras</p>
                    <ul>
                      {suggestions.map((radio) => (
                        <li
                          key={radio.id}
                          id={`hero-suggestion-${citySuggestions.length + suggestions.findIndex((item) => item.id === radio.id)}`}
                          role="option"
                          aria-selected={
                            activeSuggestionIndex ===
                            citySuggestions.length + suggestions.findIndex((item) => item.id === radio.id)
                          }
                          onClick={() => handleSuggestionClick(radio)}
                          className={cn(
                            'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm text-white transition hover:bg-white/10',
                            activeSuggestionIndex ===
                              citySuggestions.length + suggestions.findIndex((item) => item.id === radio.id) &&
                              'bg-white/15',
                            isMobileViewport && 'gap-2 px-3 py-2 text-xs',
                            isTV && !isMobileViewport && 'px-6 py-4 text-base'
                          )}
                        >
                          <div>
                            <div className={cn('text-lg font-bold', isMobileViewport && 'text-sm', isTV && !isMobileViewport && 'text-2xl')}>{radio.name}</div>
                            {radio.location && <div className={cn('text-xs font-medium text-white/50', isMobileViewport && 'text-[11px]', isTV && !isMobileViewport && 'text-sm')}>{radio.location}</div>}
                          </div>
                          <Search className={cn('text-[#696cff]', isTV ? 'h-6 w-6' : 'h-5 w-5')} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {suggestions.length === 0 && citySuggestions.length === 0 && recentSuggestions.length > 0 && (
                  <div className={cn('px-3 py-2', isMobileViewport && 'px-2 py-1.5')}>
                    <p className="px-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Recientes</p>
                    <ul>
                    {recentSuggestions.map((term) => (
                      <li
                        key={`recent-${term}`}
                        role="option"
                        aria-selected={false}
                        onClick={() => handleRecentSuggestionClick(term)}
                        className={cn(
                            'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm text-white transition hover:bg-white/10',
                            isMobileViewport && 'gap-2 px-3 py-2 text-xs',
                            isTV && !isMobileViewport && 'px-6 py-4 text-base'
                          )}
                        >
                          <div className="min-w-0">
                            <div className={cn('truncate font-bold', isTV && 'text-xl')}>{term}</div>
                            <div className={cn('text-xs text-white/55', isMobileViewport && 'text-[11px]', isTV && !isMobileViewport && 'text-sm')}>BÃºsqueda reciente</div>
                          </div>
                          <Search className={cn('text-[#696cff]', isTV ? 'h-6 w-6' : 'h-5 w-5')} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {suggestions.length === 0 && citySuggestions.length === 0 && recentSuggestions.length === 0 && searchTerm.trim().length > 0 && (
                  <div className={cn('px-4 py-4 text-center', isMobileViewport && 'px-3 py-3')}>
                    <p className={cn('text-sm font-semibold text-white/85', isMobileViewport && 'text-xs')}>
                      No encontramos resultados para "{searchTerm.trim()}"
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onSearchChange('')
                        setShowSuggestions(false)
                        const fallbackCity = topLocations[0] ?? locations[0]
                        if (!fallbackCity) return
                        navigate(`/ciudad/${encodeURIComponent(fallbackCity)}`)
                      }}
                      className={cn(
                        'mt-3 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1e293b] transition hover:bg-white/90',
                        isTV && !isMobileViewport && 'px-5 py-2.5 text-sm'
                      )}
                    >
                      Ver radios disponibles
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <Link
              to="/planes"
              className={cn('inline-flex items-center gap-2 text-sm font-bold text-white/85 underline decoration-white/35 underline-offset-4 transition-colors hover:text-white', isTV && 'text-base')}
            >
              <Radio className="h-4 w-4" />
              Ver planes para radios y publicidad
            </Link>
          </div>
          <div className="mt-4 rounded-3xl border border-white/15 bg-white/[0.05] px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="flex items-center justify-center gap-2 text-white/90">
                <MapPin className="h-4 w-4" />
                <p className="text-xs font-black uppercase tracking-[0.18em]">ElegÃ­ ciudad</p>
              </div>

              {isMobileViewport ? (
                <div className="mx-auto w-full max-w-md">
                  <select
                    value=""
                    onChange={(event) => handleCitySelectChange(event.target.value)}
                    className="w-full rounded-2xl border border-white/30 bg-white/[0.08] px-4 py-3 text-sm font-bold text-white outline-none"
                    aria-label="Seleccionar ciudad"
                  >
                    <option value="" disabled>
                      Seleccionar ciudad...
                    </option>
                    {topLocations.map((city) => (
                      <option key={city} value={city} className="text-slate-900">
                        {city} ({locationCounts.get(city) ?? 0})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {quickCities.map((city) => (
                      <button
                        key={`quick-${city}`}
                        type="button"
                        onClick={() => handleCityTagClick(city)}
                        className={cn(
                          'focusable rounded-full border border-white/35 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/20',
                          isTV && 'px-4 py-2 text-sm'
                        )}
                        aria-label={`Ver radios de ${city}`}
                      >
                        {city} <span className="text-white/70">({locationCounts.get(city) ?? 0})</span>
                      </button>
                    ))}
                  </div>

                  {extraCities.length > 0 && (
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAllCities((prev) => !prev)}
                        className="text-[11px] font-black uppercase tracking-[0.16em] text-white/85 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
                      >
                        {showAllCities ? 'Ver menos' : 'Ver todas'}
                      </button>

                      {showAllCities && (
                        <div className="flex max-h-36 flex-wrap items-start justify-center gap-2 overflow-y-auto">
                          {extraCities.map((city) => (
                            <button
                              key={`more-${city}`}
                              type="button"
                              onClick={() => handleCityTagClick(city)}
                              className="focusable rounded-full border border-white/25 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/90 transition-colors hover:bg-white/[0.12]"
                              aria-label={`Ver radios de ${city}`}
                            >
                              {city} ({locationCounts.get(city) ?? 0})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {showFilters && (
            <div className={cn('absolute left-1/2 z-40 mt-4 w-full max-w-2xl -translate-x-1/2 rounded-[2rem] border border-white/20 bg-[#1e293b]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200', isTV && 'max-w-4xl p-8')}>
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className={cn('font-bold text-white', isTV && 'text-2xl')}>Filtros de bÃºsqueda</h3>
                {(selectedLocation || selectedCategory) && (
                  <button
                    onClick={() => {
                      setSelectedCategory(null)
                      setSelectedLocation(null)
                    }}
                    className={cn('font-black uppercase tracking-widest text-[#696cff] transition-colors hover:text-white', isTV ? 'text-xs' : 'text-[10px]')}
                  >
                    Limpiar filtros
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
                    GÃ©neros musicales
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
                    UbicaciÃ³n
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

          <section className={cn('mt-16', isTV && 'mt-20')} aria-labelledby="hero-benefits-heading">
            <h2 id="hero-benefits-heading" className="sr-only">
              Beneficios de FM Lista
            </h2>
          <div className={cn('grid gap-6 text-pretty sm:grid-cols-2 lg:grid-cols-3', isTV && 'gap-8')}>
            <div className={cn('group cursor-default rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left transition-all hover:bg-white/[0.08]', isTV && 'p-8')}>
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50 transition-colors group-hover:text-white">Sonido Cristalino</h3>
              <p className={cn('mt-2 text-sm font-medium leading-relaxed text-white/80', isTV && 'mt-3 text-base')}>
                Streaming de alta fidelidad optimizado para el menor consumo de datos.
              </p>
            </div>
            <div className={cn('group cursor-default rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left transition-all hover:bg-white/[0.08]', isTV && 'p-8')}>
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50 transition-colors group-hover:text-white">Sin Fronteras</h3>
              <p className={cn('mt-2 text-sm font-medium leading-relaxed text-white/80', isTV && 'mt-3 text-base')}>
                SintonizÃ¡ desde cualquier dispositivo, en cualquier lugar del mundo.
              </p>
            </div>
            <div className={cn('group cursor-default rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left transition-all hover:bg-white/[0.08] sm:col-span-2 lg:col-span-1', isTV && 'p-8')}>
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50 transition-colors group-hover:text-white">POR LOCALIDAD</h3>
              <p className={cn('mt-2 text-sm font-medium leading-relaxed text-white/80', isTV && 'mt-3 text-base')}>
                DescubrÃ­ nuevas voces y gÃ©neros con nuestro buscador inteligente por ciudad.
              </p>
            </div>
          </div>
          </section>
        </div>
      </div>
    </div>
  )
}

