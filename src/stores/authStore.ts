import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  role: 'listener' | 'radio_admin' | 'super_admin'
}

interface AuthStore {
  user: User | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, role?: 'listener' | 'radio_admin') => Promise<void>
  signInWithGoogle: (roleHint?: 'listener' | 'radio_admin') => Promise<void>
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
  syncSession: (session: Session | null) => Promise<void>
  clearError: () => void
}

interface OAuthCallbackParams {
  accessToken: string | null
  code: string | null
  oauthErrorDescription: string | null
  refreshToken: string | null
}

const GOOGLE_ROLE_KEY = 'google_oauth_role_hint'
const OAUTH_ERROR_KEY = 'google_oauth_error'

const mapAuthError = (error: unknown, mode: 'signIn' | 'signUp' | 'signOut' | 'oauth') => {
  const fallback =
    mode === 'signIn'
      ? 'No pudimos iniciar sesion.'
      : mode === 'signUp'
        ? 'No pudimos completar el registro.'
        : mode === 'oauth'
          ? 'No pudimos iniciar con Google.'
          : 'No pudimos cerrar la sesion.'

  const message = error instanceof Error ? error.message : fallback

  if (message === 'Email not confirmed') {
    return 'Tu correo todavia no fue confirmado. Revisa tu bandeja de entrada o desactiva la confirmacion de email para pruebas.'
  }

  if (message === 'Invalid login credentials') {
    return 'El correo o la contrasena no coinciden.'
  }

  if (message.includes('Email address') && message.includes('is invalid')) {
    return 'El correo ingresado no es valido para este proyecto. Prueba con una direccion real, por ejemplo Gmail.'
  }

  if (message.includes('User already registered')) {
    return 'Ese correo ya esta registrado. Prueba iniciar sesion o recuperar el acceso.'
  }

  return message || fallback
}

const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

const getGoogleRoleHint = (): 'listener' | 'radio_admin' => {
  if (typeof window === 'undefined') return 'listener'
  const storedRole = window.localStorage.getItem(GOOGLE_ROLE_KEY)
  if (storedRole === 'radio_admin') return 'radio_admin'
  return 'listener'
}

const clearGoogleRoleHint = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(GOOGLE_ROLE_KEY)
}

const setOAuthError = (message: string) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(OAUTH_ERROR_KEY, message)
}

const consumeOAuthError = () => {
  if (typeof window === 'undefined') return null
  const message = window.localStorage.getItem(OAUTH_ERROR_KEY)
  if (message) {
    window.localStorage.removeItem(OAUTH_ERROR_KEY)
  }
  return message
}

const replaceBrowserUrl = (url: URL) => {
  if (typeof window === 'undefined') return
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`)
}

const readOAuthCallbackParams = (url: URL): OAuthCallbackParams => {
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))

  return {
    accessToken: hashParams.get('access_token'),
    code: url.searchParams.get('code'),
    oauthErrorDescription:
      url.searchParams.get('error_description') ||
      url.searchParams.get('error') ||
      hashParams.get('error_description') ||
      hashParams.get('error'),
    refreshToken: hashParams.get('refresh_token'),
  }
}

const buildFallbackUser = (
  authUser: { id: string; email?: string | null },
  fallbackRole: 'listener' | 'radio_admin' = 'listener'
): User => ({
  id: authUser.id,
  email: authUser.email ?? '',
  role: fallbackRole,
})

const shouldPromoteRole = (
  currentRole: User['role'],
  desiredRole: 'listener' | 'radio_admin'
) => {
  return currentRole === 'listener' && desiredRole === 'radio_admin'
}

const ensureUserProfile = async (
  authUser: { id: string; email?: string | null },
  fallbackRole: 'listener' | 'radio_admin' = 'listener'
) => {
  try {
    const profile = await fetchUserProfile(authUser.id)

    if (shouldPromoteRole(profile.role, fallbackRole)) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: fallbackRole })
        .eq('id', authUser.id)

      if (!updateError) {
        return await fetchUserProfile(authUser.id)
      }

      console.warn('Could not promote OAuth user role after login:', updateError)
    }

    return profile
  } catch (profileError) {
    const email = authUser.email ?? ''
    const { error: upsertError } = await supabase
      .from('users')
      .upsert(
        {
          id: authUser.id,
          email,
          role: fallbackRole,
        },
        { onConflict: 'id' }
      )

    if (upsertError) {
      throw upsertError
    }

    return await fetchUserProfile(authUser.id)
  }
}

const resolveSessionUser = async (
  session: Session | null
): Promise<{ user: User | null; error: string | null }> => {
  if (!session?.user) {
    return { user: null, error: consumeOAuthError() }
  }

  try {
    const userData = await ensureUserProfile(session.user, getGoogleRoleHint())
    clearGoogleRoleHint()
    return { user: userData, error: null }
  } catch (error) {
    console.error('Error loading user profile from session:', error)
    const fallbackRole = getGoogleRoleHint()
    clearGoogleRoleHint()
    return {
      user: buildFallbackUser(session.user, fallbackRole),
      error: consumeOAuthError(),
    }
  }
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
        const userData = await ensureUserProfile(data.user)
        set({
          user: userData,
          isLoading: false,
        })
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      set({
        error: mapAuthError(error, 'signIn'),
        isLoading: false,
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
        let profile: User | null = null
        try {
          profile = await ensureUserProfile(data.user, role)
        } catch (profileError) {
          console.warn('User profile sync after signup failed, trying to recover:', profileError)
        }

        set({
          user: profile ?? { id: data.user.id, email, role },
          isLoading: false,
        })
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      set({
        error: mapAuthError(error, 'signUp'),
        isLoading: false,
      })
      throw error
    }
  },

  signInWithGoogle: async (roleHint: 'listener' | 'radio_admin' = 'listener') => {
    try {
      set({ isLoading: true, error: null })

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(GOOGLE_ROLE_KEY, roleHint)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      })

      if (error) throw error
    } catch (error) {
      clearGoogleRoleHint()
      set({
        error: mapAuthError(error, 'oauth'),
        isLoading: false,
      })
      throw error
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true })

      const { error } = await supabase.auth.signOut()

      if (error) throw error

      clearGoogleRoleHint()
      set({
        user: null,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: mapAuthError(error, 'signOut'),
        isLoading: false,
      })
      throw error
    }
  },

  syncSession: async (session: Session | null) => {
    try {
      set({ isLoading: true, error: null })
      const resolved = await resolveSessionUser(session)
      set({
        user: resolved.user,
        error: resolved.error,
        isLoading: false,
      })
    } catch (error) {
      console.error('Error syncing auth session:', error)
      set({
        error: mapAuthError(error, 'oauth'),
        isLoading: false,
      })
    }
  },

  checkSession: async () => {
    try {
      set({ isLoading: true })

      if (typeof window !== 'undefined') {
        const currentUrl = new URL(window.location.href)
        const { accessToken, code, oauthErrorDescription, refreshToken } = readOAuthCallbackParams(currentUrl)

        if (oauthErrorDescription) {
          const mappedError = mapAuthError(new Error(oauthErrorDescription), 'oauth')
          currentUrl.searchParams.delete('error')
          currentUrl.searchParams.delete('error_description')
          currentUrl.hash = ''
          replaceBrowserUrl(currentUrl)
          clearGoogleRoleHint()
          set({ error: mappedError, isLoading: false })
          return
        }

        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          currentUrl.hash = ''
          replaceBrowserUrl(currentUrl)

          if (setSessionError) {
            const mappedError = mapAuthError(setSessionError, 'oauth')
            clearGoogleRoleHint()
            setOAuthError(mappedError)
            set({ error: mappedError, isLoading: false })
            return
          }
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          currentUrl.searchParams.delete('code')
          replaceBrowserUrl(currentUrl)

          if (exchangeError) {
            const mappedError = mapAuthError(exchangeError, 'oauth')
            clearGoogleRoleHint()
            setOAuthError(mappedError)
            set({ error: mappedError, isLoading: false })
            return
          }
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const resolved = await resolveSessionUser(session)
      set({
        user: resolved.user,
        error: resolved.error,
        isLoading: false,
      })
    } catch (error) {
      console.error('Error checking session:', error)
      set({
        error: mapAuthError(error, 'oauth'),
        isLoading: false,
      })
    }
  },

  clearError: () => set({ error: null }),
}))
