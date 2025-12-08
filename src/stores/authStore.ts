import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  role: 'listener' | 'radio_admin'
}

interface AuthStore {
  user: User | null
  isLoading: boolean
  error: string | null
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, role?: 'listener' | 'radio_admin') => Promise<void>
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  
  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.user) {
        // Get user role from our users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('email', email)
          .single()
        
        if (userError) throw userError
        
        set({ 
          user: userData,
          isLoading: false 
        })
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al iniciar sesión',
        isLoading: false 
      })
      throw error
    }
  },
  
  signUp: async (email: string, password: string, role: 'listener' | 'radio_admin' = 'listener') => {
    try {
      set({ isLoading: true, error: null })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.user) {
        // Create user in our users table
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email,
              password_hash: 'temp_hash', // In a real app, you'd handle this properly
              role
            }
          ])
        
        if (insertError) throw insertError
        
        set({ 
          user: { id: data.user.id, email, role },
          isLoading: false 
        })
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al registrarse',
        isLoading: false 
      })
      throw error
    }
  },
  
  signOut: async () => {
    try {
      set({ isLoading: true })
      
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      set({ 
        user: null,
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al cerrar sesión',
        isLoading: false 
      })
      throw error
    }
  },
  
  checkSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Get user role from our users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', session.user.id)
          .single()
        
        if (!error && userData) {
          set({ user: userData })
        }
      }
    } catch (error) {
      console.error('Error checking session:', error)
    }
  },
  
  clearError: () => set({ error: null })
}))