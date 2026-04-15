import React, { useState, useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  is_breaking?: boolean;
}

interface NewsSectionProps {
  minimal?: boolean;
  className?: string;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ minimal = false, className = '' }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      const mockNews: NewsItem[] = [
        { id: '1', title: 'Fuerte temporal afecta la zona sur de la provincia', source: 'La Manana', is_breaking: true },
        { id: '2', title: 'Nueva programacion nocturna en Radio Nacional', source: 'Radio Nacional' },
        { id: '3', title: 'Alerta meteorologica para las proximas 24 horas', source: 'Contingencias', is_breaking: true },
        { id: '4', title: 'Festival Provincial: se confirman los artistas invitados', source: 'Radio Formosa' },
      ];

      setNews(mockNews);
      setLoading(false);
    };

    fetchNews();
  }, []);

  const hasBreakingNews = news.some((item) => item.is_breaking);

  if (loading) return null;

  return (
    <div className={cn('relative group', className)}>
      {hasBreakingNews && <div className="absolute inset-0 bg-red-500/20 rounded-2xl blur-xl animate-pulse -z-10" />}

      <div
        className={cn(
          'flex items-center bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-500 overflow-hidden',
          hasBreakingNews ? 'border-red-500/50 shadow-lg shadow-red-500/10' : 'border-gray-100 dark:border-gray-800 shadow-sm',
          minimal ? 'p-1' : 'p-4'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl flex-shrink-0 z-10 shadow-sm',
            hasBreakingNews ? 'bg-red-500 text-white shadow-md' : 'bg-[#696cff]/10 text-[#696cff]'
          )}
        >
          <Newspaper className={cn('w-4 h-4', hasBreakingNews && 'animate-bounce')} />
          <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{hasBreakingNews ? 'Ultimo Momento' : 'Noticias'}</span>
        </div>

        <div className="flex-1 overflow-hidden relative ml-4">
          <div className="flex whitespace-nowrap gap-12 animate-marquee hover:[animation-play-state:paused]">
            {[...news, ...news].map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-center gap-2 text-sm font-medium text-[#566a7f] dark:text-gray-300">
                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', item.is_breaking ? 'bg-red-500 animate-pulse' : 'bg-[#a1acb8] dark:bg-slate-500')} />
                <span className="opacity-50 text-[10px] font-black uppercase tracking-tighter">{item.source}:</span>
                <span className={cn(item.is_breaking && 'text-red-600 dark:text-red-400 font-bold')}>{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
