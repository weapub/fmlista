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
        "group relative overflow-hidden rounded-[1.75rem] border border-transparent bg-white dark:bg-gray-900 p-5 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 hover:border-secondary-200/50 hover:shadow-xl focusable focus:outline-none focus:ring-4 focus:ring-secondary-500/20",
        isFeatured && "border-yellow-300/50 bg-gradient-to-br from-white to-yellow-50 dark:from-gray-900 dark:to-yellow-950/20",
        className
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          {radio.logo_url && !isPlaceholderUrl(radio.logo_url) && !logoError ? (
            <img
              src={radio.logo_url}
              alt={radio.name}
              loading="lazy"
              className="h-20 w-20 rounded-3xl object-cover border border-gray-100 dark:border-gray-800"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gray-100 dark:bg-gray-800">
              <RadioIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
          )}
          {isCurrentRadio && (
            <span className="absolute bottom-0 left-0 -translate-y-2 rounded-full bg-secondary-500 px-2 py-1 text-[11px] font-semibold text-white shadow-lg shadow-secondary-500/20">
              En reproducción
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2">{radio.name}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{radio.frequency}</span>
            {radio.location && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{radio.location}</span>}
          </div>
          {radio.category && (
            <span className="mt-3 inline-flex rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-700 dark:bg-secondary-900 dark:text-secondary-200">
              {radio.category}
            </span>
          )}
        </div>

        <button
          onClick={handlePlay}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-3xl transition-colors duration-200",
            isCurrentRadio
              ? "bg-secondary-500 text-white shadow-lg shadow-secondary-500/20"
              : "bg-slate-100 text-slate-700 hover:bg-secondary-100 dark:bg-gray-800 dark:text-slate-200 dark:hover:bg-secondary-900"
          )}
          aria-label={isCurrentRadio ? 'Continuar reproducción' : 'Reproducir radio'}
        >
          <Play className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
