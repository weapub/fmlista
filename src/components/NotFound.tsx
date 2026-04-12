// Movido a src/pages/NotFound.tsx para coherencia con App.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f5f9] flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 space-y-6">
        <div className="relative">
          <h1 className="text-9xl font-black text-[#696cff]/10">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-2xl font-bold text-[#566a7f]">Página no encontrada</h2>
          </div>
        </div>
        
        <p className="text-[#a1acb8] leading-relaxed">
          Lo sentimos, la página que estás buscando no existe o ha sido movida a otra ubicación.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-[#566a7f] rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver atrás
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#696cff] text-white rounded-lg hover:bg-[#5f61e6] shadow-md shadow-[#696cff]/20 transition-all font-bold"
          >
            <Home className="w-4 h-4" />
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;