import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Advertisement } from '@/types/database';

interface AdBannerProps {
  position: 'home_top' | 'home_middle' | 'microsite_top' | 'microsite_sidebar';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ position, className = '' }) => {
  const [ad, setAd] = useState<Advertisement | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      // Fetch a random active ad for the given position
      // Note: Supabase doesn't support RANDOM() easily in JS client without RPC, 
      // so we'll fetch a few and pick one.
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('position', position)
        .eq('active', true)
        .limit(5); // Fetch up to 5 candidates

      if (!error && data && data.length > 0) {
        const randomAd = data[Math.floor(Math.random() * data.length)];
        setAd(randomAd);
      }
    };

    fetchAd();
  }, [position]);

  const handleClick = async () => {
      if (!ad) return;
      // Increment clicks (fire and forget)
      // Note: RLS might block this if not set up to allow public updates on clicks.
      // For now we assume RLS allows it or we skip it if it fails.
      // Ideally this should be an RPC call "increment_ad_click(ad_id)"
      
      // Since we didn't create an RPC, we'll skip click tracking for anonymous users 
      // if RLS blocks updates. But let's just focus on display.
  };

  if (!ad) return null;

  return (
    <div className={`w-full flex justify-center my-4 ${className}`}>
      {ad.link_url ? (
        <a 
            href={ad.link_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={handleClick}
            className="block w-full max-w-4xl"
        >
          <img 
            src={ad.image_url} 
            alt={ad.title} 
            className="w-full h-auto object-cover rounded-lg shadow-sm hover:opacity-95 transition-opacity"
            style={{ maxHeight: position.includes('sidebar') ? '600px' : '200px' }}
          />
        </a>
      ) : (
        <div className="w-full max-w-4xl">
             <img 
            src={ad.image_url} 
            alt={ad.title} 
            className="w-full h-auto object-cover rounded-lg shadow-sm"
            style={{ maxHeight: position.includes('sidebar') ? '600px' : '200px' }}
          />
        </div>
      )}
    </div>
  );
};
