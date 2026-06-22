import { NavLink, useLocation } from 'react-router-dom'
import { Activity, Home, Users, FileText, MessageSquare, Settings, ChevronLeft, Crosshair, CheckCircle, Calendar, BookOpen, Globe, Zap, DollarSign, Edit3 } from 'react-feather'
import { useState } from 'react'
import { getUnreadCount } from '../../types/messages'

const navItems = [
  { icon: Activity, label: 'Dashboard', to: '/' },
  { icon: Home, label: 'Biens', to: '/properties' },
  { icon: Users, label: 'Clients', to: '/clients' },
  { icon: Crosshair, label: 'Prospects', to: '/prospects' },
  { icon: CheckCircle, label: 'Contacts', to: '/contacts' },
  { icon: BookOpen, label: 'Registre', to: '/register' },
  { icon: Edit3, label: 'Contrats', to: '/contracts' },
  { icon: Globe, label: 'Extranet', to: '/extranet' },
  { icon: Zap, label: 'Automator', to: '/automator' },
  { icon: DollarSign, label: 'Prêt', to: '/pret' },
  { icon: Calendar, label: 'Calendrier', to: '/calendar' },
  { icon: FileText, label: 'Documents', to: '/documents' },
  { icon: MessageSquare, label: 'Messages', to: '/messages' },
  { icon: Settings, label: 'Paramètres', to: '/settings' },
]

export default function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const unreadCount = getUnreadCount()

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} h-screen bg-card border-r border-border/50 flex flex-col transition-all duration-300`}>
      <div className="h-16 flex items-center gap-3 px-4 border-b border-border/40">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <Activity size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight">CRM Immobilier</span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to)
          const Icon = item.icon
          const showBadge = item.to === '/messages' && unreadCount > 0

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent-light text-accent'
                  : 'text-text-secondary hover:text-text hover:bg-background'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && showBadge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-accent text-white min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-12 flex items-center justify-center border-t border-border/40 text-text-secondary hover:text-text transition-colors"
      >
        <ChevronLeft size={16} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </aside>
  )
}
