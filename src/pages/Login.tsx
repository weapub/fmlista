import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Radio, Mail, Lock, User, LogIn, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { ROLES, UserRole } from '@/types/auth'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 4 1.5l2.7-2.6C17 2.8 14.8 2 12 2 6.9 2 2.8 6.4 2.8 11.8S6.9 21.5 12 21.5c6.9 0 8.6-4.9 8.6-7.4 0-.5-.1-.8-.1-1.2H12z" />
    <path fill="#34A853" d="M2.8 11.8c0 5.4 4.1 9.7 9.2 9.7 2.8 0 5-1 6.6-2.8l-3.2-2.6c-.9.6-2 .9-3.4.9-3.2 0-5.8-2.2-6.7-5.2l-2.5 2c.7 1.5 2 3 3.4 4z" opacity=".001" />
    <path fill="#4A90E2" d="M20.6 10.6H12v3.5h4.9c-.4 2-2.1 3.5-4.9 3.5-3 0-5.6-2-6.4-4.8l-2.7 2.1c1.6 3.1 4.8 5.2 9.1 5.2 5.2 0 8.7-3.6 8.7-8.7 0-.6 0-1.1-.1-1.5z" />
    <path fill="#FBBC05" d="M5.6 13.2c-.2-.5-.3-1-.3-1.5s.1-1 .3-1.5L2.9 8.1C2.2 9.4 1.8 10.6 1.8 11.8c0 1.7.4 3.3 1.1 4.7l2.7-3.3z" />
    <path fill="#34A853" d="M12 5.8c1.7 0 3.2.6 4.3 1.7l3.1-3.1C17.5 2.5 15 1.5 12 1.5 7.7 1.5 4.5 3.9 2.9 7.4l2.7 2.1c.8-2.8 3.4-4.8 6.4-4.8z" />
  </svg>
)

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { signIn, signUp, signInWithGoogle, user, isLoading, error, clearError } = useAuthStore()

  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: ROLES.LISTENER as UserRole,
  })

  useEffect(() => {
    if (user) {
      if (typeof window !== 'undefined') {
        const oauthRedirectHint = window.localStorage.getItem('google_oauth_redirect_hint')
        if (oauthRedirectHint) {
          window.localStorage.removeItem('google_oauth_redirect_hint')
          navigate(oauthRedirectHint)
          return
        }
      }

      if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.RADIO_ADMIN) {
        navigate('/admin')
      } else {
        navigate('/')
      }
    }
  }, [user, navigate])

  useEffect(() => {
    return () => {
      clearError()
    }
  }, [clearError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      clearError()
      if (isLogin) {
        await signIn(formData.email, formData.password)
      } else {
        await signUp(formData.email, formData.password, formData.role as 'listener' | 'radio_admin')
      }
    } catch (authError) {
      console.error('Authentication error:', authError)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    if (error) clearError()
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    clearError()
  }

  const handleGoogleAuth = async () => {
    try {
      clearError()
      await signInWithGoogle(formData.role as 'listener' | 'radio_admin')
    } catch (authError) {
      console.error('Google authentication error:', authError)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f9] relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#696cff]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#a1acb8] hover:text-[#696cff] transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver al inicio
        </Link>

        <div className="text-center mb-10">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="w-16 h-16 bg-[#696cff] rounded-2xl flex items-center justify-center shadow-xl shadow-[#696cff]/30 mb-4">
              <Radio className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-[#566a7f] tracking-tighter">
              Radio<span className="text-[#696cff]">Hub</span>
            </h1>
          </div>
          <p className="text-[#a1acb8] font-medium">
            {isLogin ? 'Bienvenido, por favor ingresa a tu cuenta' : 'Unete a la red de radios mas grande'}
          </p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-[#696cff]/10 border border-white p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-black text-[#566a7f] uppercase tracking-widest mb-2 ml-1">
                Correo electronico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-gray-100 rounded-xl text-[#566a7f] placeholder:text-[#a1acb8] focus:bg-white focus:ring-4 focus:ring-[#696cff]/10 focus:border-[#696cff] transition-all outline-none font-medium"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-black text-[#566a7f] uppercase tracking-widest mb-2 ml-1">
                Contrasena
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-gray-100 rounded-xl text-[#566a7f] placeholder:text-[#a1acb8] focus:bg-white focus:ring-4 focus:ring-[#696cff]/10 focus:border-[#696cff] transition-all outline-none font-medium"
                  placeholder="********"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-xs font-black text-[#566a7f] uppercase tracking-widest mb-2 ml-1">
                Tipo de cuenta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-gray-100 rounded-xl text-[#566a7f] focus:bg-white focus:ring-4 focus:ring-[#696cff]/10 focus:border-[#696cff] transition-all outline-none font-bold appearance-none"
                >
                  <option value="listener">Oyente</option>
                  <option value="radio_admin">Administrador de Radio</option>
                </select>
              </div>
              <p className="mt-2 ml-1 text-xs text-[#a1acb8]">
                Con Google usaremos este tipo de cuenta si es tu primer acceso o si tu perfil todavia figura como oyente.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-3 py-4 px-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-[#566a7f] font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              <span>{isLogin ? 'Continuar con Google' : 'Registrarse con Google'}</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-white px-3 text-[#a1acb8] font-bold">o sigue con email</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-[#696cff] hover:bg-[#5f61e6] shadow-[#696cff]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="h-5 w-5 mr-2" />
                  {isLogin ? 'Ingresar' : 'Registrarse'}
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-sm text-[#696cff] hover:text-[#5f61e6] font-bold transition-colors"
            >
              {isLogin ? 'No tienes una cuenta? Registrate aqui' : 'Ya tienes una cuenta? Ingresa aqui'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
