import { useEffect } from 'react'
import { useRadioStore } from '@/stores/radioStore'

let audioElement: HTMLAudioElement | null = null
let candidates: string[] = []
let candidateIndex = 0

export const useAudioPlayer = () => {
  const { currentRadio, isPlaying, volume, setIsPlaying } = useRadioStore()

  // Initialize shared audio element once for the whole app
  useEffect(() => {
    if (!audioElement) {
      audioElement = new Audio()
      audioElement.preload = 'none'
      audioElement.crossOrigin = 'anonymous'
    }
  }, [])

  // Reflect volume changes
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = volume
    }
  }, [volume])

  const safePlay = async () => {
    if (!audioElement) return
    try {
      await audioElement.play()
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
        // Try simple stream without path if it fails (sometimes needed for pure IP:PORT)
        if (path === '/' || path === '') {
             list.push(`${origin}/;`)
        }
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
    if (!audioElement) return
    if (!candidates.length) return
    if (candidateIndex >= candidates.length - 1) {
      setIsPlaying(false)
      return
    }
    candidateIndex += 1
    const next = candidates[candidateIndex]
    if (next) {
      audioElement.pause()
      audioElement.src = next
      audioElement.load()
      if (isPlaying) safePlay()
    } else {
      setIsPlaying(false)
    }
  }

  // Update source when stream changes
  useEffect(() => {
    const src = currentRadio?.stream_url
    if (!audioElement) return
    
    if (src) {
      audioElement.pause()
      audioElement.currentTime = 0

      const newCandidates = buildCandidates(src)
      if (candidates[0] !== newCandidates[0]) {
        candidates = newCandidates
        candidateIndex = 0
        audioElement.src = candidates[0]
        audioElement.load()
      }
    } else {
      audioElement.pause()
      audioElement.src = ''
    }

    audioElement.onerror = () => {
      tryNextCandidate()
    }

    if (isPlaying && src) {
      const playPromise = setTimeout(() => safePlay(), 10)
      return () => clearTimeout(playPromise)
    }
  }, [currentRadio?.id, currentRadio?.stream_url, isPlaying])

  // Control play/pause based on state
  useEffect(() => {
    if (!audioElement) return
    if (isPlaying && currentRadio?.stream_url) {
      safePlay()
    } else {
      audioElement.pause()
    }
  }, [isPlaying, currentRadio?.stream_url])

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
