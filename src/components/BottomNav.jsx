import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/vault', icon: '🔐', label: 'Vault' },
  { to: '/expenses', icon: '💳', label: 'Expenses' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
