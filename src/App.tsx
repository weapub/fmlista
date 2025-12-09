import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { RadioMicrosite } from '@/pages/RadioMicrosite'
import { Login } from '@/pages/Login'
import AdminPanel from '@/pages/AdminPanel'
import ProfileEditor from '@/pages/ProfileEditor'
import ScheduleManager from '@/pages/ScheduleManager'
import AdsManager from '@/pages/AdsManager'
import AppSettings from '@/pages/AppSettings'
import RadioAnalytics from '@/pages/RadioAnalytics'
import { PlansPage } from '@/pages/PlansPage'
import { AudioPlayer } from '@/components/AudioPlayer'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/planes" element={<PlansPage />} />
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
      <AudioPlayer />
    </Router>
  )
}