import { NavLink } from 'react-router-dom'
import { Home, Users, FileText, Settings, MessageSquare } from 'react-feather'

export default function Sidebar() {
  const navItems = [
    { icon: <Home size={20} />, label: 'Dashboard', to: '/' },
    { icon: <Home size={20} />, label: 'Biens', to: '/properties' },
    { icon: <Users size={20} />, label: 'Clients', to: '/clients' },
    { icon: <FileText size={20} />, label: 'Documents', to: '/documents' },
    { icon: <MessageSquare size={20} />, label: 'Messages', to: '/messages' },
    { icon: <Settings size={20} />, label: 'Paramètres', to: '/settings' },
  ]

  return (
    <aside className="w-64 h-full glass-card p-4 flex flex-col">
      <div className="mb-8 p-4">
        <h1 className="text-xl font-semibold text-text">CRM Immobilier</h1>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => 
                  `flex items-center p-3 rounded-lg transition-colors ${isActive 
                    ? 'bg-accent/20 text-text' 
                    : 'hover:bg-accent/10 text-text/80'}`
                }
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}