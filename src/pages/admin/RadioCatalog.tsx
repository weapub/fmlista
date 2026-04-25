import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { RadioCatalogEntry } from '@/types/database';
import { checkStreamCompatibility, StreamCheckUiResult } from '@/lib/streamCompatibility';

type CatalogStatus = RadioCatalogEntry['status'];

interface CatalogFormData {
  name: string;
  frequency: string;
  city: string;
  province: string;
  category: string;
  stream_url: string;
  website: string;
  facebook: string;
  instagram: string;
  logo_url: string;
  description: string;
  status: CatalogStatus;
  notes: string;
}

const defaultFormData: CatalogFormData = {
  name: '',
  frequency: '',
  city: '',
  province: 'Formosa',
  category: '',
  stream_url: '',
  website: '',
  facebook: '',
  instagram: '',
  logo_url: '',
  description: '',
  status: 'draft',
  notes: '',
};

const statusStyles: Record<CatalogStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200',
  verified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  published: 'bg-[#696cff]/15 text-[#696cff] dark:bg-[#696cff]/20 dark:text-[#aeb0ff]',
};

const statusLabel: Record<CatalogStatus, string> = {
  draft: 'Borrador',
  verified: 'Verificada',
  published: 'Publicada',
};

const escapeCsvCell = (value: unknown) => {
  const raw = value == null ? '' : String(value);
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
};

export const RadioCatalog: React.FC = () => {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<RadioCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEntry, setEditingEntry] = useState<RadioCatalogEntry | null>(null);
  const [formData, setFormData] = useState<CatalogFormData>(defaultFormData);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [streamCheckLoading, setStreamCheckLoading] = useState(false);
  const [streamCheckResult, setStreamCheckResult] = useState<StreamCheckUiResult | null>(null);

  const draftStorageKey = useMemo(() => {
    const scope = editingEntry?.id ?? 'new';
    return `radio-catalog-draft:${scope}:${user?.id ?? 'anon'}`;
  }, [editingEntry?.id, user?.id]);

  useEffect(() => {
    void fetchEntries();
  }, []);

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
      console.error('Error restoring radio catalog draft:', error);
    }
  }, [draftStorageKey, loading]);

  useEffect(() => {
    if (loading || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(formData));
    } catch (error) {
      console.error('Error persisting radio catalog draft:', error);
    }
  }, [draftStorageKey, formData, loading]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('radio_catalog')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showFeedback('error', `No pudimos cargar el catalogo: ${error.message}`);
    } else {
      setEntries((data || []) as RadioCatalogEntry[]);
    }

    setLoading(false);
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const resetForm = () => {
    setEditingEntry(null);
    setFormData(defaultFormData);
    setDraftRestored(false);
  };

  const handleInputChange =
    (field: keyof CatalogFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormData((current) => ({
        ...current,
        [field]: event.target.value,
      }));

      if (field === 'stream_url') {
        setStreamCheckResult(null);
      }
    };

  const handleCheckStream = async () => {
    setStreamCheckLoading(true);
    try {
      const result = await checkStreamCompatibility(formData.stream_url);
      setStreamCheckResult(result);
    } catch (error) {
      console.error('Error checking catalog stream compatibility:', error);
      setStreamCheckResult({
        tone: 'error',
        message: 'No se pudo validar el stream. Intenta nuevamente.',
        details: [],
      });
    } finally {
      setStreamCheckLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      showFeedback('error', 'El nombre de la radio es obligatorio.');
      return;
    }

    setSaving(true);

    const payload = {
      ...formData,
      name: formData.name.trim(),
      province: formData.province.trim() || 'Formosa',
      updated_at: new Date().toISOString(),
    };

    const query = editingEntry
      ? supabase.from('radio_catalog').update(payload).eq('id', editingEntry.id)
      : supabase.from('radio_catalog').insert({
          ...payload,
          created_by: user?.id ?? null,
        });

    const { error } = await query;

    if (error) {
      showFeedback('error', `No pudimos guardar la radio: ${error.message}`);
    } else {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(draftStorageKey);
      }
      showFeedback('success', editingEntry ? 'Radio actualizada en el catalogo.' : 'Radio agregada al catalogo.');
      resetForm();
      await fetchEntries();
    }

    setSaving(false);
  };

  const handleEdit = (entry: RadioCatalogEntry) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name ?? '',
      frequency: entry.frequency ?? '',
      city: entry.city ?? '',
      province: entry.province ?? 'Formosa',
      category: entry.category ?? '',
      stream_url: entry.stream_url ?? '',
      website: entry.website ?? '',
      facebook: entry.facebook ?? '',
      instagram: entry.instagram ?? '',
      logo_url: entry.logo_url ?? '',
      description: entry.description ?? '',
      status: entry.status ?? 'draft',
      notes: entry.notes ?? '',
    });
    setDraftRestored(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDiscardDraft = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(draftStorageKey);
    }

    setDraftRestored(false);

    if (editingEntry) {
      setFormData({
        name: editingEntry.name ?? '',
        frequency: editingEntry.frequency ?? '',
        city: editingEntry.city ?? '',
        province: editingEntry.province ?? 'Formosa',
        category: editingEntry.category ?? '',
        stream_url: editingEntry.stream_url ?? '',
        website: editingEntry.website ?? '',
        facebook: editingEntry.facebook ?? '',
        instagram: editingEntry.instagram ?? '',
        logo_url: editingEntry.logo_url ?? '',
        description: editingEntry.description ?? '',
        status: editingEntry.status ?? 'draft',
        notes: editingEntry.notes ?? '',
      });
      return;
    }

    setFormData(defaultFormData);
  };

  const handleDelete = async (entry: RadioCatalogEntry) => {
    if (!window.confirm(`Vas a eliminar "${entry.name}" del catalogo. Deseas continuar?`)) {
      return;
    }

    setDeletingId(entry.id);
    const { error } = await supabase.from('radio_catalog').delete().eq('id', entry.id);

    if (error) {
      showFeedback('error', `No pudimos eliminar la radio: ${error.message}`);
    } else {
      showFeedback('success', 'Radio eliminada del catalogo.');
      if (editingEntry?.id === entry.id) {
        resetForm();
      }
      await fetchEntries();
    }

    setDeletingId(null);
  };

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return entries;

    return entries.filter((entry) =>
      [
        entry.name,
        entry.frequency,
        entry.city,
        entry.province,
        entry.category,
        entry.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [entries, searchTerm]);

  const stats = useMemo(
    () => ({
      total: entries.length,
      verified: entries.filter((entry) => entry.status === 'verified').length,
      published: entries.filter((entry) => entry.status === 'published').length,
    }),
    [entries]
  );

  const handleExportCsv = () => {
    const rows = filteredEntries.map((entry) =>
      [
        entry.name,
        entry.frequency,
        entry.city,
        entry.province,
        entry.category,
        entry.stream_url,
        entry.website,
        entry.facebook,
        entry.instagram,
        entry.logo_url,
        entry.status,
        entry.description,
        entry.notes,
        entry.created_at,
        entry.updated_at,
      ].map(escapeCsvCell).join(',')
    );

    const csv = [
      '\uFEFFnombre,frecuencia,ciudad,provincia,categoria,stream_url,website,facebook,instagram,logo_url,status,descripcion,notas,created_at,updated_at',
      ...rows,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `catalogo-radios-formosa-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout
      title="Catalogo de Radios"
      subtitle="Carga manual y respaldo CSV de emisoras por provincia"
      searchPlaceholder="Buscar por radio, ciudad, categoria o estado..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {draftRestored && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-900/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Recuperamos tu borrador del catalogo.</p>
                <p className="text-sm text-amber-700 dark:text-amber-200">
                  Puedes seguir cargando la radio o descartar el borrador y volver al formulario limpio.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/30"
              >
                Descartar borrador
              </button>
            </div>
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#444564] dark:bg-[#2b2c40]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a1acb8]">Catalogadas</p>
            <p className="mt-3 text-3xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">{stats.total}</p>
            <p className="mt-2 text-sm text-[#8a94a6] dark:text-[#a3a4cc]">Base manual para respaldo y futuras importaciones.</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#444564] dark:bg-[#2b2c40]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a1acb8]">Verificadas</p>
            <p className="mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.verified}</p>
            <p className="mt-2 text-sm text-[#8a94a6] dark:text-[#a3a4cc]">Emisoras con datos revisados o stream confirmado.</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#444564] dark:bg-[#2b2c40]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a1acb8]">Publicadas</p>
                <p className="mt-3 text-3xl font-bold text-[#696cff] dark:text-[#aeb0ff]">{stats.published}</p>
                <p className="mt-2 text-sm text-[#8a94a6] dark:text-[#a3a4cc]">Listas para usar como referencia operativa.</p>
              </div>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredEntries.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-[#696cff] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5d61f3] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#444564] dark:bg-[#2b2c40] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">
                  {editingEntry ? 'Editar radio catalogada' : 'Nueva radio en el catalogo'}
                </h2>
                <p className="mt-1 text-sm text-[#8a94a6] dark:text-[#a3a4cc]">
                  Pensado para carga manual rapida y posterior respaldo en Excel o CSV.
                </p>
              </div>
              {editingEntry && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-[#697a8d] transition hover:bg-gray-50 dark:border-[#444564] dark:text-[#cbcbe2] dark:hover:bg-[#323249]"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </button>
              )}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Nombre de la radio *</span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#566a7f] outline-none transition focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10 dark:border-[#444564] dark:bg-[#232333] dark:text-[#cbcbe2]"
                    placeholder="Ej: FM Ladocta"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Frecuencia</span>
                  <input
                    type="text"
                    value={formData.frequency}
                    onChange={handleInputChange('frequency')}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#566a7f] outline-none transition focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10 dark:border-[#444564] dark:bg-[#232333] dark:text-[#cbcbe2]"
                    placeholder="97.9 FM"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Categoria</span>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={handleInputChange('category')}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#566a7f] outline-none transition focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10 dark:border-[#444564] dark:bg-[#232333] dark:text-[#cbcbe2]"
                    placeholder="Noticias, Tropical, Comunitaria..."
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Ciudad</span>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={handleInputChange('city')}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#566a7f] outline-none transition focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10 dark:border-[#444564] dark:bg-[#232333] dark:text-[#cbcbe2]"
                    placeholder="Formosa Capital, Clorinda, El Colorado..."
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Provincia</span>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={handleInputChange('province')}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#566a7f] outline-none transition focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10 dark:border-[#444564] dark:bg-[#232333] dark:text-[#cbcbe2]"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Estado del registro</span>
                  <select
                    value={formData.status}
                    onChange={handleInputChange('status')}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#566a7f] outline-none transition focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10 dark:border-[#444564] dark:bg-[#232333] dark:text-[#cbcbe2]"
                  >
                    <option value="draft">Borrador</option>
                    <option value="verified">Verificada</option>
                    <option value="published">Publicada</option>
                  </select>
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Stream URL</span>
                  <input
                    type="url"
                    value={formData.stream_url}
                    onChange={handleInputChange('stream_url')}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#566a7f] outline-none transition focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10 dark:border-[#444564] dark:bg-[#232333] dark:text-[#cbcbe2]"
                    placeholder="https://..."
                  />
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCheckStream}
                      disabled={streamCheckLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-[#697a8d] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#444564] dark:text-[#cbcbe2] dark:hover:bg-[#323249]"
                    >
                      {streamCheckLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                      Probar compatibilidad
                    </button>
                    <span className="text-xs text-[#8a94a6] dark:text-[#a3a4cc]">Evita cargar streams incompatibles.</span>
                  </div>

                  {streamCheckResult && (
                    <div
                      className={`mt-2 rounded-xl border px-3 py-2 text-sm ${
                        streamCheckResult.tone === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300'
                          : streamCheckResult.tone === 'warning'
                            ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300'
                            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300'
                      }`}
                    >
                      <p className="font-semibold">{streamCheckResult.message}</p>
                      {streamCheckResult.details.length > 0 && (
                        <p className="mt-1 text-xs opacity-90">{streamCheckResult.details.join(' · ')}</p>
                      )}
                    </div>
                  )}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Sitio web</span>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange('website')}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#566a7f] outline-none transition focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10 dark:border-[#444564] dark:bg-[#232333] dark:text-[#cbcbe2]"
                    placeholder="https://..."
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Logo URL</span>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={handleInputChange('logo_url')}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#566a7f] outline-none transition focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10 dark:border-[#444564] dark:bg-[#232333] dark:text-[#cbcbe2]"
                    placeholder="https://..."
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Facebook</span>
                  <input
                    type="url"
                    value={formData.facebook}
                    onChange={handleInputChange('facebook')}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#566a7f] outline-none transition focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10 dark:border-[#444564] dark:bg-[#232333] dark:text-[#cbcbe2]"
                    placeholder="https://facebook.com/..."
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Instagram</span>
                  <input
                    type="url"
                    value={formData.instagram}
                    onChange={handleInputChange('instagram')}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#566a7f] outline-none transition focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10 dark:border-[#444564] dark:bg-[#232333] dark:text-[#cbcbe2]"
                    placeholder="https://instagram.com/..."
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Descripcion</span>
                  <textarea
                    value={formData.description}
                    onChange={handleInputChange('description')}
                    rows={3}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#566a7f] outline-none transition focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10 dark:border-[#444564] dark:bg-[#232333] dark:text-[#cbcbe2]"
                    placeholder="Breve contexto editorial o institucional de la emisora..."
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Notas internas</span>
                  <textarea
                    value={formData.notes}
                    onChange={handleInputChange('notes')}
                    rows={3}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#566a7f] outline-none transition focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10 dark:border-[#444564] dark:bg-[#232333] dark:text-[#cbcbe2]"
                    placeholder="Ej: stream sin confirmar, logo pendiente, contacto por conseguir..."
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-[#444564] sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#696cff] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5d61f3] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingEntry ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingEntry ? 'Guardar cambios' : 'Agregar al catalogo'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-[#697a8d] transition hover:bg-gray-50 dark:border-[#444564] dark:text-[#cbcbe2] dark:hover:bg-[#323249]"
                >
                  <UploadCloud className="h-4 w-4" />
                  Limpiar formulario
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-[#444564] dark:bg-[#2b2c40]">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-[#444564] sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">Base actual del catalogo</h2>
                  <p className="text-sm text-[#8a94a6] dark:text-[#a3a4cc]">
                    {filteredEntries.length} de {entries.length} radios visibles.
                  </p>
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a1acb8]">
                  Provincia sugerida: Formosa
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#696cff]" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
                <p className="text-lg font-bold text-[#566a7f] dark:text-[#cbcbe2]">Todavia no hay radios para mostrar</p>
                <p className="mt-2 max-w-md text-sm text-[#8a94a6] dark:text-[#a3a4cc]">
                  Empeza cargando una emisora desde el formulario y despues exporta el respaldo cuando quieras.
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-4 sm:p-6">
                {filteredEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-gray-100 bg-[#f9fafc] p-4 transition hover:border-[#696cff]/30 hover:bg-white dark:border-[#444564] dark:bg-[#232333] dark:hover:bg-[#2e3046]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-[#566a7f] dark:text-[#cbcbe2]">{entry.name}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${statusStyles[entry.status]}`}>
                            {statusLabel[entry.status]}
                          </span>
                          {entry.frequency && (
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#697a8d] shadow-sm dark:bg-[#2b2c40] dark:text-[#cbcbe2]">
                              {entry.frequency}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-[#8a94a6] dark:text-[#a3a4cc]">
                          {entry.city && <span className="rounded-full bg-white px-3 py-1 shadow-sm dark:bg-[#2b2c40]">{entry.city}</span>}
                          <span className="rounded-full bg-white px-3 py-1 shadow-sm dark:bg-[#2b2c40]">{entry.province}</span>
                          {entry.category && <span className="rounded-full bg-white px-3 py-1 shadow-sm dark:bg-[#2b2c40]">{entry.category}</span>}
                        </div>

                        {(entry.description || entry.notes) && (
                          <div className="space-y-2 text-sm text-[#697a8d] dark:text-[#a3a4cc]">
                            {entry.description && <p>{entry.description}</p>}
                            {entry.notes && <p className="text-xs text-[#8a94a6] dark:text-[#8f92b7]">Notas: {entry.notes}</p>}
                          </div>
                        )}

                        <div className="grid gap-2 text-xs text-[#8a94a6] dark:text-[#a3a4cc] sm:grid-cols-2">
                          {entry.stream_url && <p className="truncate">Stream: {entry.stream_url}</p>}
                          {entry.website && <p className="truncate">Web: {entry.website}</p>}
                          {entry.facebook && <p className="truncate">Facebook: {entry.facebook}</p>}
                          {entry.instagram && <p className="truncate">Instagram: {entry.instagram}</p>}
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2 lg:flex-col">
                        <button
                          type="button"
                          onClick={() => handleEdit(entry)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-[#697a8d] transition hover:bg-white dark:border-[#444564] dark:text-[#cbcbe2] dark:hover:bg-[#323249]"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(entry)}
                          disabled={deletingId === entry.id}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20"
                        >
                          {deletingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

export default RadioCatalog;
