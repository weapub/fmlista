import { useEffect, useRef } from 'react'
import { useRadioStore } from '@/stores/radioStore'

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { currentRadio, isPlaying, volume, setIsPlaying } = useRadioStore()
  const candidatesRef = useRef<string[]>([])
  const candidateIndexRef = useRef<number>(0)

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio()
      audio.preload = 'none'
      audio.crossOrigin = 'anonymous'
      audioRef.current = audio
    }
    const audio = audioRef.current!
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  // Reflect volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const safePlay = async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      await audio.play()
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'AbortError') {
          return
        }
        if (error.name === 'NotSupportedError') {
          tryNextCandidate()
          return
        }
      }
      setIsPlaying(false)
    }
  }

  const buildCandidates = (stream: string): string[] => {
    try {
      const u = new URL(stream)
      const origin = `${u.protocol}//${u.host}`
      const path = u.pathname || '/'
      const list: string[] = []
      // Original
      list.push(stream)
      // Remove trailing ';'
      if (path.endsWith(';')) {
        list.push(`${origin}${path.replace(/;$/, '')}`)
      } else {
        // Add trailing ';' for Shoutcast compatibility
        list.push(`${stream};`)
      }
      // Common icecast patterns
      if (!path.includes('stream')) {
        list.push(`${origin}${path.endsWith('/') ? path + 'stream' : path + '/stream'}`)
        list.push(`${origin}${path.endsWith('/') ? path + ';stream/1' : path + '/;stream/1'}`)
        list.push(`${origin}${path.endsWith('/') ? path + 'live' : path + '/live'}`)
      }
      return Array.from(new Set(list))
    } catch {
      return [stream]
    }
  }

  const tryNextCandidate = () => {
    const audio = audioRef.current
    if (!audio) return
    const list = candidatesRef.current
    if (!list.length) return
    candidateIndexRef.current = Math.min(candidateIndexRef.current + 1, list.length)
    const next = list[candidateIndexRef.current]
    if (next) {
      audio.pause()
      audio.src = next
      audio.load()
      if (isPlaying) safePlay()
    } else {
      setIsPlaying(false)
    }
  }

  // Update source when stream changes
  useEffect(() => {
    const audio = audioRef.current
    const src = currentRadio?.stream_url
    if (!audio || !src) return
    audio.pause()
    candidatesRef.current = buildCandidates(src)
    candidateIndexRef.current = 0
    audio.src = candidatesRef.current[0]
    audio.load()
    audio.onerror = () => {
      tryNextCandidate()
    }
    if (isPlaying) safePlay()
  }, [currentRadio?.stream_url])

  // Control play/pause based on state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying && currentRadio?.stream_url) {
      safePlay()
    } else {
      audio.pause()
    }
  }, [isPlaying])

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
