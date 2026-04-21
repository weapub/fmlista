import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Advertisement } from '@/types/database';
import { cn } from '@/lib/utils';
import { useDeviceStore } from '@/stores/deviceStore';
import { useAuthStore } from '@/stores/authStore';

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
      let query = supabase
        .from('advertisements')
        .select('*')
        .eq('position', position)
        .eq('active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (radioId) {
        const { data: radioAds } = await supabase
          .from('advertisements')
          .select('*')
          .eq('position', position)
          .eq('active', true)
          .eq('radio_id', radioId)
          .order('display_order', { ascending: true });

        if (radioAds && radioAds.length > 0) {
          setAds(radioAds);
          return;
        }
      }

      query = query.is('radio_id', null);
      const { data } = await query;

      if (data && data.length > 0) {
        setAds(data);
      }
    };

    fetchAds();
  }, [position, radioId]);

  const handleClick = async (_ad: Advertisement) => {
    // Increment clicks if needed.
  };

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
      {ads.map((ad) => (
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
                src={ad.image_url}
                alt={ad.title}
                className={cn('h-auto w-full object-cover border border-white/5 shadow-lg', isTV ? 'rounded-[2rem]' : 'rounded-xl')}
                style={{ maxHeight: position.includes('sidebar') ? (isTV ? '760px' : '600px') : (isTV ? '280px' : '200px') }}
              />
            </a>
          ) : (
            <div className={cn('w-full transition-opacity duration-500 animate-in fade-in', isTV ? 'max-w-5xl' : 'max-w-4xl')}>
              <img
                src={ad.image_url}
                alt={ad.title}
                className={cn('h-auto w-full object-cover shadow-sm', isTV ? 'rounded-[2rem]' : 'rounded-lg')}
                style={{ maxHeight: position.includes('sidebar') ? (isTV ? '760px' : '600px') : (isTV ? '280px' : '200px') }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
