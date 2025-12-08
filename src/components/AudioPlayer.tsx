import React from 'react'
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, ChevronDown } from 'lucide-react'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { useRadioStore } from '@/stores/radioStore'
import { cn } from '@/lib/utils'
import { NowPlayingInfo } from '@/components/NowPlayingInfo'

export const AudioPlayer: React.FC = () => {
  const { 
    currentRadio, 
    isPlaying, 
    volume, 
    radios, 
    isPlayerExpanded,
    setCurrentRadio, 
    setIsPlaying,
    setIsPlayerExpanded,
    setVolume: setStoreVolume
  } = useRadioStore()
  
  const { togglePlay, setVolume } = useAudioPlayer()
  
  if (!currentRadio) {
    return null
  }
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    setVolume(parseFloat(e.target.value))
  }

  const goPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!radios || radios.length === 0 || !currentRadio) return
    const idx = radios.findIndex(r => r.id === currentRadio.id)
    const prevIdx = (idx - 1 + radios.length) % radios.length
    setCurrentRadio(radios[prevIdx])
    setIsPlaying(true)
  }

  const goNext = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!radios || radios.length === 0 || !currentRadio) return
    const idx = radios.findIndex(r => r.id === currentRadio.id)
    const nextIdx = (idx + 1) % radios.length
    setCurrentRadio(radios[nextIdx])
    setIsPlaying(true)
  }

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    togglePlay()
  }

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setVolume(volume === 0 ? 1 : 0)
  }

  const handleMiniPlayerClick = () => {
    setIsPlayerExpanded(true)
  }

  // Expanded Player UI
  if (isPlayerExpanded) {
    return (
      <div className={cn("fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-300")}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => setIsPlayerExpanded(false)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronDown className="w-8 h-8" />
          </button>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-widest">
            Reproduciendo ahora
          </div>
          <div className="w-12" /> {/* Spacer for balance */}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8 space-y-8 mt-12">
          {/* Album Art / Logo */}
          <div className="w-full max-w-sm aspect-square bg-gray-100 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
            {currentRadio.logo_url ? (
              <img
                src={currentRadio.logo_url}
                alt={currentRadio.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-300">
                <Play className="w-24 h-24" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="w-full max-w-sm text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {currentRadio.name}
            </h2>
            <p className="text-lg text-secondary-600 font-medium">
              {currentRadio.frequency}
            </p>
            <div className="flex justify-center pt-2">
               <NowPlayingInfo radio={currentRadio} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-8 pb-16 w-full max-w-md mx-auto space-y-8">
          {/* Progress / Live Indicator */}
          <div className="flex items-center justify-between text-xs font-medium text-gray-500">
             <span className="text-red-500 flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               EN VIVO
             </span>
             <span>Internet Radio</span>
          </div>

          {/* Main Buttons */}
          <div className="flex items-center justify-center space-x-10">
            <button
              onClick={(e) => goPrev(e)}
              className="p-4 text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            >
              <SkipBack className="w-8 h-8" />
            </button>
            
            <button
              onClick={(e) => handleTogglePlay(e)}
              className="p-6 bg-secondary-500 text-white rounded-full shadow-lg hover:bg-secondary-600 hover:scale-105 transition-all"
            >
              {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
            </button>

            <button
              onClick={(e) => goNext(e)}
              className="p-4 text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            >
              <SkipForward className="w-8 h-8" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center space-x-4 mb-8">
            <button onClick={handleMuteToggle} className="text-gray-500">
              {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary-500"
              style={{
                background: `linear-gradient(to right, #f97316 ${volume * 100}%, #e5e7eb ${volume * 100}%)`
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Mini Player UI
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={handleMiniPlayerClick}
      style={{ display: isPlayerExpanded ? 'none' : 'block' }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            {/* Controls (Mini) */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleTogglePlay}
                className="p-2 bg-secondary-500 text-white rounded-full hover:bg-secondary-600 transition-colors flex-shrink-0 z-10"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={goPrev}
                className="hidden sm:flex p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0 z-10"
                title="Anterior"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={goNext}
                className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0 z-10"
                title="Siguiente"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
            
            {/* Info (Mini) */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              {currentRadio.logo_url && (
                <img
                  src={currentRadio.logo_url}
                  alt={currentRadio.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-md object-cover flex-shrink-0 shadow-sm"
                />
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                  {currentRadio.name}
                </h4>
                <div className="text-xs sm:text-sm text-gray-600 truncate">
                   <NowPlayingInfo radio={currentRadio} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Volume (Mini) - Hidden on mobile to save space or keep if desired */}
          <div className="hidden sm:flex items-center space-x-2 sm:space-x-4 z-10">
            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleMuteToggle}
                className="p-1 text-gray-600 hover:text-gray-900 flex-shrink-0"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary-500"
                style={{
                  background: `linear-gradient(to right, #f97316 ${volume * 100}%, #e5e7eb ${volume * 100}%)`
                }}
              />
            </div>
          </div>

          {/* Expand Button (Mobile/Desktop hint) */}
          <button className="sm:hidden p-2 text-gray-400">
             <ChevronDown className="w-5 h-5 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  )
}
