import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScheduleItem } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Plus, Edit, Trash2, Clock, Calendar, X, Save } from 'lucide-react';

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
    if (!user || user.role !== 'radio_admin') {
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
    if (!confirm('Are you sure you want to delete this schedule item?')) return;

    try {
      const { error } = await supabase
        .from('schedule_items')
        .delete()
        .eq('id', itemId)
        .eq('radio_id', id);

      if (error) throw error;
      fetchSchedule();
    } catch (error) {
      console.error('Error deleting schedule item:', error);
      alert('Error deleting schedule item. Please try again.');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary-500">Configuración de Programación</h1>
            <button
              onClick={() => navigate('/admin')}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Programación</h2>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar</span>
            </button>
          </div>

          {showForm && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">
                {editingItem ? 'Edit Program' : 'Add New Program'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del programa *
                    </label>
                    <input
                      type="text"
                      name="program_name"
                      value={formData.program_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Días de la semana *</label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayChange(day)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            formData.days_of_week.includes(day)
                              ? 'bg-secondary-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                    {formData.days_of_week.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">Selecciona al menos un día</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Inicio *</label>
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Cierre *</label>
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>

                <div className="flex items-center">
                  {/* Campo de recurrencia eliminado para ajustarse al modelo de datos */}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : (editingItem ? 'Update' : 'Save')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-6">
            {daysOfWeek.map((day) => {
              const daySchedule = groupScheduleByDay()[day] || [];
              return (
                <div key={day} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    {day}
                  </h3>
                  {daySchedule.length === 0 ? (
                    <p className="text-gray-500 text-sm">Sin programas</p>
                  ) : (
                    <div className="space-y-2">
                      {daySchedule.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-4">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {formatTime(item.start_time)} - {formatTime(item.end_time)}
                              </div>
                              <div className="text-sm text-gray-600">{item.program_name}</div>
                              {item.description && (
                                <div className="text-xs text-gray-500">{item.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1 text-gray-500 hover:text-secondary-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-gray-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
