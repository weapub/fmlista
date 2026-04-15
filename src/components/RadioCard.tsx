import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Radio as RadioIcon } from 'lucide-react'
import { Radio } from '@/types/database'
import { useRadioStore } from '@/stores/radioStore'
import { prewarmStream } from '@/hooks/useAudioPlayer'
import { cn } from '@/lib/utils'

interface RadioCardProps {
  radio: Radio
  className?: string
  isFeatured?: boolean
}

export const RadioCard: React.FC<RadioCardProps> = ({ radio, className, isFeatured }) => {
  const navigate = useNavigate()
  const { currentRadio, setCurrentRadio, isPlaying, setIsPlaying } = useRadioStore()
  const [logoError, setLogoError] = useState(false)
  const isPlaceholderUrl = (url?: string | null) => !!url && url.includes('via.placeholder.com')
  const handlePrewarm = () => {
    prewarmStream(radio.stream_url)
  }
  
  const isCurrentRadio = currentRadio?.id === radio.id
  
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    handlePrewarm()
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
      onMouseEnter={handlePrewarm}
      onFocus={handlePrewarm}
      onTouchStart={handlePrewarm}
      className={cn(
        "group relative overflow-hidden rounded-[1.75rem] border border-transparent bg-white dark:bg-gray-900 p-6 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.15)] transition duration-300 hover:-translate-y-1 hover:border-[#696cff]/30 hover:shadow-2xl hover:shadow-[#696cff]/10 focusable focus:outline-none focus:ring-4 focus:ring-[#696cff]/20",
        isFeatured && "border-yellow-300/50 bg-gradient-to-br from-white to-yellow-50 dark:from-gray-900 dark:to-yellow-950/20",
        className
      )}
      onClick={handleCardClick}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
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
          {isCurrentRadio && isPlaying && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-[#696cff] to-[#5f61e6] rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-md">
              <div className="flex gap-0.5 items-end h-3">
                <div className="w-0.5 h-1.5 bg-white animate-pulse" />
                <div className="w-0.5 h-2.5 bg-white animate-pulse delay-75" />
                <div className="w-0.5 h-2 bg-white animate-pulse delay-150" />
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-slate-700 dark:text-white line-clamp-2 group-hover:text-[#696cff] transition-colors">{radio.name}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-slate-500 font-medium dark:bg-slate-800 dark:text-slate-300">{radio.frequency}</span>
            {radio.location && <span className="rounded-full bg-slate-50 px-2.5 py-1 text-slate-500 font-medium dark:bg-slate-800 dark:text-slate-300">{radio.location}</span>}
          </div>
          {radio.category && (
            <span className="mt-3 inline-flex rounded-full bg-[#696cff]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#696cff] dark:bg-secondary-900 dark:text-secondary-200">
              {radio.category}
            </span>
          )}
        </div>

        <button
          onClick={handlePlay}
          className={cn(
            "self-start flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 sm:self-center transform active:scale-90",
            isCurrentRadio
              ? "bg-[#696cff] text-white shadow-lg shadow-[#696cff]/30"
              : "bg-slate-50 text-slate-400 hover:bg-[#696cff] hover:text-white dark:bg-gray-800 dark:text-slate-200 shadow-sm"
          )}
          aria-label={isCurrentRadio ? 'Continuar reproducción' : 'Reproducir radio'}
        >
          <Play className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
