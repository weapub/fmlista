import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, LogOut, Settings, Radio, Moon, Sun, Library, Home, Menu, X, ChevronDown, Play, Heart, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Radio as RadioType } from '@/types/database'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

export const Navigation: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [appLogo, setAppLogo] = useState('/favicon.svg')
  const [appTitle, setAppTitle] = useState('FM Lista')
  const [appSlogan, setAppSlogan] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [favoriteRadio, setFavoriteRadio] = useState<RadioType | null>(null)
  const [latestRadios, setLatestRadios] = useState<RadioType[]>([])
  const [hasNotifications, setHasNotifications] = useState(true) // Mocked: Simula que hay novedades
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const userRole = user?.role as string

  useEffect(() => {
    const fetchLogo = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['app_logo', 'app_title', 'app_slogan']);
      
      const logoSetting = data?.find(s => s.key === 'app_logo');
      const titleSetting = data?.find(s => s.key === 'app_title');
      const sloganSetting = data?.find(s => s.key === 'app_slogan');

      if (logoSetting?.value) {
        setAppLogo(logoSetting.value);
      }

      if (titleSetting) {
        setAppTitle(titleSetting.value);
      }

      if (sloganSetting) {
        setAppSlogan(sloganSetting.value);
      }
    };
    fetchLogo();
  }, []);

  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!user) {
        setFavoriteRadio(null)
        setLatestRadios([])
        return
      }
      
      try {
        // Fetch Favorite Radio
        const favoriteIds = JSON.parse(localStorage.getItem('radio_favorites') || '[]')
        if (favoriteIds.length > 0) {
          const { data: favData } = await supabase
            .from('radios')
            .select('*')
            .eq('id', favoriteIds[0])
            .single()
          
          if (favData) setFavoriteRadio(favData)
        }

        // Fetch 3 Latest added radios
        const { data: latestData } = await supabase
          .from('radios')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3)
        
        if (latestData) setLatestRadios(latestData)
      } catch (e) {
        console.error('Error fetching dropdown data:', e)
      }
    }
    if (isProfileOpen) fetchDropdownData()
  }, [user, isProfileOpen])

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }
  
  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-gray-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 py-3 md:py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#696cff] rounded-xl flex items-center justify-center shadow-lg shadow-[#696cff]/20 transition-transform group-hover:scale-110">
              <img src={appLogo} alt="Logo" className="w-7 h-7 object-contain brightness-0 invert" />
            </div>
            <div className="flex flex-col">
              <p className="text-lg font-bold text-[#566a7f] dark:text-white leading-none tracking-tight">{appTitle}</p>
              {appSlogan && (
                <p className="text-[10px] font-bold text-[#a1acb8] uppercase tracking-[0.15em] mt-1">{appSlogan}</p>
              )}
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 md:gap-3">
            <button
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f9] text-[#697a8d] transition-all hover:bg-[#696cff]/10 hover:text-[#696cff] dark:bg-gray-800"
              title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link
              to="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f9] text-[#697a8d] transition-all hover:bg-[#696cff]/10 hover:text-[#696cff] dark:bg-gray-800"
              title="Inicio"
            >
              <Home className="w-5 h-5" />
            </Link>

            {user && (
              <Link
                to="/library"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f9] text-[#697a8d] transition-all hover:bg-[#696cff]/10 hover:text-[#696cff] dark:bg-gray-800"
                title="Mi Biblioteca"
              >
                <Library className="w-5 h-5" />
              </Link>
            )}

            {(userRole === 'radio_admin' || userRole === 'super_admin') && (
              <Link
                to="/admin"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f9] text-[#697a8d] transition-all hover:bg-[#696cff]/10 hover:text-[#696cff] dark:bg-gray-800"
                title="Panel de Control"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1 pr-3 text-sm text-gray-700 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 group"
                >
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#696cff]/10 text-[#696cff] group-hover:bg-[#696cff] group-hover:text-white transition-colors">
                    <User className="h-5 w-5" />
                    {hasNotifications && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-gray-900"></span>
                      </span>
                    )}
                  </div>
                  <span className="hidden lg:inline font-bold text-[#566a7f] dark:text-gray-300">
                    {user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", isProfileOpen && "rotate-180")} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-gray-100 bg-white/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-50 dark:bg-gray-900/95 dark:border-gray-800">
                    <div className="px-4 py-3 mb-1 border-b border-gray-50 dark:border-gray-800">
                      <p className="text-[10px] font-black text-[#a1acb8] uppercase tracking-widest">Cuenta</p>
                      <p className="text-sm font-bold text-[#566a7f] dark:text-white truncate">{user.email}</p>
                    </div>
                    
                    <div className="space-y-1 mt-1">
                      <Link to="/library" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-[#697a8d] hover:bg-[#696cff]/10 hover:text-[#696cff] transition-all dark:text-gray-400 dark:hover:bg-gray-800">
                        <Library className="h-4 w-4" /> Mi Biblioteca
                        {hasNotifications && (
                          <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded-full uppercase tracking-tighter">Nuevo</span>
                        )}
                      </Link>
                      
                      {(userRole === 'radio_admin' || userRole === 'super_admin') && (
                        <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-[#697a8d] hover:bg-[#696cff]/10 hover:text-[#696cff] transition-all dark:text-gray-400 dark:hover:bg-gray-800">
                          <Settings className="h-4 w-4" /> Panel de Control
                        </Link>
                      )}
                    </div>

                    {favoriteRadio && (
                      <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 px-2 mb-2">
                          <Heart className="w-3 h-3 text-red-500 fill-current" />
                          <span className="text-[10px] font-black text-[#a1acb8] uppercase tracking-widest">Favorita</span>
                        </div>
                        <button
                          onClick={() => {
                            navigate(`/radio/${favoriteRadio.id}`)
                            setIsProfileOpen(false)
                          }}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all group/fav"
                        >
                          <img 
                            src={favoriteRadio.logo_url} 
                            alt={favoriteRadio.name}
                            className="w-10 h-10 rounded-lg object-cover border border-white dark:border-slate-700 shadow-sm"
                          />
                          <div className="min-w-0 text-left">
                            <p className="text-xs font-bold text-[#566a7f] dark:text-white group-hover/fav:text-[#696cff] truncate">{favoriteRadio.name}</p>
                            <p className="text-[10px] text-[#a1acb8] font-medium">{favoriteRadio.frequency}</p>
                          </div>
                          <Play className="w-4 h-4 ml-auto text-[#696cff] opacity-0 group-hover/fav:opacity-100 transition-opacity" />
                        </button>
                      </div>
                    )}

                    {latestRadios.length > 0 && (
                      <div className="mt-2 border-t border-gray-50 dark:border-gray-800 pt-3">
                        <div className="flex items-center gap-2 px-4 mb-2">
                          <Sparkles className="w-3 h-3 text-[#696cff]" />
                          <span className="text-[10px] font-black text-[#a1acb8] uppercase tracking-widest">Recién llegadas</span>
                        </div>
                        <div className="space-y-1 px-2">
                          {latestRadios.map((radio) => (
                            <button
                              key={radio.id}
                              onClick={() => {
                                navigate(`/radio/${radio.id}`)
                                setIsProfileOpen(false)
                              }}
                              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group/item"
                            >
                              <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700">
                                {radio.logo_url ? (
                                  <img src={radio.logo_url} alt={radio.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Radio className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 text-left">
                                <p className="text-[11px] font-bold text-[#566a7f] dark:text-gray-300 truncate group-hover/item:text-[#696cff]">
                                  {radio.name}
                                </p>
                                <p className="text-[9px] text-[#a1acb8] font-medium">{radio.frequency}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />
                    
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                      <LogOut className="h-4 w-4" /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl bg-[#696cff] px-5 py-2 text-sm font-bold text-white transition-all hover:bg-[#5f61e6] shadow-md shadow-[#696cff]/20 active:scale-95"
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
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-0 z-50 overflow-y-auto bg-white min-h-screen shadow-2xl dark:bg-slate-950 md:hidden" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#696cff] rounded-xl flex items-center justify-center shadow-lg shadow-[#696cff]/20">
                  <img src={appLogo} alt="Logo" className="w-7 h-7 object-contain brightness-0 invert" />
                </div>
                <div>
                  <p className="font-bold text-[#566a7f] dark:text-white leading-tight">{appTitle}</p>
                  <p className="text-[10px] font-bold text-[#a1acb8] uppercase tracking-widest">Navegación</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <button
                onClick={() => {
                  toggleTheme()
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-3 w-full rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 text-left text-sm font-bold text-[#566a7f] transition hover:border-[#696cff]/30 hover:bg-[#696cff]/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                {isDark ? <Sun className="h-5 w-5 text-[#696cff]" /> : <Moon className="h-5 w-5 text-[#696cff]" />}
                <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
              </button>

              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 text-sm font-bold text-[#566a7f] transition hover:border-[#696cff]/30 hover:bg-[#696cff]/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                <Home className="h-5 w-5 text-[#696cff]" />
                <span>Inicio</span>
              </Link>

              {user && (
                <Link
                  to="/library"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 text-sm font-bold text-[#566a7f] transition hover:border-[#696cff]/30 hover:bg-[#696cff]/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <Library className="h-5 w-5 text-[#696cff]" />
                  <span>Mi Biblioteca</span>
                </Link>
              )}

              {(userRole === 'radio_admin' || userRole === 'super_admin') && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 text-sm font-bold text-[#566a7f] transition hover:border-[#696cff]/30 hover:bg-[#696cff]/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <Settings className="h-5 w-5 text-[#696cff]" />
                  <span>Panel de Control</span>
                </Link>
              )}

              {!user ? (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-3 rounded-2xl bg-[#696cff] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#5f61e6] shadow-md shadow-[#696cff]/20"
                >
                  <User className="h-5 w-5" />
                  <span>Ingresar</span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="flex items-center justify-center gap-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 shadow-md"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Cerrar sesión</span>
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
        </>
      )}
    </nav>
  )
}
