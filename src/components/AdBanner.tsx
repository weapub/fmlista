import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Advertisement } from '@/types/database';

interface AdBannerProps {
  position: 'home_top' | 'home_middle' | 'microsite_top' | 'microsite_sidebar';
  className?: string;
  radioId?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ position, className = '', radioId }) => {
  const [ads, setAds] = useState<Advertisement[]>([]);

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
    return (
      <div className={`w-full flex flex-col items-center space-y-4 my-8 ${className}`}>
        <div className="w-full max-w-4xl rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center transition-colors hover:bg-[#f5f5f9] dark:hover:bg-slate-800 group">
          <span className="inline-flex rounded-full bg-[#696cff]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#696cff] border border-[#696cff]/20">
            Publicidad
          </span>
          <h3 className="mt-6 text-xl font-bold text-[#566a7f] dark:text-slate-100 group-hover:text-[#696cff] transition-colors">Impulsa tu marca aqui</h3>
          <p className="mt-3 text-sm text-[#a1acb8] dark:text-slate-400">
            Agrega banners en la administracion para comenzar a mostrar publicidad en la app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col items-center space-y-6 my-6 ${className}`}>
      {ads.map((ad) => (
        <React.Fragment key={ad.id}>
          {ad.link_url ? (
            <a
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick(ad)}
              className="block w-full max-w-4xl transition-all duration-300 hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-2"
            >
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-auto object-cover rounded-xl shadow-lg border border-white/5"
                style={{ maxHeight: position.includes('sidebar') ? '600px' : '200px' }}
              />
            </a>
          ) : (
            <div className="w-full max-w-4xl transition-opacity duration-500 animate-in fade-in">
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-auto object-cover rounded-lg shadow-sm"
                style={{ maxHeight: position.includes('sidebar') ? '600px' : '200px' }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
