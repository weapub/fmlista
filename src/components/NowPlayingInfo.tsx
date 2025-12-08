import React, { useEffect, useState } from 'react'
import { Music2 } from 'lucide-react'
import { Radio } from '@/types/database'

interface Props {
  radio: Radio
}

export const NowPlayingInfo: React.FC<Props> = ({ radio }) => {
  const [nowPlaying, setNowPlaying] = useState<string>('')
  const [npError, setNpError] = useState<boolean>(false)

  useEffect(() => {
    let timer: number | undefined
    const fetchNowPlaying = async () => {
      try {
        setNpError(false)
        setNowPlaying('')
        if (!radio?.stream_url) return
        // if (import.meta.env.DEV) return
        const url = `/api/nowplaying?stream=${encodeURIComponent(radio.stream_url)}`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) throw new Error('np failed')
        const data = await res.json()
        if (data?.title) setNowPlaying(data.title)
        else if (data?.song) setNowPlaying(data.song)
        else setNowPlaying('')
      } catch (e) {
        setNpError(true)
        setNowPlaying('')
      }
    }
    fetchNowPlaying()
    timer = window.setInterval(fetchNowPlaying, 15000)
    return () => {
      if (timer) window.clearInterval(timer)
    }
  }, [radio?.stream_url])

  return (
    <div className="flex items-center space-x-1 text-xs text-gray-500 truncate max-w-[14rem] sm:max-w-[18rem]">
      <Music2 className="w-3 h-3" />
      <span>{nowPlaying || (npError ? 'En vivo' : 'Buscando canción...')}</span>
    </div>
  )
}

