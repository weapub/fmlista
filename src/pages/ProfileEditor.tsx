import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Radio } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Upload, Save, X, Image as ImageIcon } from 'lucide-react';

export default function ProfileEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [radio, setRadio] = useState<Radio | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    frequency: '',
    description: '',
    location: '',
    category: '',
    stream_url: '',
    video_stream_url: '',
    logo_url: '',
    cover_url: '',
    whatsapp: '',
    social_facebook: '',
    social_instagram: '',
    social_twitter: '',
    address: ''
  });

  const categories = [
    'Noticias',
    'Pop',
    'Rock',
    'Tropical',
    'Cumbia',
    'Folklore',
    'Latina',
    'Clásica',
    'Electrónica',
    'Jazz',
    'Deportes',
    'Religiosa',
    'Cultural',
    'Comunitaria',
    'Universitaria',
    'Hip Hop',
    'Country',
    'Charlas',
    'Otra'
  ];

  useEffect(() => {
    // TypeScript check requires casting or more complex type guards
    const userRole = user?.role as string;
    if (!user || (userRole !== 'radio_admin' && userRole !== 'super_admin')) {
      navigate('/login');
      return;
    }

    if (!id || id === 'new') {
      setLoading(false);
    } else {
      fetchRadio();
    }
  }, [id, user, navigate]);

  const fetchRadio = async () => {
    try {
      let query = supabase
        .from('radios')
        .select('*')
        .eq('id', id);

      // Si no es super admin, solo puede editar sus propias radios
      // TypeScript check requires casting or more complex type guards
      const userRole = user?.role as string;
      if (userRole !== 'super_admin') {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query.single();

      if (error) throw error;

      setRadio(data);
      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        frequency: data.frequency || '',
        description: data.description || '',
        location: data.location || '',
        category: data.category || '',
        stream_url: data.stream_url || '',
        video_stream_url: data.video_stream_url || '',
        logo_url: data.logo_url || '',
        cover_url: data.cover_url || '',
        whatsapp: data.whatsapp || '',
        social_facebook: data.social_facebook || '',
        social_instagram: data.social_instagram || '',
        social_twitter: data.social_twitter || '',
        address: data.address || ''
      });
    } catch (error) {
      console.error('Error fetching radio:', error);
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (type: 'logo' | 'cover') => {
    if (!user?.id) {
      alert('Debes iniciar sesión para subir imágenes.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const radioFolder = radio?.id ?? 'new';
        const fileName = `${user?.id}/${radioFolder}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('radio-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('radio-images')
          .getPublicUrl(fileName);

        setFormData(prev => ({
          ...prev,
          [type === 'logo' ? 'logo_url' : 'cover_url']: publicUrl
        }));
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image. Please try again.');
      }
    };
    input.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate slug format if present
      if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
        alert('El identificador (slug) solo puede contener letras minúsculas, números y guiones.');
        setSaving(false);
        return;
      }

      if (!user?.id) {
        alert('Tu sesión no está disponible. Inicia sesión nuevamente.');
        setSaving(false);
        return;
      }
      if (!id || id === 'new') {
        const { error } = await supabase
          .from('radios')
          .insert({
            name: formData.name,
            slug: formData.slug || null,
            frequency: formData.frequency,
            description: formData.description,
            location: formData.location,
            category: formData.category,
            stream_url: formData.stream_url,
            video_stream_url: formData.video_stream_url,
            logo_url: formData.logo_url,
            cover_url: formData.cover_url,
            user_id: user.id,
            whatsapp: formData.whatsapp,
            social_facebook: formData.social_facebook,
            social_instagram: formData.social_instagram,
            social_twitter: formData.social_twitter,
            address: formData.address
          });

        if (error) throw error;
      } else {
        const updateData = {
            name: formData.name,
            slug: formData.slug || null,
            frequency: formData.frequency,
            description: formData.description,
            location: formData.location,
            category: formData.category,
            stream_url: formData.stream_url,
            video_stream_url: formData.video_stream_url,
            logo_url: formData.logo_url,
            cover_url: formData.cover_url,
            whatsapp: formData.whatsapp,
            social_facebook: formData.social_facebook,
            social_instagram: formData.social_instagram,
            social_twitter: formData.social_twitter,
            address: formData.address
        };

        let query = supabase
          .from('radios')
          .update(updateData)
          .eq('id', id);

        // TypeScript check requires casting or more complex type guards
        const userRole = user?.role as string;
        if (userRole !== 'super_admin') {
           query = query.eq('user_id', user.id);
        }

        const { error } = await query;

        if (error) throw error;
      }

      navigate('/admin');
    } catch (error) {
      console.error('Error saving radio:', error);
      alert('Error saving radio profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary-500">
              {id === 'new' ? 'Create Radio Profile' : 'Edit Radio Profile'}
            </h1>
            <button
              onClick={() => navigate('/admin')}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact & Social Media */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto y Redes Sociales</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp (Número con código de país)
                  </label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    placeholder="Ej. 5491112345678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección Física
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Ej. Av. Siempre Viva 123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    name="social_facebook"
                    value={formData.social_facebook}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/turadio"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    name="social_instagram"
                    value={formData.social_instagram}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/turadio"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter / X URL
                  </label>
                  <input
                    type="url"
                    name="social_twitter"
                    value={formData.social_twitter}
                    onChange={handleInputChange}
                    placeholder="https://twitter.com/turadio"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Station Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identificador URL (Slug)
                </label>
                <p className="text-xs text-gray-500 mb-1">
                    Ejemplo: "la-docta" para fmlista.com.ar/la-docta (Solo letras, números y guiones)
                </p>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="ej. radio-uno"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency (FM) *
                </label>
                <input
                  type="text"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej. 95.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stream URL *
                </label>
                <input
                  type="url"
                  name="stream_url"
                  value={formData.stream_url}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Stream URL (Optional)
                </label>
                <input
                  type="url"
                  name="video_stream_url"
                  value={formData.video_stream_url}
                  onChange={handleInputChange}
                  placeholder="Ej. https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                />
              </div>

              {/* Campos extra removidos para alinearse al esquema */}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
              />
            </div>

            {/* Campos de redes sociales removidos para alinearse al esquema */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {formData.logo_url ? (
                    <div className="space-y-2">
                      <img
                        src={formData.logo_url}
                        alt="Logo"
                        className="w-24 h-24 object-cover rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageUpload('logo')}
                        className="text-sm text-secondary-600 hover:text-secondary-700"
                      >
                        Change Logo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto" />
                      <button
                        type="button"
                        onClick={() => handleImageUpload('logo')}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 mx-auto"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Logo</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {formData.cover_url ? (
                    <div className="space-y-2">
                      <img
                        src={formData.cover_url}
                        alt="Cover"
                        className="w-32 h-20 object-cover rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageUpload('cover')}
                        className="text-sm text-secondary-600 hover:text-secondary-700"
                      >
                        Change Cover
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto" />
                      <button
                        type="button"
                        onClick={() => handleImageUpload('cover')}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 mx-auto"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Cover</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
