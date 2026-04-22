import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MessageCircle, Radio, Twitter } from 'lucide-react';
import { fetchAppSettings } from '@/lib/publicSupabase';

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
      const data = await fetchAppSettings(['app_title', 'app_description', 'app_footer_logo', 'app_logo']);
      const title = data.app_title || 'FM Lista';
      const description = data.app_description || 'Todas las radios en un solo lugar.';
      const footerLogo = data.app_footer_logo;
      const mainLogo = data.app_logo;

      setSettings({
        title,
        description,
        logo: footerLogo || mainLogo || '',
      });
    };

    void fetchFooterSettings();
  }, []);

  return (
    <footer
      className={`border-t border-gray-100 bg-white pt-16 pb-8 transition-colors dark:border-slate-800 dark:bg-slate-950 ${className}`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#696cff] shadow-lg shadow-[#696cff]/20">
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo" width={28} height={28} className="h-7 w-7 object-contain brightness-0 invert" />
                ) : (
                  <Radio className="h-6 w-6 text-white" />
                )}
              </div>
              <span className="text-xl font-bold tracking-tight text-[#566a7f] dark:text-white">{settings.title}</span>
            </div>
            <p className="text-sm leading-relaxed text-[#a1acb8] dark:text-slate-400">{settings.description}</p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                aria-label="Facebook de FM Lista"
                title="Facebook de FM Lista"
                className="rounded-lg bg-[#f5f5f9] p-2 text-[#697a8d] transition-all hover:bg-[#696cff] hover:text-white dark:bg-slate-900 dark:text-slate-300"
              >
                <Facebook className="h-4 w-4" />
                <span className="sr-only">Facebook de FM Lista</span>
              </a>
              <a
                href="#"
                aria-label="Instagram de FM Lista"
                title="Instagram de FM Lista"
                className="rounded-lg bg-[#f5f5f9] p-2 text-[#697a8d] transition-all hover:bg-[#696cff] hover:text-white dark:bg-slate-900 dark:text-slate-300"
              >
                <Instagram className="h-4 w-4" />
                <span className="sr-only">Instagram de FM Lista</span>
              </a>
              <a
                href="#"
                aria-label="X (Twitter) de FM Lista"
                title="X (Twitter) de FM Lista"
                className="rounded-lg bg-[#f5f5f9] p-2 text-[#697a8d] transition-all hover:bg-[#696cff] hover:text-white dark:bg-slate-900 dark:text-slate-300"
              >
                <Twitter className="h-4 w-4" />
                <span className="sr-only">X (Twitter) de FM Lista</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-[#566a7f] dark:text-white">
              Plataforma
            </h4>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-sm text-[#a1acb8] transition-colors hover:text-[#696cff] dark:text-slate-400">
                  Explorar Radios
                </Link>
              </li>
              <li>
                <Link
                  to="/planes"
                  className="text-sm text-[#a1acb8] transition-colors hover:text-[#696cff] dark:text-slate-400"
                >
                  Planes Premium
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-sm text-[#a1acb8] transition-colors hover:text-[#696cff] dark:text-slate-400"
                >
                  Blog y Guia
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="text-sm text-[#a1acb8] transition-colors hover:text-[#696cff] dark:text-slate-400"
                >
                  Panel de Control
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-[#566a7f] dark:text-white">
              Soporte
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/planes"
                  className="text-sm text-[#a1acb8] transition-colors hover:text-[#696cff] dark:text-slate-400"
                >
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/543704602028"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-[#a1acb8] transition-colors hover:text-[#696cff] dark:text-slate-400"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contacto WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="mailto:soporte@fmlista.com"
                  className="flex items-center gap-2 text-sm text-[#a1acb8] transition-colors hover:text-[#696cff] dark:text-slate-400"
                >
                  <Mail className="h-4 w-4" />
                  Email de Ayuda
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-[#566a7f] dark:text-white">
              Eres dueno de una radio?
            </h4>
            <p className="mb-4 text-sm font-medium text-[#a1acb8] dark:text-slate-400">
              Suma tu emisora hoy mismo y empieza a transmitir online.
            </p>
            <Link
              to="/planes"
              className="block w-full rounded-xl border border-[#696cff]/20 bg-[#696cff]/10 px-4 py-3 text-center text-sm font-bold text-[#696cff] transition-all hover:bg-[#696cff] hover:text-white"
            >
              Publicar mi Radio
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-50 pt-8 md:flex-row dark:border-slate-800">
          <p className="text-xs font-medium text-[#a1acb8] dark:text-slate-500">
            &copy; {new Date().getFullYear()} {settings.title}. Todos los derechos reservados.
          </p>
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <Link
              to="/privacidad"
              className="text-[11px] font-bold uppercase tracking-tighter text-[#a1acb8] hover:text-[#696cff] dark:text-slate-500"
            >
              Privacidad
            </Link>
            <Link
              to="/terminos"
              className="text-[11px] font-bold uppercase tracking-tighter text-[#a1acb8] hover:text-[#696cff] dark:text-slate-500"
            >
              Terminos
            </Link>
            <a
              href="https://qr.afip.gob.ar/?qr=SkAn0mZmQWnKsx13JW8l2w,,"
              target="_F960AFIPInfo"
              rel="noreferrer"
            >
              <img
                src="https://www.afip.gob.ar/images/f960/DATAWEB.jpg"
                alt="AFIP Data Fiscal"
                width={96}
                height={48}
                className="h-12 w-auto rounded-md border border-slate-200 dark:border-slate-700"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
