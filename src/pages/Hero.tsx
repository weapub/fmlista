import React from 'react';
import { Search } from 'lucide-react';

interface HeroProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative rounded-[2.5rem] overflow-hidden mb-10 bg-[#696cff] min-h-[340px] flex items-center justify-center px-6 py-12 shadow-2xl shadow-[#696cff]/20">
      {/* Acentos de fondo estilo SaaS moderno */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/30 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center space-y-10">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
            Encuentra tu ritmo <span className="text-white/60">ideal</span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl font-medium max-w-lg mx-auto">
            Todas las radios de Formosa en un solo lugar con la mejor calidad.
          </p>
        </div>

        {/* Buscador con Efecto Vidrio Esmerilado */}
        <div className="relative group max-w-xl mx-auto w-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-transparent rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative flex items-center bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[1.75rem] px-6 py-5 shadow-2xl transition-all duration-300 group-focus-within:bg-white/15 group-focus-within:border-white/40">
            <Search className="w-6 h-6 text-white/60 mr-4 flex-shrink-0" />
            <input
              type="text"
              placeholder="Busca tu emisora, frecuencia o ciudad..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent border-none text-white placeholder:text-white/40 w-full focus:ring-0 outline-none text-lg font-bold"
            />
            <div className="hidden sm:flex items-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-[0.2em] border-l border-white/10 pl-5 ml-2">
              LIVE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};