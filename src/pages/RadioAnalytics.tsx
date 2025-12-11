import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Clock, Globe, TrendingUp, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Radio } from '@/types/database'
import { Navigation } from '@/components/Navigation'

interface AnalyticsData {
  totalListenersToday: number
  peakListeningTime: { hour: string; count: number }[]
  locations: { country: string; count: number; percentage: number }[]
  currentListeners: number
  avgListenTime: string
}

const RadioAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [radio, setRadio] = useState<Radio | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    const fetchRadioAndStats = async () => {
      try {
        if (!id) return

        // Fetch radio details
        const { data: radioData, error } = await supabase
          .from('radios')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setRadio(radioData)

        // Mock Analytics Data
        // In a real app, this would come from an analytics table or service
        const mockData: AnalyticsData = {
          totalListenersToday: Math.floor(Math.random() * 5000) + 1000,
          currentListeners: Math.floor(Math.random() * 200) + 50,
          avgListenTime: '45m',
          peakListeningTime: [
            { hour: '00:00', count: 120 },
            { hour: '04:00', count: 80 },
            { hour: '08:00', count: 450 },
            { hour: '12:00', count: 890 },
            { hour: '16:00', count: 670 },
            { hour: '20:00', count: 340 },
          ],
          locations: [
            { country: 'España', count: 1500, percentage: 45 },
            { country: 'México', count: 800, percentage: 24 },
            { country: 'Colombia', count: 450, percentage: 13 },
            { country: 'Argentina', count: 300, percentage: 9 },
            { country: 'Estados Unidos', count: 150, percentage: 5 },
            { country: 'Otros', count: 135, percentage: 4 },
          ]
        }
        
        setData(mockData)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRadioAndStats()
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!radio || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Emisora no encontrada</h2>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Volver al panel
          </button>
        </div>
      </div>
    )
  }

  const maxPeak = Math.max(...data.peakListeningTime.map(d => d.count))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al panel</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Estadísticas: {radio.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Resumen de audiencia y rendimiento
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <Clock className="w-4 h-4" />
              <span>Última actualización: Ahora mismo</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-green-500 flex items-center text-sm font-medium">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12%
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Oyentes Hoy</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.totalListenersToday.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Oyentes Actuales</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.currentListeners.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Promedio</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.avgListenTime}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
                <Globe className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">País Principal</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.locations[0].country}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Peak Listening Time Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Horarios Pico de Audiencia
            </h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {data.peakListeningTime.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1 group relative">
                  <div 
                    className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-lg relative overflow-hidden transition-all duration-300 hover:bg-blue-200 dark:hover:bg-blue-800/40"
                    style={{ height: `${(item.count / maxPeak) * 100}%` }}
                  >
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-blue-500 dark:bg-blue-500 transition-all duration-1000 ease-out"
                      style={{ height: '100%' }}
                    ></div>
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {item.count} oyentes
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                    {item.hour}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Distribution */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Ubicación Geográfica
            </h3>
            <div className="space-y-4">
              {data.locations.map((loc, index) => (
                <div key={index} className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {loc.country}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {loc.count} ({loc.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-secondary-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${loc.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Tu audiencia es principalmente de habla hispana, con un crecimiento del 5% en Estados Unidos este mes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RadioAnalytics
