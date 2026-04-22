import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export default function AuthSessionBootstrap() {
  const checkSession = useAuthStore((state) => state.checkSession)
  const syncSession = useAuthStore((state) => state.syncSession)

  useEffect(() => {
    let mounted = true
    let unsubscribe: (() => void) | undefined

    const boot = async () => {
      await checkSession()
      if (!mounted) return

      const { supabase } = await import('@/lib/supabase')
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        window.setTimeout(() => {
          void syncSession(session)
        }, 0)
      })

      unsubscribe = () => subscription.unsubscribe()
    }

    void boot()

    return () => {
      mounted = false
      unsubscribe?.()
    }
  }, [checkSession, syncSession])

  return null
}
