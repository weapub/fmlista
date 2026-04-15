import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Download } from 'lucide-react';
import { useDeviceStore } from '@/stores/deviceStore';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const { isTV } = useDeviceStore();

  const isDismissed = () => {
    const dismissedUntil = localStorage.getItem('pwa_prompt_dismissed_until');
    if (!dismissedUntil) return false;
    return Date.now() < parseInt(dismissedUntil, 10);
  };

  useEffect(() => {
    if (isTV) return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (isStandalone || isDismissed()) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      setPlatform('ios');
      setTimeout(() => setShowPrompt(true), 3000);
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isTV]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa_prompt_dismissed_until', expiry.toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-4 max-w-md mx-auto relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Cerrar aviso de instalacion"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900/30 p-3 rounded-xl">
            <Download className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Instala FM Lista</h3>

            {platform === 'ios' ? (
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p>Para una mejor experiencia, agrega esta web a tu inicio:</p>
                <ol className="list-decimal list-inside space-y-1 ml-1">
                  <li className="flex items-center gap-2">Toca el boton <Share className="w-4 h-4" /> Compartir</li>
                  <li className="flex items-center gap-2">Selecciona <PlusSquare className="w-4 h-4" /> Agregar a Inicio</li>
                </ol>
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p className="mb-3">Instala nuestra aplicacion para escuchar radios en segundo plano y acceder mas rapido.</p>
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-secondary-500 hover:bg-secondary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Instalar Aplicacion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
