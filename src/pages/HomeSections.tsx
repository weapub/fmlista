import React from 'react';
import { RadioCard } from '@/components/RadioCard';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Radio } from '@/types/database';
import { Compass, MapPin, Radio as RadioIcon, Heart, Sparkles, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeviceStore } from '@/stores/deviceStore';
import { useRadioStore } from '@/stores/radioStore';

interface HomeSectionsProps {
  citySpotlightLabel: string | null;
  citySpotlightRadios: Radio[];
  favoriteRadios: Radio[];
  trendingRadios: Radio[];
  trendingCategory: string | null;
  rankingLimit: number;
  recentRadios: Radio[];
  filteredBySearch: Radio[];
  radiosCount: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  loaderRef: React.RefObject<HTMLDivElement>;
}

const RadioCardSkeleton = () => (
  <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm animate-pulse dark:border-slate-800 dark:bg-slate-900">
    <div className="h-32 w-full bg-gray-200 dark:bg-slate-800" />
    <div className="p-4">
      <div className="space-y-3">
        <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-slate-800" />
        <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-slate-800" />
        <div className="space-y-2 pt-2">
          <div className="h-3 w-full rounded bg-gray-200 dark:bg-slate-800" />
          <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-slate-800" />
        </div>
        <div className="mt-4 h-10 w-full rounded-md bg-gray-200 dark:bg-slate-800" />
      </div>
    </div>
  </div>
);

export default function HomeSections({
  citySpotlightLabel,
  citySpotlightRadios,
  favoriteRadios,
  trendingRadios,
  trendingCategory,
  rankingLimit,
  recentRadios,
  filteredBySearch,
  radiosCount,
  hasMore,
  isLoadingMore,
  loaderRef,
}: HomeSectionsProps) {
  const { isTV } = useDeviceStore();
  const { selectedLocation, setSelectedLocation } = useRadioStore();
  const featuredDiscovery = filteredBySearch.slice(0, 2);
  const discoveryCategories = Array.from(
    new Set(filteredBySearch.map((radio) => radio.category).filter(Boolean))
  ).slice(0, 6);
  const rankingRadios = trendingRadios.slice(0, rankingLimit);

  const sectionTitleClass = cn(
    'font-semibold text-gray-900 dark:text-white',
    isTV ? 'mb-5 text-3xl' : 'mb-3 text-xl'
  );

  const gridClass = cn(
    'grid gap-6',
    isTV ? 'grid-cols-1 gap-8 xl:grid-cols-2 2xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  );

  const handleLocationTagClick = (location: string) => {
    setSelectedLocation(selectedLocation === location ? null : location);
  };

  return (
    <>
      {featuredDiscovery.length > 0 && (
        <section
          className={cn(
            'mb-10 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-[#eef0ff] p-5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950',
            isTV && 'mb-14 rounded-[2.5rem] p-8'
          )}
        >
          <div className={cn('mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between', isTV && 'mb-7')}>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#696cff]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#696cff] dark:bg-[#696cff]/15">
                <Compass className="h-3.5 w-3.5" />
                Descubrir
              </div>
              <h2 className={cn('font-bold text-slate-900 dark:text-white', isTV ? 'text-4xl' : 'text-2xl')}>
                Explora algo distinto hoy
              </h2>
              <p className={cn('mt-2 max-w-2xl text-slate-500 dark:text-slate-400', isTV ? 'text-lg' : 'text-sm')}>
                Una seleccion rapida para salir de lo de siempre y encontrar nuevas voces, estilos y ciudades.
              </p>
            </div>

            {discoveryCategories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
                {discoveryCategories.map((category) => (
                  <span
                    key={category}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300',
                      isTV && 'px-4 py-2 text-xs'
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#696cff]" />
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={cn('grid gap-6', featuredDiscovery.length > 1 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1')}>
            {featuredDiscovery.map((radio, index) => (
              <div
                key={`discovery-${radio.id}`}
                className={cn(
                  'rounded-[1.75rem] border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80',
                  index === 0 && featuredDiscovery.length > 1 && 'xl:translate-y-2'
                )}
              >
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <Sparkles className="h-3.5 w-3.5 text-[#696cff]" />
                  {index === 0 ? 'Sugerida para empezar' : 'Otra para descubrir'}
                </div>
                <RadioCard radio={radio} isFeatured className="shadow-none" />
              </div>
            ))}
          </div>
        </section>
      )}

      {favoriteRadios.length > 0 && (
        <div className={cn('mb-12', isTV && 'mb-16')}>
          <div className={cn('mb-4 flex items-center space-x-2', isTV && 'mb-6')}>
            <Heart className={cn('fill-current text-red-500', isTV ? 'h-8 w-8' : 'h-6 w-6')} />
            <h2 className={cn('font-bold text-gray-900 dark:text-white', isTV ? 'text-4xl' : 'text-2xl')}>
              Mis Favoritos
            </h2>
          </div>
          <div className={gridClass}>
            {favoriteRadios.map((radio) => (
              <RadioCard key={`fav-${radio.id}`} radio={radio} />
            ))}
          </div>
        </div>
      )}

      {citySpotlightLabel && citySpotlightRadios.length > 0 && (
        <section
          className={cn(
            'mb-10 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-[#fff8ec] via-white to-[#fff0f0] p-5 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950',
            isTV && 'mb-14 rounded-[2.5rem] p-8'
          )}
        >
          <div className={cn('mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between', isTV && 'mb-7')}>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                <MapPin className="h-3.5 w-3.5" />
                POR LOCALIDAD
              </div>
              <h2 className={cn('font-bold text-slate-900 dark:text-white', isTV ? 'text-4xl' : 'text-2xl')}>
                Sonando en {citySpotlightLabel}
              </h2>
              <p className={cn('mt-2 max-w-2xl text-slate-500 dark:text-slate-400', isTV ? 'text-lg' : 'text-sm')}>
                Una seleccion local para entrar rapido a las radios mas cercanas a tu busqueda o ubicacion elegida.
              </p>
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {citySpotlightRadios.length} emisoras destacadas
            </span>
          </div>

          <div className={cn('grid gap-4', isTV ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2')}>
            {citySpotlightRadios.map((radio) => (
              <RadioCard key={`city-${radio.id}`} radio={radio} className="shadow-none" />
            ))}
          </div>
        </section>
      )}

      {rankingRadios.length > 0 && (
        <section
          className={cn(
            'mb-10 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80',
            isTV && 'mb-14 rounded-[2.5rem] p-8'
          )}
        >
          <div className={cn('mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', isTV && 'mb-7')}>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                <Trophy className="h-3.5 w-3.5" />
                Ranking
              </div>
              <h2 className={cn('font-bold text-slate-900 dark:text-white', isTV ? 'text-4xl' : 'text-2xl')}>
                Las que mas estan sonando
              </h2>
            </div>

            <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <TrendingUp className="h-4 w-4 text-[#696cff]" />
              <span>{trendingCategory ? `Impulsadas por ${trendingCategory}` : 'Seleccion destacada del momento'}</span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className={cn('rounded-[1.75rem] bg-gradient-to-br from-[#696cff] via-[#787bff] to-[#5f61e6] p-5 text-white shadow-lg shadow-[#696cff]/20', isTV && 'p-7')}>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">Puesto 1</p>
              <h3 className={cn('mt-2 font-black tracking-tight', isTV ? 'text-4xl' : 'text-3xl')}>
                {rankingRadios[0].name}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {rankingRadios[0].frequency && (
                  <span className="rounded-full bg-white/15 px-3 py-1 font-bold">{rankingRadios[0].frequency}</span>
                )}
                {rankingRadios[0].location && (
                  <button
                    type="button"
                    onClick={() => handleLocationTagClick(rankingRadios[0].location!)}
                    className={cn(
                      'rounded-full px-3 py-1 font-bold transition-colors',
                      selectedLocation === rankingRadios[0].location
                        ? 'bg-white text-[#696cff]'
                        : 'bg-white/15 hover:bg-white/30'
                    )}
                  >
                    {rankingRadios[0].location}
                  </button>
                )}
                {rankingRadios[0].category && (
                  <span className="rounded-full bg-white/15 px-3 py-1 font-bold">{rankingRadios[0].category}</span>
                )}
              </div>
              <p className={cn('mt-4 max-w-lg text-white/80', isTV && 'text-lg')}>
                Una de las emisoras mas fuertes del momento para arrancar rapido con algo destacado.
              </p>
            </div>

            <div className="grid gap-3">
              {rankingRadios.map((radio, index) => (
                <div
                  key={`ranking-${radio.id}`}
                  className={cn(
                    'flex items-center gap-4 rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/60',
                    !isTV && 'sm:p-4',
                    isTV && 'p-5'
                  )}
                >
                  <div className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-black',
                    index === 0
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  )}>
                    #{index + 1}
                  </div>
                                    <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-800 dark:text-white">{radio.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      {radio.frequency && <span>{radio.frequency}</span>}
                      {radio.location && (
                        <button
                          type="button"
                          onClick={() => handleLocationTagClick(radio.location!)}
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-semibold transition-colors',
                            selectedLocation === radio.location
                              ? 'bg-[#696cff]/15 text-[#696cff] dark:bg-[#696cff]/25 dark:text-[#aeb0ff]'
                              : 'bg-slate-200/70 text-slate-600 hover:bg-[#696cff]/10 hover:text-[#696cff] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-[#696cff]/20'
                          )}
                        >
                          {radio.location}
                        </button>
                      )}
                      {radio.category && <span>{radio.category}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className={cn('mb-8', isTV && 'mb-12')}>
        <div className={cn('flex items-center justify-between gap-4', isTV && 'mb-5 flex-col items-start')}>
          <h2 className={sectionTitleClass}>Tendencias</h2>
          {trendingCategory && (
            <span className={cn('text-gray-500 dark:text-gray-400', isTV ? 'text-lg' : 'text-sm')}>
              Categoria: {trendingCategory}
            </span>
          )}
        </div>
        {trendingRadios.length === 0 ? (
          <p className={cn('text-gray-600 dark:text-gray-400', isTV && 'text-lg')}>Sin emisoras</p>
        ) : (
          <div className={gridClass}>
            {trendingRadios.map((radio) => (
              <RadioCard key={radio.id} radio={radio} />
            ))}
          </div>
        )}
      </div>

      <div className={cn('mb-8', isTV && 'mb-12')}>
        <h2 className={sectionTitleClass}>Agregadas recientemente</h2>
        {recentRadios.length === 0 ? (
          <p className={cn('text-gray-600 dark:text-gray-400', isTV && 'text-lg')}>Sin emisoras recientes</p>
        ) : (
          <div className={gridClass}>
            {recentRadios.map((radio) => (
              <RadioCard key={radio.id} radio={radio} />
            ))}
          </div>
        )}
      </div>

      <div
        className={cn(
          'mb-6 rounded-3xl border border-slate-200/70 bg-white/70 px-5 py-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70',
          isTV && 'mb-8 px-7 py-5',
          !isTV && 'sticky top-20 z-10'
        )}
      >
        <p className={cn('text-gray-600 dark:text-gray-400', isTV && 'text-lg font-medium')}>
          Mostrando {filteredBySearch.length} de {radiosCount} emisoras
        </p>
      </div>

      {filteredBySearch.length === 0 ? (
        <div
          className={cn(
            'rounded-[2rem] border border-dashed border-slate-200 bg-white/60 py-12 text-center backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60',
            isTV && 'py-16'
          )}
        >
          <RadioIcon className={cn('mx-auto mb-4 text-gray-300 dark:text-slate-700', isTV ? 'h-20 w-20' : 'h-16 w-16')} />
          <h3 className={cn('mb-2 font-medium text-gray-900 dark:text-white', isTV ? 'text-2xl' : 'text-lg')}>
            No se encontraron emisoras
          </h3>
          <p className={cn('text-gray-600 dark:text-gray-400', isTV && 'text-lg')}>
            Intenta ajustar tus filtros o termino de busqueda
          </p>
        </div>
      ) : (
        <>
          <div className={gridClass}>
            {filteredBySearch.map((radio) => (
              <RadioCard key={radio.id} radio={radio} />
            ))}
          </div>

          {hasMore && (
            <div ref={loaderRef} className="mt-12 pb-12">
              {isLoadingMore && (
                <div className={gridClass}>
                  {[...Array(3)].map((_, index) => (
                    <RadioCardSkeleton key={`more-${index}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <AudioPlayer />
    </>
  );
}


