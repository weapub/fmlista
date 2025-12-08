import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Radio as RadioIcon } from 'lucide-react'
import { Radio } from '@/types/database'
import { useRadioStore } from '@/stores/radioStore'
import { cn } from '@/lib/utils'

interface RadioCardProps {
  radio: Radio
  className?: string
}

export const RadioCard: React.FC<RadioCardProps> = ({ radio, className }) => {
  const navigate = useNavigate()
  const { currentRadio, setCurrentRadio, setIsPlaying } = useRadioStore()
  
  const isCurrentRadio = currentRadio?.id === radio.id
  
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isCurrentRadio) {
      setIsPlaying(true)
    } else {
      setCurrentRadio(radio)
      setIsPlaying(true)
    }
  }
  
  const handleCardClick = () => {
    navigate(`/radio/${radio.id}`)
  }
  
  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 cursor-pointer",
        className
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          {radio.logo_url ? (
            <img
              src={radio.logo_url}
              alt={radio.name}
              className="w-16 h-16 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <RadioIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 truncate">
            {radio.name}
          </h3>
          <p className="text-sm text-gray-600">
            {radio.frequency}
          </p>
          {radio.location && (
            <p className="text-sm text-gray-500">
              {radio.location}
            </p>
          )}
          {radio.category && (
            <span className="inline-block mt-1 px-2 py-1 text-xs bg-secondary-100 text-secondary-800 rounded-full">
              {radio.category}
            </span>
          )}
        </div>
        
        <button
          onClick={handlePlay}
          className={cn(
            "p-3 rounded-full transition-colors",
            isCurrentRadio
              ? "bg-secondary-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-secondary-100 hover:text-secondary-600"
          )}
        >
          <Play className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}