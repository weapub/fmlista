import { useEffect } from 'react';
import { useRadioStore } from '@/stores/radioStore';

let audioElement: HTMLAudioElement | null = null;
let candidates: string[] = [];
let candidateIndex = 0;
let activeSource = '';
const warmedOrigins = new Set<string>();
const warmedStreams = new Set<string>();

const ensureAudioElement = () => {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = 'auto';
    audioElement.crossOrigin = 'anonymous';
    audioElement.autoplay = false;
  }

  return audioElement;
};

const normalizeStreamUrl = (stream: string) => stream.trim();

const buildCandidates = (stream: string): string[] => {
  try {
    const normalized = normalizeStreamUrl(stream);
    const url = new URL(normalized);
    const origin = `${url.protocol}//${url.host}`;
    const path = url.pathname || '/';
    const list: string[] = [normalized];

    if (path.endsWith(';')) {
      list.push(`${origin}${path.replace(/;$/, '')}`);
    } else {
      list.push(`${normalized};`);
      if (path === '/' || path === '') {
        list.push(`${origin}/;`);
      }
    }

    if (!path.includes('stream')) {
      list.push(`${origin}${path.endsWith('/') ? `${path}stream` : `${path}/stream`}`);
      list.push(`${origin}${path.endsWith('/') ? `${path};stream/1` : `${path}/;stream/1`}`);
    }

    return Array.from(new Set(list));
  } catch {
    return [stream];
  }
};

export const prewarmStream = (stream?: string | null) => {
  if (!stream) return;

  const normalized = normalizeStreamUrl(stream);
  if (!normalized || warmedStreams.has(normalized)) return;

  try {
    const url = new URL(normalized);
    const origin = `${url.protocol}//${url.host}`;

    if (!warmedOrigins.has(origin) && typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      document.head.appendChild(link);
      warmedOrigins.add(origin);
    }
  } catch {
    // Ignore malformed stream URLs and avoid blocking playback.
  }

  if (typeof window !== 'undefined') {
    try {
      fetch(normalized, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
      }).catch(() => undefined);
    } catch {
      // Browsers may reject some stream endpoints here; preconnect is still useful.
    }
  }

  warmedStreams.add(normalized);
};

export const useAudioPlayer = () => {
  const { currentRadio, isPlaying, volume, setIsPlaying } = useRadioStore();

  useEffect(() => {
    const audio = ensureAudioElement();
    audio.volume = volume;
  }, [volume]);

  const safePlay = async () => {
    const audio = ensureAudioElement();

    try {
      await audio.play();
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'AbortError') return;
        if (error.name === 'NotSupportedError') {
          tryNextCandidate();
          return;
        }
      }
      setIsPlaying(false);
    }
  };

  const tryNextCandidate = () => {
    const audio = ensureAudioElement();

    if (!candidates.length) return;
    if (candidateIndex >= candidates.length - 1) {
      setIsPlaying(false);
      return;
    }

    candidateIndex += 1;
    const next = candidates[candidateIndex];
    if (!next) {
      setIsPlaying(false);
      return;
    }

    activeSource = next;
    audio.src = next;
    audio.load();

    if (useRadioStore.getState().isPlaying) {
      void safePlay();
    }
  };

  useEffect(() => {
    const audio = ensureAudioElement();

    const handleError = () => {
      tryNextCandidate();
    };

    const handleStalled = () => {
      if (useRadioStore.getState().isPlaying) {
        void safePlay();
      }
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, []);

  useEffect(() => {
    const audio = ensureAudioElement();
    const src = currentRadio?.stream_url?.trim();

    if (!src) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      activeSource = '';
      candidates = [];
      candidateIndex = 0;
      return;
    }

    const newCandidates = buildCandidates(src);
    const primaryCandidate = newCandidates[0];

    if (activeSource !== primaryCandidate) {
      candidates = newCandidates;
      candidateIndex = 0;
      activeSource = primaryCandidate;
      prewarmStream(primaryCandidate);
      audio.src = primaryCandidate;
      audio.load();
    }

    if (isPlaying) {
      void safePlay();
    }
  }, [currentRadio?.id, currentRadio?.stream_url]);

  useEffect(() => {
    const audio = ensureAudioElement();

    if (!currentRadio?.stream_url) return;

    if (isPlaying) {
      void safePlay();
    } else {
      audio.pause();
    }
  }, [isPlaying, currentRadio?.stream_url]);

  const togglePlay = () => {
    if (currentRadio) {
      setIsPlaying(!isPlaying);
    }
  };

  const setVolume = (newVolume: number) => {
    useRadioStore.getState().setVolume(Math.max(0, Math.min(1, newVolume)));
  };

  return {
    togglePlay,
    setVolume,
    isPlaying: isPlaying && !!currentRadio,
    volume,
    currentRadio,
  };
};
