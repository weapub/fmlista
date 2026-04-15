import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Radio as RadioIcon } from 'lucide-react'
import { Radio } from '@/types/database'
import { useRadioStore } from '@/stores/radioStore'
import { prewarmStream } from '@/hooks/useAudioPlayer'
import { cn } from '@/lib/utils'
import { useDeviceStore } from '@/stores/deviceStore'

interface RadioCardProps {
  radio: Radio
  className?: string
  isFeatured?: boolean
}

export const RadioCard: React.FC<RadioCardProps> = ({ radio, className, isFeatured }) => {
  const navigate = useNavigate()
  const { currentRadio, setCurrentRadio, isPlaying, setIsPlaying } = useRadioStore()
  const { isTV } = useDeviceStore()
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

  const cardHint = useMemo(() => {
    if (!isTV) return null
    if (isCurrentRadio && isPlaying) return 'Enter para pausar. I para abrir detalles.'
    if (isCurrentRadio) return 'Enter para continuar. I para abrir detalles.'
    return 'Enter para reproducir. I para abrir detalles.'
  }, [isCurrentRadio, isPlaying, isTV])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()

      if (isTV) {
        handlePrewarm()

        if (isCurrentRadio) {
          setIsPlaying(!isPlaying)
        } else {
          setCurrentRadio(radio)
          setIsPlaying(true)
        }
        return
      }

      handleCardClick()
    }

    if ((e.key === 'ContextMenu' || e.key.toLowerCase() === 'i') && isTV) {
      e.preventDefault()
      handleCardClick()
    }
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={handlePrewarm}
      onFocus={handlePrewarm}
      onTouchStart={handlePrewarm}
      className={cn(
        'group relative overflow-hidden rounded-[1.75rem] border border-transparent bg-white p-6 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.15)] transition duration-300 hover:-translate-y-1 hover:border-[#696cff]/30 hover:shadow-2xl hover:shadow-[#696cff]/10 focusable focus:outline-none focus:ring-4 focus:ring-[#696cff]/20 dark:bg-gray-900',
        isTV && 'min-h-[18rem] cursor-default border-white/10 bg-white/95 p-7 dark:bg-slate-900/95',
        isFeatured && 'border-yellow-300/50 bg-gradient-to-br from-white to-yellow-50 dark:from-gray-900 dark:to-yellow-950/20',
        className
      )}
      onClick={handleCardClick}
    >
      {isTV && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#696cff]/10 via-transparent to-transparent" />
      )}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="relative flex-shrink-0">
          {radio.logo_url && !isPlaceholderUrl(radio.logo_url) && !logoError ? (
            <img
              src={radio.logo_url}
              alt={radio.name}
              loading="lazy"
              className="h-20 w-20 rounded-3xl border border-gray-100 object-cover dark:border-gray-800"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gray-100 dark:bg-gray-800">
              <RadioIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
          )}

          {isCurrentRadio && isPlaying && (
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg border-2 border-white bg-gradient-to-br from-[#696cff] to-[#5f61e6] shadow-md dark:border-gray-900">
              <div className="flex h-3 items-end gap-0.5">
                <div className="h-1.5 w-0.5 animate-pulse bg-white" />
                <div className="delay-75 h-2.5 w-0.5 animate-pulse bg-white" />
                <div className="delay-150 h-2 w-0.5 animate-pulse bg-white" />
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="radio-card-title line-clamp-2 text-lg font-bold text-slate-700 transition-colors group-hover:text-[#696cff] dark:text-white">
            {radio.name}
          </h3>

          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="radio-card-subtitle rounded-full bg-slate-50 px-2.5 py-1 font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {radio.frequency}
            </span>
            {radio.location && (
              <span className="radio-card-subtitle rounded-full bg-slate-50 px-2.5 py-1 font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                {radio.location}
              </span>
            )}
          </div>

          {radio.category && (
            <span className="mt-3 inline-flex rounded-full bg-[#696cff]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#696cff] dark:bg-secondary-900 dark:text-secondary-200">
              {radio.category}
            </span>
          )}

          {cardHint && (
            <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-300">
              {cardHint}
            </p>
          )}
        </div>

        <button
          onClick={handlePlay}
          className={cn(
            'focusable self-start flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 transform active:scale-90 sm:self-center',
            isTV && 'h-16 w-16 rounded-3xl',
            isCurrentRadio
              ? 'bg-[#696cff] text-white shadow-lg shadow-[#696cff]/30'
              : 'bg-slate-50 text-slate-400 shadow-sm hover:bg-[#696cff] hover:text-white dark:bg-gray-800 dark:text-slate-200'
          )}
          aria-label={isCurrentRadio ? 'Continuar reproducción' : 'Reproducir radio'}
        >
          <Play className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
