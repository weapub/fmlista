import React, { useEffect, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { useDeviceStore } from '@/stores/deviceStore'
import { useAuthStore } from '@/stores/authStore'
import { ROLES } from '@/types/auth'

const RadioMicrosite = React.lazy(() => import('@/pages/RadioMicrosite'));
const PlansPage = React.lazy(() => import('@/pages/PlansPage').then(m => ({ default: m.PlansPage })));
const Login = React.lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const AdminPanel = React.lazy(() => import('@/pages/AdminPanel'));
const BillingManagement = React.lazy(() => import('@/pages/admin/BillingManagement').then(m => ({ default: m.BillingManagement })));
const AdminPlans = React.lazy(() => import('@/pages/AdminPlans'));
const AdsManager = React.lazy(() => import('@/pages/AdsManager'));
const ProfileEditor = React.lazy(() => import('@/pages/ProfileEditor'));
const ScheduleManager = React.lazy(() => import('@/pages/ScheduleManager'));
const UserLibrary = React.lazy(() => import('@/pages/UserLibrary'));
const AppSettings = React.lazy(() => import('@/pages/AppSettings'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#696cff]"></div>
  </div>
);

// Componente para proteger rutas exclusivas de Super Admin
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuthStore();

  // Mientras carga la sesión, mostramos el loader
  if (isLoading) {
    return <PageLoader />;
  }

  // Si no hay usuario o el rol no es 'super_admin', redirigimos al login
  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

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
          <Route 
            path="/admin/billing" 
            element={
              <AdminRoute>
                <BillingManagement />
              </AdminRoute>
            } 
          />
          <Route path="/admin/planes" element={<AdminPlans />} />
          <Route path="/admin/anuncios" element={<AdsManager />} />
          <Route path="/admin/anuncios/:radioId" element={<AdsManager />} />
          <Route path="/admin/profile/:id" element={<ProfileEditor />} />
          <Route path="/admin/profile/new" element={<ProfileEditor />} />
          <Route path="/admin/schedule/:id" element={<ScheduleManager />} />
          <Route path="/admin/settings" element={<AppSettings />} />
          <Route path="/library" element={<UserLibrary />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  )
}
