import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export const Footer: React.FC = () => {
  const [appLogo, setAppLogo] = useState('/favicon.svg')
  const [appTitle, setAppTitle] = useState('FM Lista')

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['app_logo', 'app_title']);
      
      const logoSetting = data?.find(s => s.key === 'app_logo');
      const titleSetting = data?.find(s => s.key === 'app_title');

      if (logoSetting?.value) {
        setAppLogo(logoSetting.value);
      }

      if (titleSetting) {
        setAppTitle(titleSetting.value);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
            <Link to="/" className="flex items-center space-x-2 mb-2">
              <img src={appLogo} alt="Logo" className="w-10 h-10 object-contain" />
              {appTitle && <span className="text-lg font-bold text-primary-500">{appTitle}</span>}
            </Link>
            <p className="text-gray-500 text-sm text-center md:text-left max-w-xs">
              Todas las radios de Formosa en un solo lugar. Escucha tu música y programas favoritos donde quieras.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
             <div className="text-sm text-gray-400">
               &copy; {new Date().getFullYear()} {appTitle}. Todos los derechos reservados.
             </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
