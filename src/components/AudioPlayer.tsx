import React, { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, ChevronDown, Users, Radio as RadioIcon } from 'lucide-react'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { useRadioStore } from '@/stores/radioStore'
import { cn } from '@/lib/utils'
import { NowPlayingInfo } from '@/components/NowPlayingInfo'
import { useDeviceStore } from '@/stores/deviceStore'
import { useRadioListeners, useReportListener } from '@/hooks/useRadioListeners'

export const AudioPlayer: React.FC = () => {
  const { 
    currentRadio, 
    isPlaying, 
    volume, 
    radios, 
    isPlayerExpanded,
    playbackDiagnostic,
    setCurrentRadio, 
    setIsPlaying,
    setIsPlayerExpanded,
    setVolume: setStoreVolume
  } = useRadioStore()

  const { isTV } = useDeviceStore()
  
  const { togglePlay, setVolume } = useAudioPlayer()
  
  // Real-time listener tracking (Los hooks ahora manejan internamente si el ID es nulo)
  const listenerCount = useRadioListeners(currentRadio?.id || '', isPlayerExpanded)
  useReportListener(currentRadio?.id || '', isPlaying)
  const playButtonRef = useRef<HTMLButtonElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    const ua = navigator.userAgent || ''
    setIsIOS(/iPad|iPhone|iPod/i.test(ua))
  }, [])

  useEffect(() => {
    // Auto-expand player on TV when playing starts
    if (isTV && currentRadio && isPlaying) {
      setIsPlayerExpanded(true)
    }
  }, [isTV, currentRadio, isPlaying, setIsPlayerExpanded])

  useEffect(() => {
    if (!currentRadio) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingTarget = !!target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      if (isTypingTarget) return

      switch (event.key) {
        case 'MediaPlayPause':
        case ' ':
        case 'Enter':
          event.preventDefault()
          togglePlay()
          break
        case 'MediaTrackNext':
        case 'ArrowRight':
          if (!radios || radios.length === 0 || !currentRadio) return
          event.preventDefault()
          goNext()
          break
        case 'MediaTrackPrevious':
        case 'ArrowLeft':
          if (!radios || radios.length === 0 || !currentRadio) return
          event.preventDefault()
          goPrev()
          break
        case 'ArrowUp':
          if (!isTV) return
          event.preventDefault()
          setVolume(Math.min(1, volume + 0.1))
          break
        case 'ArrowDown':
          if (!isTV) return
          event.preventDefault()
          setVolume(Math.max(0, volume - 0.1))
          break
        case 'Escape':
        case 'Backspace':
          if (!isTV || !isPlayerExpanded) return
          event.preventDefault()
          setIsPlayerExpanded(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentRadio, isTV, isPlayerExpanded, radios, setIsPlayerExpanded, togglePlay, volume, setVolume])

  useEffect(() => {
    if (!isTV) return

    const focusTarget = isPlayerExpanded ? closeButtonRef.current : playButtonRef.current
    focusTarget?.focus()
  }, [isTV, isPlayerExpanded])
  
  // Checkpoint para evitar renderizar UI si no hay radio, pero después de los hooks
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
      <div className={cn(
        isIOS
          ? "fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-[#f5f5f9] dark:bg-slate-950"
          : "fixed inset-0 z-[60] flex flex-col overflow-y-auto animate-in slide-in-from-bottom duration-300 bg-gradient-to-b from-[#f5f5f9] via-white to-[#eef2ff] dark:from-slate-950 dark:via-slate-950 dark:to-slate-900",
        isTV ? "tv-player-mode" : ""
      )}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <div className={cn(
            "sticky top-0 z-10 flex items-center justify-between px-4 py-4 flex-shrink-0",
            isIOS
              ? "bg-white dark:bg-slate-950"
              : "bg-white/80 backdrop-blur-sm dark:bg-slate-950/80"
          )}>
            <button 
              ref={closeButtonRef}
              onClick={() => setIsPlayerExpanded(false)}
              className="p-2 text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-full transition-colors focusable"
              aria-label="Minimizar reproductor"
            >
              <ChevronDown className={cn("w-8 h-8", isTV && "w-12 h-12")} />
            </button>
            <div className={cn("text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-widest", isTV && "text-lg")}>
              Ahora sonando
            </div>
            <div className="w-12" /> {/* Spacer for balance */}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-start sm:justify-center px-6 sm:px-8 pt-2 sm:pt-6 pb-6 sm:pb-8 space-y-4 sm:space-y-8">
            {/* Album Art / Logo */}
            <div className={cn(
              "w-full max-w-[250px] sm:max-w-sm aspect-square bg-gray-100 rounded-full shadow-2xl overflow-hidden flex items-center justify-center",
              !isIOS && "animate-spin-slow",
              isTV && "max-w-md shadow-[0_0_50px_rgba(0,0,0,0.2)]"
            )}>
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
              <h2 className={cn("text-xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight", isTV && "text-5xl mb-4")}>
                {currentRadio.name}
              </h2>
              <p className={cn("text-base sm:text-lg text-[#696cff] font-medium", isTV && "text-2xl")}>
                {currentRadio.frequency}
              </p>
              <div className="flex justify-center pt-2">
                 <NowPlayingInfo radio={currentRadio} />
              </div>
              {playbackDiagnostic && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
                  {playbackDiagnostic}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className={cn("px-4 sm:px-8 pb-8 sm:pb-14 w-full max-w-md mx-auto space-y-6 sm:space-y-8 flex-shrink-0", isTV && "max-w-2xl pb-24")}>
            {/* Progress / Live Indicator */}
            <div className={cn("flex items-center justify-between text-xs font-medium text-gray-500 dark:text-slate-400", isTV && "text-lg")}>
               <span className="text-red-500 flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 En vivo
               </span>
               <span className="flex items-center gap-1">
                 <Users className="w-3 h-3" />
                 {listenerCount} {listenerCount === 1 ? 'oyente' : 'oyentes'}
               </span>
            </div>

            {/* Main Buttons */}
            <div className={cn("flex items-center justify-center space-x-6 sm:space-x-8", isTV && "space-x-16")}>
              <button
                onClick={(e) => goPrev(e)}
                className={cn("p-3 text-gray-800 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors focusable", isTV && "p-6 bg-gray-100 dark:bg-slate-800")}
                aria-label="Reproducir emisora anterior"
              >
                <SkipBack className={cn("w-6 h-6 sm:w-7 sm:h-7", isTV && "w-12 h-12")} />
              </button>
              
              <button
                ref={playButtonRef}
                onClick={(e) => handleTogglePlay(e)}
                className={cn("p-4 sm:p-5 bg-[#696cff] text-white rounded-full shadow-lg hover:bg-[#5f61e6] hover:scale-105 transition-all focusable", isTV && "p-8 scale-110")}
                aria-label={isPlaying ? 'Pausar reproducción' : 'Iniciar reproducción'}
              >
                {isPlaying ? <Pause className={cn("w-6 h-6 sm:w-8 sm:h-8", isTV && "w-16 h-16")} /> : <Play className={cn("w-6 h-6 sm:w-8 sm:h-8 ml-1", isTV && "w-16 h-16 ml-2")} />}
              </button>

              <button
                onClick={(e) => goNext(e)}
                className={cn("p-3 text-gray-800 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors focusable", isTV && "p-6 bg-gray-100 dark:bg-slate-800")}
                aria-label="Reproducir siguiente emisora"
              >
                <SkipForward className={cn("w-6 h-6 sm:w-7 sm:h-7", isTV && "w-12 h-12")} />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center space-x-4 mb-8">
              <button onClick={handleMuteToggle} className="text-gray-500 dark:text-slate-300 focusable p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800" aria-label={volume === 0 ? 'Activar sonido' : 'Silenciar'}>
                {volume === 0 ? <VolumeX className={cn("w-5 h-5", isTV && "w-8 h-8")} /> : <Volume2 className={cn("w-5 h-5", isTV && "w-8 h-8")} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className={cn("flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#696cff] focusable", isTV && "h-3")}
                style={{
                  background: `linear-gradient(to right, #696cff ${volume * 100}%, #e5e7eb ${volume * 100}%)`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mini Player UI
  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl border shadow-[0_18px_60px_-30px_rgba(15,23,42,0.15)] z-50 cursor-pointer transition-all rounded-[1.75rem] p-1.5",
        isIOS
          ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          : "bg-white/90 backdrop-blur-lg border-white/20 hover:bg-white hover:shadow-2xl hover:shadow-[#696cff]/10"
      )}
      onClick={handleMiniPlayerClick}
      style={{ display: isPlayerExpanded ? 'none' : 'block' }}
    >
      {isPlaying && (
        <div className="pointer-events-none absolute -top-3 left-5 z-20 inline-flex items-center gap-1 rounded-full bg-[#696cff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          En vivo ahora
        </div>
      )}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            {/* Controls (Mini) */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={goPrev}
                className="focusable p-2 text-gray-700 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 z-10"
                title="Anterior"
                aria-label="Emisora anterior"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={handleTogglePlay}
                ref={playButtonRef}
                className="focusable p-3 bg-gradient-to-br from-[#696cff] to-[#5f61e6] text-white rounded-full transition-all flex-shrink-0 z-10 shadow-lg shadow-[#696cff]/25 hover:shadow-xl hover:shadow-[#696cff]/35 hover:-translate-y-0.5 active:scale-95 border border-white/10"
                aria-label={isPlaying ? 'Pausar reproducción' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
              <button
                onClick={goNext}
                className="focusable p-2 text-gray-700 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 z-10"
                title="Siguiente"
                aria-label="Siguiente emisora"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
            
            {/* Info (Mini) */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="relative flex-shrink-0">
                {currentRadio.logo_url ? (
                  <img
                    src={currentRadio.logo_url}
                    alt={currentRadio.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-gray-100 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
                    <RadioIcon className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-[#696cff] to-[#5f61e6] rounded-lg flex items-center justify-center border-2 border-white shadow-md">
                    <div className="flex gap-0.5 items-end h-2.5">
                      <div className="w-0.5 h-1.5 bg-white animate-pulse" />
                      <div className="w-0.5 h-2.5 bg-white animate-pulse delay-75" />
                      <div className="w-0.5 h-2 bg-white animate-pulse delay-150" />
                    </div>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                  {currentRadio.name}
                </h4>
                <div className="text-xs sm:text-sm text-gray-600 truncate">
                   <NowPlayingInfo radio={currentRadio} />
                </div>
                {playbackDiagnostic && (
                  <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-300 line-clamp-2">
                    {playbackDiagnostic}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Volume (Mini) - Hidden on mobile to save space */}
          <div className="hidden sm:flex items-center space-x-2 sm:space-x-4 z-10">
            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleMuteToggle}
                className="focusable p-1 text-gray-600 hover:text-gray-900 flex-shrink-0"
                aria-label={volume === 0 ? 'Activar sonido' : 'Silenciar'}
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
                className="w-16 sm:w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#696cff]"
                style={{
                background: `linear-gradient(to right, #696cff ${volume * 100}%, #e5e7eb ${volume * 100}%)`
              }}
              />
            </div>
          </div>

          {/* Expand Button (Mobile/Desktop hint) */}
          <button className="focusable sm:hidden p-2 text-gray-400" aria-label="Expandir reproductor">
             <ChevronDown className="w-5 h-5 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  )
}
