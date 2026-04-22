import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Save, Image as ImageIcon, ChevronUp, ChevronDown, Plus, X } from 'lucide-react';
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
  const [availableRadios, setAvailableRadios] = useState<Array<{ id: string; name: string; frequency?: string | null; location?: string | null }>>([]);
  const [manualRankingIds, setManualRankingIds] = useState<string[]>([]);
  const [selectedRadioToAdd, setSelectedRadioToAdd] = useState('');
  const [manualRankingLimit, setManualRankingLimit] = useState<number>(3);
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
        .in('key', ['app_logo', 'app_footer_logo', 'app_hero_image', 'app_title', 'app_slogan', 'app_description', 'home_ranking_radios', 'home_ranking_limit']);

      if (error) throw error;

      const { data: radiosData, error: radiosError } = await supabase
        .from('radios')
        .select('id, name, frequency, location')
        .order('name', { ascending: true });

      if (radiosError) throw radiosError;
      
      const logoSetting = data?.find(s => s.key === 'app_logo');
      const footerLogoSetting = data?.find(s => s.key === 'app_footer_logo');
      const heroImageSetting = data?.find(s => s.key === 'app_hero_image');
      const titleSetting = data?.find(s => s.key === 'app_title');
      const sloganSetting = data?.find(s => s.key === 'app_slogan');
      const descriptionSetting = data?.find(s => s.key === 'app_description');
      const rankingSetting = data?.find((s) => s.key === 'home_ranking_radios');
      const rankingLimitSetting = data?.find((s) => s.key === 'home_ranking_limit');

      setAvailableRadios(radiosData || []);

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
      if (rankingSetting?.value) {
        try {
          const parsed = JSON.parse(rankingSetting.value);
          if (Array.isArray(parsed)) {
            const validIds = (radiosData || []).map((radio) => radio.id);
            const filteredIds = parsed.filter((id) => typeof id === 'string' && validIds.includes(id));
            setManualRankingIds(filteredIds);
          }
        } catch (parseError) {
          console.warn('No se pudo parsear home_ranking_radios:', parseError);
        }
      }

      if (rankingLimitSetting?.value) {
        const parsedLimit = Number(rankingLimitSetting.value);
        if ([3, 5, 10].includes(parsedLimit)) {
          setManualRankingLimit(parsedLimit);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRadioToRanking = () => {
    if (!selectedRadioToAdd) return;
    setManualRankingIds((prev) => (prev.includes(selectedRadioToAdd) ? prev : [...prev, selectedRadioToAdd]));
    setSelectedRadioToAdd('');
  };

  const handleRemoveRadioFromRanking = (radioId: string) => {
    setManualRankingIds((prev) => prev.filter((id) => id !== radioId));
  };

  const moveRankingItem = (index: number, direction: -1 | 1) => {
    setManualRankingIds((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
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
          cacheControl: '31536000',
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
        { key: 'app_description', value: appDescription },
        { key: 'home_ranking_radios', value: JSON.stringify(manualRankingIds) },
        { key: 'home_ranking_limit', value: String(manualRankingLimit) }
      ];

      if (footerLogoUrl) settingsToUpsert.push({ key: 'app_footer_logo', value: footerLogoUrl });
      if (heroImageUrl) settingsToUpsert.push({ key: 'app_hero_image', value: heroImageUrl });

      const { error } = await supabase
        .from('app_settings')
        .upsert(settingsToUpsert, { onConflict: 'key' });

      if (error) throw error;

      if (typeof window !== 'undefined' && heroImageUrl) {
        window.localStorage.setItem('app_hero_image_url', heroImageUrl);
      }

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
          <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent overflow-hidden transition-colors">
            <div className="p-8 border-b border-gray-50 dark:border-[#444564]">
              <div className="flex items-center space-x-4 mb-2">
                <button onClick={() => navigate('/admin')} className="text-[#566a7f] dark:text-[#cbcbe2] hover:text-[#696cff] transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">Apariencia General</h2>
              </div>
              <p className="text-[#a1acb8] dark:text-[#7e7e9a] text-sm mt-1">Configura la identidad visual y los textos principales de la plataforma.</p>
            </div>
          
            <div className="p-8 space-y-10">
              {/* Main Logo */}
              <div>
                <label className="block text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2] mb-4">Logo de la Aplicación</label>
                <div className="flex items-start space-x-8">
                  <div className="flex-shrink-0">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="App Logo" 
                        className="h-28 w-28 object-contain border border-gray-100 dark:border-[#444564] rounded-xl p-3 bg-gray-50 dark:bg-[#232333] shadow-sm" 
                      />
                    ) : (
                      <div className="h-28 w-28 border-2 border-dashed border-gray-200 dark:border-[#444564] rounded-xl bg-gray-50 dark:bg-[#232333] flex items-center justify-center text-[#a1acb8]">
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
                      className="block w-full text-sm text-[#a1acb8] dark:text-[#7e7e9a] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#696cff]/10 file:text-[#696cff] hover:file:bg-[#696cff]/20 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Logo */}
              <div className="border-t border-gray-50 dark:border-[#444564] pt-10">
                <label className="block text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2] mb-4">Logo del Pie de Página (Footer)</label>
                <div className="flex items-start space-x-8">
                  <div className="flex-shrink-0">
                    {footerLogoUrl ? (
                      <img 
                        src={footerLogoUrl} 
                        alt="Footer Logo" 
                        className="h-28 w-28 object-contain border border-gray-100 dark:border-[#444564] rounded-xl p-3 bg-gray-50 dark:bg-[#232333] shadow-sm" 
                      />
                    ) : (
                      <div className="h-28 w-28 border-2 border-dashed border-gray-200 dark:border-[#444564] rounded-xl bg-gray-50 dark:bg-[#232333] flex items-center justify-center text-[#a1acb8]">
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
              <div className="border-t border-gray-50 dark:border-[#444564] pt-10">
                <label className="block text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2] mb-4">Imagen del Hero (Inicio)</label>
                <div className="flex items-start space-x-8">
                  <div className="flex-shrink-0">
                    {heroImageUrl ? (
                      <img 
                        src={heroImageUrl} 
                        alt="Hero Image" 
                        className="h-28 w-48 object-cover border border-gray-100 dark:border-[#444564] rounded-xl bg-gray-50 dark:bg-[#232333] shadow-sm" 
                      />
                    ) : (
                      <div className="h-28 w-48 border-2 border-dashed border-gray-200 dark:border-[#444564] rounded-xl bg-gray-50 dark:bg-[#232333] flex items-center justify-center text-[#a1acb8]">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-50 dark:border-[#444564] pt-10">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Nombre de la Aplicación</label>
                  <input
                    type="text"
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    disabled={saving}
                    placeholder="Ej. FM Lista"
                    className="w-full px-4 py-2 bg-white dark:bg-[#232333] border border-[#d9dee3] dark:border-[#444564] rounded-lg focus:border-[#696cff] focus:ring-[0.25rem] focus:ring-[#696cff]/10 transition-all outline-none text-[#566a7f] dark:text-[#cbcbe2] placeholder:text-[#b4bdc6] dark:placeholder:text-[#4e4e6a]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Eslogan de la Aplicación</label>
                  <input
                    type="text"
                    value={appSlogan}
                    onChange={(e) => setAppSlogan(e.target.value)}
                    disabled={saving}
                    placeholder="Ej. Todo el aire de Formosa"
                    className="w-full px-4 py-2 bg-white dark:bg-[#232333] border border-[#d9dee3] dark:border-[#444564] rounded-lg focus:border-[#696cff] focus:ring-[0.25rem] focus:ring-[#696cff]/10 transition-all outline-none text-[#566a7f] dark:text-[#cbcbe2] placeholder:text-[#b4bdc6] dark:placeholder:text-[#4e4e6a]"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Descripción (Footer)</label>
                  <textarea
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    disabled={saving}
                    placeholder="Breve descripción de la plataforma..."
                    rows={3}
                    className="w-full px-4 py-2 bg-white dark:bg-[#232333] border border-[#d9dee3] dark:border-[#444564] rounded-lg focus:border-[#696cff] focus:ring-[0.25rem] focus:ring-[#696cff]/10 transition-all outline-none text-[#566a7f] dark:text-[#cbcbe2] placeholder:text-[#b4bdc6] dark:placeholder:text-[#4e4e6a] resize-none"
                  />
                </div>
              </div>

              <div className="border-t border-gray-50 dark:border-[#444564] pt-10">
                <label className="block text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2] mb-3">
                  Ranking manual de radios mas escuchadas
                </label>
                <p className="text-sm text-[#a1acb8] dark:text-[#7e7e9a] mb-4">
                  Selecciona que radios aparecen en el ranking del inicio y define el orden exacto.
                </p>

                <div className="mb-5 max-w-xs">
                  <label className="block text-xs font-semibold text-[#566a7f] dark:text-[#cbcbe2] mb-2">
                    Cantidad visible en ranking
                  </label>
                  <select
                    value={manualRankingLimit}
                    onChange={(e) => setManualRankingLimit(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-white dark:bg-[#232333] border border-[#d9dee3] dark:border-[#444564] rounded-lg focus:border-[#696cff] focus:ring-[0.25rem] focus:ring-[#696cff]/10 transition-all outline-none text-[#566a7f] dark:text-[#cbcbe2]"
                  >
                    <option value={3}>Top 3</option>
                    <option value={5}>Top 5</option>
                    <option value={10}>Top 10</option>
                  </select>
                </div>

                <div className="flex flex-col md:flex-row gap-3 mb-5">
                  <select
                    value={selectedRadioToAdd}
                    onChange={(e) => setSelectedRadioToAdd(e.target.value)}
                    className="w-full md:flex-1 px-4 py-2 bg-white dark:bg-[#232333] border border-[#d9dee3] dark:border-[#444564] rounded-lg focus:border-[#696cff] focus:ring-[0.25rem] focus:ring-[#696cff]/10 transition-all outline-none text-[#566a7f] dark:text-[#cbcbe2]"
                  >
                    <option value="">Seleccionar radio para agregar...</option>
                    {availableRadios
                      .filter((radio) => !manualRankingIds.includes(radio.id))
                      .map((radio) => (
                        <option key={radio.id} value={radio.id}>
                          {radio.name} {radio.frequency ? `(${radio.frequency})` : ''}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddRadioToRanking}
                    disabled={!selectedRadioToAdd}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#696cff] text-white font-semibold hover:bg-[#5f61e6] disabled:opacity-50 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>

                {manualRankingIds.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#d9dee3] dark:border-[#444564] px-4 py-6 text-sm text-[#a1acb8] dark:text-[#7e7e9a]">
                    No hay ranking manual configurado. Se usara el ranking automatico por defecto.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {manualRankingIds.map((radioId, index) => {
                      const radio = availableRadios.find((item) => item.id === radioId);
                      if (!radio) return null;

                      return (
                        <div
                          key={radio.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-[#d9dee3] dark:border-[#444564] bg-white dark:bg-[#232333] px-3 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2] truncate">
                              #{index + 1} {radio.name}
                            </p>
                            <p className="text-xs text-[#a1acb8] dark:text-[#7e7e9a]">
                              {radio.frequency || 'Sin frecuencia'} {radio.location ? `· ${radio.location}` : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveRankingItem(index, -1)}
                              disabled={index === 0}
                              className="p-2 rounded-md border border-[#d9dee3] dark:border-[#444564] text-[#566a7f] dark:text-[#cbcbe2] disabled:opacity-40"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveRankingItem(index, 1)}
                              disabled={index === manualRankingIds.length - 1}
                              className="p-2 rounded-md border border-[#d9dee3] dark:border-[#444564] text-[#566a7f] dark:text-[#cbcbe2] disabled:opacity-40"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveRadioFromRanking(radio.id)}
                              className="p-2 rounded-md border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-500/40 dark:hover:bg-red-500/10"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50/50 dark:bg-[#232333]/50 p-8 border-t border-gray-100 dark:border-[#444564] flex justify-end">
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
