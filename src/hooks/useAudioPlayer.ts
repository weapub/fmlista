import { useEffect } from 'react';
import { useRadioStore } from '@/stores/radioStore';

let audioElement: HTMLAudioElement | null = null;
let candidates: string[] = [];
let candidateIndex = 0;
let activeSource = '';
const warmedOrigins = new Set<string>();
const warmedStreams = new Set<string>();
let reconnectRetryTimeout: number | null = null;

const ensureAudioElement = () => {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = 'auto';
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

  warmedStreams.add(normalized);
};

export const useAudioPlayer = () => {
  const { currentRadio, isPlaying, volume, setIsPlaying, radios, setCurrentRadio, setPlaybackDiagnostic } = useRadioStore();

  const clearReconnectRetry = () => {
    if (typeof window === 'undefined' || reconnectRetryTimeout === null) return;
    window.clearTimeout(reconnectRetryTimeout);
    reconnectRetryTimeout = null;
  };

  const scheduleReconnectRetry = (delay = 1200) => {
    if (typeof window === 'undefined') return;

    clearReconnectRetry();
    reconnectRetryTimeout = window.setTimeout(() => {
      reconnectRetryTimeout = null;
      resumePlaybackIfNeeded();
    }, delay);
  };

  const resumePlaybackIfNeeded = () => {
    const { currentRadio: activeRadio, isPlaying: shouldBePlaying } = useRadioStore.getState();
    if (!activeRadio?.stream_url || !shouldBePlaying) return;
    prewarmStream(activeRadio.stream_url);
    void safePlay();
  };

  useEffect(() => {
    const audio = ensureAudioElement();
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const mediaSession = navigator.mediaSession;
    const supportsMediaMetadata = typeof MediaMetadata !== 'undefined';
    const hasSetActionHandler = typeof mediaSession.setActionHandler === 'function';

    try {
      if (currentRadio) {
        if (supportsMediaMetadata) {
          mediaSession.metadata = new MediaMetadata({
            title: currentRadio.name,
            artist: currentRadio.frequency || currentRadio.location || 'FM Lista',
            album: currentRadio.category || 'Radio en vivo',
            artwork: currentRadio.logo_url
              ? [
                  { src: currentRadio.logo_url, sizes: '96x96', type: 'image/png' },
                  { src: currentRadio.logo_url, sizes: '192x192', type: 'image/png' },
                  { src: currentRadio.logo_url, sizes: '512x512', type: 'image/png' },
                ]
              : [],
          });
        } else {
          mediaSession.metadata = null;
        }
        mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } else {
        mediaSession.metadata = null;
        mediaSession.playbackState = 'none';
      }
    } catch (error) {
      console.warn('Media Session metadata not supported on this browser:', error);
    }

    const goRelative = (direction: 1 | -1) => {
      if (!currentRadio || !radios.length) return;
      const currentIndex = radios.findIndex((radio) => radio.id === currentRadio.id);
      if (currentIndex < 0) return;
      const nextIndex = (currentIndex + direction + radios.length) % radios.length;
      const nextRadio = radios[nextIndex];
      if (!nextRadio) return;
      prewarmStream(nextRadio.stream_url);
      setCurrentRadio(nextRadio);
      setIsPlaying(true);
    };

    if (!hasSetActionHandler) return;

    mediaSession.setActionHandler('play', () => setIsPlaying(true));
    mediaSession.setActionHandler('pause', () => setIsPlaying(false));
    mediaSession.setActionHandler('previoustrack', () => goRelative(-1));
    mediaSession.setActionHandler('nexttrack', () => goRelative(1));
    mediaSession.setActionHandler('stop', () => setIsPlaying(false));

    return () => {
      mediaSession.setActionHandler('play', null);
      mediaSession.setActionHandler('pause', null);
      mediaSession.setActionHandler('previoustrack', null);
      mediaSession.setActionHandler('nexttrack', null);
      mediaSession.setActionHandler('stop', null);
    };
  }, [currentRadio, isPlaying, radios, setCurrentRadio, setIsPlaying]);

  const safePlay = async () => {
    const audio = ensureAudioElement();

    try {
      clearReconnectRetry();
      await audio.play();
      setPlaybackDiagnostic(null);
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'AbortError') return;
        if (error.name === 'NotSupportedError') {
          setPlaybackDiagnostic('Este stream no es compatible en este dispositivo. Probando alternativa...');
          tryNextCandidate();
          return;
        }
        if (error.name === 'NotAllowedError') {
          setPlaybackDiagnostic('El navegador bloqueo la reproduccion automatica. Toca Play nuevamente para autorizar audio.');
          scheduleReconnectRetry(1800);
          return;
        }
      }
      setPlaybackDiagnostic('No pudimos iniciar el audio. Verifica conexion, HTTPS del stream o restricciones del navegador.');
      scheduleReconnectRetry(2200);
    }
  };

  const tryNextCandidate = () => {
    const audio = ensureAudioElement();

    if (!candidates.length) return;
    if (candidateIndex >= candidates.length - 1) {
      setPlaybackDiagnostic('No se pudo conectar con esta radio. Puede estar bloqueada por CORS/HTTPS o fuera de linea.');
      setIsPlaying(false);
      return;
    }

    candidateIndex += 1;
    const next = candidates[candidateIndex];
    if (!next) {
      setPlaybackDiagnostic('No se encontro una URL valida para este stream.');
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
      setPlaybackDiagnostic('Error al cargar el stream. Intentando una ruta alternativa...');
      tryNextCandidate();
    };

    const handleStalled = () => {
      resumePlaybackIfNeeded();
    };

    const handleSuspend = () => {
      resumePlaybackIfNeeded();
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      scheduleReconnectRetry(1200);
    };

    const handlePause = () => {
      const { isPlaying: shouldBePlaying } = useRadioStore.getState();
      if (shouldBePlaying) {
        scheduleReconnectRetry(900);
      }
    };

    const handlePlaying = () => {
      clearReconnectRetry();
      setPlaybackDiagnostic(null);
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('suspend', handleSuspend);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('suspend', handleSuspend);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('playing', handlePlaying);
    };
  }, [setIsPlaying, setPlaybackDiagnostic]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const handleVisibilityReturn = () => {
      if (document.visibilityState === 'visible') {
        resumePlaybackIfNeeded();
      }
    };

    const handleWindowFocus = () => {
      resumePlaybackIfNeeded();
    };

    const handlePageShow = () => {
      resumePlaybackIfNeeded();
    };

    const handleOnline = () => {
      resumePlaybackIfNeeded();
    };

    const handleDeviceChange = () => {
      scheduleReconnectRetry(700);
    };

    document.addEventListener('visibilitychange', handleVisibilityReturn);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('online', handleOnline);
    navigator.mediaDevices?.addEventListener?.('devicechange', handleDeviceChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityReturn);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('online', handleOnline);
      navigator.mediaDevices?.removeEventListener?.('devicechange', handleDeviceChange);
      clearReconnectRetry();
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
      setPlaybackDiagnostic(null);
      return;
    }

    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && src.startsWith('http://')) {
      setPlaybackDiagnostic('Esta radio usa HTTP y tu app esta en HTTPS. iPhone/Chrome la bloquea por seguridad.');
      setIsPlaying(false);
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
      setPlaybackDiagnostic(null);
    }

    if (isPlaying) {
      void safePlay();
    }
  }, [currentRadio?.id, currentRadio?.stream_url, setIsPlaying, setPlaybackDiagnostic]);

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
