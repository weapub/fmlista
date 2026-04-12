import React, { useEffect, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { useDeviceStore } from '@/stores/deviceStore'

const RadioMicrosite = React.lazy(() => import('@/pages/RadioMicrosite'));
const PlansPage = React.lazy(() => import('@/pages/PlansPage').then(m => ({ default: m.PlansPage })));
const Login = React.lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const AdminPanel = React.lazy(() => import('@/pages/AdminPanel'));
const ProfileEditor = React.lazy(() => import('@/pages/ProfileEditor'));
const ScheduleManager = React.lazy(() => import('@/pages/ScheduleManager'));

const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
  </div>
);

export default function App() {
  const checkDevice = useDeviceStore((state) => state.checkDevice)

  useEffect(() => {
    checkDevice()
  }, [checkDevice])

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/radio/:id" element={<RadioMicrosite />} />
          <Route path="/planes" element={<PlansPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/profile/:id" element={<ProfileEditor />} />
          <Route path="/admin/profile/new" element={<ProfileEditor />} />
          <Route path="/admin/schedule/:id" element={<ScheduleManager />} />
        </Routes>
      </Suspense>
    </Router>
  )
}
