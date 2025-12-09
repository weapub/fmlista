import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';

export default function AppSettings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [footerLogoUrl, setFooterLogoUrl] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [appTitle, setAppTitle] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (!user || user.role !== 'super_admin') {
        navigate('/admin');
        return;
      }
      fetchSettings();
    };
    checkRole();
  }, [user, navigate]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['app_logo', 'app_footer_logo', 'app_hero_image', 'app_title', 'app_description']);

      if (error) throw error;
      
      const logoSetting = data?.find(s => s.key === 'app_logo');
      const footerLogoSetting = data?.find(s => s.key === 'app_footer_logo');
      const heroImageSetting = data?.find(s => s.key === 'app_hero_image');
      const titleSetting = data?.find(s => s.key === 'app_title');
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
      const { error: logoError } = await supabase
        .from('app_settings')
        .upsert({ 
          key: 'app_logo', 
          value: logoUrl 
        });
      
      if (logoError) throw logoError;

      if (footerLogoUrl) {
        const { error: footerLogoError } = await supabase
          .from('app_settings')
          .upsert({ 
            key: 'app_footer_logo', 
            value: footerLogoUrl 
          });
        
        if (footerLogoError) throw footerLogoError;
      }

      if (heroImageUrl) {
        const { error: heroImageError } = await supabase
          .from('app_settings')
          .upsert({ 
            key: 'app_hero_image', 
            value: heroImageUrl 
          });
        
        if (heroImageError) throw heroImageError;
      }

      const { error: titleError } = await supabase
        .from('app_settings')
        .upsert({ 
          key: 'app_title', 
          value: appTitle 
        });

      if (titleError) throw titleError;

      const { error: descriptionError } = await supabase
        .from('app_settings')
        .upsert({ 
          key: 'app_description', 
          value: appDescription 
        });

      if (descriptionError) throw descriptionError;

      alert('Configuración actualizada correctamente. Recarga la página para ver los cambios.');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert(`Error al guardar la configuración: ${error.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <button onClick={() => navigate('/admin')} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de la App</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Apariencia</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la Aplicación</label>
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="App Logo" 
                      className="h-24 w-24 object-contain border border-gray-200 rounded-lg p-2 bg-gray-50" 
                    />
                  ) : (
                    <div className="h-24 w-24 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-4">
                    Sube una imagen para usar como logo principal de la aplicación. 
                    Formatos recomendados: SVG, PNG.
                  </p>
                  <input
                    type="file"
                    accept="image/*,image/svg+xml"
                    onChange={(e) => handleLogoUpload(e, 'main')}
                    disabled={saving}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary-50 file:text-secondary-700 hover:file:bg-secondary-100"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo del Pie de Página (Footer)</label>
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  {footerLogoUrl ? (
                    <img 
                      src={footerLogoUrl} 
                      alt="Footer Logo" 
                      className="h-24 w-24 object-contain border border-gray-200 rounded-lg p-2 bg-gray-50" 
                    />
                  ) : (
                    <div className="h-24 w-24 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-4">
                    Sube una imagen diferente para el pie de página si lo deseas. Si no se sube ninguna, se usará el logo principal.
                  </p>
                  <input
                    type="file"
                    accept="image/*,image/svg+xml"
                    onChange={(e) => handleLogoUpload(e, 'footer')}
                    disabled={saving}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary-50 file:text-secondary-700 hover:file:bg-secondary-100"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del Hero (Inicio)</label>
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  {heroImageUrl ? (
                    <img 
                      src={heroImageUrl} 
                      alt="Hero Image" 
                      className="h-24 w-40 object-cover border border-gray-200 rounded-lg bg-gray-50" 
                    />
                  ) : (
                    <div className="h-24 w-40 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-4">
                    Sube una imagen para el fondo del buscador en la página de inicio.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'hero')}
                    disabled={saving}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary-50 file:text-secondary-700 hover:file:bg-secondary-100"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Aplicación</label>
              <p className="text-sm text-gray-500 mb-2">
                Este texto aparecerá junto al logo en la barra de navegación. Déjalo vacío si solo quieres mostrar el logo.
              </p>
              <input
                type="text"
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                disabled={saving}
                placeholder="Ej. FM Lista"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción de la Aplicación (Footer)</label>
              <p className="text-sm text-gray-500 mb-2">
                Breve descripción que aparecerá en el pie de página.
              </p>
              <textarea
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                disabled={saving}
                placeholder="Ej. Todas las radios de Formosa..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
