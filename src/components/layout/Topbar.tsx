import { ChevronRight, User, LogOut, Settings, Bell, HelpCircle } from 'react-feather';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { getAuthToken, clearAuthToken } from '../../utils/auth';
import { sendPresence } from '../../services/realtime';
import { useNotifications } from '../../contexts/NotificationContext';

export default function Topbar({ basePath = '' }: { basePath?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, setCurrentUserId, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    const fetchProfile = () => {
      const token = getAuthToken()
      if (!token) return
      fetch('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setProfileImage(data.profile_image || '')
            setUserName(`${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Utilisateur')
            setUserRole(data.role === 'admin' ? 'Administrateur' : 'Agent')
            setCurrentUserId(String(data.id), `${data.first_name || ''} ${data.last_name || ''}`.trim())
          }
        })
        .catch(() => {})
    }

    fetchProfile()

    const handleProfileUpdate = () => fetchProfile()
    window.addEventListener('profileImageUpdated', handleProfileUpdate)
    return () => window.removeEventListener('profileImageUpdated', handleProfileUpdate)
  }, [])

  const getCurrentSection = () => {
    const rest = location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length)
      : location.pathname
    const path = rest.split('/')[1] || ''
    const sections: Record<string, string> = {
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
      settings: 'Paramètres',
    }
    return sections[path] || 'Tableau de bord'
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-[#32612D] border-b border-white/10 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate(basePath || '/')}
          className="text-white/80 hover:text-white transition-colors"
        >
          <span className="font-medium">Dashboard</span>
        </button>
        {location.pathname.split('/').filter(Boolean).length > 1 && (
          <>
            <ChevronRight size={14} className="text-white/50" />
            <span className="font-medium text-white">{getCurrentSection()}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/85 hover:text-white hover:bg-white/10 transition-all"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute mt-[-8px] ml-[8px] inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-error rounded-full ring-2 ring-[#32612D]">
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
                    <button onClick={markAllAsRead} className="text-xs text-accent hover:underline">
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
                          } else if (n.type === 'prospect_assigned' && n.propertyId) {
                            navigate(`${basePath}/prospects/${n.propertyId}`)
                          } else if (n.type === 'contact_assigned' && n.propertyId) {
                            navigate(`${basePath}/contacts/${n.propertyId}`)
          } else if (n.type === 'agent_inactivity') {
            navigate(`${basePath}/automator`)
          } else if (n.type === 'automator_delegated') {
            navigate(`${basePath}/automator?highlight=${n.propertyId}`)
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
            className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-all overflow-hidden"
          >
            {profileImage ? (
              <img src={`http://localhost:5000${profileImage}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={16} />
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
                  <p className="text-sm font-medium text-text">{userName || 'Utilisateur'}</p>
                  <p className="text-xs text-text-secondary">{userRole || 'Agent'}</p>
                </div>

                <button
                  onClick={() => { navigate(`${basePath}/settings/compte/profil`); setShowDropdown(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-background transition-colors"
                >
                  <Settings size={14} />
                  Paramètres
                </button>

                <button
                  onClick={() => { navigate(`${basePath}/settings`); setShowDropdown(false); }}
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
                    await fetch('http://localhost:5000/api/auth/logout', {
                      method: 'POST',
                      credentials: 'include',
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    })
                    navigate('/auth/login', { replace: true })
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
  );
}
