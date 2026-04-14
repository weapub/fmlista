import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Radio } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Upload, Save, X, Image as ImageIcon, ArrowLeft, Globe, MessageCircle, Share2, Info } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { ROLES } from '@/types/auth';

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
    if (!user || (user.role !== ROLES.RADIO_ADMIN && user.role !== ROLES.SUPER_ADMIN)) {
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
      if (user?.role !== ROLES.SUPER_ADMIN) {
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

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Error procesando imagen'));
          }, 'image/jpeg', 0.85);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (type: 'logo' | 'cover') => {
    if (!user?.id) {
      alert('Debes ingresar para subir imágenes.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        // Optimizamos la imagen según el tipo (logo pequeño, portada grande)
        const maxWidth = type === 'logo' ? 400 : 1200;
        const maxHeight = type === 'logo' ? 400 : 600;
        const optimizedBlob = await resizeImage(file, maxWidth, maxHeight);
        const optimizedFile = new File([optimizedBlob], file.name, { type: 'image/jpeg' });

        const radioFolder = radio?.id ?? 'new';
        const fileName = `${user?.id}/${radioFolder}/${type}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('radio-images')
          .upload(fileName, optimizedFile);

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
      if (formData.slug && !/^[a-z0-9-.]+$/.test(formData.slug)) {
        alert('El identificador (slug) solo puede contener letras minúsculas, números, guiones y puntos.');
        setSaving(false);
        return;
      }

      if (!user?.id) {
        alert('Tu sesión no está disponible. Ingresa nuevamente.');
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
        if (user?.role !== ROLES.SUPER_ADMIN) {
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
      <AdminLayout title="Editor de Perfil" subtitle="Cargando datos...">
        <div className="max-w-5xl mx-auto w-full animate-pulse">
          <div className="bg-white rounded-xl h-[600px] p-8 space-y-8 shadow-sm border border-gray-100">
            <div className="h-8 bg-slate-50 rounded-full w-48" />
            <div className="grid grid-cols-2 gap-6">
              <div className="h-12 bg-slate-50 rounded-lg" />
              <div className="h-12 bg-slate-50 rounded-lg" />
            </div>
            <div className="h-32 bg-slate-50 rounded-lg" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  const inputClasses = "w-full px-4 py-2 bg-white border border-[#d9dee3] rounded-lg focus:border-[#696cff] focus:ring-[0.25rem] focus:ring-[#696cff]/10 transition-all outline-none text-[#566a7f] placeholder:text-[#b4bdc6]";
  const labelClasses = "block text-sm font-semibold text-[#566a7f] mb-2";

  return (
    <AdminLayout 
      title={id === 'new' ? 'Crear Emisora' : 'Editar Emisora'} 
      subtitle={formData.name || 'Nueva Radio'}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 text-[#697a8d] hover:text-[#696cff] transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Panel</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card: Información Básica */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center space-x-3">
              <div className="p-2 bg-[#696cff]/10 rounded-lg">
                <Info className="w-5 h-5 text-[#696cff]" />
              </div>
              <h2 className="text-lg font-bold text-[#566a7f]">Información General</h2>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClasses}>Nombre de la Emisora *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej. Radio Formosa"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Identificador URL (Slug)</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="ej. radio.formosa"
                  className={inputClasses}
                />
                <p className="text-[10px] text-[#a1acb8] mt-1 italic">
                  Solo minúsculas, números, puntos y guiones.
                </p>
              </div>

              <div>
                <label className={labelClasses}>Frecuencia *</label>
                <input
                  type="text"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej. 95.5 FM"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Categoría *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className={inputClasses}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClasses}>Ubicación *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej. Formosa Capital"
                  className={inputClasses}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClasses}>Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Breve historia o eslogan de la radio..."
                  className={`${inputClasses} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* Card: Streaming */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center space-x-3">
              <div className="p-2 bg-[#03c3ec]/10 rounded-lg">
                <Globe className="w-5 h-5 text-[#03c3ec]" />
              </div>
              <h2 className="text-lg font-bold text-[#566a7f]">Transmisión</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className={labelClasses}>URL de Streaming (Audio) *</label>
                <input
                  type="url"
                  name="stream_url"
                  value={formData.stream_url}
                  onChange={handleInputChange}
                  required
                  placeholder="https://servidor.com/stream"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>URL de Video (Opcional)</label>
                <input
                  type="url"
                  name="video_stream_url"
                  value={formData.video_stream_url}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/live/..."
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* Card: Redes Sociales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center space-x-3">
              <div className="p-2 bg-[#71dd37]/10 rounded-lg">
                <Share2 className="w-5 h-5 text-[#71dd37]" />
              </div>
              <h2 className="text-lg font-bold text-[#566a7f]">Contacto y Redes</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>WhatsApp</label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1acb8]" />
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    placeholder="543704..."
                    className={`${inputClasses} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Dirección</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Calle y número"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Facebook URL</label>
                <input
                  type="url"
                  name="social_facebook"
                  value={formData.social_facebook}
                  onChange={handleInputChange}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Instagram URL</label>
                <input
                  type="url"
                  name="social_instagram"
                  value={formData.social_instagram}
                  onChange={handleInputChange}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* Card: Imágenes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <label className={labelClasses}>Logo de la Emisora</label>
              <div className="mt-2 flex flex-col items-center p-6 border-2 border-dashed border-[#d9dee3] rounded-xl hover:border-[#696cff] transition-colors group cursor-pointer" onClick={() => handleImageUpload('logo')}>
                  {formData.logo_url ? (
                    <img src={formData.logo_url} alt="Logo" className="w-24 h-24 object-contain rounded-lg shadow-sm" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-[#a1acb8] group-hover:text-[#696cff]" />
                  )}
                <span className="mt-3 text-xs font-bold text-[#696cff] uppercase">Cambiar Logo</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <label className={labelClasses}>Imagen de Portada</label>
              <div className="mt-2 flex flex-col items-center p-6 border-2 border-dashed border-[#d9dee3] rounded-xl hover:border-[#696cff] transition-colors group cursor-pointer" onClick={() => handleImageUpload('cover')}>
                  {formData.cover_url ? (
                    <img src={formData.cover_url} alt="Portada" className="w-full h-24 object-cover rounded-lg shadow-sm" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-[#a1acb8] group-hover:text-[#696cff]" />
                  )}
                <span className="mt-3 text-xs font-bold text-[#696cff] uppercase">Cambiar Portada</span>
              </div>
            </div>
          </div>

          {/* Barra de Acciones Fija Inferior o al final */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-6 py-2.5 border border-[#d9dee3] text-[#697a8d] rounded-lg hover:bg-gray-50 transition-all font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-8 py-2.5 bg-[#696cff] text-white rounded-lg hover:bg-[#5f61e6] shadow-md shadow-[#696cff]/20 disabled:opacity-50 transition-all transform active:scale-95 font-bold"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
