import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const tabs = [
  { to: '/vault', icon: '🔐', label: 'Vault' },
  { to: '/expenses', icon: '💳', label: 'Expenses' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar() {
  const { user } = useAuth()

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark" style={{ margin: 0, width: 38, height: 38, fontSize: 18, borderRadius: 10 }}>🔐</div>
        <span className="display">Vault</span>
      </div>
      <div className="sidebar-links">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
      {user && <div className="sidebar-footer">{user.email}</div>}
    </nav>
  )
}
