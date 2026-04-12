import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';

export default function AppSettings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [footerLogoUrl, setFooterLogoUrl] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [appTitle, setAppTitle] = useState('');
  const [appSlogan, setAppSlogan] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Si user es null, significa que definitivamente no hay sesión
      if (user === null) {
        navigate('/admin');
        setLoading(false);
        return;
      }

      if (user && user.role === 'super_admin') {
        await fetchSettings();
      } else if (user) {
        // Usuario logueado pero sin permisos de super_admin
        navigate('/admin');
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, navigate]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['app_logo', 'app_footer_logo', 'app_hero_image', 'app_title', 'app_slogan', 'app_description']);

      if (error) throw error;
      
      const logoSetting = data?.find(s => s.key === 'app_logo');
      const footerLogoSetting = data?.find(s => s.key === 'app_footer_logo');
      const heroImageSetting = data?.find(s => s.key === 'app_hero_image');
      const titleSetting = data?.find(s => s.key === 'app_title');
      const sloganSetting = data?.find(s => s.key === 'app_slogan');
      const descriptionSetting = data?.find(s => s.key === 'app_description');

      if (logoSetting) {
        setLogoUrl(logoSetting.value);
      } else {
        setLogoUrl('/favicon.svg');
      }

      if (footerLogoSetting) {
        setFooterLogoUrl(footerLogoSetting.value);
      } else {
        // Fallback to main logo or default if not set
        setFooterLogoUrl(logoSetting?.value || '/favicon.svg');
      }

      if (heroImageSetting) {
        setHeroImageUrl(heroImageSetting.value);
      }

      if (titleSetting) {
        setAppTitle(titleSetting.value);
      } else {
        setAppTitle('FM Lista');
      }

      if (sloganSetting) {
        setAppSlogan(sloganSetting.value);
      } else {
        setAppSlogan('Todo el aire de Formosa');
      }

      if (descriptionSetting) {
        setAppDescription(descriptionSetting.value);
      } else {
        setAppDescription('Todas las radios de Formosa en un solo lugar. Escucha tu música y programas favoritos donde quieras.');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'footer' | 'hero' = 'main') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      let prefix = 'logo';
      if (type === 'footer') prefix = 'footer_logo';
      if (type === 'hero') prefix = 'hero_image';
      
      const fileName = `settings/${prefix}_${Date.now()}_${file.name}`;
      
      // Determine content type correctly for SVG
      const contentType = file.type === 'image/svg+xml' ? 'image/svg+xml' : file.type;

      // Use radio-images bucket for now, or create a new one. 
      // radio-images is fine as super_admin has full access.
      const { error: uploadError } = await supabase.storage
        .from('radio-images')
        .upload(fileName, file, {
          contentType: contentType,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('radio-images')
        .getPublicUrl(fileName);

      if (type === 'main') {
        setLogoUrl(publicUrl);
        // If footer logo is not set (or same as main), update it too if desired, 
        // but here we keep them separate unless explicitly set.
        // Actually, logic in fetchSettings uses main logo as fallback, so we don't need to force set it here.
      } else if (type === 'footer') {
        setFooterLogoUrl(publicUrl);
      } else if (type === 'hero') {
        setHeroImageUrl(publicUrl);
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(`Error al subir el archivo: ${error.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const settingsToUpsert = [
        { key: 'app_logo', value: logoUrl },
        { key: 'app_title', value: appTitle },
        { key: 'app_slogan', value: appSlogan },
        { key: 'app_description', value: appDescription }
      ];

      if (footerLogoUrl) settingsToUpsert.push({ key: 'app_footer_logo', value: footerLogoUrl });
      if (heroImageUrl) settingsToUpsert.push({ key: 'app_hero_image', value: heroImageUrl });

      const { error } = await supabase
        .from('app_settings')
        .upsert(settingsToUpsert, { onConflict: 'key' });

      if (error) throw error;

      alert('Configuración actualizada correctamente. Recarga la página para ver los cambios.');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert(`Error al guardar la configuración: ${error.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Configuración" subtitle="Cargando...">
        <div className="max-w-5xl mx-auto w-full animate-pulse">
            <div className="bg-white rounded-xl h-[600px] p-8 space-y-8 shadow-sm border border-gray-100">
              <div className="h-8 bg-slate-50 rounded-full w-48" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-50/50 rounded-xl w-full" />
              ))}
            </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Configuración" 
      subtitle="Administración / Apariencia"
    >
      <div className="max-w-5xl mx-auto w-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 bg-white">
              <div className="flex items-center space-x-4 mb-2">
                <button onClick={() => navigate('/admin')} className="text-[#566a7f] hover:text-[#696cff] transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-[#566a7f]">Apariencia General</h2>
              </div>
              <p className="text-[#a1acb8] text-sm mt-1">Configura la identidad visual y los textos principales de la plataforma.</p>
            </div>
          
            <div className="p-8 space-y-10">
              {/* Main Logo */}
              <div>
                <label className="block text-sm font-semibold text-[#566a7f] mb-4">Logo de la Aplicación</label>
                <div className="flex items-start space-x-8">
                  <div className="flex-shrink-0">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="App Logo" 
                        className="h-28 w-28 object-contain border border-gray-100 rounded-xl p-3 bg-gray-50 shadow-sm" 
                      />
                    ) : (
                      <div className="h-28 w-28 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center text-[#a1acb8]">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <p className="text-sm text-[#a1acb8] leading-relaxed">
                      Logo principal utilizado en la barra de navegación y carga. 
                      Formatos: <span className="text-[#566a7f] font-medium">SVG, PNG o WebP</span>.
                    </p>
                    <input
                      type="file"
                      accept="image/*,image/svg+xml"
                      onChange={(e) => handleLogoUpload(e, 'main')}
                      disabled={saving}
                      className="block w-full text-sm text-[#a1acb8] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#696cff]/10 file:text-[#696cff] hover:file:bg-[#696cff]/20 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Logo */}
              <div className="border-t border-gray-50 pt-10">
                <label className="block text-sm font-semibold text-[#566a7f] mb-4">Logo del Pie de Página (Footer)</label>
                <div className="flex items-start space-x-8">
                  <div className="flex-shrink-0">
                    {footerLogoUrl ? (
                      <img 
                        src={footerLogoUrl} 
                        alt="Footer Logo" 
                        className="h-28 w-28 object-contain border border-gray-100 rounded-xl p-3 bg-gray-50 shadow-sm" 
                      />
                    ) : (
                      <div className="h-28 w-28 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center text-[#a1acb8]">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <p className="text-sm text-[#a1acb8] leading-relaxed">
                      Logo alternativo para el pie de página. Si se deja vacío, se utilizará el logo principal.
                    </p>
                    <input
                      type="file"
                      accept="image/*,image/svg+xml"
                      onChange={(e) => handleLogoUpload(e, 'footer')}
                      disabled={saving}
                      className="block w-full text-sm text-[#a1acb8] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#696cff]/10 file:text-[#696cff] hover:file:bg-[#696cff]/20 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Hero Image */}
              <div className="border-t border-gray-50 pt-10">
                <label className="block text-sm font-semibold text-[#566a7f] mb-4">Imagen del Hero (Inicio)</label>
                <div className="flex items-start space-x-8">
                  <div className="flex-shrink-0">
                    {heroImageUrl ? (
                      <img 
                        src={heroImageUrl} 
                        alt="Hero Image" 
                        className="h-28 w-48 object-cover border border-gray-100 rounded-xl bg-gray-50 shadow-sm" 
                      />
                    ) : (
                      <div className="h-28 w-48 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center text-[#a1acb8]">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <p className="text-sm text-[#a1acb8] leading-relaxed">
                      Imagen de fondo para el buscador de la página de inicio. 
                      <span className="block text-xs mt-1 text-[#696cff]">Recomendado: 1920x600px.</span>
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'hero')}
                      disabled={saving}
                      className="block w-full text-sm text-[#a1acb8] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#696cff]/10 file:text-[#696cff] hover:file:bg-[#696cff]/20 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Text Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-50 pt-10">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#566a7f]">Nombre de la Aplicación</label>
                  <input
                    type="text"
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    disabled={saving}
                    placeholder="Ej. FM Lista"
                    className="w-full px-4 py-2 bg-white border border-[#d9dee3] rounded-lg focus:border-[#696cff] focus:ring-[0.25rem] focus:ring-[#696cff]/10 transition-all outline-none text-[#566a7f] placeholder:text-[#b4bdc6]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#566a7f]">Eslogan de la Aplicación</label>
                  <input
                    type="text"
                    value={appSlogan}
                    onChange={(e) => setAppSlogan(e.target.value)}
                    disabled={saving}
                    placeholder="Ej. Todo el aire de Formosa"
                    className="w-full px-4 py-2 bg-white border border-[#d9dee3] rounded-lg focus:border-[#696cff] focus:ring-[0.25rem] focus:ring-[#696cff]/10 transition-all outline-none text-[#566a7f] placeholder:text-[#b4bdc6]"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-semibold text-[#566a7f]">Descripción (Footer)</label>
                  <textarea
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    disabled={saving}
                    placeholder="Breve descripción de la plataforma..."
                    rows={3}
                    className="w-full px-4 py-2 bg-white border border-[#d9dee3] rounded-lg focus:border-[#696cff] focus:ring-[0.25rem] focus:ring-[#696cff]/10 transition-all outline-none text-[#566a7f] placeholder:text-[#b4bdc6] resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50/50 p-8 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-8 py-3 bg-[#696cff] text-white rounded-lg hover:bg-[#5f61e6] shadow-md shadow-[#696cff]/20 disabled:opacity-50 transition-all transform active:scale-95 font-bold"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </div>
      </div>
    </AdminLayout>
  );
}
