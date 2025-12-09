import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, LogOut, Settings, Radio } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export const Navigation: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  
  const userRole = user?.role as string
  
  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/favicon.svg" alt="FM Lista Logo" className="w-8 h-8" />
            <span className="text-xl font-bold text-primary-500">FM Lista</span>
          </Link>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors hidden sm:inline"
            >
              Inicio
            </Link>
            
            {user ? (
              <>
                {(userRole === 'radio_admin' || userRole === 'super_admin') && (
                  <Link 
                    to="/admin" 
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors hidden sm:flex items-center space-x-1"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Panel de Control</span>
                  </Link>
                )}
                
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {(userRole === 'radio_admin' || userRole === 'super_admin') ? (
                    <Link to="/admin" className="flex items-center space-x-2 text-gray-700 hover:text-secondary-600">
                      <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-secondary-600" />
                      </div>
                      <span className="text-sm font-medium hidden sm:inline">{user.email}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-700">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium hidden sm:inline">{user.email}</span>
                    </div>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                </div>
              </>
            ) : (
              <Link 
                to="/login" 
                className="bg-secondary-500 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-secondary-600 transition-colors font-medium text-sm sm:text-base"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
