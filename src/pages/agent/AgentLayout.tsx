import { API_ORIGIN } from '../../utils/config'
import { ReactElement, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation, useOutlet } from 'react-router-dom'
import { Loader } from 'react-feather'
import { motion } from 'framer-motion'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import {
  StageThemeProvider,
  StageThemeSetterProvider,
  useStageThemeState,
} from '../../components/dashboard/Stage'
import { getAuthToken } from '../../utils/auth'
import { usePresenceReporter } from '../../services/presenceReporter'
import { useMessagingAppearance } from '../../services/messageAppearance'
import { useToast } from '../../components/ui/Toast'
import { cn } from '../../lib/utils'

export function AgentLayout() {
  const { agentId } = useParams<{ agentId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [authChecked, setAuthChecked] = useState(false)
  const basePath = agentId ? `/${agentId}` : ''
  const appearance = useMessagingAppearance()
  const isMessagesRoute = location.pathname.includes('/messages')
  const [stageTheme, setStageTheme] = useStageThemeState()
  const dark = stageTheme === 'dark'
  const mainRef = useRef<HTMLElement>(null)
  usePresenceReporter()

  /* Keep-alive cache — visited modules stay mounted so switching is instant */
  const outlet = useOutlet()
  const sectionCache = useRef<Map<string, ReactElement>>(new Map())
  const restPath = location.pathname.startsWith(basePath)
    ? location.pathname.slice(basePath.length)
    : location.pathname
  const sectionKey = restPath.split('/')[1] || 'dashboard'
  if (outlet) sectionCache.current.set(sectionKey, outlet)

  /* Per-section scroll memory */
  const scrollMem = useRef<Map<string, number>>(new Map())
  const lastNav = useRef({ section: sectionKey, path: location.pathname })

  /* Keep the page backdrop in sync with the stage theme — no white flashes */
  useEffect(() => {
    const bg = dark ? '#0B1022' : '#DFF6F0'
    document.body.style.backgroundColor = bg
    document.documentElement.style.backgroundColor = bg
  }, [dark])

  /* Scroll restore on module switch, scroll-to-top on inner navigation */
  useEffect(() => {
    const main = mainRef.current
    if (!main) return
    const prev = lastNav.current
    if (prev.section !== sectionKey) {
      scrollMem.current.set(prev.section, main.scrollTop)
      main.scrollTop = scrollMem.current.get(sectionKey) ?? 0
    } else if (prev.path !== location.pathname) {
      main.scrollTo({ top: 0 })
    }
    lastNav.current = { section: sectionKey, path: location.pathname }
  }, [location.pathname, sectionKey])

  useEffect(() => {
    const checkAuth = async () => {
      let user: any = null
      try {
        const res = await fetch(`${API_ORIGIN}/api/auth/me`, { credentials: 'include' })
        if (res.ok) user = await res.json()
      } catch (_) {}

      if (!user) {
        const token = getAuthToken()
        if (token) {
          try {
            const res = await fetch(`${API_ORIGIN}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) user = await res.json()
          } catch (_) {}
        }
      }

      if (user) {
        if (user.role !== 'agent') {
          toast('error', "Accès refusé. Vous êtes connecté en tant qu'administrateur.")
          navigate(-1)
          return
        }
        if (String(user.id) !== agentId) {
          toast('error', "Accès refusé. Vous ne pouvez accéder qu'à votre propre compte.")
          navigate(-1)
          return
        }
        setAuthChecked(true)
      } else {
        navigate('/auth/login', { replace: true })
      }
    }
    checkAuth()
  }, [navigate, agentId, toast])

  if (!authChecked) {
    return (
      <div className={cn('flex h-screen items-center justify-center', dark ? 'shell-dark stage-dark' : 'shell-light stage-light')}>
        <div className="orb-icon h-14 w-14 rounded-2xl" style={{ ['--orb-a' as string]: dark ? '#8B7CFF' : '#2DD4BF', ['--orb-b' as string]: dark ? '#5646C9' : '#0D9488' }}>
          <Loader size={22} className="animate-spin text-white" />
        </div>
      </div>
    )
  }

  return (
    <StageThemeProvider value={stageTheme}>
      <StageThemeSetterProvider value={setStageTheme}>
        <div
          className={cn(
            'relative flex h-screen overflow-hidden agent-theme',
            dark ? 'stage-dark shell-dark' : 'stage-light shell-light'
          )}
        >
          {/* Drifting aurora field behind everything */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
            <div
              className="aurora-blob aurora-violet"
              style={{ width: '48vw', height: '52vh', top: '-16%', right: '-6%' }}
            />
            <div
              className="aurora-blob aurora-cyan"
              style={{ width: '46vw', height: '46vh', bottom: '-18%', left: '-8%', animationDelay: '-9s' }}
            />
            <div
              className="aurora-blob aurora-magenta"
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
            style={{ backgroundColor: dark ? '#0B1022' : '#DFF6F0' }}
          />

          <Sidebar basePath={basePath} />

          <div className="relative z-10 flex min-w-0 flex-1 flex-col">
            <Topbar basePath={basePath} />
            <main
              ref={mainRef}
              className={cn(
                'scrollbar-thin relative flex-1 overflow-y-auto p-6',
                isMessagesRoute && appearance.theme === 'dark' && 'dark bg-background'
              )}
            >
              {Array.from(sectionCache.current.entries()).map(([key, element]) => (
                <div
                  key={key}
                  aria-hidden={key !== sectionKey}
                  className={cn(key === sectionKey && 'section-enter')}
                  style={{ display: key === sectionKey ? 'block' : 'none' }}
                >
                  {element}
                </div>
              ))}
            </main>
          </div>
        </div>
      </StageThemeSetterProvider>
    </StageThemeProvider>
  )
}
