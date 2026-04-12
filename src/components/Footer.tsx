import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export const Footer: React.FC<{ className?: string }> = ({ className }) => {
  const [appLogo, setAppLogo] = useState('/favicon.svg')
  const [footerLogo, setFooterLogo] = useState('')
  const [appTitle, setAppTitle] = useState('FM Lista')
  const [appDescription, setAppDescription] = useState('Todas las radios de Formosa en un solo lugar. Escucha tu música y programas favoritos donde quieras.')

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['app_logo', 'app_footer_logo', 'app_title', 'app_description']);
      
      const logoSetting = data?.find(s => s.key === 'app_logo');
      const footerLogoSetting = data?.find(s => s.key === 'app_footer_logo');
      const titleSetting = data?.find(s => s.key === 'app_title');
      const descriptionSetting = data?.find(s => s.key === 'app_description');

      if (logoSetting?.value) {
        setAppLogo(logoSetting.value);
      }

      if (footerLogoSetting?.value) {
        setFooterLogo(footerLogoSetting.value);
      }

      if (titleSetting) {
        setAppTitle(titleSetting.value);
      }

      if (descriptionSetting) {
        setAppDescription(descriptionSetting.value);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className={`bg-slate-950 text-slate-100 border-t border-slate-800 mt-auto transition-colors ${className || ''}`}>
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-10 md:grid-cols-[1.8fr_1fr] lg:grid-cols-[2.2fr_1fr]">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={appLogo} alt="Logo" className="w-11 h-11 object-contain" />
              {appTitle && <span className="text-xl font-semibold text-white">{appTitle}</span>}
            </Link>
            <p className="max-w-2xl text-sm text-slate-400">{appDescription}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Servicio</p>
                <p className="mt-2 text-sm text-white">Radios locales, categorías y streaming en vivo.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Diseño</p>
                <p className="mt-2 text-sm text-white">Interfaz moderna, responsive y accesible.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Soporte</p>
                <p className="mt-2 text-sm text-white">Escucha tu emisora favorita sin interrupciones.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Enlaces rápidos</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li><Link to="/" className="transition hover:text-white">Inicio</Link></li>
                <li><Link to="/login" className="transition hover:text-white">Ingresar</Link></li>
                <li><Link to="/planes" className="transition hover:text-white">Planes</Link></li>
                <li><Link to="/admin" className="transition hover:text-white">Panel</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Contacto</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>Formosa, Argentina</p>
                <p>info@fmlista.com</p>
                <p>Tel: +54 371 123 4567</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} {appTitle}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
