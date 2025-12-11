import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Radio, Mail, Lock, User, LogIn } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { signIn, signUp, user, isLoading, error, clearError, checkSession } = useAuthStore()
  
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'listener' as 'listener' | 'radio_admin'
  })
  
  useEffect(() => {
    checkSession()
  }, [checkSession])
  
  useEffect(() => {
    if (user) {
      if (user.role === 'radio_admin') {
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
      if (isLogin) {
        await signIn(formData.email, formData.password)
      } else {
        await signUp(formData.email, formData.password, formData.role)
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
    <div className="min-h-screen bg-gradient-to-br from-secondary-500 to-primary-600 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Radio className="w-12 h-12 text-white mr-3" />
            <h1 className="text-3xl font-bold text-white">FM Lista</h1>
          </div>
          <p className="text-secondary-100">
            {isLogin ? 'Ingresa a tu cuenta' : 'Crea una nueva cuenta'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500"
                  placeholder="tu@email.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            {!isLogin && (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500"
                  >
                    <option value="listener">Oyente</option>
                    <option value="radio_admin">Administrador de Radio</option>
                  </select>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" />
                  {isLogin ? 'Ingresar' : 'Registrarse'}
                </div>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-sm text-secondary-600 hover:text-secondary-500 font-medium"
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
