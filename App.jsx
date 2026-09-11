import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { VaultProvider, useVault } from './context/VaultContext'
import { ThemeProvider } from './context/ThemeContext'
import Auth from './pages/Auth'
import Unlock from './pages/Unlock'
import Vault from './pages/Vault'
import Expenses from './pages/Expenses'
import Loans from './pages/Loans'
import Settings from './pages/Settings'
import BottomNav from './components/BottomNav'
import Sidebar from './components/Sidebar'
import './styles/tokens.css'
import './styles/app.css'

function Gate() {
  const { user, loading } = useAuth()
  const { isUnlocked } = useVault()

  if (loading) return <div className="center-screen"><p className="sub">Loading…</p></div>
  if (!user) return <Auth />
  if (!isUnlocked) return <Unlock />

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Routes>
          <Route path="/vault" element={<Vault />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/vault" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <VaultProvider>
          <HashRouter>
            <div className="app-shell">
              <Gate />
            </div>
          </HashRouter>
        </VaultProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
