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
    description: 'La red de radios más grande de la provincia en un solo lugar.',
    logo: ''
  });

  useEffect(() => {
    const fetchFooterSettings = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['app_title', 'app_description', 'app_footer_logo', 'app_logo']);
      
      if (data) {
        const title = data.find(s => s.key === 'app_title')?.value || 'FM Lista';
        const desc = data.find(s => s.key === 'app_description')?.value || 'Todas las radios en un solo lugar.';
        const footerLogo = data.find(s => s.key === 'app_footer_logo')?.value;
        const mainLogo = data.find(s => s.key === 'app_logo')?.value;

        setSettings({
          title,
          description: desc,
          logo: footerLogo || mainLogo || ''
        });
      }
    };
    fetchFooterSettings();
  }, []);

  return (
    <footer className={`bg-white border-t border-gray-100 pt-16 pb-8 ${className}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Branding Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#696cff] rounded-xl flex items-center justify-center shadow-lg shadow-[#696cff]/20">
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo" className="w-7 h-7 object-contain brightness-0 invert" />
                ) : (
                  <Radio className="text-white w-6 h-6" />
                )}
              </div>
              <span className="font-bold text-xl text-[#566a7f] tracking-tight">{settings.title}</span>
            </div>
            <p className="text-[#a1acb8] text-sm leading-relaxed">
              {settings.description}
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 rounded-lg bg-[#f5f5f9] text-[#697a8d] hover:bg-[#696cff] hover:text-white transition-all"><Facebook className="w-4 h-4" /></a>
              <a href="#" className="p-2 rounded-lg bg-[#f5f5f9] text-[#697a8d] hover:bg-[#696cff] hover:text-white transition-all"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="p-2 rounded-lg bg-[#f5f5f9] text-[#697a8d] hover:bg-[#696cff] hover:text-white transition-all"><Twitter className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="font-bold text-[#566a7f] mb-6 uppercase text-xs tracking-widest">Plataforma</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-sm text-[#a1acb8] hover:text-[#696cff] transition-colors">Explorar Radios</Link></li>
              <li><Link to="/planes" className="text-sm text-[#a1acb8] hover:text-[#696cff] transition-colors">Planes Premium</Link></li>
              <li><Link to="/admin" className="text-sm text-[#a1acb8] hover:text-[#696cff] transition-colors">Panel de Control</Link></li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h4 className="font-bold text-[#566a7f] mb-6 uppercase text-xs tracking-widest">Soporte</h4>
            <ul className="space-y-4">
              <li><Link to="/planes" className="text-sm text-[#a1acb8] hover:text-[#696cff] transition-colors">Preguntas Frecuentes</Link></li>
              <li><a href="https://wa.me/543704000000" target="_blank" className="text-sm text-[#a1acb8] hover:text-[#696cff] transition-colors flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Contacto WhatsApp
              </a></li>
              <li><a href="mailto:soporte@fmlista.com" className="text-sm text-[#a1acb8] hover:text-[#696cff] transition-colors flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email de Ayuda
              </a></li>
            </ul>
          </div>

          {/* Newsletter / CTA */}
          <div>
            <h4 className="font-bold text-[#566a7f] mb-6 uppercase text-xs tracking-widest">¿Sos dueño de una radio?</h4>
            <p className="text-sm text-[#a1acb8] mb-4 font-medium">Sumá tu emisora hoy mismo y empezá a transmitir online.</p>
            <Link 
              to="/planes" 
              className="block w-full py-3 px-4 bg-[#696cff]/10 text-[#696cff] text-center rounded-xl font-bold text-sm hover:bg-[#696cff] hover:text-white transition-all border border-[#696cff]/20"
            >
              Publicar mi Radio
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#a1acb8] font-medium">
            © {new Date().getFullYear()} {settings.title}. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link to="#" className="text-[11px] font-bold text-[#a1acb8] hover:text-[#696cff] uppercase tracking-tighter">Privacidad</Link>
            <Link to="#" className="text-[11px] font-bold text-[#a1acb8] hover:text-[#696cff] uppercase tracking-tighter">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};