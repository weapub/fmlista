import React from 'react';
import { RadioCard } from '@/components/RadioCard';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Radio } from '@/types/database';
import { Compass, Radio as RadioIcon, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeviceStore } from '@/stores/deviceStore';

interface HomeSectionsProps {
  favoriteRadios: Radio[];
  trendingRadios: Radio[];
  trendingCategory: string | null;
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
  favoriteRadios,
  trendingRadios,
  trendingCategory,
  recentRadios,
  filteredBySearch,
  radiosCount,
  hasMore,
  isLoadingMore,
  loaderRef,
}: HomeSectionsProps) {
  const { isTV } = useDeviceStore();
  const featuredDiscovery = filteredBySearch.slice(0, 2);
  const discoveryCategories = Array.from(
    new Set(filteredBySearch.map((radio) => radio.category).filter(Boolean))
  ).slice(0, 6);

  const sectionTitleClass = cn(
    'font-semibold text-gray-900 dark:text-white',
    isTV ? 'mb-5 text-3xl' : 'mb-3 text-xl'
  );

  const gridClass = cn(
    'grid gap-6',
    isTV ? 'grid-cols-1 gap-8 xl:grid-cols-2 2xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  );

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
                Una selección rápida para salir de lo de siempre y encontrar nuevas voces, estilos y ciudades.
              </p>
            </div>

            {discoveryCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
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
          isTV && 'mb-8 px-7 py-5'
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
