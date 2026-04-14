import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Advertisement } from '@/types/database';
import { Plus, Trash2, Edit, Save, X, ExternalLink, AlertCircle, CheckCircle2, Eye, EyeOff, Megaphone } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { cn } from '@/lib/utils';
import { ROLES } from '@/types/auth';

export default function AdsManager() {
  const navigate = useNavigate();
  const { radioId } = useParams<{ radioId: string }>();
  const { user } = useAuthStore();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [radioName, setRadioName] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    position: 'home_top',
    active: true,
    display_order: 0,
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      if (radioId) {
        // Radio Owner Context - Verify ownership
        const { data: radio, error } = await supabase
          .from('radios')
          .select('id, user_id, name')
          .eq('id', radioId)
          .single();

        if (error || !radio) {
          navigate('/admin');
          return;
        }

        if (user.role !== ROLES.SUPER_ADMIN && radio.user_id !== user.id) {
          navigate('/admin');
          return;
        }
        setRadioName(radio.name);
      } else {
        // Super Admin Context (Global Ads)
        if (user.role !== ROLES.SUPER_ADMIN) {
          navigate('/admin');
          return;
        }
      }

      await fetchAds();
    };
    checkRole();
  }, [user, navigate, radioId]);

  const fetchAds = async () => {
    try {
      let query = supabase
        .from('advertisements')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (radioId) {
        query = query.eq('radio_id', radioId);
      } else {
        query = query.is('radio_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      showNotification('error', 'Error al cargar los anuncios');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const getAdStatus = (ad: Advertisement) => {
    const now = new Date();
    const startDate = ad.start_date ? new Date(ad.start_date) : null;
    const endDate = ad.end_date ? new Date(ad.end_date) : null;

    if (startDate && now < startDate) {
      return { status: 'upcoming', label: 'Próximamente', color: 'text-yellow-600 bg-yellow-50' };
    }
    if (endDate && now > endDate) {
      return { status: 'expired', label: 'Expirado', color: 'text-gray-500 bg-gray-50' };
    }
    return { status: 'active', label: 'Activo', color: 'text-green-600 bg-green-50' };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = `ads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
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

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      showNotification('success', '✓ Imagen cargada correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      showNotification('error', 'Error al subir la imagen');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.image_url) {
      showNotification('error', 'Completa título e imagen');
      return;
    }

    try {
      if (editingAd) {
        const { error } = await supabase
          .from('advertisements')
          .update({
            title: formData.title,
            image_url: formData.image_url,
            link_url: formData.link_url || null,
            position: formData.position,
            active: formData.active,
            display_order: formData.display_order,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null
          })
          .eq('id', editingAd.id);

        if (error) throw error;
        showNotification('success', 'Anuncio actualizado correctamente');
      } else {
        const payload: any = {
          title: formData.title,
          image_url: formData.image_url,
          link_url: formData.link_url || null,
          position: formData.position,
          active: formData.active,
          display_order: formData.display_order,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null
        };

        if (radioId) {
          payload.radio_id = radioId;
        }

        const { error } = await supabase
          .from('advertisements')
          .insert([payload]);

        if (error) throw error;
        showNotification('success', 'Anuncio creado correctamente');
      }

      setShowForm(false);
      setEditingAd(null);
      setFormData({
        title: '',
        image_url: '',
        link_url: '',
        position: 'home_top',
        active: true,
        display_order: 0,
        start_date: '',
        end_date: ''
      });
      await fetchAds();
    } catch (error) {
      console.error('Error saving ad:', error);
      showNotification('error', 'Error al guardar el anuncio');
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      image_url: ad.image_url || '',
      link_url: ad.link_url || '',
      position: ad.position || 'home_top',
      active: ad.active !== false,
      display_order: ad.display_order || 0,
      start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este anuncio?')) return;

    const originalAds = [...ads];
    setAds(prev => prev.filter(ad => ad.id !== id));

    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showNotification('success', 'Anuncio eliminado correctamente');
    } catch (error) {
      console.error('Error deleting ad:', error);
      setAds(originalAds);
      showNotification('error', 'Error al eliminar el anuncio');
    }
  };

  const toggleActive = async (ad: Advertisement) => {
    const originalAds = [...ads];
    setAds(prev =>
      prev.map(a => a.id === ad.id ? { ...a, active: !a.active } : a)
    );

    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ active: !ad.active })
        .eq('id', ad.id);

      if (error) throw error;
      showNotification('success', ad.active ? 'Anuncio desactivado' : 'Anuncio activado');
    } catch (error) {
      console.error('Error toggling ad:', error);
      setAds(originalAds);
      showNotification('error', 'Error al cambiar estado del anuncio');
    }
  };

  const positionLabels: Record<string, string> = {
    'home_top': '🏠 Inicio - Arriba',
    'home_middle': '🏠 Inicio - Medio',
    'microsite_top': '🌐 Micrositio - Arriba',
    'microsite_sidebar': '🌐 Micrositio - Lateral'
  };

  if (loading) {
    return (
      <AdminLayout 
        title="Gestión de Anuncios" 
        subtitle="Cargando anuncios..."
      >
        <div className="max-w-6xl mx-auto">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-20 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Gestión de Anuncios" 
      subtitle={radioId ? `Anuncios de ${radioName}` : 'Administra banners publicitarios globales'}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Notification */}
        {notification && (
          <div className={cn(
            "p-4 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300",
            notification.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400" :
            notification.type === 'error' ? "bg-red-50 border-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400" :
            "bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800/30 dark:text-blue-400"
          )}>
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />}
            <p className="text-sm font-bold">{notification.message}</p>
          </div>
        )}

        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">
            {ads.length} {ads.length === 1 ? 'Anuncio' : 'Anuncios'}
          </h2>
          <button
            onClick={() => {
              setEditingAd(null);
              setFormData({
                title: '',
                image_url: '',
                link_url: '',
                position: 'home_top',
                active: true,
                display_order: 0,
                start_date: '',
                end_date: ''
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-[#696cff] text-white px-4 py-2 rounded-lg hover:bg-[#5f61e6] transition-colors font-bold"
          >
            <Plus className="w-5 h-5" />
            Nuevo Anuncio
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <>
            <div className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40" onClick={() => setShowForm(false)} />
            <div className="relative z-50 bg-white dark:bg-[#2b2c40] rounded-xl shadow-2xl border border-gray-100 dark:border-[#444564] p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">
                  {editingAd ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#444564] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#696cff] focus:border-transparent"
                      placeholder="Ej: Coca-Cola 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">
                      Posición *
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#696cff] focus:border-transparent"
                    >
                      {!radioId && <option value="home_top">🏠 Inicio - Arriba</option>}
                      {!radioId && <option value="home_middle">🏠 Inicio - Medio</option>}
                      <option value="microsite_top">🌐 Micrositio - Arriba</option>
                      <option value="microsite_sidebar">🌐 Micrositio - Lateral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">
                      Orden de Visualización
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.display_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#696cff] focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">
                      Enlace (Opcional)
                    </label>
                    <input
                      type="url"
                      value={formData.link_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#696cff] focus:border-transparent"
                      placeholder="https://ejemplo.com"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-3">
                    Imagen *
                  </label>
                  <div className="space-y-3">
                    {formData.image_url && (
                      <div className="relative group">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="h-32 w-full object-cover rounded-lg border border-gray-200 dark:border-[#444564]"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] text-sm text-[#a1acb8] dark:text-[#7e7e9a] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-[#696cff] file:text-white hover:file:bg-[#5f61e6] cursor-pointer"
                      placeholder="Sube una imagen"
                    />
                  </div>
                </div>

                {/* Date Range - Scheduling */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">
                      Fecha de Inicio (Opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#696cff] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">
                      Fecha de Fin (Opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#696cff] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Date Range - Scheduling */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">
                      Fecha de Inicio (Opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#696cff] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">
                      Fecha de Fin (Opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#696cff] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-col sm:flex-row gap-6 bg-gray-50 dark:bg-[#1a1b2e] p-4 rounded-lg border border-gray-200 dark:border-[#444564]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 dark:border-[#444564] text-[#696cff] focus:ring-[#696cff] accent-[#696cff]"
                    />
                    <span className="text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2]">Anuncio Activo</span>
                  </label>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t border-gray-100 dark:border-[#444564]">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-[#444564] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1b2e] transition-colors font-bold text-[#566a7f] dark:text-[#cbcbe2]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#696cff] text-white rounded-lg hover:bg-[#5f61e6] active:bg-[#5050d4] transition-colors font-bold flex items-center gap-2 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Anuncio
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Ads Grid */}
        <div className="space-y-4">
          {ads.length === 0 ? (
            <div className="bg-white dark:bg-[#2b2c40] rounded-xl border border-gray-200 dark:border-[#444564] p-12 text-center">
              <Megaphone className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">Sin anuncios</h3>
              <p className="text-[#a1acb8] dark:text-[#7e7e9a] mb-6">Crea tu primer anuncio para comenzar</p>
              <button
                onClick={() => {
                  setEditingAd(null);
                  setFormData({
                    title: '',
                    image_url: '',
                    link_url: '',
                    position: 'home_top',
                    active: true,
                    display_order: 0,
                    start_date: '',
                    end_date: ''
                  });
                  setShowForm(true);
                }}
                className="bg-[#696cff]/10 text-[#696cff] px-6 py-2 rounded-lg hover:bg-[#696cff]/20 transition-colors font-bold"
              >
                Crear Anuncio
              </button>
            </div>
          ) : (
            ads.map((ad) => (
              <div
                key={ad.id}
                className="group bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-200 dark:border-[#444564] hover:shadow-md dark:hover:border-[#696cff]/30 transition-all duration-200 overflow-hidden"
              >
                <div className="flex flex-col md:flex-row gap-6 p-6">
                  {/* Image */}
                  <div className="flex-shrink-0 w-full md:w-40">
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-[#444564]"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2220%22 fill=%22%239ca3af%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-1">
                          {ad.title}
                        </h3>
                        <p className="text-sm text-[#a1acb8] dark:text-[#7e7e9a]">
                          {positionLabels[ad.position] || ad.position}
                        </p>
                      </div>
                      <span className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap",
                        ad.active
                          ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
                      )}>
                        {ad.active ? '✓ Activo' : '○ Inactivo'}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-[#1a1b2e] rounded-lg border border-gray-100 dark:border-[#444564] mb-4">
                      <div>
                        <p className="text-xs text-[#a1acb8] dark:text-[#7e7e9a] uppercase font-bold">Orden</p>
                        <p className="text-lg font-bold text-[#696cff]">{ad.display_order || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#a1acb8] dark:text-[#7e7e9a] uppercase font-bold">Clics</p>
                        <p className="text-lg font-bold text-[#566a7f] dark:text-[#cbcbe2]">{ad.clicks || 0}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-[#a1acb8] dark:text-[#7e7e9a] uppercase font-bold">Enlace</p>
                        <p className="text-sm text-[#696cff] truncate">
                          {ad.link_url ? (
                            <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                              {ad.link_url.replace(/^https?:\/\//, '')}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[#a1acb8] dark:text-[#7e7e9a]">Sin enlace</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => toggleActive(ad)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-[#444564] text-[#566a7f] dark:text-[#cbcbe2] rounded-lg hover:bg-gray-200 dark:hover:bg-[#555575] transition-all font-bold text-sm"
                      >
                        {ad.active ? (
                          <>
                            <Eye className="w-4 h-4" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Activar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(ad)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#696cff]/10 text-[#696cff] rounded-lg hover:bg-[#696cff]/20 transition-all font-bold text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-all font-bold text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
