import { useEffect, useRef } from 'react'
import { useRadioStore } from '@/stores/radioStore'

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { currentRadio, isPlaying, volume, setIsPlaying } = useRadioStore()
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])
  
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }
    
    const audio = audioRef.current
    
    if (currentRadio?.stream_url) {
      audio.src = currentRadio.stream_url
      
      if (isPlaying) {
        audio.play().catch(error => {
          console.error('Error playing audio:', error)
          setIsPlaying(false)
        })
      } else {
        audio.pause()
      }
    }
    
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [currentRadio?.stream_url, isPlaying, setIsPlaying])
  
  const togglePlay = () => {
    if (currentRadio) {
      setIsPlaying(!isPlaying)
    }
  }
  
  const setVolume = (newVolume: number) => {
    useRadioStore.getState().setVolume(Math.max(0, Math.min(1, newVolume)))
  }
  
  return {
    togglePlay,
    setVolume,
    isPlaying: isPlaying && !!currentRadio,
    volume,
    currentRadio
  }
}