import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Plan } from '@/types/database';
import { Plus, Trash2, Edit, Save, X, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { cn } from '@/lib/utils';

interface PlanFormData {
  name: string;
  type: 'streaming' | 'ads' | 'microsite' | 'premium_feature';
  price: number;
  description: string;
  features: string[];
  interval: 'monthly' | 'yearly';
  active: boolean;
  is_featured: boolean;
}

export default function AdminPlans() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    type: 'streaming',
    price: 0,
    description: '',
    features: [],
    interval: 'monthly',
    active: true,
    is_featured: false
  });
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      if (user.role !== 'super_admin') {
        navigate('/admin');
        return;
      }

      await fetchPlans();
    };

    checkRole();
  }, [user, navigate]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('type', { ascending: true })
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      showNotification('error', 'Error al cargar los planes');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      type: (plan.type as any) || 'streaming',
      price: Number(plan.price) || 0,
      description: plan.description || '',
      features: Array.isArray(plan.features) ? plan.features : [],
      interval: (plan.interval as any) || 'monthly',
      active: plan.active !== false,
      is_featured: plan.is_featured || false
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.price < 0 || formData.features.length === 0) {
      showNotification('error', 'Completa todos los campos requeridos');
      return;
    }

    try {
      if (editingPlan) {
        // Update existing plan
        const { error } = await supabase
          .from('plans')
          .update({
            name: formData.name,
            type: formData.type,
            price: formData.price,
            description: formData.description,
            features: formData.features,
            interval: formData.interval,
            active: formData.active,
            is_featured: formData.is_featured
          })
          .eq('id', editingPlan.id);

        if (error) throw error;
        showNotification('success', 'Plan actualizado correctamente');
      } else {
        // Create new plan
        const { error } = await supabase
          .from('plans')
          .insert([{
            name: formData.name,
            type: formData.type,
            price: formData.price,
            currency: 'ARS',
            description: formData.description,
            features: formData.features,
            interval: formData.interval,
            active: formData.active,
            is_featured: formData.is_featured
          }]);

        if (error) throw error;
        showNotification('success', 'Plan creado correctamente');
      }

      setShowForm(false);
      setEditingPlan(null);
      setFormData({
        name: '',
        type: 'streaming',
        price: 0,
        description: '',
        features: [],
        interval: 'monthly',
        active: true,
        is_featured: false
      });
      await fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      showNotification('error', 'Error al guardar el plan');
    }
  };

  const handleDelete = async (planId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este plan?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      showNotification('success', 'Plan eliminado correctamente');
      await fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      showNotification('error', 'Error al eliminar el plan');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Gestión de Planes" subtitle="Cargando planes...">
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
    <AdminLayout title="Gestión de Planes" subtitle="Administra todos los planes disponibles">
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
            <div className="flex-1">
              <p className="text-sm font-bold">{notification.message}</p>
            </div>
          </div>
        )}

        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">
            {plans.length} Planes Activos
          </h2>
          <button
            onClick={() => {
              setEditingPlan(null);
              setFormData({
                name: '',
                type: 'streaming',
                price: 0,
                description: '',
                features: [],
                interval: 'monthly',
                active: true,
                is_featured: false
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-[#696cff] text-white px-4 py-2 rounded-lg hover:bg-[#5f61e6] transition-colors font-bold"
          >
            <Plus className="w-5 h-5" />
            Nuevo Plan
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-lg border border-gray-100 dark:border-transparent p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">
                {editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}
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
                    Nombre del Plan *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] dark:text-white"
                    placeholder="Ej: Streaming Pro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">
                    Tipo de Plan *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] dark:text-white"
                  >
                    <option value="streaming">Streaming</option>
                    <option value="ads">Publicidad</option>
                    <option value="microsite">Micrositio</option>
                    <option value="premium_feature">Feature Premium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">
                    Precio (ARS) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] dark:text-white"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">
                    Ciclo de Facturación *
                  </label>
                  <select
                    value={formData.interval}
                    onChange={(e) => setFormData(prev => ({ ...prev, interval: e.target.value as any }))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] dark:text-white"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] dark:text-white"
                  rows={3}
                  placeholder="Describe brevemente este plan..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">
                  Características *
                </label>
                <div className="space-y-3">
                  {formData.features.length > 0 && (
                    <div className="space-y-2 mb-4 p-4 bg-gray-50 dark:bg-[#1a1b2e] rounded-lg border border-gray-200 dark:border-[#444564]">
                      {/* Características incluidas */}
                      <div>
                        {formData.features.filter(f => !f.startsWith('–') && !f.startsWith('-')).length > 0 && (
                          <>
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 uppercase">Incluidas</p>
                            <div className="space-y-2 mb-4">
                              {formData.features.filter(f => !f.startsWith('–') && !f.startsWith('-')).map((feature, idx) => {
                                const actualIdx = formData.features.indexOf(feature);
                                return (
                                  <div key={actualIdx} className="flex items-center gap-2">
                                    <div className="flex-1 px-4 py-2 border border-emerald-200 dark:border-emerald-800/30 rounded-lg dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 text-sm">
                                      ✓ {feature}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFeature(actualIdx)}
                                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Características no incluidas */}
                      <div>
                        {formData.features.filter(f => f.startsWith('–') || f.startsWith('-')).length > 0 && (
                          <>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">No Incluidas</p>
                            <div className="space-y-2">
                              {formData.features.filter(f => f.startsWith('–') || f.startsWith('-')).map((feature, idx) => {
                                const actualIdx = formData.features.indexOf(feature);
                                return (
                                  <div key={actualIdx} className="flex items-center gap-2">
                                    <div className="flex-1 px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#0a0a12] text-gray-500 dark:text-gray-400 text-sm line-through opacity-60">
                                      {feature}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFeature(actualIdx)}
                                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                      className="flex-1 px-4 py-2 border border-gray-200 dark:border-[#444564] rounded-lg dark:bg-[#1a1b2e] dark:text-white"
                      placeholder="Agregar característica... (usa '–' al inicio para NO incluidas)"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-[#696cff] text-white rounded-lg hover:bg-[#5f61e6] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#a1acb8] dark:text-[#7e7e9a] mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30">
                    💡 <strong>Tip:</strong> Escribe características normales para "Incluidas" o comienza con "<strong>–</strong>" para características "No Incluidas" que se mostrarán tachadas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2]">Activo</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-bold text-[#696cff]">Plan Destacado</span>
                </label>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-gray-100 dark:border-[#444564]">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-200 dark:border-[#444564] rounded-lg hover:bg-gray-50 dark:hover:bg-[#444564] transition-colors font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#696cff] text-white rounded-lg hover:bg-[#5f61e6] transition-colors font-bold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar Plan
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent p-6 transition-colors">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-[#566a7f] dark:text-[#cbcbe2]">
                      {plan.name}
                    </h3>
                    <span className="px-2 py-1 bg-[#696cff]/10 text-[#696cff] text-xs font-bold rounded-full">
                      {plan.type}
                    </span>
                    {plan.interval && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-[#444564] text-[#566a7f] dark:text-[#cbcbe2] text-xs font-bold rounded-full">
                        {plan.interval === 'monthly' ? 'Mensual' : 'Anual'}
                      </span>
                    )}
                    {plan.is_featured && (
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 text-xs font-bold rounded-full">
                        ⭐ Destacado
                      </span>
                    )}
                    {!plan.active && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 text-xs font-bold rounded-full">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-[#a1acb8] dark:text-[#7e7e9a] mb-3">{plan.description}</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-[#a1acb8] dark:text-[#7e7e9a]">Precio</p>
                      <p className="text-2xl font-bold text-[#696cff]">${plan.price}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#a1acb8] dark:text-[#7e7e9a]">Características</p>
                      <p className="text-xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">
                        {Array.isArray(plan.features) ? plan.features.length : 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#03c3ec]/10 text-[#03c3ec] rounded-lg hover:bg-[#03c3ec]/20 transition-colors font-bold"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => plan.id && handleDelete(plan.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
