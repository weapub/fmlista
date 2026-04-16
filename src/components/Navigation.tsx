import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, LogOut, Settings, Radio, Moon, Sun, Library, Home, Menu, X, ChevronDown, Play, Heart, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Radio as RadioType } from '@/types/database'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { useDeviceStore } from '@/stores/deviceStore'
import { getRadioPath } from '@/lib/microsites'

export const Navigation: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [appLogo, setAppLogo] = useState('/favicon.svg')
  const [appTitle, setAppTitle] = useState('FM Lista')
  const [appSlogan, setAppSlogan] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [favoriteRadio, setFavoriteRadio] = useState<RadioType | null>(null)
  const [latestRadios, setLatestRadios] = useState<RadioType[]>([])
  const [hasNotifications] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const { isTV } = useDeviceStore()

  const dropdownRef = useRef<HTMLDivElement>(null)

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
        .in('key', ['app_logo', 'app_title', 'app_slogan'])

      const logoSetting = data?.find((s) => s.key === 'app_logo')
      const titleSetting = data?.find((s) => s.key === 'app_title')
      const sloganSetting = data?.find((s) => s.key === 'app_slogan')

      if (logoSetting?.value) setAppLogo(logoSetting.value)
      if (titleSetting?.value) setAppTitle(titleSetting.value)
      if (sloganSetting?.value) setAppSlogan(sloganSetting.value)
    }

    void fetchLogo()
  }, [])

  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!user) {
        setFavoriteRadio(null)
        setLatestRadios([])
        return
      }

      try {
        const favoriteIds = JSON.parse(localStorage.getItem('radio_favorites') || '[]')
        if (favoriteIds.length > 0) {
          const { data: favData } = await supabase
            .from('radios')
            .select('*')
            .eq('id', favoriteIds[0])
            .single()

          if (favData) setFavoriteRadio(favData)
        }

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

    if (isProfileOpen) {
      void fetchDropdownData()
    }
  }, [user, isProfileOpen])

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const iconButtonClass = cn(
    'focusable inline-flex items-center justify-center rounded-xl bg-[#f5f5f9] text-[#697a8d] transition-all hover:bg-[#696cff]/10 hover:text-[#696cff] dark:bg-gray-800',
    isTV ? 'h-14 w-14 rounded-2xl' : 'h-10 w-10'
  )

  return (
    <nav className={cn('sticky top-0 z-40 border-b border-gray-100 bg-white/80 shadow-sm backdrop-blur-md transition-colors dark:border-gray-800 dark:bg-gray-950/80', isTV && 'bg-white/90 dark:bg-gray-950/90')}>
      <div className={cn('mx-auto max-w-6xl px-4', isTV && 'max-w-[90rem] px-8')}>
        <div className={cn('flex items-center justify-between gap-4 py-3 md:py-4', isTV && 'py-5')}>
          <Link to="/" className="focusable group flex items-center gap-3 rounded-2xl">
            <div className={cn('flex items-center justify-center rounded-xl bg-[#696cff] shadow-lg shadow-[#696cff]/20 transition-transform group-hover:scale-110', isTV ? 'h-14 w-14 rounded-2xl' : 'h-10 w-10')}>
              <img src={appLogo} alt="Logo" className={cn('object-contain brightness-0 invert', isTV ? 'h-9 w-9' : 'h-7 w-7')} />
            </div>
            <div className="flex flex-col">
              <p className={cn('leading-none tracking-tight text-[#566a7f] font-bold dark:text-white', isTV ? 'text-2xl' : 'text-lg')}>{appTitle}</p>
              {appSlogan && (
                <p className={cn('mt-1 font-bold uppercase tracking-[0.15em] text-[#a1acb8]', isTV ? 'text-xs' : 'text-[10px]')}>
                  {appSlogan}
                </p>
              )}
            </div>
          </Link>

          <div className={cn('hidden items-center gap-2 md:flex md:gap-3', isTV && 'gap-4')}>
            <button onClick={toggleTheme} className={iconButtonClass} title={isDark ? 'Modo Claro' : 'Modo Oscuro'}>
              {isDark ? <Sun className={cn(isTV ? 'h-6 w-6' : 'h-5 w-5')} /> : <Moon className={cn(isTV ? 'h-6 w-6' : 'h-5 w-5')} />}
            </button>

            <Link to="/" className={iconButtonClass} title="Inicio">
              <Home className={cn(isTV ? 'h-6 w-6' : 'h-5 w-5')} />
            </Link>

            {user && (
              <Link to="/library" className={iconButtonClass} title="Mi Biblioteca">
                <Library className={cn(isTV ? 'h-6 w-6' : 'h-5 w-5')} />
              </Link>
            )}

            {(userRole === 'radio_admin' || userRole === 'super_admin') && (
              <Link to="/admin" className={iconButtonClass} title="Panel de Control">
                <Settings className={cn(isTV ? 'h-6 w-6' : 'h-5 w-5')} />
              </Link>
            )}

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={cn('focusable group flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1 pr-3 text-sm text-gray-700 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200', isTV && 'gap-3 pr-4 text-base')}
                >
                  <div className={cn('relative flex items-center justify-center rounded-full bg-[#696cff]/10 text-[#696cff] transition-colors group-hover:bg-[#696cff] group-hover:text-white', isTV ? 'h-11 w-11' : 'h-9 w-9')}>
                    <User className={cn(isTV ? 'h-6 w-6' : 'h-5 w-5')} />
                    {hasNotifications && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500 dark:border-gray-900" />
                      </span>
                    )}
                  </div>
                  <span className={cn('hidden font-bold text-[#566a7f] dark:text-gray-300 lg:inline', isTV && '!inline text-lg')}>
                    {user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={cn('text-gray-400 transition-transform duration-200', isTV ? 'h-5 w-5' : 'h-4 w-4', isProfileOpen && 'rotate-180')} />
                </button>

                {isProfileOpen && (
                  <div className={cn('absolute right-0 z-50 mt-2 origin-top-right rounded-xl border border-gray-100 bg-white/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 dark:border-gray-800 dark:bg-gray-900/95', isTV ? 'w-80 rounded-2xl p-3' : 'w-64')}>
                    <div className="mb-1 border-b border-gray-50 px-4 py-3 dark:border-gray-800">
                      <p className={cn('font-black uppercase tracking-widest text-[#a1acb8]', isTV ? 'text-xs' : 'text-[10px]')}>Cuenta</p>
                      <p className={cn('truncate font-bold text-[#566a7f] dark:text-white', isTV ? 'text-base' : 'text-sm')}>{user.email}</p>
                    </div>

                    <div className="mt-1 space-y-1">
                      <Link to="/library" onClick={() => setIsProfileOpen(false)} className={cn('focusable flex items-center gap-3 rounded-lg px-4 py-2.5 font-medium text-[#697a8d] transition-all hover:bg-[#696cff]/10 hover:text-[#696cff] dark:text-gray-400 dark:hover:bg-gray-800', isTV ? 'py-3 text-base' : 'text-sm')}>
                        <Library className="h-4 w-4" />
                        Mi Biblioteca
                        {hasNotifications && (
                          <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-red-600">
                            Nuevo
                          </span>
                        )}
                      </Link>

                      {(userRole === 'radio_admin' || userRole === 'super_admin') && (
                        <Link to="/admin" onClick={() => setIsProfileOpen(false)} className={cn('focusable flex items-center gap-3 rounded-lg px-4 py-2.5 font-medium text-[#697a8d] transition-all hover:bg-[#696cff]/10 hover:text-[#696cff] dark:text-gray-400 dark:hover:bg-gray-800', isTV ? 'py-3 text-base' : 'text-sm')}>
                          <Settings className="h-4 w-4" />
                          Panel de Control
                        </Link>
                      )}
                    </div>

                    {favoriteRadio && (
                      <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50">
                        <div className="mb-2 flex items-center gap-2 px-2">
                          <Heart className="h-3 w-3 fill-current text-red-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#a1acb8]">Favorita</span>
                        </div>
                        <button
                          onClick={() => {
                            navigate(getRadioPath(favoriteRadio))
                            setIsProfileOpen(false)
                          }}
                          className={cn('focusable group/fav flex w-full items-center gap-3 rounded-lg p-2 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800', isTV && 'p-3')}
                        >
                          <img
                            src={favoriteRadio.logo_url}
                            alt={favoriteRadio.name}
                            className="h-10 w-10 rounded-lg border border-white object-cover shadow-sm dark:border-slate-700"
                          />
                          <div className="min-w-0 text-left">
                            <p className={cn('truncate font-bold text-[#566a7f] group-hover/fav:text-[#696cff] dark:text-white', isTV ? 'text-sm' : 'text-xs')}>
                              {favoriteRadio.name}
                            </p>
                            <p className={cn('font-medium text-[#a1acb8]', isTV ? 'text-xs' : 'text-[10px]')}>{favoriteRadio.frequency}</p>
                          </div>
                          <Play className="ml-auto h-4 w-4 text-[#696cff] opacity-0 transition-opacity group-hover/fav:opacity-100" />
                        </button>
                      </div>
                    )}

                    {latestRadios.length > 0 && (
                      <div className="mt-2 border-t border-gray-50 pt-3 dark:border-gray-800">
                        <div className="mb-2 flex items-center gap-2 px-4">
                          <Sparkles className="h-3 w-3 text-[#696cff]" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#a1acb8]">Recién llegadas</span>
                        </div>
                        <div className="space-y-1 px-2">
                          {latestRadios.map((radio) => (
                            <button
                              key={radio.id}
                              onClick={() => {
                                navigate(getRadioPath(radio))
                                setIsProfileOpen(false)
                              }}
                              className={cn('focusable group/item flex w-full items-center gap-3 rounded-lg p-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50', isTV && 'p-3')}
                            >
                              <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md border border-gray-100 dark:border-gray-700">
                                {radio.logo_url ? (
                                  <img src={radio.logo_url} alt={radio.name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                                    <Radio className="h-4 w-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 text-left">
                                <p className={cn('truncate font-bold text-[#566a7f] group-hover/item:text-[#696cff] dark:text-gray-300', isTV ? 'text-sm' : 'text-[11px]')}>
                                  {radio.name}
                                </p>
                                <p className={cn('font-medium text-[#a1acb8]', isTV ? 'text-xs' : 'text-[9px]')}>{radio.frequency}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="my-2 h-px bg-gray-100 dark:bg-gray-800" />

                    <button onClick={handleLogout} className={cn('focusable flex w-full items-center gap-3 rounded-lg px-4 py-2.5 font-bold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-500/10', isTV ? 'py-3 text-base' : 'text-sm')}>
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className={cn('focusable inline-flex items-center justify-center rounded-xl bg-[#696cff] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#696cff]/20 transition-all hover:bg-[#5f61e6] active:scale-95', isTV && 'rounded-2xl px-6 py-3 text-base')}>
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
          <div className="fixed inset-0 z-50 min-h-screen overflow-y-auto bg-white shadow-2xl dark:bg-slate-950 md:hidden" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#696cff] shadow-lg shadow-[#696cff]/20">
                  <img src={appLogo} alt="Logo" className="h-7 w-7 object-contain brightness-0 invert" />
                </div>
                <div>
                  <p className="font-bold leading-tight text-[#566a7f] dark:text-white">{appTitle}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a1acb8]">Navegación</p>
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
                className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 text-left text-sm font-bold text-[#566a7f] transition hover:border-[#696cff]/30 hover:bg-[#696cff]/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                {isDark ? <Sun className="h-5 w-5 text-[#696cff]" /> : <Moon className="h-5 w-5 text-[#696cff]" />}
                <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
              </button>

              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 text-sm font-bold text-[#566a7f] transition hover:border-[#696cff]/30 hover:bg-[#696cff]/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                <Home className="h-5 w-5 text-[#696cff]" />
                <span>Inicio</span>
              </Link>

              {user && (
                <Link to="/library" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 text-sm font-bold text-[#566a7f] transition hover:border-[#696cff]/30 hover:bg-[#696cff]/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                  <Library className="h-5 w-5 text-[#696cff]" />
                  <span>Mi Biblioteca</span>
                </Link>
              )}

              {(userRole === 'radio_admin' || userRole === 'super_admin') && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 text-sm font-bold text-[#566a7f] transition hover:border-[#696cff]/30 hover:bg-[#696cff]/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                  <Settings className="h-5 w-5 text-[#696cff]" />
                  <span>Panel de Control</span>
                </Link>
              )}

              {!user ? (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-3 rounded-2xl bg-[#696cff] px-4 py-3 text-center text-sm font-bold text-white shadow-md shadow-[#696cff]/20 transition hover:bg-[#5f61e6]">
                  <User className="h-5 w-5" />
                  <span>Ingresar</span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    void handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800"
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
