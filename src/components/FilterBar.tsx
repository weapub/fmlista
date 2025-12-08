import React, { useState, useEffect } from 'react'
import { Filter, MapPin, Tag } from 'lucide-react'
import { useRadioStore } from '@/stores/radioStore'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export const FilterBar: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const { selectedCategory, selectedLocation, setSelectedCategory, setSelectedLocation } = useRadioStore()
  
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setIsLoading(true)
        const [categoriesData, locationsData] = await Promise.all([
          api.getCategories(),
          api.getLocations()
        ])
        setCategories(categoriesData)
        setLocations(locationsData)
      } catch (error) {
        console.error('Error fetching filters:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchFilters()
  }, [])
  
  const clearFilters = () => {
    setSelectedCategory(null)
    setSelectedLocation(null)
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="animate-pulse flex space-x-4">
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 p-4 bg-white rounded-lg shadow-sm space-y-3 sm:space-y-0">
      <div className="flex items-center space-x-2">
        <Filter className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Filtros:</span>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-gray-600" />
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 w-full sm:w-auto"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-600" />
          <select
            value={selectedLocation || ''}
            onChange={(e) => setSelectedLocation(e.target.value || null)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 w-full sm:w-auto"
          >
            <option value="">Todas las ubicaciones</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>
      </div>
      
      {(selectedCategory || selectedLocation) && (
        <button
          onClick={clearFilters}
          className="px-3 py-2 text-sm text-secondary-600 hover:text-secondary-700 font-medium self-start sm:self-center"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}