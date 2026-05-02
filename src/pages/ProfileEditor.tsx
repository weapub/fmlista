import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Radio, Plan } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Upload, Save, X, Image as ImageIcon, ArrowLeft, Globe, MessageCircle, Share2, Info, CreditCard, Settings, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { cn } from '@/lib/utils';
import { ROLES } from '@/types/auth';
import { checkStreamCompatibility, StreamCheckUiResult } from '@/lib/streamCompatibility';
import { trackEvent } from '@/lib/analytics/tracker';

export default function ProfileEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [radio, setRadio] = useState<Radio | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{id: string, email: string}[]>([]);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'invalid'>('idle');
  const [saving, setSaving] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [streamCheckLoading, setStreamCheckLoading] = useState(false);
  const [streamCheckResult, setStreamCheckResult] = useState<StreamCheckUiResult | null>(null);
  const [seoAssistLoading, setSeoAssistLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    frequency: '',
    description: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
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
    address: '',
    user_id: '',
    plan_id: ''
  });

  const draftStorageKey = useMemo(() => {
    const scope = id && id !== 'new' ? id : 'new';
    return `radio-editor-draft:${scope}:${user?.id ?? 'anon'}`;
  }, [id, user?.id]);

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
      if (user?.role === ROLES.SUPER_ADMIN) {
        fetchUsers();
        fetchPlans();
      }
    } else {
      fetchRadio();
      if (user?.role === ROLES.SUPER_ADMIN) {
        fetchUsers();
        fetchPlans();
      }
    }
  }, [id, user, navigate]);

  useEffect(() => {
    if (loading || typeof window === 'undefined') return;

    try {
      const storedDraft = window.localStorage.getItem(draftStorageKey);
      if (!storedDraft) return;

      const parsedDraft = JSON.parse(storedDraft);
      if (!parsedDraft || typeof parsedDraft !== 'object') return;

      setFormData((current) => ({
        ...current,
        ...parsedDraft,
      }));
      setDraftRestored(true);
    } catch (error) {
      console.error('Error restoring radio draft:', error);
    }
  }, [draftStorageKey, loading]);

  useEffect(() => {
    if (loading || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(formData));
    } catch (error) {
      console.error('Error persisting radio draft:', error);
    }
  }, [draftStorageKey, formData, loading]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, email')
      .order('email');
    if (data) setUsers(data);
  };

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('active', true)
      .order('price');
    if (data) setAvailablePlans(data);
  };

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

      // Obtener el plan actual si existe
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('plan_id')
        .eq('radio_id', id)
        .maybeSingle();

      setRadio(data);
      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        frequency: data.frequency || '',
        description: data.description || '',
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        seo_keywords: data.seo_keywords || '',
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
        address: data.address || '',
        user_id: data.user_id || '',
        plan_id: subData?.plan_id || ''
      });
    } catch (error) {
      console.error('Error fetching radio:', error);
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSlug = async () => {
      if (!formData.slug) {
        setSlugStatus('idle');
        return;
      }

      if (!/^[a-z0-9-.]+$/.test(formData.slug)) {
        setSlugStatus('invalid');
        return;
      }

      setSlugStatus('checking');
      const available = await isSlugAvailable(formData.slug, id);
      setSlugStatus(available ? 'available' : 'unavailable');
    };

    const timeoutId = setTimeout(checkSlug, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.slug, id]);

  const isSlugAvailable = async (slug: string, currentId?: string): Promise<boolean> => {
    if (!slug) return true;
    try {
      let query = supabase
        .from('radios')
        .select('id')
        .eq('slug', slug);
      if (currentId && currentId !== 'new') {
        query = query.neq('id', currentId);
      }
      const { data } = await query.maybeSingle();
      return data === null;
    } catch (err) {
      return false;
    }
  };

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD') // Separa caracteres combinados (como acentos)
      .replace(/[\u0300-\u036f]/g, '') // Elimina los acentos
      .replace(/[^a-z0-9.-]/g, '-') // Reemplaza todo lo que no sea letra, número, punto o guion por un guion
      .replace(/-+/g, '-') // Evita guiones múltiples seguidos
      .replace(/^-+|-+$/g, ''); // Quita guiones al inicio o final
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Generar slug automático solo si es una radio nueva y estamos cambiando el nombre
      if (name === 'name' && (!id || id === 'new')) {
        newData.slug = generateSlug(value);
      }
      return newData;
    });

    if (name === 'stream_url') {
      setStreamCheckResult(null);
    }
  };

  const handleCheckStream = async () => {
    setStreamCheckLoading(true);
    try {
      const result = await checkStreamCompatibility(formData.stream_url);
      setStreamCheckResult(result);
    } catch (error) {
      console.error('Error checking stream compatibility:', error);
      setStreamCheckResult({
        tone: 'error',
        message: 'No se pudo validar el stream. Intenta nuevamente en unos segundos.',
        details: [],
      });
    } finally {
      setStreamCheckLoading(false);
    }
  };

  const handleGenerateSeo = async () => {
    if (!formData.name.trim()) {
      alert('Completa al menos el nombre de la emisora para generar SEO.');
      return;
    }

    setSeoAssistLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-seo-copy', {
        body: {
          name: formData.name,
          frequency: formData.frequency,
          location: formData.location,
          category: formData.category,
          description: formData.description,
        },
      });

      if (error) throw error;

      const keywords = Array.isArray(data?.seo_keywords) ? data.seo_keywords.join(', ') : '';

      setFormData((prev) => ({
        ...prev,
        seo_title: data?.seo_title || prev.seo_title,
        seo_description: data?.seo_description || prev.seo_description,
        seo_keywords: keywords || prev.seo_keywords,
      }));

      trackEvent('seo_ai_generated', {
        page_name: 'profile_editor',
        radio_id: id || 'new',
      });
    } catch (error) {
      console.error('Error generating SEO content:', error);
      alert('No se pudo generar contenido SEO con IA. Revisa la configuración de la función e intenta nuevamente.');
    } finally {
      setSeoAssistLoading(false);
    }
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
          .upload(fileName, optimizedFile, {
            contentType: 'image/jpeg',
            cacheControl: '31536000',
            upsert: true
          });

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
      if (slugStatus === 'invalid') {
        alert('El identificador (slug) solo puede contener letras minúsculas, números, guiones y puntos.');
        setSaving(false);
        return;
      }

      if (slugStatus === 'unavailable') {
        alert('El Identificador URL (Slug) ya está en uso por otra radio. Elige uno diferente.');
        setSaving(false);
        return;
      }

      if (!user?.id) {
        alert('Tu sesión no está disponible. Ingresa nuevamente.');
        setSaving(false);
        return;
      }
      
      let radioId = id;

      if (!id || id === 'new') {
        const { data: newRadio, error } = await supabase
          .from('radios')
          .insert({
            name: formData.name,
            slug: formData.slug || null,
            frequency: formData.frequency,
            description: formData.description,
            seo_title: formData.seo_title || null,
            seo_description: formData.seo_description || null,
            seo_keywords: formData.seo_keywords || null,
            location: formData.location,
            category: formData.category,
            stream_url: formData.stream_url,
            video_stream_url: formData.video_stream_url,
            logo_url: formData.logo_url,
            cover_url: formData.cover_url,
            user_id: user.role === ROLES.SUPER_ADMIN ? (formData.user_id || user.id) : user.id,
            whatsapp: formData.whatsapp,
            social_facebook: formData.social_facebook,
            social_instagram: formData.social_instagram,
            social_twitter: formData.social_twitter,
            address: formData.address
          })
          .select()
          .single();

        if (error) throw error;
        radioId = newRadio.id;
      } else {
        const updateData: any = {
            name: formData.name,
            slug: formData.slug || null,
            frequency: formData.frequency,
            description: formData.description,
            seo_title: formData.seo_title || null,
            seo_description: formData.seo_description || null,
            seo_keywords: formData.seo_keywords || null,
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

        // Solo actualizamos el owner si el Super Admin seleccionó uno específicamente
        if (user.role === ROLES.SUPER_ADMIN && formData.user_id) {
          updateData.user_id = formData.user_id;
        }

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

      // Actualizar o quitar plan si es Super Admin
      if (user.role === ROLES.SUPER_ADMIN && radioId) {
        if (formData.plan_id) {
          const { error: subError } = await supabase
            .from('subscriptions')
            .upsert({
              radio_id: radioId,
              plan_id: formData.plan_id,
              status: 'active',
              next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'radio_id' });

          if (subError) throw subError;
        } else {
          const { error: subError } = await supabase
            .from('subscriptions')
            .update({
              plan_id: null,
              status: 'canceled',
              next_billing_date: null,
              current_period_end: null,
              updated_at: new Date().toISOString(),
            })
            .eq('radio_id', radioId);

          if (subError) throw subError;
        }
      }

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(draftStorageKey);
      }

      navigate('/admin');
    } catch (error: any) {
      console.error('Error saving radio:', error);
      // Mostramos un error más descriptivo
      const errorMsg = error.code === '23505' 
        ? 'El Identificador URL (Slug) ya está en uso por otra radio. Elige uno diferente.'
        : error.message || 'Ocurrió un problema al guardar los cambios.';
      
      alert(`Error: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Editor de Perfil" subtitle="Cargando datos...">
        <div className="max-w-5xl mx-auto w-full animate-pulse">
          <div className="bg-white dark:bg-slate-900 rounded-xl h-[600px] p-8 space-y-8 shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="h-8 bg-slate-50 dark:bg-slate-800 rounded-full w-48" />
            <div className="grid grid-cols-2 gap-6">
              <div className="h-12 bg-slate-50 dark:bg-slate-800 rounded-lg" />
              <div className="h-12 bg-slate-50 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="h-32 bg-slate-50 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  const inputClasses = "w-full px-4 py-2 bg-white dark:bg-slate-900 border border-[#d9dee3] dark:border-slate-700 rounded-lg focus:border-[#696cff] focus:ring-[0.25rem] focus:ring-[#696cff]/10 transition-all outline-none text-[#566a7f] dark:text-white placeholder:text-[#b4bdc6] dark:placeholder:text-slate-500";
  const labelClasses = "block text-sm font-semibold text-[#566a7f] dark:text-slate-200 mb-2";

  const handleDiscardDraft = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(draftStorageKey);
    }

    setDraftRestored(false);

    if (!id || id === 'new') {
      setFormData({
        name: '',
        slug: '',
        frequency: '',
        description: '',
        seo_title: '',
        seo_description: '',
        seo_keywords: '',
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
        address: '',
        user_id: '',
        plan_id: ''
      });
      return;
    }

    void fetchRadio();
  };

  return (
    <AdminLayout 
      title={id === 'new' ? 'Crear Emisora' : 'Editar Emisora'} 
      subtitle={formData.name || 'Nueva Radio'}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {draftRestored && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Recuperamos tu borrador automaticamente.</p>
                <p className="text-sm text-amber-700 dark:text-amber-200">
                  Puedes seguir cargando la emisora o descartar este borrador y volver al estado inicial.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/30"
              >
                Descartar borrador
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 text-[#697a8d] dark:text-slate-300 hover:text-[#696cff] transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Panel</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card: Información Básica */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex items-center space-x-3">
              <div className="p-2 bg-[#696cff]/10 rounded-lg">
                <Settings className="w-5 h-5 text-[#696cff]" />
              </div>
              <h2 className="text-lg font-bold text-[#566a7f] dark:text-white">Administración y Propietario</h2>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30 dark:bg-slate-950/30">
              {user?.role === ROLES.SUPER_ADMIN ? (
                <>
                  <div>
                    <label className={labelClasses}>Usuario Propietario</label>
                    <select
                      name="user_id"
                      value={formData.user_id}
                      onChange={handleInputChange}
                      className={inputClasses}
                    >
                      <option value="">Seleccionar Usuario...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.email}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-[#a1acb8] dark:text-slate-500 mt-1">
                      Usuario que tendrá acceso a gestionar esta emisora.
                    </p>
                  </div>

                  <div>
                    <label className={labelClasses}>Plan Asignado</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1acb8] dark:text-slate-500" />
                      <select
                        name="plan_id"
                        value={formData.plan_id}
                        onChange={handleInputChange}
                        className={`${inputClasses} pl-10`}
                      >
                        <option value="">Sin Plan Activo</option>
                        {availablePlans.map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} (${plan.price}/{plan.interval === 'monthly' ? 'mes' : 'año'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[10px] text-[#a1acb8] dark:text-slate-500 mt-1">
                      Controla las funcionalidades premium de la radio.
                    </p>
                  </div>
                </>
              ) : (
                <div className="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-900 rounded-lg flex items-center gap-3">
                  <Info className="w-5 h-5 text-blue-500" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Estás editando esta radio como administrador. Solo el Super Admin puede cambiar el propietario o el plan.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card: Información Básica */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex items-center space-x-3">
              <div className="p-2 bg-[#696cff]/10 rounded-lg">
                <Info className="w-5 h-5 text-[#696cff]" />
              </div>
              <h2 className="text-lg font-bold text-[#566a7f] dark:text-white">Información General</h2>
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
                <div className="relative">
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="ej. radio.formosa"
                    className={cn(
                      inputClasses,
                      slugStatus === 'available' && "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/10",
                      (slugStatus === 'unavailable' || slugStatus === 'invalid') && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {slugStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-[#a1acb8] dark:text-slate-500" />}
                    {slugStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {(slugStatus === 'unavailable' || slugStatus === 'invalid') && <AlertCircle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
                <p className={cn(
                  "text-[10px] mt-1 italic",
                  slugStatus === 'invalid' ? "text-red-500" : 
                  slugStatus === 'unavailable' ? "text-red-500" :
                  slugStatus === 'available' ? "text-emerald-600" : "text-[#a1acb8] dark:text-slate-500"
                )}>
                  {slugStatus === 'invalid' && "Formato inválido (solo minúsculas, números, puntos y guiones)."}
                  {slugStatus === 'unavailable' && "Este identificador ya está en uso."}
                  {slugStatus === 'available' && "¡Identificador disponible!"}
                  {slugStatus === 'idle' && "Solo minúsculas, números, puntos y guiones."}
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

              <div className="md:col-span-2 rounded-xl border border-[#d9dee3] p-4 dark:border-slate-700">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#566a7f] dark:text-white">Asistente SEO con IA</p>
                    <p className="text-xs text-[#a1acb8] dark:text-slate-500">
                      Genera título, descripción y keywords para el micrositio.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateSeo}
                    disabled={seoAssistLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#696cff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5f61e6] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {seoAssistLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    {seoAssistLoading ? 'Generando...' : 'Generar con IA'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={labelClasses}>Título SEO</label>
                    <input
                      type="text"
                      name="seo_title"
                      value={formData.seo_title}
                      onChange={handleInputChange}
                      placeholder="Ej. Radio X en vivo - Noticias y música en Formosa"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Descripción SEO</label>
                    <textarea
                      name="seo_description"
                      value={formData.seo_description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Meta descripción de 140 a 160 caracteres..."
                      className={`${inputClasses} resize-none`}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Keywords SEO</label>
                    <input
                      type="text"
                      name="seo_keywords"
                      value={formData.seo_keywords}
                      onChange={handleInputChange}
                      placeholder="radio formosa, fm en vivo, noticias formosa, ..."
                      className={inputClasses}
                    />
                    <p className="mt-1 text-[10px] text-[#a1acb8] dark:text-slate-500">
                      Separadas por coma. Se usan para optimizar metadata del micrositio.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Streaming */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex items-center space-x-3">
              <div className="p-2 bg-[#03c3ec]/10 rounded-lg">
                <Globe className="w-5 h-5 text-[#03c3ec]" />
              </div>
              <h2 className="text-lg font-bold text-[#566a7f] dark:text-white">Transmisión</h2>
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
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCheckStream}
                    disabled={streamCheckLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#d9dee3] px-4 py-2 text-sm font-semibold text-[#566a7f] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {streamCheckLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    Probar compatibilidad
                  </button>
                  <p className="text-xs text-[#a1acb8] dark:text-slate-500">
                    Recomendado antes de guardar para evitar fallos en iPhone/Chrome.
                  </p>
                </div>

                {streamCheckResult && (
                  <div
                    className={cn(
                      'mt-3 rounded-lg border px-3 py-2 text-sm',
                      streamCheckResult.tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300',
                      streamCheckResult.tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300',
                      streamCheckResult.tone === 'error' && 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300'
                    )}
                  >
                    <p className="font-semibold">{streamCheckResult.message}</p>
                    {streamCheckResult.details.length > 0 && (
                      <p className="mt-1 text-xs opacity-90">{streamCheckResult.details.join(' · ')}</p>
                    )}
                  </div>
                )}
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
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex items-center space-x-3">
              <div className="p-2 bg-[#71dd37]/10 rounded-lg">
                <Share2 className="w-5 h-5 text-[#71dd37]" />
              </div>
              <h2 className="text-lg font-bold text-[#566a7f] dark:text-white">Contacto y Redes</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>WhatsApp</label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1acb8] dark:text-slate-500" />
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
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
              <label className={labelClasses}>Logo de la Emisora</label>
              <div className="mt-2 flex flex-col items-center p-6 border-2 border-dashed border-[#d9dee3] rounded-xl hover:border-[#696cff] transition-colors group cursor-pointer" onClick={() => handleImageUpload('logo')}>
                  {formData.logo_url ? (
                    <img src={formData.logo_url} alt="Logo" className="w-24 h-24 object-contain rounded-lg shadow-sm" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-[#a1acb8] dark:text-slate-500 group-hover:text-[#696cff]" />
                  )}
                <span className="mt-3 text-xs font-bold text-[#696cff] uppercase">Cambiar Logo</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
              <label className={labelClasses}>Imagen de Portada</label>
              <div className="mt-2 flex flex-col items-center p-6 border-2 border-dashed border-[#d9dee3] rounded-xl hover:border-[#696cff] transition-colors group cursor-pointer" onClick={() => handleImageUpload('cover')}>
                  {formData.cover_url ? (
                    <img src={formData.cover_url} alt="Portada" className="w-full h-24 object-cover rounded-lg shadow-sm" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-[#a1acb8] dark:text-slate-500 group-hover:text-[#696cff]" />
                  )}
                <span className="mt-3 text-xs font-bold text-[#696cff] uppercase">Cambiar Portada</span>
              </div>
            </div>
          </div>

          {/* Barra de Acciones Fija Inferior o al final */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-6 py-2.5 border border-[#d9dee3] dark:border-slate-700 text-[#697a8d] dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-semibold"
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
