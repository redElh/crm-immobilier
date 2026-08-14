import { API_ORIGIN } from '../../utils/config'
import { NavLink, useLocation } from 'react-router-dom'
import { Activity, Home, Users, FileText, MessageSquare, Settings, ChevronLeft, Crosshair, CheckCircle, Calendar, BookOpen, Eye, Zap, DollarSign, Edit3 } from 'react-feather'
import { useState, useEffect } from 'react'
import { useMessageUnread } from '../../services/realtime'
import { useAutomator } from '../../contexts/AutomatorContext'
import { getMyEffectivePermissions } from '../../services/permissionsService'
import { getAuthToken } from '../../utils/auth'

export default function Sidebar({ basePath = '' }: { basePath?: string }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [espaceType, setEspaceType] = useState('')
  const unreadCount = useMessageUnread()
  const automator = useAutomator()
  const automatorBadge = automator.getUnreadCount()
  const [calendarVisible, setCalendarVisible] = useState(true)
  const [contactsVisible, setContactsVisible] = useState(true)
  const [prospectsVisible, setProspectsVisible] = useState(true)
  const [clientsVisible, setClientsVisible] = useState(true)
  const [contractsVisible, setContractsVisible] = useState(true)
  const [biensVisible, setBiensVisible] = useState(true)
  const [registreVisible, setRegistreVisible] = useState(true)

  useEffect(() => {
    let cancelled = false
    getMyEffectivePermissions()
      .then(perms => {
        if (cancelled) return
        if (perms['calendrier-lecture'] === false) setCalendarVisible(false)
        if (perms['contacts-lecture'] === false) setContactsVisible(false)
        if (perms['prospects-lecture'] === false) setProspectsVisible(false)
        if (perms['clients-lecture'] === false) setClientsVisible(false)
        if (perms['contrats-lecture'] === false) setContractsVisible(false)
        if (perms['biens-lecture'] === false) setBiensVisible(false)
        if (perms['registre-lecture'] === false) setRegistreVisible(false)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    fetch(`${API_ORIGIN}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          if (data.role === 'admin') setEspaceType('Administrateur')
          else if (data.role === 'gerant') setEspaceType('Gérant')
          else setEspaceType(data.position || 'Agent')
        }
      })
      .catch(() => {})
  }, [])

  const navItems = [
    { icon: Activity, label: 'Dashboard', to: basePath || '/' },
    ...(biensVisible
      ? [{ icon: Home, label: 'Biens', to: `${basePath}/properties` }]
      : []),
    ...(clientsVisible
      ? [{ icon: Users, label: 'Clients', to: `${basePath}/clients` }]
      : []),
    ...(prospectsVisible
      ? [{ icon: Crosshair, label: 'Prospects', to: `${basePath}/prospects` }]
      : []),
    ...(contactsVisible
      ? [{ icon: CheckCircle, label: 'Contacts', to: `${basePath}/contacts` }]
      : []),
    ...(registreVisible
      ? [{ icon: BookOpen, label: 'Registre', to: `${basePath}/register` }]
      : []),
    ...(contractsVisible
      ? [{ icon: Edit3, label: 'Contrats', to: `${basePath}/contracts` }]
      : []),
    { icon: Eye, label: 'Squarepeek', to: `${basePath}/extranet` },
    { icon: Zap, label: 'Automator', to: `${basePath}/automator`, badge: automatorBadge },
    ...(calendarVisible
      ? [{ icon: Calendar, label: 'Calendrier', to: `${basePath}/calendar` }]
      : []),
    { icon: FileText, label: 'Documents', to: `${basePath}/documents` },
    { icon: MessageSquare, label: 'Messages', to: `${basePath}/messages`, badge: unreadCount },
    { icon: Settings, label: 'Paramètres', to: `${basePath}/settings` },
  ]

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} h-screen bg-[#32612D] border-r border-white/10 flex flex-col transition-all duration-300`}>
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10">
        <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/30 bg-[linear-gradient(180deg,rgba(7,59,39,0.96),rgba(6,34,23,0.98))] shadow-[0_10px_24px_rgba(0,0,0,0.22)] flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-premium/30 via-transparent to-accent/10" />
          <img src="/CRM_Official_Image.jfif" alt="CRM Square Immo" className="relative h-full w-full object-cover" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight text-white">
            CRM Square Immo
            {espaceType && <span className="ml-1.5 text-white/70">({espaceType})</span>}
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = item.to === basePath
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to)
          const Icon = item.icon
          const badge = (item as any).badge || 0
          const showBadge = badge > 0

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-[#32612D] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && showBadge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-white text-[#32612D] min-w-[18px] text-center">
                  {badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-12 flex items-center justify-center border-t border-white/10 text-white/80 hover:text-white transition-colors"
      >
        <ChevronLeft size={16} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </aside>
  )
}
