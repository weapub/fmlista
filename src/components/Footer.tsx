import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Facebook, Instagram, Twitter, Mail, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const [settings, setSettings] = useState({
    title: 'FM Lista',
    description: 'La red de radios mas grande de la provincia en un solo lugar.',
    logo: '',
  });

  useEffect(() => {
    const fetchFooterSettings = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['app_title', 'app_description', 'app_footer_logo', 'app_logo']);

      if (data) {
        const title = data.find((setting) => setting.key === 'app_title')?.value || 'FM Lista';
        const description = data.find((setting) => setting.key === 'app_description')?.value || 'Todas las radios en un solo lugar.';
        const footerLogo = data.find((setting) => setting.key === 'app_footer_logo')?.value;
        const mainLogo = data.find((setting) => setting.key === 'app_logo')?.value;

        setSettings({
          title,
          description,
          logo: footerLogo || mainLogo || '',
        });
      }
    };

    fetchFooterSettings();
  }, []);

  return (
    <footer className={`bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 pt-16 pb-8 transition-colors ${className}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#696cff] rounded-xl flex items-center justify-center shadow-lg shadow-[#696cff]/20">
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo" className="w-7 h-7 object-contain brightness-0 invert" />
                ) : (
                  <Radio className="text-white w-6 h-6" />
                )}
              </div>
              <span className="font-bold text-xl text-[#566a7f] dark:text-white tracking-tight">{settings.title}</span>
            </div>
            <p className="text-[#a1acb8] dark:text-slate-400 text-sm leading-relaxed">{settings.description}</p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 rounded-lg bg-[#f5f5f9] dark:bg-slate-900 text-[#697a8d] dark:text-slate-300 hover:bg-[#696cff] hover:text-white transition-all"><Facebook className="w-4 h-4" /></a>
              <a href="#" className="p-2 rounded-lg bg-[#f5f5f9] dark:bg-slate-900 text-[#697a8d] dark:text-slate-300 hover:bg-[#696cff] hover:text-white transition-all"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="p-2 rounded-lg bg-[#f5f5f9] dark:bg-slate-900 text-[#697a8d] dark:text-slate-300 hover:bg-[#696cff] hover:text-white transition-all"><Twitter className="w-4 h-4" /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-[#566a7f] dark:text-white mb-6 uppercase text-xs tracking-widest">Plataforma</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-sm text-[#a1acb8] dark:text-slate-400 hover:text-[#696cff] transition-colors">Explorar Radios</Link></li>
              <li><Link to="/planes" className="text-sm text-[#a1acb8] dark:text-slate-400 hover:text-[#696cff] transition-colors">Planes Premium</Link></li>
              <li><Link to="/admin" className="text-sm text-[#a1acb8] dark:text-slate-400 hover:text-[#696cff] transition-colors">Panel de Control</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#566a7f] dark:text-white mb-6 uppercase text-xs tracking-widest">Soporte</h4>
            <ul className="space-y-4">
              <li><Link to="/planes" className="text-sm text-[#a1acb8] dark:text-slate-400 hover:text-[#696cff] transition-colors">Preguntas Frecuentes</Link></li>
              <li><a href="https://wa.me/543704000000" target="_blank" rel="noreferrer" className="text-sm text-[#a1acb8] dark:text-slate-400 hover:text-[#696cff] transition-colors flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Contacto WhatsApp</a></li>
              <li><a href="mailto:soporte@fmlista.com" className="text-sm text-[#a1acb8] dark:text-slate-400 hover:text-[#696cff] transition-colors flex items-center gap-2"><Mail className="w-4 h-4" /> Email de Ayuda</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#566a7f] dark:text-white mb-6 uppercase text-xs tracking-widest">Eres dueno de una radio?</h4>
            <p className="text-sm text-[#a1acb8] dark:text-slate-400 mb-4 font-medium">Suma tu emisora hoy mismo y empieza a transmitir online.</p>
            <Link
              to="/planes"
              className="block w-full py-3 px-4 bg-[#696cff]/10 text-[#696cff] text-center rounded-xl font-bold text-sm hover:bg-[#696cff] hover:text-white transition-all border border-[#696cff]/20"
            >
              Publicar mi Radio
            </Link>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-50 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#a1acb8] dark:text-slate-500 font-medium">© {new Date().getFullYear()} {settings.title}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <Link to="#" className="text-[11px] font-bold text-[#a1acb8] dark:text-slate-500 hover:text-[#696cff] uppercase tracking-tighter">Privacidad</Link>
            <Link to="#" className="text-[11px] font-bold text-[#a1acb8] dark:text-slate-500 hover:text-[#696cff] uppercase tracking-tighter">Terminos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
