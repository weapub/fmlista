import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Pause, ArrowLeft, Radio as RadioIcon, MapPin, Heart, Share2, MonitorPlay } from 'lucide-react'
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

export const RadioMicrosite: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [radio, setRadio] = useState<RadioWithSchedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [coverError, setCoverError] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isTheaterMode, setIsTheaterMode] = useState(false)
  const isPlaceholderUrl = (url?: string | null) => !!url && url.includes('via.placeholder.com')
  
  const { currentRadio, setCurrentRadio, setIsPlaying } = useRadioStore()
  const { togglePlay, isPlaying } = useAudioPlayer()
  
  useEffect(() => {
    const fetchRadio = async () => {
      if (!id) return
      
      try {
        setIsLoading(true)
        const data = await api.getRadioById(id)
        setRadio(data)

        const storedFavs = localStorage.getItem('radio_favorites');
        if (storedFavs) {
          try {
            const favorites = JSON.parse(storedFavs);
            setIsFavorite(Array.isArray(favorites) && favorites.includes(id));
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
  }, [id])
  
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
    if (!id) return
    const favorites = JSON.parse(localStorage.getItem('radio_favorites') || '[]')
    let newFavorites
    if (isFavorite) {
      newFavorites = favorites.filter((favId: string) => favId !== id)
    } else {
      newFavorites = [...favorites, id]
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Radio no encontrada</h2>
            <p className="text-gray-600 mb-4">La emisora que buscas no existe o ha sido eliminada.</p>
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
  
  const shareUrl = `${window.location.origin}/radio/${radio.id}`
  
  return (
    <div className="min-h-screen bg-[#f5f5f9] pb-32">
      <Navigation />
      
      {/* Cover Image */}
      <div className={cn(
        "relative transition-all duration-500 ease-in-out bg-black overflow-hidden shadow-2xl",
        isTheaterMode ? "h-[60vh] md:h-[75vh]" : "h-64"
      )}>
        {isTheaterMode && radio.video_url ? (
          <div className="w-full h-full bg-black flex items-center justify-center">
            <ReactPlayer
              url={radio.video_url}
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
          className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-all border border-white/10"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
            <div className="flex flex-col gap-6 lg:flex-row items-start justify-between">
              <div className="flex flex-col sm:flex-row sm:items-start items-center gap-4">
                {radio.logo_url && !isPlaceholderUrl(radio.logo_url) && !logoError ? (
                  <img
                    src={radio.logo_url}
                    alt={radio.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                    loading="lazy"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                    <RadioIcon className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold text-[#566a7f] mb-2">
                    {radio.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-[#a1acb8]">
                    <span className="text-lg font-bold text-[#696cff]">{radio.frequency}</span>
                    {radio.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{radio.location}</span>
                      </div>
                    )}
                    {radio.category && (
                      <span className="px-3 py-1 bg-[#696cff]/10 text-[#696cff] rounded-full text-xs font-bold uppercase tracking-wider">
                        {radio.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {radio.video_url && (
                  <button
                    onClick={() => setIsTheaterMode(!isTheaterMode)}
                    className={cn(
                      "p-3 rounded-full border transition-all",
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
                      ? 'bg-red-50 border-red-200 text-red-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 rounded-full border bg-gray-50 border-gray-200 text-gray-400 hover:text-blue-500 transition-all"
                  title="Compartir"
                >
                  <Share2 className="w-6 h-6" />
                </button>
                <button
                  onClick={handlePlay}
                  className={`p-5 rounded-2xl transition-all shadow-lg active:scale-95 ${
                    isCurrentRadio && isPlaying
                      ? 'bg-[#696cff] text-white shadow-[#696cff]/30'
                      : 'bg-[#696cff] text-white hover:bg-[#5f61e6] shadow-[#696cff]/20'
                  }`}
                >
                  {isCurrentRadio && isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 fill-current" />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Description Section */}
            <div className="space-y-6">
              {radio.description && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-xl font-bold text-[#566a7f] mb-4">
                    Acerca de esta emisora
                  </h2>
                  <p className="text-[#697a8d] leading-relaxed">
                    {radio.description}
                  </p>
                </div>
              )}
              
              {/* Share Buttons */}
              <div id="share-section" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-lg font-bold text-[#566a7f] mb-4">
                  Compartir esta emisora
                </h3>
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
