import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radio, Settings, Calendar, Image, Play, Edit, Trash2, Plus, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Radio as RadioType } from '@/types/database'

const AdminPanel: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [radios, setRadios] = useState<RadioType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (!user || user.role !== 'radio_admin') {
      navigate('/login')
      return
    }
    
    const fetchUserRadios = async () => {
      try {
        setIsLoading(true)
        // Get all radios for this user
        const { data, error } = await supabase
          .from('radios')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setRadios(data || [])
      } catch (error) {
        console.error('Error fetching user radios:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserRadios()
  }, [user, navigate])
  
  const handleDeleteRadio = async (radioId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta emisora?')) {
      return
    }
    
    try {
      await api.deleteRadio(radioId)
      setRadios(radios.filter(radio => radio.id !== radioId))
    } catch (error) {
      console.error('Error deleting radio:', error)
      alert('Error al eliminar la emisora')
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-white rounded-lg shadow-sm"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Panel de Administración
              </h1>
              <p className="text-gray-600">
                Gestiona tus emisoras de radio y su contenido
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver al inicio</span>
            </button>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Radio className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Emisoras</p>
                  <p className="text-2xl font-bold text-gray-900">{radios.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Play className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  <p className="text-2xl font-bold text-green-600">Activo</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Plan</p>
                  <p className="text-2xl font-bold text-gray-900">Gratis</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Mis Emisoras
            </h2>
            <button
              onClick={() => navigate('/admin/profile/new')}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Emisora</span>
            </button>
          </div>
          
          {/* Radios Grid */}
          {radios.length === 0 ? (
            <div className="text-center py-12">
              <Radio className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes emisoras</h3>
              <p className="text-gray-600 mb-4">
                Crea tu primera emisora para comenzar a compartir tu contenido
              </p>
              <button
                onClick={() => navigate('/admin/profile/new')}
                className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
              >
                Crear Emisora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {radios.map((radio) => (
                <div key={radio.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {radio.cover_url ? (
                    <img
                      src={radio.cover_url}
                      alt={radio.name}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
                      <Radio className="w-12 h-12 text-white opacity-50" />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {radio.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {radio.frequency}
                        </p>
                        {radio.location && (
                          <p className="text-sm text-gray-500">
                            {radio.location}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {radio.description && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {radio.description}
                      </p>
                    )}
                    
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => navigate(`/admin/profile/${radio.id}`)}
                        className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1 text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                      
                      <button
                        onClick={() => navigate(`/admin/schedule/${radio.id}`)}
                        className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1 text-sm"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Programación</span>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteRadio(radio.id)}
                        className="bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 transition-colors flex items-center justify-center"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
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
  )
}

export default AdminPanel
