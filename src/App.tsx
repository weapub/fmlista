import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { RadioMicrosite } from '@/pages/RadioMicrosite'
import { Login } from '@/pages/Login'
import AdminPanel from '@/pages/AdminPanel'
import ProfileEditor from '@/pages/ProfileEditor'
import ScheduleManager from '@/pages/ScheduleManager'
import { AudioPlayer } from '@/components/AudioPlayer'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/radio/:id" element={<RadioMicrosite />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/profile/:id" element={<ProfileEditor />} />
        <Route path="/admin/profile/new" element={<ProfileEditor />} />
        <Route path="/admin/schedule/:id" element={<ScheduleManager />} />
      </Routes>
      <AudioPlayer />
    </Router>
  )
}