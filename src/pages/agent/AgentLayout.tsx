import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Loader } from 'react-feather'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import { getAuthToken } from '../../utils/auth'
import { usePresenceReporter } from '../../services/presenceReporter'
import { useMessagingAppearance } from '../../services/messageAppearance'
import { useToast } from '../../components/ui/Toast'
import { cn } from '../../lib/utils'

export function AgentLayout({ children }: { children: React.ReactNode }) {
  const { agentId } = useParams<{ agentId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [authChecked, setAuthChecked] = useState(false)
  const basePath = agentId ? `/${agentId}` : ''
  const appearance = useMessagingAppearance()
  const isMessagesRoute = location.pathname.includes('/messages')
  usePresenceReporter()

  useEffect(() => {
    const checkAuth = async () => {
      let user: any = null
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', { credentials: 'include' })
        if (res.ok) user = await res.json()
      } catch (_) {}

      if (!user) {
        const token = getAuthToken()
        if (token) {
          try {
            const res = await fetch('http://localhost:5000/api/auth/me', {
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
      <div className="flex h-screen items-center justify-center bg-background agent-theme">
        <Loader size={32} className="animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background agent-theme">
      <Sidebar basePath={basePath} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar basePath={basePath} />
        <main className={cn('flex-1 overflow-y-auto p-6 scrollbar-thin', isMessagesRoute && appearance.theme === 'dark' && 'dark bg-background')}>
          {children}
        </main>
      </div>
    </div>
  )
}
