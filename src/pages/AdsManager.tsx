import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Advertisement } from '@/types/database';
import { Plus, Trash2, Edit, Save, X, Image as ImageIcon, ExternalLink, ArrowLeft } from 'lucide-react';

export default function AdsManager() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    position: 'home_top',
    active: true
  });

  useEffect(() => {
    const checkRole = async () => {
        if (!user || user.role !== 'super_admin') {
            navigate('/admin');
            return;
        }
        fetchAds();
    };
    checkRole();
  }, [user, navigate]);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = `ads/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('radio-images')
        .upload(fileName, file, {
          contentType: file.type // Explicitly set content type to handle GIFs correctly
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('radio-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAd) {
        const { error } = await supabase
          .from('advertisements')
          .update({
            title: formData.title,
            image_url: formData.image_url,
            link_url: formData.link_url,
            position: formData.position,
            active: formData.active
          })
          .eq('id', editingAd.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('advertisements')
          .insert([{
            title: formData.title,
            image_url: formData.image_url,
            link_url: formData.link_url,
            position: formData.position,
            active: formData.active
          }]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingAd(null);
      setFormData({
        title: '',
        image_url: '',
        link_url: '',
        position: 'home_top',
        active: true
      });
      fetchAds();
    } catch (error) {
      console.error('Error saving ad:', error);
      alert('Error saving advertisement');
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      image_url: ad.image_url,
      link_url: ad.link_url || '',
      position: ad.position,
      active: ad.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    // Optimistic UI update
    if (!window.confirm('Are you sure you want to delete this ad?')) return;
    
    // Immediately update local state
    const originalAds = [...ads];
    setAds(prev => prev.filter(ad => ad.id !== id));

    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', id);
      if (error) throw error;
      // No need to fetchAds() if success, state is already correct
    } catch (error) {
      console.error('Error deleting ad:', error);
      // Revert on failure
      setAds(originalAds);
      alert('Error deleting ad');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
                <button onClick={() => navigate('/admin')} className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Administrador de Anuncios</h1>
            </div>
            <button
                onClick={() => setShowForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600"
            >
                <Plus className="w-4 h-4" />
                <span>Nuevo Anuncio</span>
            </button>
        </div>

        {showForm && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{editingAd ? 'Editar Anuncio' : 'Crear Anuncio'}</h2>
                    <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Posición</label>
                            <select
                                name="position"
                                value={formData.position}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="home_top">Inicio - Arriba</option>
                                <option value="home_middle">Inicio - Medio</option>
                                <option value="microsite_top">Micrositio - Arriba</option>
                                <option value="microsite_sidebar">Micrositio - Lateral</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Enlace (Opcional)</label>
                            <input
                                type="url"
                                name="link_url"
                                value={formData.link_url}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                             <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                            />
                            <label className="text-sm font-medium text-gray-700">Activo</label>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Imagen</label>
                        <div className="flex items-center space-x-4">
                            {formData.image_url && (
                                <img src={formData.image_url} alt="Preview" className="h-20 w-auto object-cover rounded" />
                            )}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleImageUpload}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary-50 file:text-secondary-700 hover:file:bg-secondary-100"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            className="flex items-center space-x-2 px-6 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600"
                        >
                            <Save className="w-4 h-4" />
                            <span>Guardar</span>
                        </button>
                    </div>
                </form>
            </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imagen</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {ads.map((ad) => (
                        <tr key={ad.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <img src={ad.image_url} alt={ad.title} className="h-12 w-20 object-cover rounded" />
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{ad.title}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">{ad.link_url}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {ad.position}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ad.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {ad.active ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => handleEdit(ad)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(ad.id)} className="text-red-600 hover:text-red-900">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {ads.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                No hay anuncios creados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
