import { API_ORIGIN } from '../../../utils/config'
import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Switch } from '../../../components/ui/Switch'
import { Dialog } from '../../../components/ui/Dialog'
import { BackLink } from '../../../components/ui/BackLink'
import { useToast } from '../../../components/ui/Toast'
import { getAuthToken, getSessionId } from '../../../utils/auth'
import TwoFactorSetup from '../../../components/auth/TwoFactorSetup'
import { getDeviceInfo, getPublicIP } from '../../../utils/device'
import { Shield, Smartphone, Monitor, AlertTriangle, User, Sun, Lock, Loader, LogOut, XCircle, Clock, Globe, Eye, EyeOff } from 'react-feather'

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

export default function SecuriteSettingsPage() {
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
      const res = await fetch(`${API_ORIGIN}/api/auth/2fa/status`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTwoFAEnabled(data.two_factor_enabled)
      }
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
      const res = await fetch(`${API_ORIGIN}/api/auth/sessions${query}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deviceInfo })
      })
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions)
      }
    } catch (_) {}
    setSessionsLoading(false)
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_ORIGIN}/api/auth/sessions/history?limit=${limit}&offset=${historyOffset}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        let items = data.history
        if (historyFilter === 'Succès') items = items.filter((e: any) => e.status === 'success')
        else if (historyFilter === 'Échec') items = items.filter((e: any) => e.status === 'failure')
        setHistory(items)
        setHistoryTotal(data.total)
      }
    } catch (_) {}
    setHistoryLoading(false)
  }

  useEffect(() => {
    fetch2FAStatus()
    fetchSessions()
    getPublicIP().then(setCurrentDeviceIP)
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [historyOffset, historyFilter])

  const currentSessionId = getSessionId()

  const displayIP = (ip: string) => {
    if (!ip || ip === '::1' || ip === 'Inconnue') return currentDeviceIP || ip
    return ip
  }

  const formatDateTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const getSessionStatus = (session: Session) => {
    const now = Date.now()
    const last = new Date(session.last_activity).getTime()
    const diffMin = (now - last) / 60000
    const expires = new Date(session.expires_at).getTime()
    if (expires < now || diffMin > 30) return { label: 'Expirée', color: 'text-text-secondary' }
    if (diffMin < 5) return { label: 'Actif', color: 'text-emerald-600' }
    return { label: 'Inactif', color: 'text-amber-600' }
  }

  const handleTerminate = async () => {
    if (!terminateTarget) return
    setActionLoading(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_ORIGIN}/api/auth/sessions/${terminateTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast('success', 'Session terminée')
        setShowTerminateConfirm(false)
        setTerminateTarget(null)
        fetchSessions()
      } else {
        toast('error', 'Erreur lors de la déconnexion')
      }
    } catch (_) {
      toast('error', 'Erreur réseau')
    }
    setActionLoading(false)
  }

  const handleRevokeOthers = async () => {
    const sessionId = currentSessionId
    if (!sessionId) { toast('error', 'Session introuvable'); return }
    setActionLoading(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_ORIGIN}/api/auth/sessions/revoke-others`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentSessionId: sessionId })
      })
      if (res.ok) {
        toast('success', 'Toutes les autres sessions ont été déconnectées')
        setShowRevokeOthersConfirm(false)
        fetchSessions()
      } else {
        toast('error', 'Erreur lors de la déconnexion')
      }
    } catch (_) {
      toast('error', 'Erreur réseau')
    }
    setActionLoading(false)
  }

  const handleRevokeAll = async () => {
    setActionLoading(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_ORIGIN}/api/auth/sessions/revoke-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast('success', 'Toutes les sessions ont été déconnectées')
        setShowRevokeAllConfirm(false)
        setSessions([])
      } else {
        toast('error', 'Erreur lors de la déconnexion')
      }
    } catch (_) {
      toast('error', 'Erreur réseau')
    }
    setActionLoading(false)
  }

  const handleDisable2FA = async () => {
    setDisableError('')
    if (!disablePassword) { setDisableError('Mot de passe requis'); return }
    setDisabling(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_ORIGIN}/api/auth/2fa/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: disablePassword })
      })
      const data = await res.json()
      if (res.ok) {
        setTwoFAEnabled(false)
        setShowDisableDialog(false)
        setDisablePassword('')
        toast('success', 'Authentification à deux facteurs désactivée')
      } else {
        setDisableError(data.error || 'Mot de passe incorrect')
      }
    } catch (_) {
      setDisableError('Erreur réseau')
    }
    setDisabling(false)
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    if (!newPassword || !confirmPassword) {
      setPasswordError('Tous les champs sont requis')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }
    setChanging(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_ORIGIN}/api/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      })
      const data = await res.json()
      if (res.ok) {
        toast('success', 'Mot de passe modifié avec succès')
        setShowPasswordModal(false)
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordError(data.error || 'Erreur lors du changement de mot de passe')
      }
    } catch (_) {
      setPasswordError('Erreur réseau')
    }
    setChanging(false)
  }

  const location = useLocation()
  const basePath = location.pathname.substring(0, location.pathname.lastIndexOf('/'))
  const compteTabs = [
    { label: 'Profil', icon: User, to: `${basePath}/profil` },
    { label: 'Sécurité', icon: Shield, to: `${basePath}/securite` },
    { label: 'Préférences', icon: Sun, to: `${basePath}/preferences` },
  ]

  return (
    <div className="space-y-6">
      <BackLink />
      <div className="flex gap-1 p-1 rounded-lg bg-background border border-border/50 w-fit">
        {compteTabs.map((tab) => {
          const TabIcon = tab.icon
          const isActive = location.pathname === tab.to
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive
                  ? 'bg-card text-text shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <TabIcon size={15} />
              {tab.label}
            </NavLink>
          )
        })}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Sécurité</h1>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-accent-light text-accent mt-0.5">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Mot de passe</h3>
              <p className="text-xs text-text-secondary mt-1">Dernière modification : il y a 45 jours</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>Changer mon mot de passe</Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-accent-light text-accent mt-0.5">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Authentification à deux facteurs (2FA)</h3>
              <div className="flex items-center gap-2 mt-2">
                {twoFALoading ? (
                  <Loader size={14} className="animate-spin text-text-secondary" />
                ) : (
                  <>
                    <span className={`text-xs font-medium ${twoFAEnabled ? 'text-emerald-600' : 'text-text-secondary'}`}>
                      {twoFAEnabled ? 'Activé (recommandé)' : 'Désactivé'}
                    </span>
                    <Switch
                      checked={twoFAEnabled}
                      onCheckedChange={(checked) => {
                        if (checked) setShowTwoFASetup(true)
                        else setShowDisableDialog(true)
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowTwoFASetup(true)} disabled={twoFAEnabled}>Configurer</Button>
        </div>
      </Card>
      <TwoFactorSetup
        isOpen={showTwoFASetup}
        onClose={() => setShowTwoFASetup(false)}
        onComplete={fetch2FAStatus}
      />

       <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-sm">Sessions actives</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {sessionsLoading ? 'Chargement...' : `${sessions.length} session${sessions.length > 1 ? 's' : ''} active${sessions.length > 1 ? 's' : ''}`}
            </p>
            {currentDeviceIP && (
              <p className="text-xs text-text-secondary/60 mt-1 flex items-center gap-1">
                <Globe size={10} />
                Cet appareil : <span className="font-mono text-accent">{currentDeviceIP}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowRevokeOthersConfirm(true)} disabled={sessions.length <= 1}>
              <LogOut size={13} className="mr-1" />
              Déconnecter les autres
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowRevokeAllConfirm(true)} disabled={sessions.length === 0}>
              <AlertTriangle size={13} className="mr-1" />
              Tout déconnecter
            </Button>
          </div>
        </div>

        {sessionsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader size={20} className="animate-spin text-text-secondary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10">
            <Monitor size={24} className="text-text-secondary/40 mx-auto mb-2" />
            <p className="text-sm text-text-secondary">Aucune session active</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => {
              const isCurrent = session.id === currentSessionId
              const status = getSessionStatus(session)
              const isTerminated = !session.is_active || status.label === 'Expirée'
              return (
                <div key={session.id} className={`flex items-start justify-between p-3 rounded-lg transition-all ${
                  isCurrent ? 'bg-accent-light/30 border border-accent/20' : 'hover:bg-background'
                }`}>
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-lg mt-0.5 ${
                      isTerminated ? 'bg-text-secondary/10 text-text-secondary' :
                      isCurrent ? 'bg-accent-light text-accent' : 'bg-background text-text-secondary'
                    }`}>
                      <Monitor size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">
                          {session.device_browser || 'Navigateur inconnu'}
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-light text-accent font-medium whitespace-nowrap">
                            Cette session
                          </span>
                        )}
                        {isTerminated && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-text-secondary/10 text-text-secondary font-medium whitespace-nowrap">
                            Terminée
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${
                          status.label === 'Actif' ? 'bg-emerald-50 text-emerald-600' :
                          status.label === 'Inactif' ? 'bg-amber-50 text-amber-600' :
                          'bg-text-secondary/10 text-text-secondary'
                        }`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary flex-wrap">
                        <span>{session.device_os || 'OS inconnu'}</span>
                        <span className="text-border">|</span>
                        <span className="font-mono text-text-secondary/70">{displayIP(session.ip_address)}</span>
                        <span className="text-border">|</span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          Connexion : {formatDateTime(session.login_time)}
                        </span>
                        <span className="text-border">|</span>
                        <span>
                          Dernière activité : {formatDateTime(session.last_activity)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isCurrent && !isTerminated && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 ml-3"
                      onClick={() => { setTerminateTarget(session); setShowTerminateConfirm(true) }}
                    >
                      <XCircle size={13} className="mr-1" />
                      Déconnecter
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Terminate single session confirmation */}
      <Dialog isOpen={showTerminateConfirm} onClose={() => { setShowTerminateConfirm(false); setTerminateTarget(null) }} title="Déconnecter cette session" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Êtes-vous sûr de vouloir déconnecter cette session ?
          </p>
          {terminateTarget && (
            <div className="bg-background rounded-lg p-3 text-sm space-y-1">
              <p><span className="text-text-secondary">Appareil :</span> {terminateTarget.device_browser} — {terminateTarget.device_os}</p>
              <p><span className="text-text-secondary">IP :</span> {displayIP(terminateTarget.ip_address)}</p>
              <p><span className="text-text-secondary">Connecté depuis :</span> {formatDateTime(terminateTarget.login_time)}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowTerminateConfirm(false); setTerminateTarget(null) }}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleTerminate} loading={actionLoading}>
              Déconnecter
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Revoke others confirmation */}
      <Dialog isOpen={showRevokeOthersConfirm} onClose={() => setShowRevokeOthersConfirm(false)} title="Déconnecter toutes les autres sessions" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              Toutes les sessions sur les autres appareils seront immédiatement déconnectées.
              Votre session actuelle restera active.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowRevokeOthersConfirm(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleRevokeOthers} loading={actionLoading}>
              Confirmer
            </Button>
          </div>
        </div>
      </Dialog>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-sm">Historique des connexions</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {historyLoading ? 'Chargement...' : `${historyTotal} tentative${historyTotal > 1 ? 's' : ''} de connexion`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-background rounded-lg border border-border p-0.5">
              {(['Toutes', 'Succès', 'Échec'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setHistoryFilter(f); setHistoryOffset(0) }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    historyFilter === f
                      ? 'bg-card text-text shadow-sm'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader size={20} className="animate-spin text-text-secondary" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10">
            <Clock size={24} className="text-text-secondary/40 mx-auto mb-2" />
            <p className="text-sm text-text-secondary">Aucun historique de connexion</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left text-xs text-text-secondary font-medium pb-2 pr-4 whitespace-nowrap">Date</th>
                  <th className="text-left text-xs text-text-secondary font-medium pb-2 pr-4 whitespace-nowrap">Navigateur / Appareil</th>
                  <th className="text-left text-xs text-text-secondary font-medium pb-2 pr-4 whitespace-nowrap">Adresse IP</th>
                  <th className="text-left text-xs text-text-secondary font-medium pb-2 pr-4 whitespace-nowrap">Statut</th>
                  <th className="text-left text-xs text-text-secondary font-medium pb-2 whitespace-nowrap">Raison (si échec)</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => {
                  const isSuccess = entry.status === 'success'
                  return (
                    <tr key={entry.id} className="border-b border-border/20 last:border-0 hover:bg-background/50 transition-colors">
                      <td className="py-3 pr-4 text-text whitespace-nowrap text-xs">{formatDateTime(entry.created_at)}</td>
                      <td className="py-3 pr-4 text-text whitespace-nowrap">
                        {entry.device_browser || 'Inconnu'}
                        {entry.device_os ? ` / ${entry.device_os}` : ''}
                      </td>
                      <td className="py-3 pr-4 text-text-secondary whitespace-nowrap font-mono text-xs">{displayIP(entry.ip_address)}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-error/5 text-error'
                        }`}>
                          {isSuccess ? 'Succès' : 'Échec'}
                        </span>
                      </td>
                      <td className="py-3 text-text-secondary text-xs">
                        {entry.failure_reason || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {historyTotal > limit && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={historyOffset === 0}
              onClick={() => setHistoryOffset(Math.max(0, historyOffset - limit))}
            >
              Précédent
            </Button>
            <span className="flex items-center text-xs text-text-secondary px-2">
              {historyOffset + 1}–{Math.min(historyOffset + limit, historyTotal)} sur {historyTotal}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={historyOffset + limit >= historyTotal}
              onClick={() => setHistoryOffset(historyOffset + limit)}
            >
              Suivant
            </Button>
          </div>
        )}
      </Card>

      {/* Revoke all confirmation */}
      <Dialog isOpen={showRevokeAllConfirm} onClose={() => setShowRevokeAllConfirm(false)} title="Déconnecter toutes les sessions" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-error/5 border border-error/20 rounded-lg p-3">
            <AlertTriangle size={14} className="text-error mt-0.5 shrink-0" />
            <p className="text-xs text-error">
              Vous allez être déconnecté de <strong>tous</strong> vos appareils, y compris celui-ci.
              Vous devrez vous reconnecter partout.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowRevokeAllConfirm(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleRevokeAll} loading={actionLoading}>
              Tout déconnecter
            </Button>
          </div>
        </div>
      </Dialog>


      <Dialog isOpen={showDisableDialog} onClose={() => { setShowDisableDialog(false); setDisablePassword(''); setDisableError('') }} title="Désactiver la 2FA" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Pour désactiver l'authentification à deux facteurs, veuillez confirmer votre mot de passe.
          </p>
          <Input
            label="Mot de passe"
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            icon={<Lock size={14} />}
          />
          {disableError && <p className="text-xs text-error">{disableError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowDisableDialog(false); setDisablePassword(''); setDisableError('') }}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDisable2FA} loading={disabling}>
              Désactiver
            </Button>
          </div>
        </div>
      </Dialog>
      <Dialog isOpen={showPasswordModal} onClose={() => { setShowPasswordModal(false); setPasswordError(''); setShowNewPassword(false); setShowConfirmPassword(false) }} title="Changer mon mot de passe" size="sm">
        <div className="space-y-4">
          <Input
            label="Nouveau mot de passe"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            icon={<Lock size={14} />}
            suffix={
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="focus:outline-none">
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            autoFocus
          />
          <Input
            label="Confirmer le mot de passe"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock size={14} />}
            suffix={
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="focus:outline-none">
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          {passwordError && (
            <p className="text-xs text-error">{passwordError}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowPasswordModal(false); setPasswordError('') }}>
              Annuler
            </Button>
            <Button variant="default" onClick={handleChangePassword} loading={changing}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
