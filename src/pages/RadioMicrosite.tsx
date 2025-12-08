import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, ArrowLeft, Radio as RadioIcon, MapPin } from 'lucide-react'
import { api } from '@/lib/api'
import { RadioWithSchedule } from '@/types/database'
import { ScheduleDisplay } from '@/components/ScheduleDisplay'
import { ShareButtons } from '@/components/ShareButtons'
import { Navigation } from '@/components/Navigation'
import { useRadioStore } from '@/stores/radioStore'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'

export const RadioMicrosite: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [radio, setRadio] = useState<RadioWithSchedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const { currentRadio } = useRadioStore()
  const { togglePlay, isPlaying } = useAudioPlayer()
  
  useEffect(() => {
    const fetchRadio = async () => {
      if (!id) return
      
      try {
        setIsLoading(true)
        const data = await api.getRadioById(id)
        setRadio(data)
      } catch (error) {
        console.error('Error fetching radio:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRadio()
  }, [id])
  
  const handlePlay = () => {
    if (radio) {
      togglePlay()
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
              className="px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 transition-colors"
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-secondary-500 to-secondary-700">
        {radio.cover_url ? (
          <img
            src={radio.cover_url}
            alt={radio.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-secondary-500 to-secondary-700 flex items-center justify-center">
            <RadioIcon className="w-24 h-24 text-white opacity-50" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full hover:bg-opacity-30 transition-all"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                {radio.logo_url && (
                  <img
                    src={radio.logo_url}
                    alt={radio.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {radio.name}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <span className="text-lg font-semibold">{radio.frequency}</span>
                    {radio.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{radio.location}</span>
                      </div>
                    )}
                    {radio.category && (
                      <span className="px-3 py-1 bg-secondary-100 text-secondary-800 rounded-full text-sm font-medium">
                        {radio.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handlePlay}
                className={`p-4 rounded-full transition-colors ${
                  isCurrentRadio && isPlaying
                    ? 'bg-secondary-500 text-white'
                    : 'bg-secondary-500 text-white hover:bg-secondary-600'
                }`}
              >
                <Play className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Description Section */}
            <div className="space-y-6">
              {radio.description && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Acerca de esta emisora
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {radio.description}
                  </p>
                </div>
              )}
              
              {/* Share Buttons */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}