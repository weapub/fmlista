import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Radio as RadioIcon, MapPin, Star } from 'lucide-react';
import { useRadioStore } from '@/stores/radioStore';
import { Radio } from '@/types/database';
import { cn } from '@/lib/utils';
import { getRadioPath } from '@/lib/microsites';

interface RadioCardProps {
  radio: Radio;
  className?: string;
  isFeatured?: boolean;
}

export const RadioCard: React.FC<RadioCardProps> = ({ radio, className, isFeatured }) => {
  const navigate = useNavigate();
  const { currentRadio, setCurrentRadio, setIsPlaying } = useRadioStore();
  const [imageError, setImageError] = useState(false);

  const isCurrentPlaying = currentRadio?.id === radio.id;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCurrentPlaying) {
      setCurrentRadio(radio);
    }
    setIsPlaying(true);
  };

  const handleNavigate = () => {
    navigate(getRadioPath(radio));
  };

  const isPlaceholder = (url?: string | null) => !!url && url.includes('via.placeholder.com');

  return (
    <div
      onClick={handleNavigate}
      className={cn(
        "group relative bg-white rounded-[1.5rem] border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#696cff]/10 cursor-pointer overflow-hidden",
        isFeatured && "ring-2 ring-[#696cff]/20",
        className
      )}
    >
      {/* Badge de "Sponsoreado" o "Destacado" */}
      {(isFeatured || radio.is_featured) && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-[#696cff] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-[#696cff]/30">
          <Star className="w-3 h-3 fill-current" />
          Premium
        </div>
      )}

      <div className="p-5 flex items-center gap-5">
        {/* Logo Container */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group-hover:border-[#696cff]/30 transition-colors shadow-inner">
            {radio.logo_url && !isPlaceholder(radio.logo_url) && !imageError ? (
              <img
                src={radio.logo_url}
                alt={radio.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <RadioIcon className="w-8 h-8" />
              </div>
            )}
          </div>
          
          {/* Indicador de "Reproduciendo" animado */}
          {isCurrentPlaying && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#696cff] rounded-lg flex items-center justify-center border-2 border-white shadow-md">
              <div className="flex gap-0.5 items-center">
                <div className="w-0.5 h-2 bg-white animate-pulse" />
                <div className="w-0.5 h-3 bg-white animate-pulse delay-75" />
                <div className="w-0.5 h-2 bg-white animate-pulse delay-150" />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-[#566a7f] group-hover:text-[#696cff] transition-colors truncate mb-0.5">
            {radio.name}
          </h3>
          <p className="text-sm font-black text-[#696cff] tracking-tight mb-1">
            {radio.frequency}
          </p>
          <div className="flex items-center gap-1.5 text-[#a1acb8] font-medium text-xs">
            <MapPin className="w-3.5 h-3.5" />
            {radio.location || 'Argentina'}
          </div>
        </div>

        {/* Play Button */}
        <button
          onClick={handlePlay}
          className={cn(
            "p-4 rounded-2xl transition-all duration-300 transform active:scale-90",
            isCurrentPlaying 
              ? "bg-[#696cff] text-white shadow-lg shadow-[#696cff]/30" 
              : "bg-slate-50 text-[#a1acb8] hover:bg-[#696cff] hover:text-white hover:shadow-lg"
          )}
        >
          <Play className={cn("w-6 h-6", isCurrentPlaying && "fill-current")} />
        </button>
      </div>
    </div>
  );
};
