import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AudioPlayer } from '@/components/AudioPlayer'
import { PWAPrompt } from '@/components/PWAPrompt'
import { useDeviceStore } from '@/stores/deviceStore'

// Lazy load pages
const Home = lazy(() => import('@/pages/Home').then(module => ({ default: module.Home })))
const PlansPage = lazy(() => import('@/pages/PlansPage').then(module => ({ default: module.PlansPage })))
const UserLibrary = lazy(() => import('@/pages/UserLibrary'))
const RadioMicrosite = lazy(() => import('@/pages/RadioMicrosite').then(module => ({ default: module.RadioMicrosite })))
const Login = lazy(() => import('@/pages/Login').then(module => ({ default: module.Login })))
const AdminPanel = lazy(() => import('@/pages/AdminPanel'))
const ProfileEditor = lazy(() => import('@/pages/ProfileEditor'))
const ScheduleManager = lazy(() => import('@/pages/ScheduleManager'))
const AdsManager = lazy(() => import('@/pages/AdsManager'))
const RadioAnalytics = lazy(() => import('@/pages/RadioAnalytics'))
const AppSettings = lazy(() => import('@/pages/AppSettings'))

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
)

export default function App() {
  const { checkDevice } = useDeviceStore()

  useEffect(() => {
    checkDevice()
  }, [checkDevice])

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/planes" element={<PlansPage />} />
          <Route path="/library" element={<UserLibrary />} />
          <Route path="/radio/:id" element={<RadioMicrosite />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/profile/:id" element={<ProfileEditor />} />
          <Route path="/admin/profile/new" element={<ProfileEditor />} />
          <Route path="/admin/schedule/:id" element={<ScheduleManager />} />
          <Route path="/admin/ads" element={<AdsManager />} />
          <Route path="/admin/ads/:radioId" element={<AdsManager />} />
          <Route path="/admin/analytics/:id" element={<RadioAnalytics />} />
          <Route path="/admin/settings" element={<AppSettings />} />
          {/* Route for vanity URLs (slugs) - Must be last to avoid conflicts */}
          <Route path="/:idOrSlug" element={<RadioMicrosite />} />
        </Routes>
      </Suspense>
      <AudioPlayer />
      <PWAPrompt />
    </Router>
  )
}