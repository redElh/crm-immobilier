import { API_ORIGIN } from '../../utils/config'
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { getAuthToken, clearAuthToken } from '../../utils/auth'
import { useToast } from '../../components/ui/Toast'
import { useNotifications } from '../../contexts/NotificationContext'
import { useMessageUnread, sendPresence } from '../../services/realtime'
import { usePresenceReporter } from '../../services/presenceReporter'
import { useMessagingAppearance } from '../../services/messageAppearance'
import { cn } from '../../lib/utils'
import {
  Home, Users, FileText, MessageSquare, Settings,
  Calendar, BookOpen, Eye, Zap,
  Edit3, Crosshair, CheckCircle, Shield, ChevronRight,
  LogOut, Bell, HelpCircle, Loader, Compass, Tool,
} from 'react-feather'
import { AnimatePresence, motion } from 'framer-motion'
import SidebarToggle from '../../components/layout/SidebarToggle'
import { StageThemeProvider } from '../../components/dashboard/Stage'

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { adminId } = useParams<{ adminId: string }>()
  const [collapsed, setCollapsed] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [profileImage, setProfileImage] = useState('')
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('admin')
  const [userId, setUserId] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const { notifications, unreadCount, setCurrentUserId, markAsRead, markAllAsRead } = useNotifications()
  const messageUnread = useMessageUnread()
  usePresenceReporter()
  const appearance = useMessagingAppearance()
  const isMessagesRoute = location.pathname.includes('/messages')

  const basePath = `/admin/${adminId}`

  const navItems = [
    { icon: Shield, label: 'Dashboard', to: basePath },
    { icon: Users, label: 'Utilisateurs', to: `${basePath}/users` },
    { icon: Home, label: 'Biens', to: `${basePath}/properties` },
    { icon: Users, label: 'Clients', to: `${basePath}/clients` },
    { icon: Crosshair, label: 'Prospects', to: `${basePath}/prospects` },
    { icon: CheckCircle, label: 'Contacts', to: `${basePath}/contacts` },
    { icon: BookOpen, label: 'Registre', to: `${basePath}/register` },
    { icon: Edit3, label: 'Contrats', to: `${basePath}/contracts` },
    { icon: Eye, label: 'Squarepeek', to: `${basePath}/extranet` },
    { icon: Zap, label: 'Automator', to: `${basePath}/automator` },
    { icon: Calendar, label: 'Calendrier', to: `${basePath}/calendar` },
    { icon: FileText, label: 'Documents', to: `${basePath}/documents` },
    { icon: MessageSquare, label: 'Messages', to: `${basePath}/messages`, badge: messageUnread },
    { icon: Compass, label: 'Activités Conciergerie', to: `${basePath}/conciergerie` },
    { icon: Tool, label: 'Toolbox', to: `${basePath}/toolbox` },
    { icon: Settings, label: 'Paramètres', to: `${basePath}/settings` },
  ]

  useEffect(() => {
    const loadProfile = async () => {
      let user = null
      // Try with cookie first
      try {
        const response = await fetch(`${API_ORIGIN}/api/auth/me`, { credentials: 'include' })
        if (response.ok) user = await response.json()
      } catch (e) {}

      // Fallback: try token from storage
      if (!user) {
        const storedToken = getAuthToken()
        if (storedToken) {
          try {
            const response = await fetch(`${API_ORIGIN}/api/auth/me`, {
              headers: { Authorization: `Bearer ${storedToken}` }
            })
            if (response.ok) user = await response.json()
          } catch (e) {}
        }
      }

      if (user && (user.role === 'admin' || user.role === 'gerant')) {
        if (String(user.id) !== adminId) {
          toast('error', "Accès refusé. Vous ne pouvez accéder qu'à votre propre compte.")
          navigate(-1)
          return
        }
        setProfileImage(user.profile_image || '')
        setUserName(`${user.first_name || ''} ${user.last_name || ''}`.trim() || (user.role === 'gerant' ? 'Gérant' : 'Administrateur'))
        setUserRole(user.role)
        setUserId(user.id)
        setCurrentUserId(String(user.id))
        setAuthChecked(true)
      } else if (user && user.role === 'agent') {
        toast('error', "Accès refusé. Vous êtes connecté en tant qu'agent.")
        navigate(-1)
      } else {
        navigate('/auth/admin/login', { replace: true })
      }
    }
    loadProfile()
  }, [navigate, adminId, toast])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!authChecked) {
    return (
      <div className="flex h-screen bg-background items-center justify-center admin-theme">
        <Loader size={32} className="text-accent animate-spin" />
      </div>
    )
  }

  const getCurrentSection = () => {
    const path = location.pathname.split('/')[3]
    const sections: Record<string, string> = {
      users: 'Utilisateurs',
      properties: 'Biens',
      clients: 'Clients',
      prospects: 'Prospects',
      contacts: 'Contacts',
      register: 'Registre',
      contracts: 'Contrats',
      extranet: 'Squarepeek',
      automator: 'Automator',
      calendar: 'Calendrier',
      documents: 'Documents',
      messages: 'Messages',
      conciergerie: 'Activités Conciergerie',
      settings: 'Paramètres',
      dashboard: 'Dashboard',
    }
    return sections[path] || 'Admin'
  }

  return (
    <div className={`flex h-screen admin-theme ${userRole === 'admin' ? 'bg-[#FFCC99]' : 'bg-[#D2B1A3]'}`}>
      <aside className={`relative ${collapsed ? 'w-16' : 'w-60'} h-screen ${userRole === 'admin' ? 'bg-[#893101]' : 'bg-[#905D5D]'} ${userRole === 'admin' ? 'border-r border-white/10' : 'border-r border-border/50'} flex flex-col transition-[width] duration-300 ease-in-out`}>
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10 overflow-hidden shrink-0">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/30 bg-[linear-gradient(180deg,rgba(7,59,39,0.96),rgba(6,34,23,0.98))] shadow-[0_6px_16px_rgba(0,0,0,0.22)] flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-premium/30 via-transparent to-accent/10" />
            <img src="/CRM_Official_Admin_Image.jfif" alt="CRM Square Immo" className="relative h-full w-full object-cover" />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="brand"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className={`font-semibold text-sm leading-tight tracking-tight text-white whitespace-nowrap overflow-hidden`}
              >
                CRM Square Immo
                <span className={`block text-[10px] leading-tight font-normal text-white/70 mt-0.5 whitespace-nowrap`}>
                  {userRole === 'gerant' ? 'Gérant' : 'Administrateur'}
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = item.to === basePath
              ? location.pathname === basePath
              : location.pathname.startsWith(item.to)
            const Icon = item.icon
            const badge = (item as any).badge || 0
            const showBadge = badge > 0

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  collapsed ? 'justify-center' : 'justify-start gap-3 px-3'
                } ${
                  isActive
                    ? userRole === 'admin'
                      ? 'bg-white text-[#893101] shadow-sm'
                      : 'bg-white/15 text-white shadow-sm'
                    : userRole === 'admin'
                      ? 'text-white/80 hover:text-white hover:bg-white/10'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="flex-1 whitespace-nowrap overflow-hidden text-left"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!collapsed && showBadge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-accent text-white min-w-[18px] text-center flex-shrink-0">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <SidebarToggle
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          tone={userRole === 'admin' ? 'orange' : 'rose'}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-16 ${userRole === 'admin' ? 'bg-[#893101] border-b border-white/10' : 'bg-[#905D5D] border-b border-border/50'} px-6 flex items-center justify-between sticky top-0 z-40`}>
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate(basePath)}
              className={`${userRole === 'admin' ? 'text-white/80 hover:text-white' : 'text-white/80 hover:text-white'} transition-colors`}
            >
              <span className="font-medium">{userRole === 'gerant' ? 'Gérant' : 'Admin'}</span>
            </button>
            {location.pathname.split('/').filter(Boolean).length > 2 && (
              <>
                <ChevronRight size={14} className={userRole === 'admin' ? 'text-white/50' : 'text-white/50'} />
                <span className={`font-medium ${userRole === 'admin' ? 'text-white' : 'text-white'}`}>{getCurrentSection()}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${userRole === 'admin' ? 'text-white/85 hover:text-white hover:bg-white/10' : 'text-white/85 hover:text-white hover:bg-white/10'} transition-all`}
              >
                <Bell size={18} />
                    {unreadCount > 0 && (
                  <span className={`absolute mt-[-8px] ml-[8px] inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-error rounded-full ${userRole === 'admin' ? 'ring-2 ring-[#893101]' : 'ring-2 ring-[#905D5D]'}`}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-card rounded-xl border border-border/50 shadow-dropdown z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                      <p className="text-sm font-semibold">Notifications</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-accent hover:underline"
                        >
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-text-secondary/60 text-center py-6">Aucune notification</p>
                      ) : (
                        notifications.map(n => (
                          <button
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id)
                              setShowNotifications(false)
                              if ((n.type === 'activity_alarm' || n.type === 'activity_reminder') && n.propertyRef?.startsWith('ACTIVITY-')) {
                                const activityId = n.propertyRef.replace('ACTIVITY-', '');
                                navigate(`${basePath}/clients/${n.propertyId}?tab=notes_activite&activityId=${activityId}`)
                              } else if (n.type === 'contact_assigned' && n.propertyId) {
                                navigate(`${basePath}/contacts/${n.propertyId}`)
                              } else if (n.type === 'agent_inactivity') {
                                navigate(`${basePath}/automator`)
                              } else if (n.type === 'event_reminder') {
                                navigate(`${basePath}/calendar?event=${n.propertyId}`)
                              } else if (n.type === 'event_assigned' || n.type === 'event_modified' || n.type === 'event_deleted') {
                                navigate(`${basePath}/calendar?event=${n.propertyId}`)
                              } else {
                                navigate(`${basePath}/properties/${n.propertyId}`)
                              }
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-background transition-colors flex items-start gap-3 ${
                              !n.read ? 'bg-accent/5' : ''
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              n.read ? 'bg-transparent' : 'bg-accent'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-text-secondary">{n.senderName}</p>
                              <p className="text-sm text-text mt-0.5">{n.message}</p>
                              <p className="text-[10px] text-text-secondary/50 mt-0.5">
                                {new Date(n.createdAt).toLocaleString('fr-FR')}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 hover:bg-amber-200 transition-all overflow-hidden"
              >
                {profileImage ? (
                  <img src={`${API_ORIGIN}${profileImage}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Shield size={16} />
                )}
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
                      <p className="text-sm font-medium text-text">{userName}</p>
                      <p className="text-xs text-text-secondary">{userRole === 'gerant' ? 'Gérant' : 'Admin'} {userId && <span className="font-mono">#{userId}</span>}</p>
                    </div>

                    <button
                      onClick={() => { navigate(`${basePath}/settings`); setShowDropdown(false) }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-background transition-colors"
                    >
                      <Settings size={14} />
                      Paramètres admin
                    </button>

                    <button
                      onClick={() => { navigate(`${basePath}/settings/aide`); setShowDropdown(false) }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-background transition-colors"
                    >
                      <HelpCircle size={14} />
                      Aide & Support
                    </button>

                    <button
                      onClick={async () => {
                        setShowDropdown(false)
                        const token = getAuthToken()
                        sendPresence('offline')
                        clearAuthToken()
                        await fetch(`${API_ORIGIN}/api/auth/logout`, {
                          method: 'POST',
                          credentials: 'include',
                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                        })
                        navigate('/auth/admin/login', { replace: true })
                      }}
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

        <StageThemeProvider value="light">
          <main className={cn('flex-1 overflow-y-auto p-6 scrollbar-thin', isMessagesRoute && appearance.theme === 'dark' && 'dark bg-background')}>
            {children}
          </main>
        </StageThemeProvider>
      </div>
    </div>
  )
}
