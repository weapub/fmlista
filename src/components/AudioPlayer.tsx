import React from 'react'
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack } from 'lucide-react'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { useRadioStore } from '@/stores/radioStore'
import { cn } from '@/lib/utils'

export const AudioPlayer: React.FC = () => {
  const { currentRadio, isPlaying, volume } = useRadioStore()
  const { togglePlay, setVolume } = useAudioPlayer()
  
  if (!currentRadio) {
    return null
  }
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value))
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={togglePlay}
                className="p-2 bg-secondary-500 text-white rounded-full hover:bg-secondary-600 transition-colors flex-shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              {currentRadio.logo_url && (
                <img
                  src={currentRadio.logo_url}
                  alt={currentRadio.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                  {currentRadio.name}
                </h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  {currentRadio.frequency}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setVolume(volume === 0 ? 1 : 0)}
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
                className="w-16 sm:w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}