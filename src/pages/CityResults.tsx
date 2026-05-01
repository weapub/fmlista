import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Radio as RadioIcon, Search } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { RadioCard } from '@/components/RadioCard'
import { AudioPlayer } from '@/components/AudioPlayer'
import { useSeo } from '@/hooks/useSeo'
import { queryPublicTable } from '@/lib/publicSupabase'
import { Radio } from '@/types/database'
import { useRadioStore } from '@/stores/radioStore'

const RADIO_LIST_SELECT = 'id,name,slug,logo_url,cover_url,frequency,location,category,stream_url,created_at'

export default function CityResults() {
  const AUTOLOAD_STORAGE_KEY = 'city-results-autoload-enabled'
  const { city } = useParams<{ city: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const decodedCity = useMemo(() => decodeURIComponent(city ?? ''), [city])
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') ?? '')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => searchParams.get('category'))
  const [radios, setRadios] = useState<Radio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(() => {
    const fromQuery = searchParams.get('autoload')
    if (fromQuery === 'true') return true
    if (fromQuery === 'false') return false
    if (typeof window === 'undefined') return true
    const stored = window.localStorage.getItem(AUTOLOAD_STORAGE_KEY)
    return stored === null ? true : stored === 'true'
  })
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const setStoreRadios = useRadioStore((state) => state.setRadios)
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://fmlista.com'
  const PAGE_SIZE = 12

  useSeo({
    title: decodedCity ? `Radios en vivo de ${decodedCity} | FM Lista` : 'Radios por ciudad | FM Lista',
    description: decodedCity
      ? `Escuchá radios en vivo de ${decodedCity} en FM Lista.`
      : 'Escuchá radios en vivo por ciudad en FM Lista.',
    url: `${siteUrl}/ciudad/${encodeURIComponent(decodedCity)}`,
    image: '/apple-touch-icon.png',
    siteName: 'FM Lista',
  })

  const fetchCityRadios = async (pageNum: number) => {
    if (!decodedCity) {
      setRadios([])
      setHasMore(false)
      setIsLoading(false)
      setIsLoadingMore(false)
      return
    }

    try {
      if (pageNum === 0) setIsLoading(true)
      else setIsLoadingMore(true)

      const data = await queryPublicTable<Radio>('radios', {
        select: RADIO_LIST_SELECT,
        filters: [{ column: 'location', op: 'eq', value: decodedCity }],
        order: [{ column: 'created_at', ascending: false }],
        range: { from: pageNum * PAGE_SIZE, to: pageNum * PAGE_SIZE + PAGE_SIZE - 1 },
      })

      const rows = data ?? []
      setRadios((prev) => (pageNum === 0 ? rows : [...prev, ...rows]))
      setHasMore(rows.length === PAGE_SIZE)
    } catch (error) {
      console.error('Error fetching city radios:', error)
      if (pageNum === 0) setRadios([])
      setHasMore(false)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    setPage(0)
    setHasMore(true)
    setRadios([])
    void fetchCityRadios(0)
  }, [decodedCity])

  useEffect(() => {
    setStoreRadios(radios)
  }, [radios, setStoreRadios])

  const filteredRadios = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return radios.filter((radio) => {
      const matchesSearch =
        !term || radio.name.toLowerCase().includes(term) || radio.frequency?.toLowerCase().includes(term)
      const matchesCategory = !selectedCategory || radio.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [radios, searchTerm, selectedCategory])

  const categories = useMemo(
    () => Array.from(new Set(radios.map((radio) => radio.category).filter(Boolean))).sort(),
    [radios]
  )

  const handleLoadMore = () => {
    if (isLoading || isLoadingMore || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    void fetchCityRadios(nextPage)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(AUTOLOAD_STORAGE_KEY, String(autoLoadEnabled))
  }, [autoLoadEnabled])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)
    if (searchTerm.trim()) nextParams.set('q', searchTerm.trim())
    else nextParams.delete('q')

    if (selectedCategory) nextParams.set('category', selectedCategory)
    else nextParams.delete('category')

    nextParams.set('autoload', String(autoLoadEnabled))
    setSearchParams(nextParams, { replace: true })
  }, [searchTerm, selectedCategory, autoLoadEnabled, setSearchParams])

  useEffect(() => {
    if (!autoLoadEnabled || searchTerm.trim() || !hasMore || isLoading || isLoadingMore) return

    const sentinel = document.getElementById('city-results-loader')
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [autoLoadEnabled, searchTerm, hasMore, isLoading, isLoadingMore, page])

  return (
    <div className="min-h-screen bg-[#f5f5f9] pb-32 transition-colors dark:bg-slate-950">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-8 rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al inicio
          </Link>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#696cff]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#696cff]">
            <MapPin className="h-3.5 w-3.5" />
            Ciudad
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            Radios en vivo de {decodedCity || 'tu ciudad'}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isLoading ? 'Buscando emisoras...' : `${filteredRadios.length} emisoras encontradas`}
          </p>
          <div className="relative mt-4 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por nombre o frecuencia"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#696cff] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>
          {categories.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Categorías</p>
                {(selectedCategory || searchTerm.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(null)
                      setSearchTerm('')
                    }}
                    className="text-xs font-semibold text-[#696cff] hover:text-[#5f61e6]"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedCategory === null
                      ? 'bg-[#696cff] text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  Todas
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category!)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedCategory === category
                        ? 'bg-[#696cff] text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-[1.5rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
            ))}
          </div>
        ) : filteredRadios.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white/70 py-12 text-center dark:border-slate-800 dark:bg-slate-900/70">
            <RadioIcon className="mx-auto mb-4 h-16 w-16 text-slate-300 dark:text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No hay emisoras disponibles</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Probá con otra ciudad desde el buscador.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRadios.map((radio) => (
                <RadioCard key={radio.id} radio={radio} />
              ))}
            </div>
            {!searchTerm.trim() && hasMore && (
              <div id="city-results-loader" className="mt-8 flex flex-col items-center gap-3">
                {autoLoadEnabled && (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Cargando automáticamente al llegar al final
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoLoadEnabled((prev) => !prev)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {autoLoadEnabled ? 'Pausar auto-carga' : 'Activar auto-carga'}
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="rounded-xl bg-[#696cff] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5f61e6] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoadingMore ? 'Cargando...' : 'Cargar más'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer className="pb-8" />
      <AudioPlayer />
    </div>
  )
}
