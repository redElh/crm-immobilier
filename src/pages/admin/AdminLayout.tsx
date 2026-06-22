import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import {
  Activity, Home, Users, FileText, MessageSquare, Settings,
  ChevronLeft, Calendar, BookOpen, Globe, Zap, DollarSign,
  Edit3, Crosshair, CheckCircle, Shield, ChevronRight,
  LogOut, Bell, User, HelpCircle
} from 'react-feather'
import { AnimatePresence, motion } from 'framer-motion'

const navItems = [
  { icon: Shield, label: 'Dashboard', to: '/admin' },
  { icon: Users, label: 'Utilisateurs', to: '/admin/users' },
  { icon: Home, label: 'Biens', to: '/admin/properties' },
  { icon: Users, label: 'Clients', to: '/admin/clients' },
  { icon: Crosshair, label: 'Prospects', to: '/admin/prospects' },
  { icon: CheckCircle, label: 'Contacts', to: '/admin/contacts' },
  { icon: BookOpen, label: 'Registre', to: '/admin/register' },
  { icon: Edit3, label: 'Contrats', to: '/admin/contracts' },
  { icon: Globe, label: 'Extranet', to: '/admin/extranet' },
  { icon: Zap, label: 'Automator', to: '/admin/automator' },
  { icon: DollarSign, label: 'Prêt', to: '/admin/pret' },
  { icon: Calendar, label: 'Calendrier', to: '/admin/calendar' },
  { icon: FileText, label: 'Documents', to: '/admin/documents' },
  { icon: MessageSquare, label: 'Messages', to: '/admin/messages' },
  { icon: Settings, label: 'Paramètres', to: '/admin/settings' },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getCurrentSection = () => {
    const path = location.pathname.split('/')[2]
    switch (path) {
      case 'users': return 'Utilisateurs'
      case 'properties': return 'Biens'
      case 'clients': return 'Clients'
      case 'documents': return 'Documents'
      case 'messages': return 'Messages'
      case 'settings': return 'Paramètres'
      case 'dashboard': return 'Dashboard'
      default: return 'Admin'
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <style>{`
        .admin-content .bg-accent-light { background-color: #FEF3C7; }
        .admin-content .text-accent { color: #D97706; }
        .admin-content .bg-accent { background-color: #D97706; }
        .admin-content .bg-accent\\/10 { background-color: rgba(217,119,6,0.1); }
        .admin-content .bg-accent\\/20 { background-color: rgba(217,119,6,0.2); }
        .admin-content .bg-accent\\/5 { background-color: rgba(217,119,6,0.05); }
        .admin-content .border-accent { border-color: #D97706; }
        .admin-content .border-accent\\/20 { border-color: rgba(217,119,6,0.2); }
        .admin-content .ring-accent\\/20 { --tw-ring-color: rgba(217,119,6,0.2); }
        .admin-content .hover\\:bg-accent\\/90:hover { background-color: rgba(217,119,6,0.9); }
        .admin-content .hover\\:bg-accent\\/10:hover { background-color: rgba(217,119,6,0.1); }
        .admin-content .hover\\:border-accent\\/50:hover { border-color: rgba(217,119,6,0.5); }
        .admin-content .focus\\:border-accent:focus { border-color: #D97706; }
        .admin-content .focus\\:ring-accent\\/20:focus { --tw-ring-color: rgba(217,119,6,0.2); }
        .admin-content .bg-accent-light\\/20 { background-color: rgba(254,243,199,0.2); }
        .admin-content .bg-accent-light\\/40 { background-color: rgba(254,243,199,0.4); }
        .admin-content .text-accent\\/70 { color: rgba(217,119,6,0.7); }
        .admin-content .text-accent\\/80 { color: rgba(217,119,6,0.8); }
        .admin-content .accent-light\\/20 { background-color: rgba(254,243,199,0.2); }
      `}</style>
      <aside className={`${collapsed ? 'w-16' : 'w-60'} h-screen bg-card border-r border-border/50 flex flex-col transition-all duration-300`}>
        <div className="h-16 flex items-center gap-3 px-4 border-b border-border/40">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm tracking-tight">Admin Panel</span>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = item.to === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.to)
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-text-secondary hover:text-text hover:bg-background'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border/50 px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate('/admin')}
              className="text-text-secondary hover:text-text transition-colors"
            >
              <span className="font-medium">Admin</span>
            </button>
            {location.pathname.split('/').filter(Boolean).length > 1 && (
              <>
                <ChevronRight size={14} className="text-text-secondary/50" />
                <span className="text-text-secondary">{getCurrentSection()}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all">
              <Bell size={18} />
              <span className="absolute mt-[-8px] ml-[8px] w-2 h-2 bg-error rounded-full ring-2 ring-card" />
            </button>

            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-background text-text-secondary hover:text-text hover:bg-border/50 transition-all"
            >
              <Activity size={14} />
              Voir l'app
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 hover:bg-amber-200 transition-all"
              >
                <Shield size={16} />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-card rounded-xl border border-border/50 shadow-dropdown py-1 z-50"
                  >
                    <div className="px-4 py-3 border-b border-border/40">
                      <p className="text-sm font-medium text-text">Administrateur</p>
                      <p className="text-xs text-text-secondary">Admin</p>
                    </div>

                    <button
                      onClick={() => { navigate('/admin/settings'); setShowDropdown(false) }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-background transition-colors"
                    >
                      <Settings size={14} />
                      Paramètres admin
                    </button>

                    <button
                      onClick={() => { navigate('/'); setShowDropdown(false) }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-background transition-colors"
                    >
                      <Activity size={14} />
                      App CRM
                    </button>

                    <button
                      onClick={() => { navigate('/auth/login'); setShowDropdown(false) }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-error hover:bg-error/5 transition-colors border-t border-border/40 mt-1"
                    >
                      <LogOut size={14} />
                      Déconnexion
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}
