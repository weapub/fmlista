import React, { Suspense, useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { useDeviceStore } from '@/stores/deviceStore'
import { useTheme } from '@/hooks/useTheme'
import { ROLES } from '@/types/auth'
import { shouldRenderMicrositeAtRoot } from '@/lib/microsites'

const RadioMicrosite = React.lazy(() => import('@/pages/RadioMicrosite'))
const PlansPage = React.lazy(() => import('@/pages/PlansPage').then((m) => ({ default: m.PlansPage })))
const Login = React.lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })))
const AdminPanel = React.lazy(() => import('@/pages/AdminPanel'))
const BillingManagement = React.lazy(() => import('@/pages/admin/BillingManagement').then((m) => ({ default: m.BillingManagement })))
const RadioCatalog = React.lazy(() => import('@/pages/admin/RadioCatalog'))
const AdminPlans = React.lazy(() => import('@/pages/AdminPlans'))
const UserManagement = React.lazy(() => import('@/pages/admin/UserManagement').then((m) => ({ default: m.UserManagement })))
const PaymentHistory = React.lazy(() => import('@/pages/admin/PaymentHistory').then((m) => ({ default: m.PaymentHistory })))
const AdsManager = React.lazy(() => import('@/pages/AdsManager'))
const ProfileEditor = React.lazy(() => import('@/pages/ProfileEditor'))
const ScheduleManager = React.lazy(() => import('@/pages/ScheduleManager'))
const UserLibrary = React.lazy(() => import('@/pages/UserLibrary'))
const AppSettings = React.lazy(() => import('@/pages/AppSettings'))
const PrivacyPolicy = React.lazy(() => import('@/pages/PrivacyPolicy'))
const TermsAndConditions = React.lazy(() => import('@/pages/TermsAndConditions'))
const Blog = React.lazy(() => import('@/pages/Blog'))
const BlogArticlePage = React.lazy(() => import('@/pages/BlogArticlePage'))
const NotFound = React.lazy(() => import('@/pages/NotFound'))
const ProtectedRoute = React.lazy(() => import('@/components/ProtectedRoute'))
const AuthSessionBootstrap = React.lazy(() => import('@/components/AuthSessionBootstrap'))

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

const ScrollNavigationManager = () => {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (hash) {
      const targetId = hash.replace('#', '')
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [pathname, search, hash])

  return null
}

export default function App() {
  const checkDevice = useDeviceStore((state) => state.checkDevice)
  const [shouldInitAuth, setShouldInitAuth] = useState(false)

  useEffect(() => {
    checkDevice()
  }, [checkDevice])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let initialized = false
    const initializeAuth = () => {
      if (initialized) return
      initialized = true
      detachInteractionListeners()
      setShouldInitAuth(true)
    }

    const interactionEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart']
    const onFirstInteraction = () => initializeAuth()
    const detachInteractionListeners = () => {
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, onFirstInteraction)
      })
    }

    const currentUrl = new URL(window.location.href)
    const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ''))
    const hasOAuthCallbackParams =
      currentUrl.searchParams.has('code') ||
      currentUrl.searchParams.has('error') ||
      currentUrl.searchParams.has('error_description') ||
      hashParams.has('access_token') ||
      hashParams.has('refresh_token') ||
      hashParams.has('error') ||
      hashParams.has('error_description')

    if (hasOAuthCallbackParams) {
      initializeAuth()
      return () => {
        detachInteractionListeners()
      }
    }

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, onFirstInteraction, { once: true, passive: true })
    })

    const timeoutId = window.setTimeout(initializeAuth, 15000)

    return () => {
      window.clearTimeout(timeoutId)
      detachInteractionListeners()
    }
  }, [])

  return (
    <Router>
      <ThemeBootstrap />
      <ScrollNavigationManager />
      {shouldInitAuth && (
        <Suspense fallback={null}>
          <AuthSessionBootstrap />
        </Suspense>
      )}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeOrMicrosite />} />
          <Route path="/radio/:id" element={<RadioMicrosite />} />
          <Route path="/planes" element={<PlansPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogArticlePage />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          <Route path="/terminos" element={<TermsAndConditions />} />
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
            path="/admin/catalogo"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <RadioCatalog />
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
          <Route path="/:slug" element={<RadioMicrosite />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  )
}
