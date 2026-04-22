import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const PageLoader = () => (
  <div className="min-h-screen bg-[#f5f5f9] flex items-center justify-center transition-colors dark:bg-slate-950">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#696cff]" />
  </div>
)

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: string[]
}) {
  const { user, isLoading, checkSession } = useAuthStore()

  useEffect(() => {
    if (!user && !isLoading) {
      void checkSession()
    }
  }, [user, isLoading, checkSession])

  if (isLoading) {
    return <PageLoader />
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
