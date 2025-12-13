import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export const useRadioListeners = (radioId: string | undefined) => {
  const [listenerCount, setListenerCount] = useState<number>(0)

  useEffect(() => {
    if (!radioId) {
      setListenerCount(0)
      return
    }

    // Create a unique channel for this radio's listeners
    const channel = supabase.channel(`radio_listeners:${radioId}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        // Each presence entry represents a connected client (listener)
        // We count the number of keys (clients)
        const count = Object.keys(state).length
        setListenerCount(count)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [radioId])

  return listenerCount
}

export const useReportListener = (radioId: string | undefined, isPlaying: boolean) => {
  useEffect(() => {
    if (!radioId || !isPlaying) return

    // Connect to the same channel to report presence
    const channel = supabase.channel(`radio_listeners:${radioId}`)

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence with a timestamp
        await channel.track({
          online_at: new Date().toISOString(),
        })
      }
    })

    return () => {
      // Untrack and leave channel when stopped or radio changes
      channel.untrack()
      supabase.removeChannel(channel)
    }
  }, [radioId, isPlaying])
}
