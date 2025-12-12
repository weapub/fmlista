import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Radio as RadioIcon } from 'lucide-react'
import { Radio } from '@/types/database'
import { useRadioStore } from '@/stores/radioStore'
import { cn } from '@/lib/utils'

interface RadioCardProps {
  radio: Radio
  className?: string
  isFeatured?: boolean
}

export const RadioCard: React.FC<RadioCardProps> = ({ radio, className, isFeatured }) => {
  const navigate = useNavigate()
  const { currentRadio, setCurrentRadio, setIsPlaying } = useRadioStore()
  const [logoError, setLogoError] = useState(false)
  const isPlaceholderUrl = (url?: string | null) => !!url && url.includes('via.placeholder.com')
  
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
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleCardClick();
        }
      }}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 cursor-pointer relative overflow-hidden focusable focus:ring-4 focus:ring-secondary-500 focus:outline-none",
        isFeatured && "border-2 border-yellow-400 dark:border-yellow-600 bg-gradient-to-br from-white to-yellow-50 dark:from-gray-800 dark:to-yellow-900/20",
        className
      )}
      onClick={handleCardClick}
    >
      {isFeatured && (
        <div className="absolute top-0 right-0">
          <div className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
            DESTACADO
          </div>
        </div>
      )}
      <div className="flex items-center space-x-4">
        <div className="relative">
          {radio.logo_url && !isPlaceholderUrl(radio.logo_url) && !logoError ? (
            <img
              src={radio.logo_url}
              alt={radio.name}
              className="w-16 h-16 rounded-full object-cover"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <RadioIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
            {radio.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {radio.frequency}
          </p>
          {radio.location && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {radio.location}
            </p>
          )}
          {radio.category && (
            <span className="inline-block mt-1 px-2 py-1 text-xs bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 rounded-full">
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
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-secondary-100 dark:hover:bg-secondary-900 hover:text-secondary-600 dark:hover:text-secondary-400"
          )}
        >
          <Play className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
