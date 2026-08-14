import { Routes, Route } from 'react-router-dom'
import MainApp from './pages/MainApp'
import VerifyListing from './pages/VerifyListing'

export default function App() {
  return (
    <Routes>
      {/* Public — no login required, reachable by scanning a listing's QR code */}
      <Route path="/verify/:stamp" element={<VerifyListing />} />
      {/* Everything else is the main app, gated by login inside MainApp */}
      <Route path="*" element={<MainApp />} />
    </Routes>
  )
}
