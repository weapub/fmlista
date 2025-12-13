import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactPlayer from 'react-player'
import { Play, ArrowLeft, Radio as RadioIcon, MapPin, Heart, MessageCircle, Star, Send, Phone, ListMusic, Plus, Facebook, Instagram, Twitter, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { RadioWithSchedule, Review, ChatMessage } from '@/types/database'
import { ScheduleDisplay } from '@/components/ScheduleDisplay'
import { ShareButtons } from '@/components/ShareButtons'
import { Navigation } from '@/components/Navigation'
import { AdBanner } from '@/components/AdBanner'
import { Footer } from '@/components/Footer'
import { useRadioStore } from '@/stores/radioStore'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { useRadioListeners } from '@/hooks/useRadioListeners'

export const RadioMicrosite: React.FC = () => {
  const { id, idOrSlug } = useParams<{ id?: string, idOrSlug?: string }>()
  const navigate = useNavigate()
  // Use explicit typing for radio to handle ScheduleItem[] correctly
  const [radio, setRadio] = useState<RadioWithSchedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [coverError, setCoverError] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const isPlaceholderUrl = (url?: string | null) => !!url && url.includes('via.placeholder.com')
  
  const { currentRadio, setCurrentRadio, setIsPlaying, isPlaying } = useRadioStore()
  const { user } = useAuthStore()
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }
  
  const [isFavorite, setIsFavorite] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' })
  const [newMessage, setNewMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'chat' | 'reviews'>('info')
  const [playingVideo, setPlayingVideo] = useState(false)
  const [videoMode, setVideoMode] = useState(false)

  // Real-time listener tracking
  const listenerCount = useRadioListeners(radio?.id)

  // Playlist State
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [userPlaylists, setUserPlaylists] = useState<any[]>([])

  useEffect(() => {
    if (showPlaylistModal && user) {
      const saved = localStorage.getItem(`playlists_${user.id}`)
      if (saved) {
        setUserPlaylists(JSON.parse(saved))
      }
    }
  }, [showPlaylistModal, user])

  const addToPlaylist = (playlistId: string) => {
    if (!user || !radio) return
    
    const playlists = [...userPlaylists]
    const playlistIndex = playlists.findIndex(p => p.id === playlistId)
    
    if (playlistIndex !== -1) {
      const playlist = playlists[playlistIndex]
      // Check if radio already exists
      if (!playlist.radios.some((r: any) => r.id === radio.id)) {
        playlist.radios.push(radio)
        playlists[playlistIndex] = playlist
        localStorage.setItem(`playlists_${user.id}`, JSON.stringify(playlists))
        alert('Añadido a la playlist')
      } else {
        alert('Ya está en esta playlist')
      }
    }
    setShowPlaylistModal(false)
  }

  useEffect(() => {
    const fetchRadioData = async () => {
      const param = id || idOrSlug;
      if (!param) return
      
      try {
        setIsLoading(true)
        
        let data: RadioWithSchedule | null = null;
        
        // Check if param is UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
        
        if (isUUID) {
             data = await api.getRadioById(param);
        } else {
             data = await api.getRadioBySlug(param);
        }

        if (!data) {
            setRadio(null);
            return;
        }

        // Ensure data matches RadioWithSchedule by explicitly typing the response or transforming if needed
        // Assuming api.getRadioById returns compatible structure but TypeScript might need reassurance on schedule
        setRadio(data as unknown as RadioWithSchedule)
        
        const radioId = data.id;

        // Fetch additional data if user is logged in or for public views
        if (user) {
          const { data: favData } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', user.id)
            .eq('radio_id', radioId)
            .single()
          setIsFavorite(!!favData)
        }

        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*, user:users(full_name, avatar_url)')
          .eq('radio_id', radioId)
          .order('created_at', { ascending: false })
        setReviews(reviewsData || [])

        const { data: chatData } = await supabase
          .from('chat_messages')
          .select('*, user:users(full_name, avatar_url)')
          .eq('radio_id', radioId)
          .order('created_at', { ascending: true })
          .limit(50)
        setChatMessages(chatData || [])

      } catch (error) {
        console.error('Error fetching radio data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRadioData()
    
    // Determine radioId for subscription
    // Since radio state might not be set yet, we can't rely on it for subscription immediately if we used `id` param directly before.
    // However, subscription depends on `radio.id`.
    // We should probably move subscription inside a separate effect that depends on `radio`.
  }, [id, idOrSlug, user])
  
  // Chat subscription effect
  useEffect(() => {
    if (!radio?.id) return;
    
    const chatSubscription = supabase
      .channel(`radio_chat:${radio.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages', 
        filter: `radio_id=eq.${radio.id}` 
      }, async (payload) => {
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, avatar_url')
          .eq('id', payload.new.user_id)
          .single()
        
        const newMessage = { ...payload.new, user: userData } as ChatMessage
        setChatMessages(prev => [...prev, newMessage])
      })
      .subscribe()

    return () => {
      chatSubscription.unsubscribe()
    }
  }, [radio?.id]);

  const toggleFavorite = async () => {
    if (!user || !radio) {
      navigate('/login')
      return
    }

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('radio_id', radio.id)
      setIsFavorite(false)
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: user.id, radio_id: radio.id })
      setIsFavorite(true)
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !radio) return

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        radio_id: radio.id,
        rating: newReview.rating,
        comment: newReview.comment
      })
      .select('*, user:users(full_name, avatar_url)')
      .single()

    if (data) {
      setReviews([data, ...reviews])
      setNewReview({ rating: 5, comment: '' })
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !radio || !newMessage.trim()) return

    await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        radio_id: radio.id,
        message: newMessage.trim()
      })
    
    setNewMessage('')
  }
  
  const handlePlay = () => {
    if (!radio) return

    if (currentRadio?.id === radio.id) {
      if (!isPlaying) {
        setPlayingVideo(false)
      }
      togglePlay()
    } else {
      // Stop current playback before switching to avoid double playback issues
      if (isPlaying) {
        setIsPlaying(false)
      }
      // If video is playing, stop it
      if (playingVideo) {
        setPlayingVideo(false)
      }
      
      // Small timeout to ensure clean state transition
      setTimeout(() => {
        setCurrentRadio(radio)
        setIsPlaying(true)
      }, 50)
    }
  }
  
  const handleVideoStart = () => {
    setVideoMode(true)
    setPlayingVideo(true)
    setIsPlaying(false)
  }

  const handleVideoPlay = () => {
    setPlayingVideo(true)
    if (isPlaying) {
      setIsPlaying(false)
    }
  }

  const handleVideoPause = () => {
    setPlayingVideo(false)
  }
  
  const isCurrentRadio = currentRadio?.id === radio?.id
  const Player = ReactPlayer as any
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Navigation />
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-800"></div>
          <div className="container mx-auto px-4 py-8">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
            <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (!radio) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Navigation />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="text-center">
            <RadioIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Radio no encontrada</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">La emisora que buscas no existe o ha sido eliminada.</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  const shareUrl = radio.slug 
    ? `${window.location.origin}/${radio.slug}`
    : `${window.location.origin}/radio/${radio.id}`
  
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300 ${currentRadio ? 'pb-32' : 'pb-8'}`}>
      <Navigation />
      
      {/* Video or Cover Image */}
      <div className={`relative ${radio.video_stream_url ? 'h-64 md:h-96' : 'h-64'} bg-black group`}>
        {radio.video_stream_url ? (
          <div className="w-full h-full">
            {!videoMode ? (
               <div className="relative w-full h-full cursor-pointer" onClick={handleVideoStart}>
                 {/* Cover Image Background */}
                 <div className="absolute inset-0 bg-gradient-to-r from-secondary-500 to-secondary-700">
                    {radio.cover_url && !isPlaceholderUrl(radio.cover_url) && !coverError ? (
                      <img
                        src={radio.cover_url}
                        alt={radio.name}
                        className="w-full h-full object-cover opacity-80"
                        onError={() => setCoverError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <RadioIcon className="w-24 h-24 text-white opacity-50" />
                      </div>
                    )}
                 </div>
                 {/* Play Button Overlay */}
                 <div className="absolute inset-0 flex items-center justify-center z-10">
                   <button className="p-4 bg-secondary-500 rounded-full text-white shadow-lg transform transition-transform group-hover:scale-110">
                     <Play className="w-8 h-8 fill-current" />
                   </button>
                 </div>
               </div>
            ) : (
               <Player
                 url={radio.video_stream_url}
                 width="100%"
                 height="100%"
                 controls
                 playing={playingVideo}
                 onPlay={handleVideoPlay}
                 onPause={handleVideoPause}
                 config={{
                    file: {
                        forceHLS: radio.video_stream_url.endsWith('.m3u8')
                    }
                 }}
               />
            )}
          </div>
        ) : (
          <>
            <div className="w-full h-full bg-gradient-to-r from-secondary-500 to-secondary-700">
              {radio.cover_url && !isPlaceholderUrl(radio.cover_url) && !coverError ? (
                <img
                  src={radio.cover_url}
                  alt={radio.name}
                  className="w-full h-full object-cover"
                  onError={() => setCoverError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <RadioIcon className="w-24 h-24 text-white opacity-50" />
                </div>
              )}
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          </>
        )}
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full hover:bg-opacity-30 transition-all z-10"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 py-0">
        <AdBanner position="microsite_top" radioId={radio.id} />
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8 transition-colors">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full">
                {radio.logo_url && !isPlaceholderUrl(radio.logo_url) && !logoError ? (
                  <img
                    src={radio.logo_url}
                    alt={radio.name}
                    className="w-24 h-24 md:w-20 md:h-20 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-24 h-24 md:w-20 md:h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
                    <RadioIcon className="w-12 h-12 md:w-10 md:h-10 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                <div className="text-center md:text-left w-full">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {radio.name}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 text-gray-600 dark:text-gray-300">
                    <span className="text-lg font-semibold">{radio.frequency}</span>
                    {radio.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="whitespace-normal text-center md:text-left">{radio.location}</span>
                      </div>
                    )}
                    {radio.category && (
                      <span className="px-3 py-1 bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 rounded-full text-sm font-medium whitespace-nowrap">
                        {radio.category}
                      </span>
                    )}
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{listenerCount} {listenerCount === 1 ? 'oyente' : 'oyentes'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handlePlay}
                className={`p-4 rounded-full transition-colors flex-shrink-0 ${
                  isCurrentRadio && isPlaying
                    ? 'bg-secondary-500 text-white'
                    : 'bg-secondary-500 text-white hover:bg-secondary-600'
                }`}
              >
                {isCurrentRadio && isPlaying ? (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className="w-2 h-6 bg-white rounded-sm animate-pulse mr-1"></div>
                    <div className="w-2 h-6 bg-white rounded-sm animate-pulse delay-75"></div>
                  </div>
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </button>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 gap-4">
              <div className="flex items-center justify-center space-x-4 w-full md:w-auto">
                <button
                  onClick={toggleFavorite}
                  title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  className={`flex items-center justify-center p-3 rounded-full transition-colors ${
                    isFavorite 
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => user ? setShowPlaylistModal(true) : navigate('/login')}
                  title="Añadir a lista"
                  className="flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <ListMusic className="w-5 h-5" />
                </button>
                
                {radio.whatsapp && (
                  <a
                    href={`https://wa.me/${radio.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors w-full md:w-auto"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
              
              <div className="flex items-center justify-center space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                 <button
                   onClick={() => setActiveTab('info')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-1 md:flex-none ${
                     activeTab === 'info' ? 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                   }`}
                 >
                   Información
                 </button>
                 <button
                   onClick={() => setActiveTab('reviews')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-1 md:flex-none ${
                     activeTab === 'reviews' ? 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                   }`}
                 >
                   Reseñas ({reviews.length})
                 </button>
                 <button
                   onClick={() => setActiveTab('chat')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-1 md:flex-none ${
                     activeTab === 'chat' ? 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                   }`}
                 >
                   Chat
                 </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
            {activeTab === 'info' && (
              <>
                {/* Description & Details */}
                <div className="space-y-6">
                  {(radio.description || radio.address || radio.social_facebook || radio.social_instagram || radio.social_twitter) && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Acerca de esta emisora
                      </h2>
                      {radio.description && (
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                          {radio.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {radio.address && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{radio.address}</span>
                          </div>
                        )}
                        {radio.whatsapp && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4" />
                            <span>{radio.whatsapp}</span>
                          </div>
                        )}
                      </div>

                      {/* Social Links */}
                      {(radio.social_facebook || radio.social_instagram || radio.social_twitter) && (
                         <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex space-x-4">
                           {radio.social_facebook && (
                             <a href={radio.social_facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors" title="Facebook">
                               <Facebook className="w-5 h-5" />
                             </a>
                           )}
                           {radio.social_instagram && (
                             <a href={radio.social_instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors" title="Instagram">
                               <Instagram className="w-5 h-5" />
                             </a>
                           )}
                           {radio.social_twitter && (
                             <a href={radio.social_twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500 transition-colors" title="X (Twitter)">
                               <Twitter className="w-5 h-5" />
                             </a>
                           )}
                         </div>
                      )}
                    </div>
                  )}
                  
                  {/* Share Buttons */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
                  <ScheduleDisplay schedule={radio.schedule || []} />
                </div>
              </>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Escribe una reseña</h3>
                  {user ? (
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                            className={`p-1 ${newReview.rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                          >
                            <Star className="w-6 h-6 fill-current" />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={newReview.comment}
                        onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="Comparte tu opinión sobre esta radio..."
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        rows={3}
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600"
                      >
                        Publicar Reseña
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400">Ingresa para dejar una reseña.</p>
                      <button onClick={() => navigate('/login')} className="mt-2 text-secondary-600 dark:text-secondary-400 font-medium hover:underline">
                        Ingresar
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                           <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                             {review.user?.avatar_url ? (
                               <img src={review.user.avatar_url} alt="" className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                                 {review.user?.full_name?.charAt(0) || 'U'}
                               </div>
                             )}
                           </div>
                           <span className="font-medium text-gray-900 dark:text-white">{review.user?.full_name || 'Usuario'}</span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex text-yellow-400 mb-2">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aún no hay reseñas. ¡Sé el primero!</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-[600px] flex flex-col transition-colors">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chat en Vivo</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Conversa con otros oyentes</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex items-start space-x-3 ${msg.user_id === user?.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                           {msg.user?.avatar_url ? (
                             <img src={msg.user.avatar_url} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                               {msg.user?.full_name?.charAt(0) || 'U'}
                             </div>
                           )}
                        </div>
                        <div className={`max-w-[70%] rounded-lg p-3 ${
                          msg.user_id === user?.id 
                            ? 'bg-secondary-500 text-white rounded-tr-none' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                        }`}>
                          <div className="text-xs opacity-75 mb-1">
                            {msg.user?.full_name || 'Usuario'}
                          </div>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                    {chatMessages.length === 0 && (
                      <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <p>No hay mensajes recientes. ¡Saluda!</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    {user ? (
                      <form onSubmit={handleSendMessage} className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Escribe un mensaje..."
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-secondary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="p-2 bg-secondary-500 text-white rounded-full hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </form>
                    ) : (
                      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        <button onClick={() => navigate('/login')} className="text-secondary-600 dark:text-secondary-400 hover:underline">
                          Ingresa
                        </button>
                        {' '}para participar en el chat.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>

            {/* Sidebar with Ads */}
            <div className="lg:col-span-1">
                 <div className="sticky top-8">
                     <AdBanner position="microsite_sidebar" radioId={radio.id} />
                 </div>
            </div>
          </div>
        </div>
      </div>
      <Footer className={currentRadio ? 'pb-32' : 'pb-8'} />
      
      {/* Playlist Selection Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Guardar en Playlist</h3>
            
            {userPlaylists.length > 0 ? (
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {userPlaylists.map(playlist => (
                  <button
                    key={playlist.id}
                    onClick={() => addToPlaylist(playlist.id)}
                    className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-3"
                  >
                    <ListMusic className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{playlist.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 mb-4 text-center">
                No tienes playlists creadas.
              </p>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
               <button
                 onClick={() => navigate('/library')}
                 className="text-secondary-600 dark:text-secondary-400 text-sm font-medium hover:underline flex items-center"
               >
                 <Plus className="w-4 h-4 mr-1" />
                 Nueva Playlist
               </button>
               <button
                 onClick={() => setShowPlaylistModal(false)}
                 className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
               >
                 Cancelar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
