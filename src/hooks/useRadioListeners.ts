import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Registro global para compartir suscripciones entre componentes
const activeChannels = new Map<string, {
  channel: any,
  refCount: number,
  lastCount: number,
  subscribers: Set<(count: number) => void>
}>();

export const useRadioListeners = (radioId: string | undefined, enabled = true) => {
  const [listenerCount, setListenerCount] = useState(0);

  useEffect(() => {
    if (!radioId || !enabled) {
      setListenerCount(0);
      return;
    }

    let channelData = activeChannels.get(radioId);

    if (!channelData) {
      const subscribers = new Set<(count: number) => void>();
      const channel = supabase.channel(`radio_listeners_${radioId}`, {
        config: { presence: { key: radioId } }
      });

      channelData = { channel, refCount: 0, lastCount: 0, subscribers };
      activeChannels.set(radioId, channelData);

      channel
        .on('presence', { event: 'sync' }, () => {
          const newState = channel.presenceState();
          const count = Object.values(newState).flat().length;
          const current = activeChannels.get(radioId);
          if (current) {
            current.lastCount = count;
            current.subscribers.forEach(cb => cb(count));
          }
        })
        .subscribe();
    }

    channelData.refCount++;
    channelData.subscribers.add(setListenerCount);
    setListenerCount(channelData.lastCount);

    return () => {
      const data = activeChannels.get(radioId);
      if (data) {
        data.refCount--;
        data.subscribers.delete(setListenerCount);
        if (data.refCount === 0) {
          data.channel.unsubscribe();
          activeChannels.delete(radioId);
        }
      }
    };
  }, [radioId, enabled]);

  return listenerCount;
};

export const useReportListener = (radioId: string | undefined, isPlaying: boolean) => {
  useEffect(() => {
    if (!radioId || !isPlaying) return;

    // Placeholder analytics/reporting hook for future usage.
    // This currently avoids compile errors while preserving the expected hook contract.
    console.debug('Reporting active listener for radio:', radioId);
  }, [radioId, isPlaying]);
};
