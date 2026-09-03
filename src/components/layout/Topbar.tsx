import { API_ORIGIN } from '../../utils/config'
import { ChevronRight, Home as HomeIcon, User, LogOut, Settings, Bell, HelpCircle, Sun, Moon, ChevronDown } from 'react-feather';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { getAuthToken, clearAuthToken } from '../../utils/auth';
import { sendPresence } from '../../services/realtime';
import { useNotifications } from '../../contexts/NotificationContext';
import { OrbIcon, STAGE_HUES, SLATE_HUE, useStageTheme, useStageThemeSetter } from '../dashboard/Stage';
import { cn } from '../../lib/utils';

function HoloAvatar({ src, size, dark }: { src?: string; size: number; dark: boolean }) {
  return (
    <span className="relative block shrink-0" style={{ width: size, height: size }}>
      <span aria-hidden="true" className="holo-spin absolute -inset-[2px] rounded-full" />
      <span
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full p-[2px]"
        style={{ backgroundColor: dark ? '#0B1022' : '#FFFFFF' }}
      >
        <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500 text-white">
          {src ? (
            <img src={`${API_ORIGIN}${src}`} alt="" className="h-full w-full object-cover" />
          ) : (
            <User size={Math.round(size * 0.42)} />
          )}
        </span>
      </span>
    </span>
  );
}

function ThemeSwitch({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onToggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      title={dark ? 'Mode clair' : 'Mode sombre'}
      className="relative h-8 w-16 shrink-0 rounded-full"
      style={{
        background: dark
          ? 'linear-gradient(180deg, #0A1030 0%, #151C42 100%)'
          : 'linear-gradient(180deg, #F0FCFA 0%, #D2F0E8 100%)',
        border: dark ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(13,148,136,0.18)',
        boxShadow: dark
          ? 'inset 0 2px 8px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.05), 0 0 18px rgba(124,92,255,0.14)'
          : 'inset 0 2px 8px rgba(13,148,136,0.18), inset 0 -1px 0 rgba(255,255,255,0.9), 0 0 18px rgba(45,212,191,0.16)',
        transition: 'background 500ms ease, border 500ms ease, box-shadow 500ms ease',
      }}
    >
      {/* Night scene */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden rounded-full"
        animate={{ opacity: dark ? 1 : 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <span
          className="absolute -right-2 -top-3 h-8 w-8 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.35), transparent 65%)' }}
        />
        <span className="star-twinkle absolute left-[15px] top-[7px] h-[2px] w-[2px] rounded-full bg-white/90" />
        <span className="star-twinkle absolute left-[26px] top-[20px] h-[1.5px] w-[1.5px] rounded-full bg-white/60" style={{ animationDelay: '-0.9s' }} />
        <span className="star-twinkle absolute left-[33px] top-[8px] h-[1.5px] w-[1.5px] rounded-full bg-white/50" style={{ animationDelay: '-1.6s' }} />
        <span className="star-twinkle absolute left-[21px] top-[14px] h-[1px] w-[1px] rounded-full bg-white/70" style={{ animationDelay: '-0.4s' }} />
      </motion.span>

      {/* Day scene */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden rounded-full"
        animate={{ opacity: dark ? 0 : 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <span className="cloud-drift absolute left-[22px] top-[8px] h-[4px] w-3.5 rounded-full bg-white/90" />
        <span className="cloud-drift absolute left-[29px] top-[17px] h-[3px] w-2.5 rounded-full bg-white/70" style={{ animationDelay: '-2.2s' }} />
      </motion.span>

      {/* Destination glyphs — the exposed one shows where the knob will land */}
      <span aria-hidden="true" className={cn('absolute left-[9px] top-1/2 -translate-y-1/2 transition-opacity duration-500', dark ? 'text-amber-400/90 opacity-100' : 'opacity-0')}>
        <Sun size={11} />
      </span>
      <span aria-hidden="true" className={cn('absolute right-[9px] top-1/2 -translate-y-1/2 transition-opacity duration-500', dark ? 'opacity-0' : 'text-slate-400/90 opacity-100')}>
        <Moon size={11} />
      </span>

      {/* Knob — hand-tuned glossy sphere; no CSS transform transitions so the spring stays butter-smooth */}
      <motion.span
        initial={false}
        animate={{ x: dark ? 37 : 3 }}
        transition={{ type: 'spring', stiffness: 320, damping: 23, mass: 0.65 }}
        className="absolute left-0 top-1 z-10 h-6 w-6 rounded-full"
        style={{
          willChange: 'transform',
          background: dark
            ? 'radial-gradient(circle at 32% 26%, #FFFFFF 0%, #DBE4F3 34%, #9FB0CB 72%, #7C8FAD 100%)'
            : 'radial-gradient(circle at 32% 26%, #FFF3C4 0%, #FFD34D 36%, #F59E0B 74%, #D97706 100%)',
          boxShadow: dark
            ? 'inset 0 1px 2px rgba(255,255,255,0.9), inset 0 -3px 5px rgba(51,65,105,0.55), 0 1px 4px rgba(0,0,0,0.55), 0 0 16px rgba(203,213,225,0.4)'
            : 'inset 0 1px 2px rgba(255,255,255,0.85), inset 0 -3px 5px rgba(146,64,14,0.45), 0 1px 4px rgba(180,83,9,0.4), 0 0 16px rgba(251,191,36,0.55)',
          transition: 'background 450ms ease, box-shadow 450ms ease',
        }}
      >
        <span aria-hidden="true" className="pointer-events-none absolute left-[5px] top-[4px] h-[6px] w-[7px] rounded-full bg-white/75 blur-[1px]" />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <AnimatePresence initial={false}>
            <motion.span
              key={dark ? 'moon' : 'sun'}
              initial={{ opacity: 0, rotate: -110, scale: 0.4 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 110, scale: 0.4 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className={cn('absolute flex', dark ? 'text-slate-600' : 'text-white')}
              style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }}
            >
              {dark ? <Moon size={12} /> : <Sun size={12} />}
            </motion.span>
          </AnimatePresence>
        </span>
      </motion.span>
    </motion.button>
  );
}

export default function Topbar({ basePath = '' }: { basePath?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useStageTheme();
  const setTheme = useStageThemeSetter();
  const dark = theme === 'dark';
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, setCurrentUserId, markAsRead, markAllAsRead } = useNotifications();
  const [now, setNow] = useState(() => new Date());

  /* Mission clock */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const timeStr = now.toLocaleTimeString('fr-FR', { hour12: false })
  const dateStr = now
    .toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\./g, '')
    .toUpperCase()

  useEffect(() => {
    const fetchProfile = () => {
      const token = getAuthToken()
      if (!token) return
      fetch(`${API_ORIGIN}/api/auth/me`, {
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
      conciergerie: 'Activités Conciergerie',
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

  /* Themed surface tokens */
  const iconBtn = dark
    ? 'text-slate-400 hover:text-white'
    : 'text-slate-500 hover:text-teal-900';
  const capsule = dark
    ? 'border-white/[0.08] bg-white/[0.04] hover:border-white/[0.16] hover:bg-white/[0.07]'
    : 'border-teal-900/10 bg-white/70 hover:border-teal-900/20 hover:bg-white';
  const itemHover = dark ? 'hover:bg-white/[0.06]' : 'hover:bg-teal-900/[0.05]';
  const hairline = dark ? 'border-white/[0.08]' : 'border-teal-900/[0.08]';
  const mutedTxt = dark ? 'text-slate-400' : 'text-slate-500';
  const faintTxt = dark ? 'text-slate-500' : 'text-slate-400';

  const homeHue = dark ? STAGE_HUES.violet : STAGE_HUES.emerald;

  const menuItems = [
    { icon: Settings, label: 'Paramètres', onClick: () => navigate(`${basePath}/settings/compte/profil`) },
    { icon: HelpCircle, label: 'Aide & Support', onClick: () => navigate(`${basePath}/settings`) },
  ];

  return (
    <header className="shell-bar relative z-40 flex h-[68px] w-full shrink-0 items-center justify-between gap-3 px-5">
      {/* Holographic bottom edge */}
      <div aria-hidden="true" className="holo-hairline-h pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-80" />

      {/* Breadcrumb */}
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <button
          onClick={() => navigate(basePath || '/')}
          className={cn(
            'group flex items-center gap-2 rounded-xl border border-transparent px-1 py-1 transition-all duration-200',
            dark ? 'hover:border-white/[0.08] hover:bg-white/[0.05]' : 'hover:border-teal-900/[0.08] hover:bg-teal-900/[0.04]'
          )}
        >
          <OrbIcon icon={HomeIcon} hue={homeHue} size={28} radius={9} className="transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-105" />
          <span className={cn('hidden text-[13px] font-semibold sm:block', dark ? 'text-slate-200 group-hover:text-white' : 'text-slate-700 group-hover:text-teal-900')}>
            Dashboard
          </span>
        </button>
        {location.pathname.split('/').filter(Boolean).length > 1 && (
          <>
            <ChevronRight size={14} className={dark ? 'shrink-0 text-slate-600' : 'shrink-0 text-slate-400'} />
            <motion.span
              key={getCurrentSection()}
              initial={{ opacity: 0, y: 8, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'inline-flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[13px] font-semibold backdrop-blur-sm',
                dark
                  ? 'border-white/[0.09] bg-white/[0.05] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]'
                  : 'border-teal-900/10 bg-white/75 text-teal-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
              )}
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundImage: dark
                    ? 'linear-gradient(135deg, #8B7CFF, #38BDF8)'
                    : 'linear-gradient(135deg, #2DD4BF, #14B8A6)',
                  boxShadow: dark ? '0 0 9px rgba(124,92,255,0.85)' : '0 0 9px rgba(13,148,136,0.65)',
                }}
              />
              <span className="truncate">{getCurrentSection()}</span>
            </motion.span>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Mission clock */}
        <div
          title="Heure locale"
          className={cn(
            'hidden h-10 items-center gap-2.5 rounded-xl border px-3 xl:flex',
            dark ? 'border-white/[0.08] bg-white/[0.04]' : 'border-teal-900/10 bg-white/70'
          )}
        >
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
          <span className={cn('text-[12px] font-bold tabular-nums tracking-wide', dark ? 'text-slate-100' : 'text-slate-800')}>
            {timeStr}
          </span>
          <span className={cn('h-3 w-px', dark ? 'bg-white/10' : 'bg-teal-900/10')} />
          <span className={cn('text-[10px] font-bold uppercase tracking-[1.5px]', faintTxt)}>
            {dateStr}
          </span>
        </div>

        {/* Theme switch */}
        <ThemeSwitch dark={dark} onToggle={() => setTheme?.(dark ? 'light' : 'dark')} />

        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            title="Notifications"
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200',
              iconBtn,
              showNotifications
                ? dark
                  ? 'border-violet-400/35 bg-violet-500/[0.12] text-violet-200 shadow-[0_0_18px_rgba(124,92,255,0.35)]'
                  : 'border-teal-600/30 bg-teal-600/[0.1] text-teal-800 shadow-[0_0_18px_rgba(13,148,136,0.3)]'
                : capsule
            )}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <>
                {!showNotifications && (
                  <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0 rounded-xl border', dark ? 'animate-pulse border-rose-400/40' : 'animate-pulse border-rose-500/40')} />
                )}
                <span
                  className={cn(
                    'absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white',
                    dark ? 'ring-2 ring-[#0C1126]' : 'ring-2 ring-white'
                  )}
                  style={{ backgroundImage: 'linear-gradient(135deg,#FB7185,#E11D48)', boxShadow: '0 0 12px rgba(225,29,72,0.65)' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
                {showNotifications && (
                  <span className="live-dot absolute bottom-2 right-2 h-1 w-1 rounded-full bg-emerald-400 text-emerald-400" />
                )}
              </>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 8, scale: 0.97, filter: 'blur(4px)' }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="pop-glass absolute right-0 mt-2 z-50 w-[350px] origin-top-right overflow-hidden"
              >
                <div className={cn('relative z-[1] flex items-center gap-2.5 border-b px-4 py-3', hairline)}>
                  <OrbIcon icon={Bell} hue={STAGE_HUES.violet} size={32} radius={10} />
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-bold', dark ? 'text-white' : 'text-slate-900')}>Notifications</p>
                    <p className={cn('mt-0.5 text-[10px] font-semibold uppercase tracking-[1.4px]', mutedTxt)}>
                      {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className={cn(
                        'shrink-0 rounded-lg border px-2 py-1 text-[10px] font-bold transition-colors',
                        dark
                          ? 'border-indigo-400/25 bg-indigo-400/10 text-indigo-200 hover:bg-indigo-400/20 hover:text-white'
                          : 'border-teal-600/25 bg-teal-600/10 text-teal-800 hover:bg-teal-600/20'
                      )}
                    >
                      Tout lire
                    </button>
                  )}
                </div>
                <div className="scrollbar-thin relative z-[1] max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-6 py-8">
                      <OrbIcon icon={Bell} hue={SLATE_HUE} size={46} />
                      <p className={cn('text-center text-sm', mutedTxt)}>Aucune notification pour le moment</p>
                    </div>
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
                        className={cn(
                          'flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0',
                          hairline,
                          itemHover,
                          !n.read && (dark ? 'bg-violet-400/[0.06]' : 'bg-teal-600/[0.05]')
                        )}
                      >
                        <span className="mt-[7px] shrink-0">
                          {n.read ? (
                            <span className={cn('block h-1.5 w-1.5 rounded-full', dark ? 'bg-slate-600' : 'bg-slate-300')} />
                          ) : (
                            <span
                              className="block h-2 w-2 rounded-full"
                              style={
                                dark
                                  ? { backgroundColor: '#8B7CFF', boxShadow: '0 0 9px rgba(139,124,255,0.95)' }
                                  : { backgroundColor: '#0D9488', boxShadow: '0 0 9px rgba(13,148,136,0.75)' }
                              }
                            />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className={cn('truncate text-[10px] font-bold uppercase tracking-[1.2px]', mutedTxt)}>{n.senderName}</span>
                            <span className={cn('shrink-0 text-[10px] tabular-nums', faintTxt)}>
                              {new Date(n.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </span>
                          <span className={cn('mt-0.5 block text-[13px] leading-snug', dark ? 'text-slate-200' : 'text-slate-800')}>{n.message}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            aria-expanded={showDropdown}
            className={cn(
              'flex h-10 items-center gap-2.5 rounded-xl border py-1 pl-1 pr-2.5 transition-all duration-200',
              showDropdown
                ? dark
                  ? 'border-white/[0.18] bg-white/[0.07] shadow-[0_0_20px_rgba(124,92,255,0.2)]'
                  : 'border-teal-900/20 bg-white shadow-[0_0_20px_rgba(13,148,136,0.2)]'
                : capsule
            )}
          >
            <HoloAvatar src={profileImage} size={30} dark={dark} />
            <span className="hidden min-w-0 flex-col items-start leading-tight lg:flex">
              <span className={cn('max-w-[120px] truncate text-xs font-bold', dark ? 'text-slate-100' : 'text-slate-800')}>
                {userName || 'Utilisateur'}
              </span>
              <span className={cn('text-[9px] font-extrabold uppercase tracking-[1.5px]', dark ? 'text-indigo-300/80' : 'text-teal-700')}>
                {userRole || 'Agent'}
              </span>
            </span>
            <motion.span animate={{ rotate: showDropdown ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className={mutedTxt}>
              <ChevronDown size={13} />
            </motion.span>
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 8, scale: 0.97, filter: 'blur(4px)' }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'top right' }}
                className="pop-glass absolute right-0 mt-2 z-50 w-72 overflow-hidden"
              >
                {/* Identity header */}
                <div className={cn('relative z-[1] flex items-center gap-3 border-b px-4 py-4', hairline)}>
                  <HoloAvatar src={profileImage} size={44} dark={dark} />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-[15px] font-bold leading-tight', dark ? 'text-white' : 'text-slate-900')}>
                      {userName || 'Utilisateur'}
                    </span>
                    <span
                      className={cn(
                        'mt-1.5 inline-flex items-center gap-1.5 rounded-md border px-1.5 py-[3px] text-[8px] font-extrabold uppercase leading-none tracking-[1.6px]',
                        dark
                          ? 'border-indigo-400/25 bg-indigo-400/10 text-indigo-200'
                          : 'border-teal-600/25 bg-teal-600/10 text-teal-800'
                      )}
                    >
                      <span
                        className="h-1 w-1 rounded-full"
                        style={{
                          backgroundColor: dark ? '#8B7CFF' : '#0D9488',
                          boxShadow: dark ? '0 0 6px rgba(139,124,255,0.9)' : '0 0 6px rgba(13,148,136,0.7)',
                        }}
                      />
                      {userRole || 'Agent'}
                    </span>
                  </span>
                  <span aria-hidden="true" className="absolute inset-x-6 bottom-0 h-px" style={{ background: dark
                    ? 'linear-gradient(90deg, transparent, rgba(139,124,255,0.45), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(45,212,191,0.5), transparent)' }}
                  />
                </div>

                {/* Actions */}
                <div className="relative z-[1] space-y-0.5 px-2 py-2">
                  {menuItems.map(item => (
                    <button
                      key={item.label}
                      onClick={() => { item.onClick(); setShowDropdown(false); }}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-[13px] font-medium transition-colors',
                        mutedTxt, itemHover,
                        dark ? 'hover:text-white' : 'hover:text-teal-900'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 group-hover:scale-105',
                          dark
                            ? 'border-white/10 bg-white/[0.05] group-hover:border-violet-400/30 group-hover:bg-violet-400/10'
                            : 'border-teal-900/10 bg-white group-hover:border-teal-600/25 group-hover:bg-teal-600/[0.08]'
                        )}
                      >
                        <item.icon size={13} />
                      </span>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight
                        size={13}
                        className="-translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-60"
                      />
                    </button>
                  ))}
                </div>

                {/* Logout */}
                <div className={cn('relative z-[1] border-t p-2', hairline)}>
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
                      navigate('/auth/login', { replace: true })
                    }}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-[13px] font-medium transition-colors',
                      dark
                        ? 'text-slate-400 hover:bg-rose-500/10 hover:text-rose-300'
                        : 'text-slate-500 hover:bg-rose-500/[0.07] hover:text-rose-600'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 group-hover:scale-105',
                        dark
                          ? 'border-white/10 bg-white/[0.05] group-hover:border-rose-400/30 group-hover:bg-rose-500/10'
                          : 'border-teal-900/10 bg-white group-hover:border-rose-500/25 group-hover:bg-rose-500/[0.08]'
                      )}
                    >
                      <LogOut size={13} />
                    </span>
                    Déconnexion
                    <ChevronRight
                      size={13}
                      className="-translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-60"
                    />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
