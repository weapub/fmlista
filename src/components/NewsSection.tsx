import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Newspaper, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeviceStore } from '@/stores/deviceStore';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary?: string;
  published_at?: string;
  url?: string;
  is_breaking?: boolean;
}

interface NewsSectionProps {
  minimal?: boolean;
  className?: string;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ minimal = false, className = '' }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const { isTV } = useDeviceStore();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const movedDuringDragRef = useRef(false);
  const isTouchDraggingRef = useRef(false);

  const resetDragState = () => {
    isPointerDownRef.current = false;
    isDraggingRef.current = false;
    isTouchDraggingRef.current = false;
  };

  useEffect(() => {
    const fetchNews = async () => {
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'Fuerte temporal afecta la zona sur de la provincia',
          source: 'La Manana',
          summary:
            'Las autoridades reportaron anegamientos parciales, cortes intermitentes y tareas de asistencia en distintos barrios durante la madrugada.',
          published_at: 'Hoy, 08:15',
          is_breaking: true,
        },
        {
          id: '2',
          title: 'Nueva programacion nocturna en Radio Nacional',
          source: 'Radio Nacional',
          summary:
            'La emisora renueva su franja nocturna con entrevistas en vivo, segmentos culturales y una propuesta musical mas amplia.',
          published_at: 'Hoy, 10:40',
        },
        {
          id: '3',
          title: 'Alerta meteorologica para las proximas 24 horas',
          source: 'Contingencias',
          summary:
            'Se esperan lluvias intensas, actividad electrica y rafagas. Recomiendan asegurar objetos sueltos y evitar circular en zonas bajas.',
          published_at: 'Hoy, 11:05',
          is_breaking: true,
        },
        {
          id: '4',
          title: 'Festival Provincial: se confirman los artistas invitados',
          source: 'Radio Formosa',
          summary:
            'La organizacion difundio el cronograma preliminar y anuncio la apertura de nuevas entradas para el fin de semana.',
          published_at: 'Ayer, 19:20',
        },
      ];

      setNews(mockNews);
      setLoading(false);
    };

    void fetchNews();
  }, []);

  useEffect(() => {
    if (!selectedNews) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedNews(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNews]);

  useEffect(() => {
    const handleGlobalPointerRelease = () => {
      resetDragState();
    };

    window.addEventListener('pointerup', handleGlobalPointerRelease);
    window.addEventListener('pointercancel', handleGlobalPointerRelease);
    window.addEventListener('touchend', handleGlobalPointerRelease, { passive: true });
    window.addEventListener('touchcancel', handleGlobalPointerRelease, { passive: true });

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerRelease);
      window.removeEventListener('pointercancel', handleGlobalPointerRelease);
      window.removeEventListener('touchend', handleGlobalPointerRelease);
      window.removeEventListener('touchcancel', handleGlobalPointerRelease);
    };
  }, []);

  useEffect(() => {
    if (!selectedNews) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedNews]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || news.length === 0) return;

    let frameId = 0;
    let lastTimestamp = 0;
    const speed = 36;

    const step = (timestamp: number) => {
      if (!trackRef.current) return;
      const activeTrack = trackRef.current;

      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      const elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (!isDraggingRef.current) {
        activeTrack.scrollLeft += (speed * elapsed) / 1000;
      }

      const halfWidth = activeTrack.scrollWidth / 2;
      if (activeTrack.scrollLeft >= halfWidth) {
        activeTrack.scrollLeft -= halfWidth;
      } else if (activeTrack.scrollLeft <= 0) {
        activeTrack.scrollLeft += halfWidth;
      }

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [news]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;

    isPointerDownRef.current = true;
    isDraggingRef.current = true;
    movedDuringDragRef.current = false;
    dragStartXRef.current = event.clientX;
    dragStartScrollRef.current = track.scrollLeft;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || !isPointerDownRef.current || isTouchDraggingRef.current) return;

    const deltaX = event.clientX - dragStartXRef.current;
    if (Math.abs(deltaX) > 6) {
      movedDuringDragRef.current = true;
    }

    track.scrollLeft = dragStartScrollRef.current - deltaX;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    resetDragState();
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    resetDragState();
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const touch = event.touches[0];
    if (!track || !touch) return;

    isTouchDraggingRef.current = true;
    isDraggingRef.current = true;
    movedDuringDragRef.current = false;
    dragStartXRef.current = touch.clientX;
    dragStartScrollRef.current = track.scrollLeft;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const touch = event.touches[0];
    if (!track || !touch || !isTouchDraggingRef.current) return;

    const deltaX = touch.clientX - dragStartXRef.current;
    if (Math.abs(deltaX) > 6) {
      movedDuringDragRef.current = true;
      event.preventDefault();
    }

    track.scrollLeft = dragStartScrollRef.current - deltaX;
  };

  const handleTouchEnd = () => {
    resetDragState();
  };

  const openNews = (item: NewsItem) => {
    if (movedDuringDragRef.current) return;
    setSelectedNews(item);
  };

  const hasBreakingNews = news.some((item) => item.is_breaking);

  if (loading) return null;

  return (
    <>
      <div className={cn('relative group', className)}>
        {hasBreakingNews && (
          <div
            className={cn(
              'absolute inset-0 -z-10 bg-red-500/20 blur-xl animate-pulse',
              isTV ? 'rounded-[2rem]' : 'rounded-2xl'
            )}
          />
        )}

        <div
          className={cn(
            'flex overflow-hidden border bg-white transition-all duration-500 dark:bg-slate-900',
            hasBreakingNews
              ? 'border-red-500/50 shadow-lg shadow-red-500/10'
              : 'border-gray-100 shadow-sm dark:border-gray-800',
            minimal ? 'p-1' : 'p-4',
            isTV ? 'rounded-[2rem] px-3 py-2' : 'rounded-2xl',
            'flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-0'
          )}
        >
          <div
            className={cn(
              'z-10 flex flex-shrink-0 items-center gap-2 self-start shadow-sm',
              hasBreakingNews ? 'bg-red-500 text-white shadow-md' : 'bg-[#696cff]/10 text-[#696cff]',
              isTV ? 'rounded-2xl px-5 py-3' : 'rounded-xl px-4 py-2',
              'md:self-auto'
            )}
          >
            <Newspaper className={cn(isTV ? 'h-5 w-5' : 'h-4 w-4', hasBreakingNews && 'animate-bounce')} />
            <span className={cn('whitespace-nowrap font-black uppercase tracking-widest', isTV ? 'text-xs' : 'text-[10px]')}>
              {hasBreakingNews ? 'Ultimo Momento' : 'Noticias'}
            </span>
          </div>

          <div
            ref={trackRef}
            className={cn(
              'relative w-full flex-1 overflow-x-hidden md:ml-4',
              isTV && 'md:ml-6',
              'cursor-grab active:cursor-grabbing select-none'
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onPointerLeave={(event) => {
              if (isPointerDownRef.current) {
                handlePointerUp(event);
              }
            }}
          >
            <div className="flex w-max whitespace-nowrap gap-12">
              {[...news, ...news].map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className={cn(
                    'flex items-center gap-2 font-medium text-[#566a7f] dark:text-gray-300',
                    isTV ? 'gap-3 text-base' : 'text-sm'
                  )}
                >
                  <span
                    className={cn(
                      'flex-shrink-0 rounded-full',
                      isTV ? 'h-2 w-2' : 'h-1.5 w-1.5',
                      item.is_breaking ? 'bg-red-500 animate-pulse' : 'bg-[#a1acb8] dark:bg-slate-500'
                    )}
                  />
                  <span className={cn('font-black uppercase tracking-tighter opacity-50', isTV ? 'text-xs' : 'text-[10px]')}>
                    {item.source}:
                  </span>
                  <button
                    type="button"
                    onClick={() => openNews(item)}
                    className={cn(
                      'truncate text-left transition-colors hover:text-[#696cff] focus:text-[#696cff] focus:outline-none',
                      item.is_breaking && 'font-bold text-red-600 dark:text-red-400',
                      isTV && 'text-lg'
                    )}
                  >
                    {item.title}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedNews && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            aria-label="Cerrar modal de noticia"
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setSelectedNews(null)}
          />

          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#696cff]">
                  {selectedNews.source}
                </p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-[#566a7f] dark:text-white sm:text-2xl">
                  {selectedNews.title}
                </h3>
                {selectedNews.published_at && (
                  <p className="mt-2 text-sm text-[#a1acb8] dark:text-slate-400">{selectedNews.published_at}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <p className="text-base leading-7 text-[#697a8d] dark:text-slate-300">
                {selectedNews.summary || 'No hay mas detalles disponibles para esta noticia por el momento.'}
              </p>

              {selectedNews.url && (
                <a
                  href={selectedNews.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#696cff] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#696cff]/20 transition hover:bg-[#5f61e6]"
                >
                  <span>Ir a la fuente</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
