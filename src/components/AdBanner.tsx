import React, { useEffect, useState } from 'react';
import { Advertisement } from '@/types/database';
import { cn } from '@/lib/utils';
import { useDeviceStore } from '@/stores/deviceStore';
import { useAuthStore } from '@/stores/authStore';
import { optimizeSupabaseImageUrl } from '@/lib/imageOptimization';
import { queryPublicTable } from '@/lib/publicSupabase';

interface AdBannerProps {
  position: 'home_top' | 'home_middle' | 'microsite_top' | 'microsite_sidebar';
  className?: string;
  radioId?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ position, className = '', radioId }) => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const { isTV } = useDeviceStore()
  const { user } = useAuthStore()
  const isAdminUser = user?.role === 'radio_admin' || user?.role === 'super_admin'

  useEffect(() => {
    const fetchAds = async () => {
      if (radioId) {
        const radioAds = await queryPublicTable<Advertisement>('advertisements', {
          filters: [
            { column: 'position', op: 'eq', value: position },
            { column: 'active', op: 'eq', value: true },
            { column: 'radio_id', op: 'eq', value: radioId },
          ],
          order: [
            { column: 'display_order', ascending: true },
            { column: 'created_at', ascending: false },
          ],
        });

        if (radioAds && radioAds.length > 0) {
          setAds(radioAds);
          return;
        }
      }

      const data = await queryPublicTable<Advertisement>('advertisements', {
        filters: [
          { column: 'position', op: 'eq', value: position },
          { column: 'active', op: 'eq', value: true },
          { column: 'radio_id', op: 'is', value: null },
        ],
        order: [
          { column: 'display_order', ascending: true },
          { column: 'created_at', ascending: false },
        ],
      });

      if (data && data.length > 0) {
        setAds(data);
      }
    };

    const timeoutId = window.setTimeout(() => {
      void fetchAds();
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [position, radioId]);

  const handleClick = async (_ad: Advertisement) => {
    // Increment clicks if needed.
  };

  const getOptimizedAdUrl = (url?: string | null) => {
    if (!url) return ''
    if (url.toLowerCase().includes('.gif')) return url

    const width = position.includes('sidebar') ? (isTV ? 900 : 700) : (isTV ? 1600 : 1200)
    return optimizeSupabaseImageUrl(url, {
      width,
      quality: 70,
    })
  }

  if (ads.length === 0) {
    if (!isAdminUser) return null;

    return (
      <div className={cn('my-8 flex w-full flex-col items-center space-y-4', className)}>
        <div className={cn('group w-full max-w-4xl border border-dashed border-slate-200 bg-white p-10 text-center transition-colors hover:bg-[#f5f5f9] dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800', isTV ? 'rounded-[2rem] p-12 max-w-5xl' : 'rounded-2xl')}>
          <span className={cn('inline-flex rounded-full border border-[#696cff]/20 bg-[#696cff]/10 font-bold uppercase tracking-[0.2em] text-[#696cff]', isTV ? 'px-5 py-2 text-xs' : 'px-4 py-1.5 text-[10px]')}>
            Publicidad
          </span>
          <h3 className={cn('mt-6 font-bold text-[#566a7f] transition-colors group-hover:text-[#696cff] dark:text-slate-100', isTV ? 'text-3xl' : 'text-xl')}>Impulsa tu marca aquí</h3>
          <p className={cn('mt-3 text-[#a1acb8] dark:text-slate-400', isTV ? 'text-base' : 'text-sm')}>
            Agrega banners en la administración para comenzar a mostrar publicidad en la app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('my-6 flex w-full flex-col items-center space-y-6', className)}>
      {ads.filter((ad) => !!ad.image_url).map((ad) => {
        const optimizedUrl = getOptimizedAdUrl(ad.image_url)
        if (!optimizedUrl) return null

        const isSidebar = position.includes('sidebar')
        const width = isSidebar ? (isTV ? 900 : 700) : (isTV ? 1600 : 1200)
        const height = isSidebar ? (isTV ? 760 : 600) : (isTV ? 280 : 200)

        return (
        <React.Fragment key={ad.id}>
          {ad.link_url ? (
            <a
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick(ad)}
              className={cn('block w-full transition-all duration-300 hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-2 focusable', isTV ? 'max-w-5xl rounded-[2rem]' : 'max-w-4xl')}
            >
              <img
                src={optimizedUrl}
                alt={ad.title}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                width={width}
                height={height}
                className={cn('h-auto w-full object-cover border border-white/5 shadow-lg', isTV ? 'rounded-[2rem]' : 'rounded-xl')}
                style={{ maxHeight: `${height}px` }}
              />
            </a>
          ) : (
            <div className={cn('w-full transition-opacity duration-500 animate-in fade-in', isTV ? 'max-w-5xl' : 'max-w-4xl')}>
              <img
                src={optimizedUrl}
                alt={ad.title}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                width={width}
                height={height}
                className={cn('h-auto w-full object-cover shadow-sm', isTV ? 'rounded-[2rem]' : 'rounded-lg')}
                style={{ maxHeight: `${height}px` }}
              />
            </div>
          )}
        </React.Fragment>
      )})}
    </div>
  );
};
