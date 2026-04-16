import React, { Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { useDeviceStore } from '@/stores/deviceStore'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/hooks/useTheme'
import { ROLES } from '@/types/auth'
import { shouldRenderMicrositeAtRoot } from '@/lib/microsites'
import { supabase } from '@/lib/supabase'

const RadioMicrosite = React.lazy(() => import('@/pages/RadioMicrosite'))
const PlansPage = React.lazy(() => import('@/pages/PlansPage').then((m) => ({ default: m.PlansPage })))
const Login = React.lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })))
const AdminPanel = React.lazy(() => import('@/pages/AdminPanel'))
const BillingManagement = React.lazy(() => import('@/pages/admin/BillingManagement').then((m) => ({ default: m.BillingManagement })))
const AdminPlans = React.lazy(() => import('@/pages/AdminPlans'))
const UserManagement = React.lazy(() => import('@/pages/admin/UserManagement').then((m) => ({ default: m.UserManagement })))
const PaymentHistory = React.lazy(() => import('@/pages/admin/PaymentHistory').then((m) => ({ default: m.PaymentHistory })))
const AdsManager = React.lazy(() => import('@/pages/AdsManager'))
const ProfileEditor = React.lazy(() => import('@/pages/ProfileEditor'))
const ScheduleManager = React.lazy(() => import('@/pages/ScheduleManager'))
const UserLibrary = React.lazy(() => import('@/pages/UserLibrary'))
const AppSettings = React.lazy(() => import('@/pages/AppSettings'))
const NotFound = React.lazy(() => import('@/pages/NotFound'))

const PageLoader = () => (
  <div className="min-h-screen bg-[#f5f5f9] flex items-center justify-center transition-colors dark:bg-slate-950">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#696cff]" />
  </div>
)

const ThemeBootstrap = () => {
  useTheme()
  return null
}

const HomeOrMicrosite = () => {
  if (typeof window !== 'undefined' && shouldRenderMicrositeAtRoot()) {
    return <RadioMicrosite />
  }

  return <Home />
}

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: string[]
}) => {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <PageLoader />
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  const checkDevice = useDeviceStore((state) => state.checkDevice)
  const checkSession = useAuthStore((state) => state.checkSession)

  useEffect(() => {
    checkDevice()
  }, [checkDevice])

  useEffect(() => {
    void checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void checkSession()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [checkSession])

  return (
    <Router>
      <ThemeBootstrap />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeOrMicrosite />} />
          <Route path="/radio/:id" element={<RadioMicrosite />} />
          <Route path="/:slug" element={<RadioMicrosite />} />
          <Route path="/planes" element={<PlansPage />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[ROLES.RADIO_ADMIN, ROLES.SUPER_ADMIN]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/billing"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <BillingManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRoles={[ROLES.RADIO_ADMIN, ROLES.SUPER_ADMIN]}>
                <PaymentHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/planes"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <AdminPlans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/anuncios"
            element={
              <ProtectedRoute allowedRoles={[ROLES.RADIO_ADMIN, ROLES.SUPER_ADMIN]}>
                <AdsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/anuncios/:radioId"
            element={
              <ProtectedRoute allowedRoles={[ROLES.RADIO_ADMIN, ROLES.SUPER_ADMIN]}>
                <AdsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile/:id"
            element={
              <ProtectedRoute allowedRoles={[ROLES.RADIO_ADMIN, ROLES.SUPER_ADMIN]}>
                <ProfileEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile/new"
            element={
              <ProtectedRoute allowedRoles={[ROLES.RADIO_ADMIN, ROLES.SUPER_ADMIN]}>
                <ProfileEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/schedule/:id"
            element={
              <ProtectedRoute allowedRoles={[ROLES.RADIO_ADMIN, ROLES.SUPER_ADMIN]}>
                <ScheduleManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <AppSettings />
              </ProtectedRoute>
            }
          />
          <Route path="/library" element={<UserLibrary />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  )
}
