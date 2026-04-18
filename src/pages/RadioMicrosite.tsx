import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Pause, ArrowLeft, Radio as RadioIcon, MapPin, Heart, Share2, MonitorPlay, BadgeCheck, Mic2, WandSparkles } from 'lucide-react'
import ReactPlayer from 'react-player'
import { api } from '@/lib/api'
import { RadioWithSchedule } from '@/types/database'
import { ScheduleDisplay } from '@/components/ScheduleDisplay'
import { ShareButtons } from '@/components/ShareButtons'
import { Navigation } from '@/components/Navigation'
import { AdBanner } from '@/components/AdBanner'
import { useRadioStore } from '@/stores/radioStore'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { AudioPlayer } from '@/components/AudioPlayer'
import { cn } from '@/lib/utils'
import { useDeviceStore } from '@/stores/deviceStore'
import { getMicrositeSlugFromHostname, getRadioPath } from '@/lib/microsites'
import { useSeo } from '@/hooks/useSeo'

export const RadioMicrosite: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>()
  const navigate = useNavigate()
  const [radio, setRadio] = useState<RadioWithSchedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [coverError, setCoverError] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isTheaterMode, setIsTheaterMode] = useState(false)
  const { isTV } = useDeviceStore()
  // ReactPlayer's type definitions can conflict with our setup; cast to any for JSX usage
  const RP: any = ReactPlayer as any;
  const isPlaceholderUrl = (url?: string | null) => !!url && url.includes('via.placeholder.com')
  
  const { currentRadio, setCurrentRadio, setIsPlaying } = useRadioStore()
  const { togglePlay, isPlaying } = useAudioPlayer()
  
  useEffect(() => {
    const fetchRadio = async () => {
      const hostnameSlug = typeof window !== 'undefined' ? getMicrositeSlugFromHostname() : null
      const identifier = hostnameSlug || slug || id

      if (!identifier) return
      
      try {
        setIsLoading(true)
        const data = hostnameSlug || slug
          ? await api.getRadioBySlug(identifier)
          : await api.getRadioById(identifier)
        setRadio(data)

        const storedFavs = localStorage.getItem('radio_favorites');
        if (storedFavs) {
          try {
            const favorites = JSON.parse(storedFavs);
            setIsFavorite(Array.isArray(favorites) && !!data?.id && favorites.includes(data.id));
          } catch (e) {
            console.error('Error parsing favorites:', e);
            localStorage.setItem('radio_favorites', '[]');
          }
        }
      } catch (error) {
        console.error('Error fetching radio:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRadio()
  }, [id, slug])
  
  const handlePlay = () => {
    if (!radio) return

    if (currentRadio?.id !== radio.id) {
      setCurrentRadio(radio)
      setIsPlaying(true)
      return
    }

    togglePlay()
  }
  
  const toggleFavorite = () => {
    if (!radio?.id) return
    const favorites = JSON.parse(localStorage.getItem('radio_favorites') || '[]')
    let newFavorites
    if (isFavorite) {
      newFavorites = favorites.filter((favId: string) => favId !== radio.id)
    } else {
      newFavorites = [...favorites, radio.id]
    }
    localStorage.setItem('radio_favorites', JSON.stringify(newFavorites))
    setIsFavorite(!isFavorite)
  }

  const handleShare = async () => {
    if (!radio) return
    const shareData = {
      title: radio.name,
      text: `Escucha ${radio.name} (${radio.frequency}) en vivo a través de FM Lista`,
      url: window.location.href,
    }

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Error sharing:', err)
      }
    } else {
      // Si no hay API nativa (escritorio), hacemos scroll a los botones de abajo
      document.getElementById('share-section')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const isCurrentRadio = currentRadio?.id === radio?.id
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${radio ? getRadioPath(radio) : window.location.pathname}`
    : radio ? getRadioPath(radio) : '/'
  const seoTitle = radio
    ? `${radio.name} en vivo | ${radio.frequency || 'FM Lista'}`
    : 'FM Lista | Radios en vivo de Formosa'
  const seoDescription = radio
    ? radio.description || `Escucha ${radio.name} en vivo${radio.frequency ? ` en ${radio.frequency}` : ''}${radio.location ? ` desde ${radio.location}` : ''}.`
    : 'Escucha radios en vivo de Formosa, descubre nuevas emisoras y accede a sus micrositios en un solo lugar.'
  const seoImage = radio?.cover_url || radio?.logo_url || '/apple-touch-icon.png'
  const editorialHighlights = radio
    ? [
        radio.category ? `${radio.name} conecta con oyentes que buscan ${radio.category.toLowerCase()} y una identidad sonora bien marcada.` : null,
        radio.location ? `${radio.location} aparece como base editorial de esta emisora, ideal para quienes quieren seguir de cerca la escena local.` : null,
        radio.frequency ? `Su frecuencia ${radio.frequency} ayuda a reforzar recordación de marca tanto en aire como en digital.` : null,
      ].filter(Boolean) as string[]
    : []

  useSeo({
    title: seoTitle,
    description: seoDescription,
    url: shareUrl,
    image: seoImage,
    siteName: 'FM Lista',
    jsonLd: radio
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'RadioStation',
            name: radio.name,
            description: seoDescription,
            url: shareUrl,
            image: seoImage,
            logo: radio.logo_url || seoImage,
            address: radio.location || undefined,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: seoTitle,
            description: seoDescription,
            url: shareUrl,
            primaryImageOfPage: seoImage,
          },
        ]
      : {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: seoTitle,
          description: seoDescription,
          url: shareUrl,
          primaryImageOfPage: seoImage,
        },
  })
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
        <Navigation />
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200"></div>
          <div className="container mx-auto px-4 py-8">
            <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-96 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (!radio) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <RadioIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Radio no encontrada</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">La emisora que buscas no existe o ha sido eliminada.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-[#696cff] text-white rounded-lg hover:bg-[#5f61e6] transition-colors shadow-md shadow-[#696cff]/20"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#f5f5f9] dark:bg-slate-950 pb-32 transition-colors">
      <Navigation />
      
      {/* Cover Image */}
      <div className={cn(
        "relative transition-all duration-500 ease-in-out bg-black overflow-hidden shadow-2xl",
        isTheaterMode ? "h-[60vh] md:h-[75vh]" : "h-64",
        isTV && !isTheaterMode && "h-[32rem]"
      )}>
        {isTheaterMode && radio.video_stream_url ? (
          <div className="w-full h-full bg-black flex items-center justify-center">
            <RP
              url={radio.video_stream_url}
              width="100%"
              height="100%"
              playing={isPlaying}
              controls={true}
              volume={useRadioStore.getState().volume}
            />
          </div>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-[#696cff] to-[#5f61e6]">
              {radio.cover_url && !isPlaceholderUrl(radio.cover_url) && !coverError ? (
                <img
                  src={radio.cover_url}
                  alt={radio.name}
                  className="w-full h-full object-cover opacity-60"
                  loading="lazy"
                  onError={() => setCoverError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <RadioIcon className="w-24 h-24 text-white opacity-30" />
                </div>
              )}
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30"></div>
          </>
        )}
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className={cn("absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-all border border-white/10 focusable", isTV && "p-4 rounded-3xl")}
        >
          <ArrowLeft className={cn("text-white", isTV ? "w-8 h-8" : "w-6 h-6")} />
        </button>
      </div>
      
      {/* Content */}
      <div className={cn("container mx-auto px-4 py-8", isTV && "px-8 py-10")}>
        <div className={cn("max-w-4xl mx-auto", isTV && "max-w-6xl")}>
          {/* Header Section */}
          <div className={cn("bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 mb-8 transition-colors", isTV && "rounded-[2rem] p-10 mb-10")}>
            <div className="flex flex-col gap-6 lg:flex-row items-start justify-between">
              <div className={cn("flex flex-col sm:flex-row sm:items-start items-center gap-4", isTV && "gap-6")}>
                {radio.logo_url && !isPlaceholderUrl(radio.logo_url) && !logoError ? (
                  <img
                    src={radio.logo_url}
                    alt={radio.name}
                    className={cn("rounded-full object-cover border-4 border-white shadow-lg", isTV ? "w-28 h-28" : "w-20 h-20")}
                    loading="lazy"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className={cn("rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg", isTV ? "w-28 h-28" : "w-20 h-20")}>
                    <RadioIcon className={cn("text-gray-400", isTV ? "w-14 h-14" : "w-10 h-10")} />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className={cn("font-bold text-[#566a7f] dark:text-white mb-2", isTV ? "text-5xl" : "text-3xl")}>
                    {radio.name}
                  </h1>
                  <div className={cn("flex flex-wrap items-center gap-3 text-[#a1acb8] dark:text-slate-400", isTV && "gap-4 text-lg")}>
                    <span className={cn("font-bold text-[#696cff]", isTV ? "text-2xl" : "text-lg")}>{radio.frequency}</span>
                    {radio.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className={cn(isTV ? "w-5 h-5" : "w-4 h-4")} />
                        <span>{radio.location}</span>
                      </div>
                    )}
                    {radio.category && (
                      <span className={cn("bg-[#696cff]/10 text-[#696cff] rounded-full font-bold uppercase tracking-wider", isTV ? "px-4 py-2 text-sm" : "px-3 py-1 text-xs")}>
                        {radio.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={cn("flex flex-wrap items-center gap-3", isTV && "gap-4")}>
                {radio.video_stream_url && (
                  <button
                    onClick={() => setIsTheaterMode(!isTheaterMode)}
                    className={cn(
                      "p-3 rounded-full border transition-all focusable",
                      isTV && "p-4",
                      isTheaterMode 
                        ? "bg-[#696cff] border-[#696cff] text-white shadow-lg shadow-[#696cff]/30" 
                        : "bg-gray-50 border-gray-200 text-gray-400 hover:text-[#696cff] hover:border-[#696cff]/30"
                    )}
                    title={isTheaterMode ? "Cerrar Modo Teatro" : "Modo Teatro (Video)"}
                  >
                    <MonitorPlay className="w-6 h-6" />
                  </button>
                )}
                <button
                  onClick={toggleFavorite}
                className={`p-3 rounded-full border transition-all ${
                    isFavorite 
                      ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-900 text-red-500' 
                      : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 hover:text-red-500'
                  } ${isTV ? 'focusable p-4' : 'focusable'}`}
                >
                  <Heart className={`${isTV ? 'w-7 h-7' : 'w-6 h-6'} ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className={cn("p-3 rounded-full border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 hover:text-blue-500 transition-all focusable", isTV && "p-4")}
                  title="Compartir"
                >
                  <Share2 className={cn(isTV ? "w-7 h-7" : "w-6 h-6")} />
                </button>
                <button
                  onClick={handlePlay}
                  className={cn(`rounded-2xl transition-all shadow-lg active:scale-95 focusable ${
                    isCurrentRadio && isPlaying
                      ? 'bg-[#696cff] text-white shadow-[#696cff]/30'
                      : 'bg-[#696cff] text-white hover:bg-[#5f61e6] shadow-[#696cff]/20'
                  }`, isTV ? 'p-6 rounded-[1.75rem]' : 'p-5')}
                >
                  {isCurrentRadio && isPlaying ? <Pause className={cn(isTV ? "w-9 h-9" : "w-7 h-7")} /> : <Play className={cn("fill-current", isTV ? "w-9 h-9" : "w-7 h-7")} />}
                </button>
              </div>
            </div>
          </div>
          
          <div className={cn("grid grid-cols-1 gap-8 lg:grid-cols-2", isTV && "gap-10")}>
            {/* Description Section */}
            <div className="space-y-6">
              <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-3", isTV && "gap-5")}>
                <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
                  <div className="inline-flex rounded-2xl bg-[#696cff]/10 p-3 text-[#696cff]">
                    <Mic2 className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#a1acb8] dark:text-slate-500">Identidad</p>
                  <p className="mt-2 text-base font-bold text-[#566a7f] dark:text-white">
                    {radio.category || 'Programación generalista'}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#697a8d] dark:text-slate-300">
                    Una propuesta con personalidad clara para oyentes que buscan una senal reconocible.
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
                  <div className="inline-flex rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#a1acb8] dark:text-slate-500">Cobertura</p>
                  <p className="mt-2 text-base font-bold text-[#566a7f] dark:text-white">
                    {radio.location || 'Disponible online en todo momento'}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#697a8d] dark:text-slate-300">
                    Ideal para seguir la escena local o entrar desde cualquier lugar sin perder contexto.
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
                  <div className="inline-flex rounded-2xl bg-amber-500/10 p-3 text-amber-600">
                    <WandSparkles className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#a1acb8] dark:text-slate-500">Descubrimiento</p>
                  <p className="mt-2 text-base font-bold text-[#566a7f] dark:text-white">
                    {radio.frequency ? `Súmate a ${radio.frequency}` : `Conoce ${radio.name}`}
                  </p>
                </div>
              </div>

              {radio.description && (
                <div className={cn("bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 transition-colors", isTV && "rounded-[2rem] p-10")}>
                  <h2 className={cn("font-bold text-[#566a7f] dark:text-white mb-4", isTV ? "text-3xl" : "text-xl")}>
                    Acerca de esta emisora
                  </h2>
                  <p className={cn("text-[#697a8d] dark:text-slate-300 leading-relaxed", isTV && "text-lg leading-8")}>
                    {radio.description}
                  </p>
                </div>
              )}

              {editorialHighlights.length > 0 && (
                <div className={cn("bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 transition-colors", isTV && "rounded-[2rem] p-10")}>
                  <h2 className={cn("font-bold text-[#566a7f] dark:text-white mb-4", isTV ? "text-3xl" : "text-xl")}>
                    Por qué seguir esta emisora
                  </h2>
                  <div className="space-y-3">
                    {editorialHighlights.map((highlight) => (
                      <div key={highlight} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4 dark:bg-slate-800/60">
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#696cff]" />
                        <p className={cn("text-[#697a8d] dark:text-slate-300 leading-relaxed", isTV && "text-lg leading-8")}>
                          {highlight}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Share Buttons */}
              <div id="share-section" className={cn("bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 transition-colors", isTV && "rounded-[2rem] p-10")}>
                <h3 className={cn("font-bold text-[#566a7f] dark:text-white mb-4", isTV ? "text-2xl" : "text-lg")}>
                  Compartir esta emisora
                </h3>
                <p className="mb-4 text-sm text-[#697a8d] dark:text-slate-300">
                  Llévala a WhatsApp, redes o compártela directo con tu audiencia para ayudar a que el micrositio siga creciendo.
                </p>
                <ShareButtons
                  url={shareUrl}
                  title={radio.name}
                  description={radio.description || `Escucha ${radio.name} en ${radio.frequency}`}
                />
              </div>
            </div>
            
            {/* Schedule Section */}
            <div>
              <ScheduleDisplay schedule={radio.schedule} />
              <AdBanner position="microsite_sidebar" className="mt-6" radioId={radio.id} />
            </div>
          </div>
        </div>
      </div>
      <AudioPlayer />
    </div>
  )
}

export default RadioMicrosite
