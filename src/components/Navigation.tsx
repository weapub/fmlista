import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, LogOut, Settings, Radio, Moon, Sun, Library, Home, Menu, X } from 'lucide-react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
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
    <nav className="sticky top-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 py-3 md:py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={appLogo} alt="Logo" className="w-12 h-12 object-contain dark:invert dark:hue-rotate-180" />
            <div>
              <p className="text-lg font-semibold text-primary-500 dark:text-white">{appTitle}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">La guía de radios de Formosa</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link
              to="/"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Inicio"
            >
              <Home className="w-5 h-5" />
            </Link>

            {user && (
              <Link
                to="/library"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                title="Mi Biblioteca"
              >
                <Library className="w-5 h-5" />
              </Link>
            )}

            {(userRole === 'radio_admin' || userRole === 'super_admin') && (
              <Link
                to="/admin"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                title="Panel de Control"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}

            {user ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 text-secondary-600 dark:bg-secondary-900 dark:text-secondary-300">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden lg:inline">{user.email}</span>
                <button onClick={handleLogout} className="inline-flex h-10 items-center rounded-full bg-secondary-500 px-3 text-white transition hover:bg-secondary-600">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full bg-secondary-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-600"
              >
                Ingresar
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 md:hidden"
            aria-label="Abrir menú"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={`fixed right-0 top-0 z-50 h-full w-full max-w-xs bg-white shadow-2xl transition-transform duration-300 dark:bg-slate-950 md:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img src={appLogo} alt="Logo" className="w-10 h-10 object-contain dark:invert" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{appTitle}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Menú rápido</p>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <button
            onClick={() => {
              setDarkMode(!darkMode)
              setMobileMenuOpen(false)
            }}
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
          </button>

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Inicio
          </Link>

          {user && (
            <Link
              to="/library"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Mi Biblioteca
            </Link>
          )}

          {(userRole === 'radio_admin' || userRole === 'super_admin') && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Panel de Control
            </Link>
          )}

          {!user ? (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-3xl bg-secondary-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-secondary-600"
            >
              Ingresar
            </Link>
          ) : (
            <button
              onClick={() => {
                handleLogout()
                setMobileMenuOpen(false)
              }}
              className="w-full rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          )}

          {user && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <p className="font-semibold">Sesión activa</p>
              <p className="truncate text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
