import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Radio, Settings, Calendar, Image, Play, Edit, Trash2, Plus, ArrowLeft, Megaphone, BarChart2, CheckCircle2, AlertCircle, Info as InfoIcon, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Radio as RadioType } from '@/types/database'
import { AdminLayout } from '@/components/AdminLayout'
import { cn } from '@/lib/utils'

const RadioCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse border border-gray-100">
    <div className="w-full h-32 bg-gray-200" />
    <div className="p-4">
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="space-y-2 pt-2">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
        <div className="flex space-x-2 mt-4">
          <div className="h-9 bg-gray-200 rounded-md flex-1" />
          <div className="h-9 bg-gray-200 rounded-md flex-1" />
          <div className="h-9 bg-gray-200 rounded-md w-10" />
        </div>
      </div>
    </div>
  </div>
);

const AdminPanel: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const [radios, setRadios] = useState<RadioType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notification, setNotification] = useState<{type: 'success' | 'info' | 'error', message: string} | null>(null)

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'payment_success') {
      setNotification({
        type: 'success',
        message: '¡Pago procesado con éxito! Tu suscripción se activará automáticamente en unos instantes.'
      });
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    } else if (status === 'payment_pending') {
      setNotification({
        type: 'info',
        message: 'Tu pago está pendiente de confirmación. Te avisaremos por email una vez acreditado.'
      });
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  useEffect(() => {
    // TypeScript check requires casting or more complex type guards
    const userRole = user?.role as string;
    if (!user || (userRole !== 'radio_admin' && userRole !== 'super_admin')) {
      navigate('/login')
      return
    }
    
    const fetchUserRadios = async () => {
      try {
        setIsLoading(true)
        // Get radios based on role
        let query = supabase
          .from('radio_subscription_status')
          .select('*')
          .order('created_at', { ascending: false })

        // If not super_admin, filter by user_id
        if (userRole !== 'super_admin') {
          query = query.eq('user_id', user.id)
        }

        const { data, error } = await query
        
        if (error) throw error
        setRadios(data || [])
      } catch (error) {
        console.error('Error fetching radios:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserRadios()
  }, [user, navigate])
  
  const handleDeleteRadio = async (radioId: string) => {
    // Optimistic update for better perceived performance
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta emisora?')) {
      return
    }
    
    // Optimistically remove from UI immediately
    const originalRadios = [...radios];
    setRadios(prev => prev.filter(radio => radio.id !== radioId));

    try {
      await api.deleteRadio(radioId)
      // Success, no further action needed as state is already updated
    } catch (error) {
      console.error('Error deleting radio:', error)
      alert('Error al eliminar la emisora')
      // Revert optimistic update on failure
      setRadios(originalRadios);
    }
  }
  
  if (isLoading) {
    return (
      <AdminLayout title="Panel de Administración" subtitle="Cargando emisoras...">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <RadioCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }
  
  return (
    <AdminLayout 
      title="Panel de Administración" 
      subtitle="Gestión de emisoras y contenido"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Notificaciones de Pago */}
        {notification && (
          <div className={cn(
            "p-4 rounded-xl border flex items-start gap-3 relative animate-in fade-in slide-in-from-top-4 duration-300",
            notification.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400" :
            notification.type === 'error' ? "bg-red-50 border-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400" :
            "bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800/30 dark:text-blue-400"
          )}>
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />}
            {notification.type === 'info' && <InfoIcon className="w-5 h-5 shrink-0 text-blue-500" />}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{notification.type === 'success' ? '¡Excelente!' : 'Aviso'}</p>
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>

            <button 
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tarjetas de estadísticas con nuevo estilo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent p-6 flex items-center space-x-4 transition-colors">
            <div className="p-3 bg-[#696cff]/10 rounded-lg">
              <Radio className="w-6 h-6 text-[#696cff]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#a1acb8] dark:text-[#7e7e9a] uppercase">Total Emisoras</p>
              <p className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">{radios.length}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent p-6 flex items-center space-x-4 transition-colors">
            <div className="p-3 bg-[#71dd37]/10 rounded-lg">
              <Play className="w-6 h-6 text-[#71dd37]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#a1acb8] dark:text-[#7e7e9a] uppercase">Estado</p>
              <p className="text-2xl font-bold text-[#71dd37]">En Línea</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent p-6 flex items-center space-x-4 transition-colors">
            <div className="p-3 bg-[#03c3ec]/10 rounded-lg">
              <Settings className="w-6 h-6 text-[#03c3ec]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#a1acb8] dark:text-[#7e7e9a] uppercase">Plan Actual</p>
              <p className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">
                {radios[0]?.plan_name || 'Sin Plan'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Contenedor principal de la lista */}
        <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent overflow-hidden transition-colors">
          <div className="p-6 border-b border-gray-50 dark:border-[#444564] flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">Mis Emisoras</h2>
            <div className="flex flex-wrap gap-3">
              {user?.role === 'super_admin' && (
                <button
                  onClick={() => navigate('/admin/settings')}
                  className="bg-[#697a8d]/10 text-[#697a8d] dark:text-[#a3a4cc] px-4 py-2 rounded-lg hover:bg-[#697a8d]/20 transition-all flex items-center space-x-2 text-sm font-semibold"
                >
                  <Settings className="w-4 h-4" />
                  <span>Configuración Global</span>
                </button>
              )}
              <button
                onClick={() => navigate('/admin/profile/new')}
                className="bg-[#696cff] text-white px-4 py-2 rounded-lg hover:bg-[#5f61e6] shadow-sm shadow-[#696cff]/20 transition-all flex items-center space-x-2 text-sm font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Emisora</span>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {radios.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Radio className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-1">No hay emisoras registradas</h3>
                <p className="text-[#a1acb8] dark:text-[#7e7e9a] mb-6 text-sm">Crea tu primera emisora para comenzar a transmitir.</p>
                <button
                  onClick={() => navigate('/admin/profile/new')}
                  className="bg-[#696cff]/10 text-[#696cff] px-6 py-2 rounded-lg hover:bg-[#696cff]/20 transition-all font-bold"
                >
                  Comenzar ahora
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {radios.map((radio) => (
                  <div key={radio.id} className="group bg-white dark:bg-[#232333] rounded-xl border border-gray-100 dark:border-transparent overflow-hidden hover:shadow-md transition-all duration-300">
                    <div className="relative h-32">
                      {radio.cover_url ? (
                        <img src={radio.cover_url} alt={radio.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#696cff] to-[#787bff] flex items-center justify-center">
                          <Radio className="w-10 h-10 text-white opacity-20" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="bg-white/90 backdrop-blur-sm text-[#696cff] text-[10px] font-bold px-2 py-1 rounded-md uppercase shadow-sm">
                          {radio.frequency}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="font-bold text-[#566a7f] dark:text-[#cbcbe2] truncate mb-1">{radio.name}</h3>
                      <p className="text-xs text-[#a1acb8] dark:text-[#7e7e9a] flex items-center mb-3">
                        <Play className="w-3 h-3 mr-1" /> {radio.location || 'Emisora Online'}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <button
                          onClick={() => navigate(`/admin/profile/${radio.id}`)}
                          className="flex items-center justify-center space-x-1 py-2 bg-gray-50 dark:bg-[#2b2c40] text-[#697a8d] dark:text-[#a3a4cc] rounded-lg hover:bg-gray-100 dark:hover:bg-[#323249] transition-colors text-xs font-semibold"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => navigate(`/admin/schedule/${radio.id}`)}
                          className="flex items-center justify-center space-x-1 py-2 bg-[#696cff]/10 text-[#696cff] rounded-lg hover:bg-[#696cff]/20 transition-colors text-xs font-semibold"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Horarios</span>
                        </button>
                        <button
                          onClick={() => handleDeleteRadio(radio.id)}
                          className="col-span-2 py-2 text-[#ff3e1d] hover:bg-[#ff3e1d]/5 rounded-lg transition-colors text-xs font-semibold flex items-center justify-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar Emisora</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminPanel
