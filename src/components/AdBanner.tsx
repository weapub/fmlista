import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Advertisement } from '@/types/database';

interface AdBannerProps {
  position: 'home_top' | 'home_middle' | 'microsite_top' | 'microsite_sidebar';
  className?: string;
  radioId?: string; // Optional radio ID for context-aware ads
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
        // If radioId is provided, we prioritize ads for this radio.
        // We might want to show ONLY this radio's ads if they exist, or mix them.
        // The requirement is "owners can put their own ads". 
        // Typically this means they replace the platform ads on their site.
        
        // Let's try to fetch ads specifically for this radio first.
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

      // Fallback to global ads (where radio_id is null)
      query = query.is('radio_id', null);
      
      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        setAds(data);
      }
    };

    fetchAds();
  }, [position, radioId]);

  const handleClick = async (ad: Advertisement) => {
    // Increment clicks (fire and forget)
  };

  if (ads.length === 0) return null;

  return (
    <div className={`w-full flex flex-col items-center space-y-4 my-4 ${className}`}>
      {ads.map((ad) => (
        <React.Fragment key={ad.id}>
          {ad.link_url ? (
            <a 
                href={ad.link_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => handleClick(ad)}
                className="block w-full max-w-4xl transition-opacity duration-500 animate-in fade-in"
            >
              <img 
                src={ad.image_url} 
                alt={ad.title} 
                className="w-full h-auto object-cover rounded-lg shadow-sm hover:opacity-95 transition-opacity"
                style={{ maxHeight: position.includes('sidebar') ? '600px' : '200px' }}
              />
            </a>
          ) : (
            <div 
                className="w-full max-w-4xl transition-opacity duration-500 animate-in fade-in"
            >
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
