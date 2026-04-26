import React, { useEffect, useMemo, useState } from 'react'
import { Loader2, Pencil, Plus, Save, Trash2, XCircle, PlaySquare } from 'lucide-react'
import { AdminLayout } from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { StreamingProgram } from '@/types/database'
import { buildYouTubeThumbnailUrl, extractYouTubeVideoId } from '@/lib/youtube'
import { ROLES } from '@/types/auth'

interface ProgramFormData {
  title: string
  description: string
  youtube_url: string
  channel_name: string
  category: string
  thumbnail_url: string
  is_featured: boolean
  display_order: number
  active: boolean
}

const defaultFormData: ProgramFormData = {
  title: '',
  description: '',
  youtube_url: '',
  channel_name: '',
  category: 'General',
  thumbnail_url: '',
  is_featured: false,
  display_order: 0,
  active: true,
}

const StreamingPrograms: React.FC = () => {
  const { user } = useAuthStore()
  const [programs, setPrograms] = useState<StreamingProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingProgram, setEditingProgram] = useState<StreamingProgram | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [formData, setFormData] = useState<ProgramFormData>(defaultFormData)

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    window.setTimeout(() => setFeedback(null), 3500)
  }

  const fetchPrograms = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('streaming_programs')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      showFeedback('error', `No pudimos cargar los programas: ${error.message}`)
      setPrograms([])
    } else {
      setPrograms((data || []) as StreamingProgram[])
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!user || user.role !== ROLES.SUPER_ADMIN) return
    void fetchPrograms()
  }, [user])

  const resetForm = () => {
    setEditingProgram(null)
    setFormData(defaultFormData)
  }

  const handleInputChange =
    (field: keyof ProgramFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const isCheckbox = event.target instanceof HTMLInputElement && event.target.type === 'checkbox'
      const rawValue = isCheckbox
        ? (event.target as HTMLInputElement).checked
        : event.target.value

      setFormData((current) => ({
        ...current,
        [field]:
          field === 'display_order'
            ? Number(rawValue) || 0
            : rawValue,
      }))
    }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const videoId = extractYouTubeVideoId(formData.youtube_url)
    if (!videoId) {
      showFeedback('error', 'Ingresa una URL de YouTube valida.')
      return
    }

    setSaving(true)
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      youtube_url: formData.youtube_url.trim(),
      youtube_video_id: videoId,
      channel_name: formData.channel_name.trim() || null,
      category: formData.category.trim() || 'General',
      thumbnail_url: formData.thumbnail_url.trim() || buildYouTubeThumbnailUrl(videoId),
      is_featured: formData.is_featured,
      display_order: formData.display_order || 0,
      active: formData.active,
      updated_at: new Date().toISOString(),
    }

    const query = editingProgram
      ? supabase.from('streaming_programs').update(payload).eq('id', editingProgram.id)
      : supabase.from('streaming_programs').insert({
          ...payload,
          created_by: user?.id ?? null,
        })

    const { error } = await query

    if (error) {
      showFeedback('error', `No pudimos guardar el programa: ${error.message}`)
    } else {
      showFeedback('success', editingProgram ? 'Programa actualizado.' : 'Programa agregado.')
      resetForm()
      await fetchPrograms()
    }

    setSaving(false)
  }

  const handleEdit = (program: StreamingProgram) => {
    setEditingProgram(program)
    setFormData({
      title: program.title || '',
      description: program.description || '',
      youtube_url: program.youtube_url || '',
      channel_name: program.channel_name || '',
      category: program.category || 'General',
      thumbnail_url: program.thumbnail_url || '',
      is_featured: !!program.is_featured,
      display_order: Number(program.display_order || 0),
      active: !!program.active,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (program: StreamingProgram) => {
    if (!window.confirm(`Eliminar "${program.title}" del catálogo?`)) return

    const { error } = await supabase.from('streaming_programs').delete().eq('id', program.id)
    if (error) {
      showFeedback('error', `No pudimos eliminar el programa: ${error.message}`)
    } else {
      showFeedback('success', 'Programa eliminado.')
      if (editingProgram?.id === program.id) resetForm()
      await fetchPrograms()
    }
  }

  const filteredPrograms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return programs
    return programs.filter((program) =>
      [program.title, program.category, program.channel_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    )
  }, [programs, searchTerm])

  const previewVideoId = extractYouTubeVideoId(formData.youtube_url)
  const previewThumbnail = formData.thumbnail_url || buildYouTubeThumbnailUrl(previewVideoId) || '/apple-touch-icon.png'

  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    return (
      <AdminLayout title="Programas Streaming" subtitle="Acceso restringido">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700">
          Solo super admin puede gestionar este modulo.
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Programas Streaming"
      subtitle="Catálogo estilo plataforma para videos de YouTube"
      searchPlaceholder="Buscar por titulo, canal o categoria..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {feedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1.5fr]">
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#444564] dark:bg-[#2b2c40]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">
                  {editingProgram ? 'Editar programa' : 'Nuevo programa'}
                </h2>
                <p className="text-sm text-[#8a94a6] dark:text-[#a3a4cc]">
                  Carga videos de YouTube para la sección pública /programas.
                </p>
              </div>
              {editingProgram && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-[#697a8d] hover:bg-gray-50"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </button>
              )}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="space-y-2 block">
                <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Titulo *</span>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange('title')}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10"
                  placeholder="Ej: La noche de Mirtha"
                  required
                />
              </label>

              <label className="space-y-2 block">
                <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">URL de YouTube *</span>
                <input
                  type="url"
                  value={formData.youtube_url}
                  onChange={handleInputChange('youtube_url')}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 block">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Categoria</span>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={handleInputChange('category')}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10"
                    placeholder="Noticias"
                  />
                </label>
                <label className="space-y-2 block">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Canal</span>
                  <input
                    type="text"
                    value={formData.channel_name}
                    onChange={handleInputChange('channel_name')}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10"
                    placeholder="Todo Noticias"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 block">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Orden</span>
                  <input
                    type="number"
                    min={0}
                    value={formData.display_order}
                    onChange={handleInputChange('display_order')}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10"
                  />
                </label>
                <label className="space-y-2 block">
                  <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Miniatura URL (opcional)</span>
                  <input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={handleInputChange('thumbnail_url')}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10"
                  />
                </label>
              </div>

              <label className="space-y-2 block">
                <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">Descripcion</span>
                <textarea
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  rows={3}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#696cff] focus:ring-4 focus:ring-[#696cff]/10"
                  placeholder="Resumen corto del programa..."
                />
              </label>

              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#566a7f]">
                  <input type="checkbox" checked={formData.is_featured} onChange={handleInputChange('is_featured')} />
                  Destacado
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#566a7f]">
                  <input type="checkbox" checked={formData.active} onChange={handleInputChange('active')} />
                  Activo
                </label>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#a1acb8]">Vista previa</p>
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                  <img src={previewThumbnail} alt="Miniatura del programa" className="h-36 w-full object-cover" />
                  <div className="p-3">
                    <p className="text-sm font-bold text-[#566a7f]">{formData.title || 'Titulo del programa'}</p>
                    <p className="text-xs text-[#8a94a6]">{formData.channel_name || 'Canal nacional'}</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#696cff] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5d61f3] disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingProgram ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingProgram ? 'Guardar cambios' : 'Agregar programa'}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-[#444564] dark:bg-[#2b2c40]">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">Programas cargados</h2>
              <p className="text-sm text-[#8a94a6] dark:text-[#a3a4cc]">{filteredPrograms.length} de {programs.length} visibles.</p>
            </div>

            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#696cff]" />
              </div>
            ) : filteredPrograms.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center px-6 text-center text-sm text-[#8a94a6]">
                Sin resultados para esta búsqueda.
              </div>
            ) : (
              <div className="space-y-3 p-4 sm:p-6">
                {filteredPrograms.map((program) => (
                  <article
                    key={program.id}
                    className="rounded-2xl border border-gray-100 bg-[#f9fafc] p-4 dark:border-[#444564] dark:bg-[#232333]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold text-[#566a7f] dark:text-[#cbcbe2]">{program.title}</h3>
                          {!program.active && (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                              Inactivo
                            </span>
                          )}
                          {program.is_featured && (
                            <span className="rounded-full bg-[#696cff]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#696cff]">
                              Destacado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8a94a6] dark:text-[#a3a4cc]">
                          {program.channel_name || 'Canal nacional'} · {program.category || 'General'} · Orden {program.display_order || 0}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(program)}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-[#697a8d] hover:bg-white"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(program)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-[#8a94a6]">
                      <PlaySquare className="h-4 w-4 text-[#696cff]" />
                      <a href={program.youtube_url} target="_blank" rel="noreferrer" className="truncate hover:text-[#696cff]">
                        {program.youtube_url}
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  )
}

export default StreamingPrograms

