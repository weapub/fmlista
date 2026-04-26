import React, { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Star, Tv, X } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { AudioPlayer } from '@/components/AudioPlayer'
import { queryPublicTable } from '@/lib/publicSupabase'
import { useSeo } from '@/hooks/useSeo'
import { StreamingProgram } from '@/types/database'
import { buildYouTubeEmbedUrl, buildYouTubeThumbnailUrl } from '@/lib/youtube'

const Programs: React.FC = () => {
  const [programs, setPrograms] = useState<StreamingProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState<StreamingProgram | null>(null)

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://fmlista.com'

  useSeo({
    title: 'Programas en streaming | FM Lista',
    description:
      'Explora programas nacionales de YouTube seleccionados por FM Lista, organizados por categoría y en formato visual tipo catálogo.',
    url: `${siteUrl}/programas`,
    image: '/apple-touch-icon.png',
  })

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true)
        const data = await queryPublicTable<StreamingProgram>('streaming_programs', {
          select:
            'id,title,description,youtube_url,youtube_video_id,thumbnail_url,category,channel_name,is_featured,display_order,active,created_at',
          filters: [{ column: 'active', op: 'eq', value: true }],
          order: [
            { column: 'is_featured', ascending: false },
            { column: 'display_order', ascending: true },
            { column: 'created_at', ascending: false },
          ],
          limit: 120,
        })

        setPrograms(data || [])
      } catch (error) {
        console.error('Error fetching streaming programs:', error)
        setPrograms([])
      } finally {
        setLoading(false)
      }
    }

    void fetchPrograms()
  }, [])

  const featuredPrograms = useMemo(
    () => programs.filter((program) => program.is_featured).slice(0, 8),
    [programs]
  )

  const programsByCategory = useMemo(() => {
    return programs.reduce<Record<string, StreamingProgram[]>>((acc, program) => {
      const category = program.category?.trim() || 'General'
      if (!acc[category]) acc[category] = []
      acc[category].push(program)
      return acc
    }, {})
  }, [programs])

  const categoryEntries = useMemo(() => Object.entries(programsByCategory), [programsByCategory])

  const scrollCategoryRow = (rowId: string, direction: 'left' | 'right') => {
    const container = document.getElementById(rowId)
    if (!container) return
    const amount = Math.max(280, Math.floor(container.clientWidth * 0.8))
    container.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  const renderProgramCard = (program: StreamingProgram) => {
    const thumbnail = program.thumbnail_url || buildYouTubeThumbnailUrl(program.youtube_video_id) || '/apple-touch-icon.png'

    return (
      <button
        key={program.id}
        type="button"
        onClick={() => setSelectedProgram(program)}
        className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white text-left transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={thumbnail}
            alt={program.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <span className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#696cff] shadow">
            <Play className="h-4 w-4 translate-x-[1px]" />
          </span>
        </div>
        <div className="space-y-1 p-4">
          <p className="line-clamp-2 text-sm font-bold text-[#566a7f] dark:text-slate-100">{program.title}</p>
          {program.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-[#8a94a6] dark:text-slate-400">
              {program.description}
            </p>
          )}
          <p className="text-xs text-[#8a94a6] dark:text-slate-400">{program.channel_name || 'Canal nacional'}</p>
        </div>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f9] pb-32 transition-colors dark:bg-slate-950">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-10">
        <section className="rounded-3xl border border-slate-100 bg-white px-6 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#696cff]">FM Lista Streaming</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#566a7f] dark:text-white">Programas Nacionales</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#8a94a6] dark:text-slate-400">
                Un catálogo curado estilo plataforma para descubrir y reproducir los programas más importantes de YouTube.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#696cff]/20 bg-[#696cff]/10 px-3 py-2 text-xs font-bold uppercase text-[#696cff]">
              <Tv className="h-4 w-4" />
              {programs.length} disponibles
            </div>
          </div>
        </section>

        {loading ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-60 animate-pulse rounded-2xl bg-white dark:bg-slate-900" />
            ))}
          </section>
        ) : programs.length === 0 ? (
          <section className="rounded-2xl border border-slate-100 bg-white px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-bold text-[#566a7f] dark:text-white">Todavía no hay programas cargados</p>
            <p className="mt-2 text-sm text-[#8a94a6] dark:text-slate-400">
              En breve vamos a sumar nuevas selecciones destacadas desde YouTube.
            </p>
          </section>
        ) : (
          <>
            {featuredPrograms.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#696cff]" />
                  <h2 className="text-xl font-black text-[#566a7f] dark:text-white">Destacados</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredPrograms.map(renderProgramCard)}
                </div>
              </section>
            )}

            {categoryEntries.map(([category, categoryPrograms], index) => {
              const rowId = `program-row-${index}`
              return (
              <section key={category} className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-black text-[#566a7f] dark:text-white">{category}</h3>
                  <div className="hidden sm:flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollCategoryRow(rowId, 'left')}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-[#566a7f] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      aria-label={`Desplazar ${category} a la izquierda`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCategoryRow(rowId, 'right')}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-[#566a7f] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      aria-label={`Desplazar ${category} a la derecha`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div
                  id={rowId}
                  className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {categoryPrograms.map((program) => (
                    <div
                      key={program.id}
                      className="min-w-[80%] snap-start sm:min-w-[48%] lg:min-w-[31%] xl:min-w-[24%]"
                    >
                      {renderProgramCard(program)}
                    </div>
                  ))}
                </div>
              </section>
            )})}
          </>
        )}
      </main>
      <Footer className="pb-8" />
      <AudioPlayer />

      {selectedProgram && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Cerrar reproductor de programa"
            onClick={() => setSelectedProgram(null)}
          />
          <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{selectedProgram.title}</p>
                <p className="truncate text-xs text-slate-300">{selectedProgram.channel_name || 'Canal nacional'}</p>
                {selectedProgram.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{selectedProgram.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedProgram(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                title={selectedProgram.title}
                src={buildYouTubeEmbedUrl(selectedProgram.youtube_video_id) || selectedProgram.youtube_url}
                className="h-full w-full"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Programs
