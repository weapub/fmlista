import React from 'react';
import { RadioCard } from '@/components/RadioCard';
import { AudioPlayer } from '@/components/AudioPlayer';
import { NewsSection } from '@/components/NewsSection';
import { Radio } from '@/types/database';
import { Radio as RadioIcon, Heart } from 'lucide-react';

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
  <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm overflow-hidden animate-pulse border border-gray-100 dark:border-slate-800">
    <div className="w-full h-32 bg-gray-200 dark:bg-slate-800" />
    <div className="p-4">
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="space-y-2 pt-2">
          <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-5/6" />
        </div>
        <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded-md w-full mt-4" />
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
  return (
    <>
      {favoriteRadios.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center space-x-2 mb-4">
            <Heart className="w-6 h-6 text-red-500 fill-current" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Favoritos</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteRadios.map((radio) => (
              <RadioCard key={`fav-${radio.id}`} radio={radio} />
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tendencias</h2>
          {trendingCategory && <span className="text-sm text-gray-500 dark:text-gray-400">Categoria: {trendingCategory}</span>}
        </div>
        {trendingRadios.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Sin emisoras</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingRadios.map((radio) => (
              <RadioCard key={radio.id} radio={radio} />
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Agregadas recientemente</h2>
        {recentRadios.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Sin emisoras recientes</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentRadios.map((radio) => (
              <RadioCard key={radio.id} radio={radio} />
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400">Mostrando {filteredBySearch.length} de {radiosCount} emisoras</p>
      </div>

      {filteredBySearch.length === 0 ? (
        <div className="text-center py-12">
          <RadioIcon className="w-16 h-16 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No se encontraron emisoras</h3>
          <p className="text-gray-600 dark:text-gray-400">Intenta ajustar tus filtros o termino de busqueda</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBySearch.map((radio) => (
              <RadioCard key={radio.id} radio={radio} />
            ))}
          </div>

          {hasMore && (
            <div ref={loaderRef} className="mt-12 pb-12">
              {isLoadingMore && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, index) => (
                    <RadioCardSkeleton key={`more-${index}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Noticias de Formosa</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Actualidad desde los diarios mas populares de la provincia.</p>
        <NewsSection />
      </div>

      <AudioPlayer />
    </>
  );
}
