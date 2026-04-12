import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScheduleItem } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Plus, Edit, Trash2, Clock, Calendar, X, Save, ArrowLeft } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';

export default function ScheduleManager() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [formData, setFormData] = useState({
    program_name: '',
    description: '',
    days_of_week: [] as string[],
    start_time: '',
    end_time: ''
  });

  const daysOfWeek = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  ] as const;

  useEffect(() => {
    if (!user || (user.role !== 'radio_admin' && user.role !== 'super_admin')) {
      navigate('/login');
      return;
    }

    if (id) {
      fetchSchedule();
    }
  }, [id, user, navigate]);

  const fetchSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .eq('radio_id', id)
        // Remove day_of_week ordering since it's now string and might not order correctly alphabetically if we want logical order
        // We will group and order in frontend
        .order('start_time', { ascending: true });

      if (error) throw error;
      setScheduleItems(data || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleDayChange = (day: string) => {
    setFormData(prev => {
      const days = prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day];
      return { ...prev, days_of_week: days };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.days_of_week.length === 0) {
      alert('Please select at least one day of the week.');
      return;
    }
    setSaving(true);

    try {
      if (editingItem) {
        // Update the existing item with the first selected day
        const firstDay = formData.days_of_week[0];
        
        const { error: updateError } = await supabase
          .from('schedule_items')
          .update({
            program_name: formData.program_name,
            description: formData.description,
            day_of_week: firstDay,
            start_time: formData.start_time,
            end_time: formData.end_time
          })
          .eq('id', editingItem.id)
          .eq('radio_id', id);

        if (updateError) throw updateError;

        // If multiple days were selected, create new entries for the additional days
        if (formData.days_of_week.length > 1) {
          const additionalDays = formData.days_of_week.slice(1);
          const inserts = additionalDays.map(day => ({
            radio_id: id,
            program_name: formData.program_name,
            description: formData.description,
            day_of_week: day,
            start_time: formData.start_time,
            end_time: formData.end_time
          }));

          const { error: insertError } = await supabase
            .from('schedule_items')
            .insert(inserts);

          if (insertError) throw insertError;
        }
      } else {
        // Create multiple entries
        const inserts = formData.days_of_week.map(day => ({
          radio_id: id,
          program_name: formData.program_name,
          description: formData.description,
          day_of_week: day,
          start_time: formData.start_time,
          end_time: formData.end_time
        }));

        const { error } = await supabase
          .from('schedule_items')
          .insert(inserts);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingItem(null);
      setFormData({
        program_name: '',
        description: '',
        days_of_week: [],
        start_time: '',
        end_time: ''
      });
      fetchSchedule();
    } catch (error) {
      console.error('Error saving schedule item:', error);
      alert('Error saving schedule item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormData({
      program_name: item.program_name,
      description: item.description || '',
      days_of_week: [item.day_of_week], // Initialize with the single day of the item being edited
      start_time: item.start_time,
      end_time: item.end_time
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    // Optimistic UI update or skip confirm to avoid blocking thread excessively
    // For better UX, we can use a custom modal instead of window.confirm, 
    // but for now, let's just make sure the async operation doesn't freeze UI before it starts.
    if (!window.confirm('Are you sure you want to delete this schedule item?')) return;

    // Set loading state for specific item if possible, or global loading
    // Ideally we should have a deletingId state to show spinner on specific button
    
    try {
      const { error } = await supabase
        .from('schedule_items')
        .delete()
        .eq('id', itemId)
        .eq('radio_id', id);

      if (error) throw error;
      
      // Update local state immediately instead of waiting for fetch
      setScheduleItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting schedule item:', error);
      alert('Error deleting schedule item. Please try again.');
      // Revert state if needed (fetchSchedule will handle sync)
      fetchSchedule();
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      program_name: '',
      description: '',
      days_of_week: [],
      start_time: '',
      end_time: ''
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const groupScheduleByDay = () => {
    const grouped: { [key: string]: ScheduleItem[] } = {};
    scheduleItems.forEach(item => {
      if (!grouped[item.day_of_week]) {
        grouped[item.day_of_week] = [];
      }
      grouped[item.day_of_week].push(item);
    });
    return grouped;
  };

  if (loading) {
    return (
      <AdminLayout title="Configuración de Programación" subtitle="Cargando horarios...">
        <div className="max-w-6xl mx-auto w-full animate-pulse">
          <div className="bg-white rounded-xl h-[400px] p-8 space-y-8 shadow-sm border border-gray-100">
            <div className="h-8 bg-slate-50 rounded-full w-48" />
            <div className="space-y-4">
              <div className="h-12 bg-slate-50 rounded-lg w-full" />
              <div className="h-12 bg-slate-50 rounded-lg w-full" />
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const inputClasses = "w-full px-4 py-2 bg-white border border-[#d9dee3] rounded-lg focus:border-[#696cff] focus:ring-[0.25rem] focus:ring-[#696cff]/10 transition-all outline-none text-[#566a7f] placeholder:text-[#b4bdc6]";
  const labelClasses = "block text-sm font-semibold text-[#566a7f] mb-1";

  return (
    <AdminLayout 
      title="Gestión de Programación" 
      subtitle="Horarios y programas de la emisora"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 text-[#697a8d] hover:text-[#696cff] transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Panel</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#566a7f]">Programas Registrados</h2>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#696cff] text-white rounded-lg hover:bg-[#5f61e6] shadow-sm shadow-[#696cff]/20 transition-all font-bold text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Programa</span>
            </button>
          </div>

          {showForm && (
            <div className="m-6 p-6 border border-[#d9dee3] rounded-xl bg-[#f5f5f9]/30">
              <h3 className="text-lg font-bold text-[#566a7f] mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-[#696cff]" />
                {editingItem ? 'Editar Programa' : 'Agregar nuevo programa'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>
                      Nombre del programa *
                    </label>
                    <input
                      type="text"
                      name="program_name"
                      value={formData.program_name}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej. La Mañana de la Radio"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Días de la semana *</label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayChange(day)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            formData.days_of_week.includes(day)
                              ? 'bg-[#696cff] text-white shadow-sm shadow-[#696cff]/20'
                              : 'bg-white text-[#697a8d] border border-[#d9dee3] hover:bg-gray-50'
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Hora de Inicio *</label>
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      required
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Hora de Cierre *</label>
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      required
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Breve descripción del programa..."
                    className={`${inputClasses} resize-none`}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-4 py-2 text-[#697a8d] hover:bg-gray-100 rounded-lg transition-colors font-semibold text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-2 bg-[#696cff] text-white rounded-lg hover:bg-[#5f61e6] shadow-md shadow-[#696cff]/20 disabled:opacity-50 transition-all font-bold text-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Guardar')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {daysOfWeek.map((day) => {
              const daySchedule = groupScheduleByDay()[day] || [];
              return (
                <div key={day} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  <h3 className="text-sm font-bold text-[#566a7f] bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex items-center uppercase tracking-wider">
                    <Calendar className="w-4 h-4 mr-2 text-[#696cff]" />
                    {day}
                  </h3>
                  <div className="p-4 flex-1">
                    {daySchedule.length === 0 ? (
                      <p className="text-[#a1acb8] text-sm italic py-2">Sin programas asignados</p>
                    ) : (
                      <div className="space-y-3">
                      {daySchedule.map((item) => (
                        <div key={item.id} className="group flex items-center justify-between p-3 bg-[#f5f5f9]/50 rounded-lg border border-transparent hover:border-[#696cff]/30 transition-all">
                          <div className="flex items-start space-x-3">
                            <div className="mt-1 bg-white p-1.5 rounded-md shadow-sm">
                              <Clock className="w-3.5 h-3.5 text-[#696cff]" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#696cff] mb-0.5">
                                {formatTime(item.start_time)} - {formatTime(item.end_time)}
                              </div>
                              <div className="text-sm font-bold text-[#566a7f] leading-tight">{item.program_name}</div>
                              {item.description && (
                                <div className="text-[11px] text-[#a1acb8] mt-1 line-clamp-1">{item.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 text-[#697a8d] hover:text-[#696cff] hover:bg-white rounded-md transition-all"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-[#697a8d] hover:text-[#ff3e1d] hover:bg-white rounded-md transition-all"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
