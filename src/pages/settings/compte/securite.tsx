import { API_ORIGIN } from '../../../utils/config'
import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Switch } from '../../../components/ui/Switch'
import { Dialog } from '../../../components/ui/Dialog'
import { useToast } from '../../../components/ui/Toast'
import { getAuthToken, getSessionId } from '../../../utils/auth'
import TwoFactorSetup from '../../../components/auth/TwoFactorSetup'
import { getDeviceInfo, getPublicIP } from '../../../utils/device'
import { Shield, Smartphone, Monitor, AlertTriangle, User, Sun, Lock, Loader, LogOut, XCircle, Clock, Globe, Eye, EyeOff, ArrowLeft } from 'react-feather'
import { motion } from 'framer-motion'
import {
  Stage,
  StageBadge,
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'

interface Session {
  id: number
  device_browser: string
  device_os: string
  ip_address: string
  login_time: string
  last_activity: string
  is_active: boolean
  expires_at: string
}

function CompteTabs({ basePath }: { basePath: string }) {
  const location = useLocation()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const tabs = [
    { label: 'Profil', icon: User, to: `${basePath}/profil` },
    { label: 'Sécurité', icon: Shield, to: `${basePath}/securite` },
    { label: 'Préférences', icon: Sun, to: `${basePath}/preferences` },
  ]
  return (
    <div className="stage-glass flex gap-1 p-1 w-fit rounded-2xl">
      {tabs.map(tab => {
        const TabIcon = tab.icon
        const isActive = location.pathname === tab.to
        return (
          <NavLink key={tab.to} to={tab.to} className={`relative flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${isActive ? 'text-white' : isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-teal-900'}`}>
            {isActive && <motion.span layoutId="compte-tab-pill-sec" className="absolute inset-0 rounded-xl border border-white/20" style={{ backgroundImage: isDark ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)' : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)' }} transition={{ type: 'spring', stiffness: 380, damping: 32 } as any} />}
            <TabIcon size={14} className="relative z-10" /><span className="relative z-10">{tab.label}</span>
          </NavLink>
        )
      })}
    </div>
  )
}

export default function SecuriteSettingsPage() {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [twoFALoading, setTwoFALoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showTwoFASetup, setShowTwoFASetup] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [disabling, setDisabling] = useState(false)
  const [disableError, setDisableError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changing, setChanging] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [terminateTarget, setTerminateTarget] = useState<Session | null>(null)
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false)
  const [showRevokeOthersConfirm, setShowRevokeOthersConfirm] = useState(false)
  const [showRevokeAllConfirm, setShowRevokeAllConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentDeviceIP, setCurrentDeviceIP] = useState<string | undefined>(undefined)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyFilter, setHistoryFilter] = useState<'Toutes' | 'Succès' | 'Échec'>('Toutes')
  const [historyOffset, setHistoryOffset] = useState(0)
  const limit = 20
  const { toast } = useToast()

  const fetch2FAStatus = async () => {
    setTwoFALoading(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_ORIGIN}/api/auth/2fa/status`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const data = await res.json(); setTwoFAEnabled(data.two_factor_enabled) }
    } catch (_) {}
    setTwoFALoading(false)
  }
  const fetchSessions = async () => {
    setSessionsLoading(true)
    try {
      const token = getAuthToken()
      const sessionId = getSessionId()
      const deviceInfo = { ...(await getDeviceInfo()), ...(currentDeviceIP ? { ip: currentDeviceIP } : {}) }
      const query = sessionId ? `?currentSessionId=${sessionId}` : ''
      const res = await fetch(`${API_ORIGIN}/api/auth/sessions${query}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ deviceInfo }) })
      if (res.ok) { const data = await res.json(); setSessions(data.sessions) }
    } catch (_) {}
    setSessionsLoading(false)
  }
  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_ORIGIN}/api/auth/sessions/history?limit=${limit}&offset=${historyOffset}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        let items = data.history
        if (historyFilter === 'Succès') items = items.filter((e: any) => e.status === 'success')
        else if (historyFilter === 'Échec') items = items.filter((e: any) => e.status === 'failure')
        setHistory(items); setHistoryTotal(data.total)
      }
    } catch (_) {}
    setHistoryLoading(false)
  }
  useEffect(() => { fetch2FAStatus(); fetchSessions(); getPublicIP().then(setCurrentDeviceIP) }, [])
  useEffect(() => { fetchHistory() }, [historyOffset, historyFilter])
  const currentSessionId = getSessionId()
  const displayIP = (ip: string) => { if (!ip || ip === '::1' || ip === 'Inconnue') return currentDeviceIP || ip; return ip }
  const formatDateTime = (iso: string) => { const d = new Date(iso); return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  const getSessionStatus = (session: Session) => {
    const now = Date.now(); const last = new Date(session.last_activity).getTime(); const diffMin = (now - last) / 60000; const expires = new Date(session.expires_at).getTime()
    if (expires < now || diffMin > 30) return { label: 'Expirée', color: 'text-slate-500' }
    if (diffMin < 5) return { label: 'Actif', color: 'text-emerald-500' }
    return { label: 'Inactif', color: 'text-amber-500' }
  }
  const handleTerminate = async () => {
    if (!terminateTarget) return; setActionLoading(true)
    try { const token = getAuthToken(); const res = await fetch(`${API_ORIGIN}/api/auth/sessions/${terminateTarget.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (res.ok) { toast('success', 'Session terminée'); setShowTerminateConfirm(false); setTerminateTarget(null); fetchSessions() } else toast('error', 'Erreur lors de la déconnexion') } catch (_) { toast('error', 'Erreur réseau') }
    setActionLoading(false)
  }
  const handleRevokeOthers = async () => {
    const sessionId = currentSessionId; if (!sessionId) { toast('error', 'Session introuvable'); return }; setActionLoading(true)
    try { const token = getAuthToken(); const res = await fetch(`${API_ORIGIN}/api/auth/sessions/revoke-others`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ currentSessionId: sessionId }) }); if (res.ok) { toast('success', 'Toutes les autres sessions ont été déconnectées'); setShowRevokeOthersConfirm(false); fetchSessions() } else toast('error', 'Erreur lors de la déconnexion') } catch (_) { toast('error', 'Erreur réseau') }
    setActionLoading(false)
  }
  const handleRevokeAll = async () => {
    setActionLoading(true)
    try { const token = getAuthToken(); const res = await fetch(`${API_ORIGIN}/api/auth/sessions/revoke-all`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); if (res.ok) { toast('success', 'Toutes les sessions ont été déconnectées'); setShowRevokeAllConfirm(false); setSessions([]) } else toast('error', 'Erreur lors de la déconnexion') } catch (_) { toast('error', 'Erreur réseau') }
    setActionLoading(false)
  }
  const handleDisable2FA = async () => {
    setDisableError(''); if (!disablePassword) { setDisableError('Mot de passe requis'); return }; setDisabling(true)
    try { const token = getAuthToken(); const res = await fetch(`${API_ORIGIN}/api/auth/2fa/disable`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ password: disablePassword }) }); const data = await res.json(); if (res.ok) { setTwoFAEnabled(false); setShowDisableDialog(false); setDisablePassword(''); toast('success', 'Authentification à deux facteurs désactivée') } else setDisableError(data.error || 'Mot de passe incorrect') } catch (_) { setDisableError('Erreur réseau') }
    setDisabling(false)
  }
  const handleChangePassword = async () => {
    setPasswordError(''); if (!newPassword || !confirmPassword) { setPasswordError('Tous les champs sont requis'); return }; if (newPassword.length < 6) { setPasswordError('Le mot de passe doit contenir au moins 6 caractères'); return }; if (newPassword !== confirmPassword) { setPasswordError('Les mots de passe ne correspondent pas'); return }; setChanging(true)
    try { const token = getAuthToken(); const res = await fetch(`${API_ORIGIN}/api/auth/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ newPassword }) }); const data = await res.json(); if (res.ok) { toast('success', 'Mot de passe modifié avec succès'); setShowPasswordModal(false); setNewPassword(''); setConfirmPassword('') } else setPasswordError(data.error || 'Erreur lors du changement de mot de passe') } catch (_) { setPasswordError('Erreur réseau') }
    setChanging(false)
  }

  const location = useLocation()
  const basePath = location.pathname.substring(0, location.pathname.lastIndexOf('/'))

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5 hover:text-white' : 'border-teal-900/10 text-slate-600 hover:bg-white'}`}> <ArrowLeft size={13} /> Retour </button>
          <CompteTabs basePath={basePath} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /></span>
            <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Mon compte · Sécurité</p>
          </div>
          <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Sécurité</h1>
          <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>Protégez votre compte et surveillez vos sessions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="stage-glass p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <OrbIcon icon={Shield} hue={STAGE_HUES.violet} size={40} radius={12} />
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Mot de passe</h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Dernière modification : il y a 45 jours</p>
                </div>
              </div>
              <StageButton variant="glass" size="sm" onClick={() => setShowPasswordModal(true)}>Changer</StageButton>
            </div>
          </div>

          <div className="stage-glass p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <OrbIcon icon={Smartphone} hue={STAGE_HUES.sky} size={40} radius={12} />
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Authentification à deux facteurs</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {twoFALoading ? <Loader size={14} className="animate-spin text-slate-400" /> : <>
                      <StageBadge variant={twoFAEnabled ? 'ok' : 'neutral'}>{twoFAEnabled ? 'Activé' : 'Désactivé'}</StageBadge>
                      <Switch checked={twoFAEnabled} onCheckedChange={checked => { if (checked) setShowTwoFASetup(true); else setShowDisableDialog(true) }} />
                    </>}
                  </div>
                </div>
              </div>
              <StageButton variant="glass" size="sm" onClick={() => setShowTwoFASetup(true)} disabled={twoFAEnabled}>Configurer</StageButton>
            </div>
          </div>
        </div>

        <TwoFactorSetup isOpen={showTwoFASetup} onClose={() => setShowTwoFASetup(false)} onComplete={fetch2FAStatus} />

        <div className="stage-glass p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <OrbIcon icon={Monitor} hue={STAGE_HUES.emerald} size={36} radius={11} />
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sessions actives</h3>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sessionsLoading ? 'Chargement...' : `${sessions.length} session${sessions.length > 1 ? 's' : ''}`}{currentDeviceIP && <span className="inline-flex items-center gap-1 ml-2"><Globe size={10} />{currentDeviceIP}</span>}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <StageButton variant="glass" size="sm" onClick={() => setShowRevokeOthersConfirm(true)} disabled={sessions.length <= 1}>Déconnecter les autres</StageButton>
              <StageButton variant="glass" size="sm" onClick={() => setShowRevokeAllConfirm(true)} disabled={sessions.length === 0}><AlertTriangle size={13} /> Tout déconnecter</StageButton>
            </div>
          </div>

          {sessionsLoading ? <div className="flex items-center justify-center py-10"><Loader size={20} className="animate-spin text-slate-400" /></div> : sessions.length === 0 ? <div className="text-center py-10"><Monitor size={24} className="text-slate-400/40 mx-auto mb-2" /><p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Aucune session active</p></div> : (
            <div className="space-y-2">
              {sessions.map(session => {
                const isCurrent = session.id === currentSessionId
                const status = getSessionStatus(session)
                const isTerminated = !session.is_active || status.label === 'Expirée'
                return (
                  <div key={session.id} className={`flex flex-wrap items-start justify-between gap-3 p-3 rounded-2xl border transition-all ${isCurrent ? (isDark ? 'bg-violet-500/10 border-violet-400/20' : 'bg-teal-50 border-teal-500/20') : isDark ? 'border-white/5 hover:bg-white/[0.03]' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2 rounded-xl mt-0.5 ${isTerminated ? (isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400') : isCurrent ? (isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-teal-100 text-teal-700') : isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}><Monitor size={15} /></div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{session.device_browser || 'Navigateur inconnu'}</p>
                          {isCurrent && <StageBadge variant="violet" className="text-[10px]">Cette session</StageBadge>}
                          {isTerminated && <StageBadge variant="neutral" className="text-[10px]">Terminée</StageBadge>}
                          <StageBadge variant={status.label === 'Actif' ? 'ok' : status.label === 'Inactif' ? 'warn' : 'neutral'} className="text-[10px]">{status.label}</StageBadge>
                        </div>
                        <div className={`flex items-center gap-2 mt-1 text-xs flex-wrap ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span>{session.device_os || 'OS inconnu'}</span><span className="opacity-30">|</span><span className="font-mono">{displayIP(session.ip_address)}</span><span className="opacity-30">|</span><span className="flex items-center gap-1"><Clock size={10} />{formatDateTime(session.login_time)}</span>
                        </div>
                      </div>
                    </div>
                    {!isCurrent && !isTerminated && <StageButton variant="glass" size="sm" onClick={() => { setTerminateTarget(session); setShowTerminateConfirm(true) }}><XCircle size={13} /> Déconnecter</StageButton>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="stage-glass p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <OrbIcon icon={Clock} hue={STAGE_HUES.amber} size={36} radius={11} />
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Historique des connexions</h3>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{historyLoading ? 'Chargement...' : `${historyTotal} tentative${historyTotal > 1 ? 's' : ''}`}</p>
              </div>
            </div>
            <div className={`flex rounded-xl border p-1 gap-1 ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-slate-50'}`}>
              {(['Toutes', 'Succès', 'Échec'] as const).map(f => (
                <button key={f} onClick={() => { setHistoryFilter(f); setHistoryOffset(0) }} className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${historyFilter === f ? 'text-white shadow' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`} style={historyFilter === f ? { backgroundImage: isDark ? 'linear-gradient(135deg, #8B7CFF, #6C5ECF)' : 'linear-gradient(135deg, #2DD4BF, #0D9488)' } : undefined}>{f}</button>
              ))}
            </div>
          </div>
          {historyLoading ? <div className="flex items-center justify-center py-10"><Loader size={20} className="animate-spin text-slate-400" /></div> : history.length === 0 ? <div className="text-center py-10"><Clock size={24} className="text-slate-400/40 mx-auto mb-2" /><p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Aucun historique</p></div> : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead><tr className={`border-b ${isDark ? 'border-white/5' : 'border-slate-100'} text-left text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><th className="pb-2 pr-4 font-bold uppercase tracking-wider">Date</th><th className="pb-2 pr-4 font-bold uppercase tracking-wider">Navigateur</th><th className="pb-2 pr-4 font-bold uppercase tracking-wider">IP</th><th className="pb-2 pr-4 font-bold uppercase tracking-wider">Statut</th><th className="pb-2 font-bold uppercase tracking-wider">Raison</th></tr></thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-50'}`}>{history.map((entry: any) => { const isSuccess = entry.status === 'success'; return <tr key={entry.id} className={`${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'} transition-colors`}><td className={`py-3 pr-4 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{formatDateTime(entry.created_at)}</td><td className={`py-3 pr-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{entry.device_browser || 'Inconnu'}{entry.device_os ? ` / ${entry.device_os}` : ''}</td><td className={`py-3 pr-4 font-mono text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{displayIP(entry.ip_address)}</td><td className="py-3 pr-4"><StageBadge variant={isSuccess ? 'ok' : 'danger'}>{isSuccess ? 'Succès' : 'Échec'}</StageBadge></td><td className={`py-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{entry.failure_reason || '—'}</td></tr> })}</tbody>
              </table>
            </div>
          )}
          {historyTotal > limit && (
            <div className="flex justify-center gap-2 mt-4">
              <StageButton variant="glass" size="sm" disabled={historyOffset === 0} onClick={() => setHistoryOffset(Math.max(0, historyOffset - limit))}>Précédent</StageButton>
              <span className={`flex items-center text-xs px-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{historyOffset + 1}–{Math.min(historyOffset + limit, historyTotal)} sur {historyTotal}</span>
              <StageButton variant="glass" size="sm" disabled={historyOffset + limit >= historyTotal} onClick={() => setHistoryOffset(historyOffset + limit)}>Suivant</StageButton>
            </div>
          )}
        </div>

        <Dialog isOpen={showTerminateConfirm} onClose={() => { setShowTerminateConfirm(false); setTerminateTarget(null) }} title="Déconnecter cette session" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Êtes-vous sûr de vouloir déconnecter cette session ?</p>
            {terminateTarget && <div className="rounded-xl bg-background border border-border/50 p-3 text-sm space-y-1"><p><span className="text-text-secondary">Appareil :</span> {terminateTarget.device_browser} — {terminateTarget.device_os}</p><p><span className="text-text-secondary">IP :</span> {displayIP(terminateTarget.ip_address)}</p></div>}
            <div className="flex justify-end gap-3 pt-2"><Button variant="outline" onClick={() => { setShowTerminateConfirm(false); setTerminateTarget(null) }}>Annuler</Button><Button variant="danger" onClick={handleTerminate} loading={actionLoading}>Déconnecter</Button></div>
          </div>
        </Dialog>
        <Dialog isOpen={showRevokeOthersConfirm} onClose={() => setShowRevokeOthersConfirm(false)} title="Déconnecter les autres sessions" size="sm">
          <div className="space-y-4"><div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3"><AlertTriangle size={14} className="text-amber-600 mt-0.5" /><p className="text-xs text-amber-800">Toutes les autres sessions seront déconnectées.</p></div><div className="flex justify-end gap-3 pt-2"><Button variant="outline" onClick={() => setShowRevokeOthersConfirm(false)}>Annuler</Button><Button variant="danger" onClick={handleRevokeOthers} loading={actionLoading}>Confirmer</Button></div></div>
        </Dialog>
        <Dialog isOpen={showRevokeAllConfirm} onClose={() => setShowRevokeAllConfirm(false)} title="Déconnecter toutes les sessions" size="sm">
          <div className="space-y-4"><div className="flex items-start gap-3 bg-error/5 border border-error/20 rounded-xl p-3"><AlertTriangle size={14} className="text-error mt-0.5" /><p className="text-xs text-error">Vous serez déconnecté de tous vos appareils.</p></div><div className="flex justify-end gap-3 pt-2"><Button variant="outline" onClick={() => setShowRevokeAllConfirm(false)}>Annuler</Button><Button variant="danger" onClick={handleRevokeAll} loading={actionLoading}>Tout déconnecter</Button></div></div>
        </Dialog>
        <Dialog isOpen={showDisableDialog} onClose={() => { setShowDisableDialog(false); setDisablePassword(''); setDisableError('') }} title="Désactiver la 2FA" size="sm">
          <div className="space-y-4"><p className="text-sm text-text-secondary">Confirmez votre mot de passe pour désactiver la 2FA.</p><Input label="Mot de passe" type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} icon={<Lock size={14} />} />{disableError && <p className="text-xs text-error">{disableError}</p>}<div className="flex justify-end gap-3 pt-2"><Button variant="outline" onClick={() => { setShowDisableDialog(false); setDisablePassword(''); setDisableError('') }}>Annuler</Button><Button variant="danger" onClick={handleDisable2FA} loading={disabling}>Désactiver</Button></div></div>
        </Dialog>
        <Dialog isOpen={showPasswordModal} onClose={() => { setShowPasswordModal(false); setPasswordError(''); setShowNewPassword(false); setShowConfirmPassword(false) }} title="Changer mon mot de passe" size="sm">
          <div className="space-y-4">
            <Input label="Nouveau mot de passe" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} icon={<Lock size={14} />} suffix={<button type="button" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>} autoFocus />
            <Input label="Confirmer le mot de passe" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} icon={<Lock size={14} />} suffix={<button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
            {passwordError && <p className="text-xs text-error">{passwordError}</p>}
            <div className="flex justify-end gap-3 pt-2"><Button variant="outline" onClick={() => { setShowPasswordModal(false); setPasswordError('') }}>Annuler</Button><Button variant="default" onClick={handleChangePassword} loading={changing}>Enregistrer</Button></div>
          </div>
        </Dialog>
      </div>
    </Stage>
  )
}
