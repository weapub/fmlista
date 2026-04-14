import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Radio, Mail, Lock, User, LogIn, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { ROLES, UserRole } from '@/types/auth'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { signIn, signUp, user, isLoading, error, clearError, checkSession } = useAuthStore()
  
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: ROLES.LISTENER as UserRole
  })
  
  useEffect(() => {
    checkSession()
  }, [checkSession])
  
  useEffect(() => {
    if (user) {
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
    } catch (error) {
      console.error('Authentication error:', error)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) clearError()
  }
  
  const toggleMode = () => {
    setIsLogin(!isLogin)
    clearError()
  }
  
  return (
    <div className="min-h-screen bg-[#f5f5f9] relative overflow-hidden flex items-center justify-center px-4">
      {/* Acentos de fondo estilo Startup */}
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
            <h1 className="text-3xl font-black text-[#566a7f] tracking-tighter">Radio<span className="text-[#696cff]">Hub</span></h1>
          </div>
          <p className="text-[#a1acb8] font-medium">
            {isLogin ? 'Bienvenido, por favor ingresa a tu cuenta' : 'Únete a la red de radios más grande'}
          </p>
        </div>
        
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-[#696cff]/10 border border-white p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-black text-[#566a7f] uppercase tracking-widest mb-2 ml-1">
                Correo electrónico
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
                Contraseña
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
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            {!isLogin && (
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
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}
            
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
              {isLogin 
                ? '¿No tienes una cuenta? Regístrate aquí' 
                : '¿Ya tienes una cuenta? Ingresa aquí'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
