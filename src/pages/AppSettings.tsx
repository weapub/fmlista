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
        .select('value')
        .eq('key', 'app_logo')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setLogoUrl(data.value);
      } else {
        // Default fallback if not in DB yet
        setLogoUrl('/favicon.svg');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const fileName = `settings/logo_${Date.now()}_${file.name}`;
      
      // Use radio-images bucket for now, or create a new one. 
      // radio-images is fine as super_admin has full access.
      const { error: uploadError } = await supabase.storage
        .from('radio-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('radio-images')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      alert(`Error al subir el logo: ${error.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('app_settings')
        .upsert({ 
          key: 'app_logo', 
          value: logoUrl 
        });

      if (error) throw error;
      alert('Logo actualizado correctamente. Recarga la página para ver los cambios.');
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
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={saving}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary-50 file:text-secondary-700 hover:file:bg-secondary-100"
                  />
                </div>
              </div>
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
