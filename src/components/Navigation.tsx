import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, LogOut, Settings, Radio, Moon, Sun, Library, Home } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

export const Navigation: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [appLogo, setAppLogo] = useState('/favicon.svg')
  const [appTitle, setAppTitle] = useState('FM Lista')
  const [darkMode, setDarkMode] = useState(() => {
    // Check local storage, default to light
    if (localStorage.getItem('theme') === 'dark') return true
    return false
  })
  
  const userRole = user?.role as string

  useEffect(() => {
    const fetchLogo = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['app_logo', 'app_title']);
      
      const logoSetting = data?.find(s => s.key === 'app_logo');
      const titleSetting = data?.find(s => s.key === 'app_title');

      if (logoSetting?.value) {
        setAppLogo(logoSetting.value);
      }

      if (titleSetting) {
        setAppTitle(titleSetting.value);
      }
    };
    fetchLogo();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])
  
  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }
  
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={appLogo} alt="Logo" className="w-16 h-16 object-contain dark:invert dark:hue-rotate-180" />
            {appTitle && <span className="text-xl font-bold text-primary-500 dark:text-white">{appTitle}</span>}
          </Link>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link 
              to="/" 
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Inicio"
            >
              <Home className="w-5 h-5" />
            </Link>

            {user && (
              <Link 
                to="/library" 
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Mi Biblioteca"
              >
                <Library className="w-5 h-5" />
              </Link>
            )}
            
            {user ? (
              <>
                {(userRole === 'radio_admin' || userRole === 'super_admin') && (
                  <Link 
                    to="/admin" 
                    className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Panel de Control"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                )}
                
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {(userRole === 'radio_admin' || userRole === 'super_admin') ? (
                    <Link to="/admin" className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-secondary-600">
                      <div className="w-8 h-8 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-secondary-600 dark:text-secondary-400" />
                      </div>
                      <span className="text-sm font-medium hidden sm:inline">{user.email}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium hidden sm:inline">{user.email}</span>
                    </div>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
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
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
