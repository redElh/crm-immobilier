import { API_ORIGIN } from '../../utils/config'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { getAuthToken } from '../../utils/auth'
import { useToast } from '../../components/ui/Toast'
import { useNotifications } from '../../contexts/NotificationContext'
import { usePresenceReporter } from '../../services/presenceReporter'
import { ensureE2EEIdentity } from '../../services/e2ee/session'
import { useMessagingAppearance } from '../../services/messageAppearance'
import { cn } from '../../lib/utils'
import { Loader } from 'react-feather'
import { motion } from 'framer-motion'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import {
  StageThemeProvider,
  StageThemeSetterProvider,
  StageScopeProvider,
  useStageThemeState,
} from '../../components/dashboard/Stage'
import { useScrollMemory } from '../../hooks/useScrollMemory'

/* Admin/gérant shell — same Stage chrome as the agent rail:
   shared Sidebar + Topbar (admin variant), violet dark / orange light canvas.
   The `admin-theme` token palette is retained alongside `agent-theme` so the
   admin-only legacy pages keep their tokens pending upcoming modernization. */
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { adminId } = useParams<{ adminId: string }>()
  const [authChecked, setAuthChecked] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const basePath = `/admin/${adminId}`
  usePresenceReporter()
  const appearance = useMessagingAppearance()
  const isMessagesRoute = location.pathname.includes('/messages')
  const [stageTheme, setStageTheme] = useStageThemeState()
  const dark = stageTheme === 'dark'
  const { setCurrentUserId } = useNotifications()
  const mainRef = useRef<HTMLElement>(null)

  useScrollMemory(mainRef, authChecked)

  /* E2EE keys: generate + publish at login so others can seal to this
     device even before the messages module is ever opened. */
  useEffect(() => {
    if (userId != null) ensureE2EEIdentity(String(userId))
  }, [userId])

  /* Keep the page backdrop in sync with the stage theme — no white flashes */
  useEffect(() => {
    const bg = dark ? '#0D0A18' : '#FDF3EA'
    document.body.style.backgroundColor = bg
    document.documentElement.style.backgroundColor = bg
  }, [dark])

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

  if (!authChecked) {
    return (
      <div className={cn('relative flex h-screen items-center justify-center overflow-hidden stage-admin', dark ? 'stage-dark agent-theme' : 'stage-light agent-theme admin-theme')}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className={cn('aurora-blob', dark ? 'aurora-rose' : 'aurora-violet')} style={{ width: '42vw', height: '46vh', top: '-14%', right: '-6%' }} />
          <div className="aurora-blob aurora-cyan" style={{ width: '40vw', height: '40vh', bottom: '-16%', left: '-8%', animationDelay: '-9s' }} />
        </div>
        <div className="orb-icon relative z-10 h-14 w-14 rounded-2xl" style={{ ['--orb-a' as string]: dark ? '#F43F5E' : '#F97316', ['--orb-b' as string]: dark ? '#6D28D9' : '#C2410C' }}>
          <Loader size={22} className="animate-spin text-white" />
        </div>
      </div>
    )
  }

  return (
    <StageThemeProvider value={stageTheme}>
      <StageThemeSetterProvider value={setStageTheme}>
        <StageScopeProvider value="admin">
          <div
            className={cn(
              'relative flex h-screen overflow-hidden agent-theme admin-theme stage-admin',
              dark ? 'stage-dark' : 'stage-light'
            )}
          >
            {/* Drifting aurora field behind everything — crimson/violet at night, orange by day */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
              <div
                className={cn('aurora-blob', dark ? 'aurora-rose' : 'aurora-violet')}
                style={{ width: '48vw', height: '52vh', top: '-16%', right: '-6%' }}
              />
              <div
                className="aurora-blob aurora-cyan"
                style={{ width: '46vw', height: '46vh', bottom: '-18%', left: '-8%', animationDelay: '-9s' }}
              />
              <div
                className={cn('aurora-blob', dark ? 'aurora-violet' : 'aurora-orange')}
                style={{ width: '34vw', height: '36vh', top: '34%', left: '44%', animationDelay: '-17s' }}
              />
            </div>

            {/* Theme crossfade veil — masks the palette swap */}
            <motion.div
              key={dark ? 'dark' : 'light'}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[70]"
              style={{ backgroundColor: dark ? '#0D0A18' : '#FDF3EA' }}
            />

            <Sidebar basePath={basePath} variant="admin" brandImage="/CRM_Official_Admin_Image.jfif" />

            <div className="relative z-10 flex min-w-0 flex-1 flex-col">
              <Topbar basePath={basePath} variant="admin" />
              <main
                ref={mainRef}
                className={cn(
                  'scrollbar-thin relative flex-1 overflow-y-auto p-6',
                  isMessagesRoute && appearance.theme === 'dark' && 'dark bg-background'
                )}
              >
                {children}
              </main>
            </div>
          </div>
        </StageScopeProvider>
      </StageThemeSetterProvider>
    </StageThemeProvider>
  )
}
