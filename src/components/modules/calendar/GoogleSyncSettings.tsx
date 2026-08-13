import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, RefreshCw, CheckCircle, AlertCircle } from 'react-feather'
import {
  getGoogleAuthUrl,
  getGoogleConnectionStatus,
  disconnectGoogle,
  syncGoogleCalendar,
} from '../../../services/googleService'
import type { GoogleSyncDirection } from '../../../services/googleService'

interface GoogleSyncSettingsProps {
  isOpen: boolean
  onSynced?: () => void
}

export default function GoogleSyncSettings({ isOpen, onSynced }: GoogleSyncSettingsProps) {
  const [expanded, setExpanded] = useState(false)
  const [syncDirection, setSyncDirection] = useState<GoogleSyncDirection>('crm-to-google')
  const [syncing, setSyncing] = useState(false)
  const [autoActive, setAutoActive] = useState(false)
  const autoRunningRef = useRef(false)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [email, setEmail] = useState('')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const autoMode = connected && syncDirection === 'google-to-crm'

  const loadStatus = useCallback(async () => {
    setLoading(true)
    try {
      const status = await getGoogleConnectionStatus()
      setConnected(status.connected)
      setEmail(status.email || '')
      setExpiresAt(status.expiresAt || null)
    } catch {
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    setExpanded(true)
    loadStatus()
    const googleParam = searchParams.get('google')
    if (googleParam === 'connected') {
      setMessage({ type: 'success', text: 'Compte Google connecté avec succès' })
      setSearchParams({}, { replace: true })
    } else if (googleParam === 'error') {
      setMessage({ type: 'error', text: "La connexion à Google a échoué. Vérifiez que l'URI de redirection est autorisée dans Google Cloud Console." })
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (!autoMode) {
      setAutoActive(false)
      return
    }
    let cancelled = false
    setAutoActive(true)
    const run = async () => {
      if (cancelled || autoRunningRef.current) return
      autoRunningRef.current = true
      try {
        const result = await syncGoogleCalendar('google-to-crm')
        if (result.connected && (result.pulled || 0) > 0 && onSynced) onSynced()
      } catch {
        // keep the automatic loop running; errors are reported by manual sync
      } finally {
        autoRunningRef.current = false
      }
    }
    run()
    const id = setInterval(run, 30000)
    return () => { cancelled = true; setAutoActive(false); clearInterval(id) }
  }, [autoMode, onSynced])

  const handleConnect = async () => {
    setLoading(true)
    try {
      const url = await getGoogleAuthUrl(window.location.pathname)
      window.location.href = url
    } catch {
      setMessage({ type: 'error', text: 'Impossible de générer le lien de connexion Google' })
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setMessage(null)
    try {
      const result = await syncGoogleCalendar(syncDirection)
      if (!result.connected) {
        setMessage({ type: 'error', text: 'Aucun compte Google connecté. Connectez-vous d\'abord.' })
      } else {
        const summary =
          syncDirection === 'crm-to-google'
            ? `${result.pushed || 0} ajouté(s), ${result.updated || 0} mis à jour, ${result.failed || 0} erreur(s).`
            : `${result.pulled || 0} événement(s) mis à jour dans le CRM, ${result.failed || 0} erreur(s).`
        setMessage({ type: 'success', text: `Synchronisation terminée : ${summary}` })
        setLastSync(new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
        if (onSynced) onSynced()
      }
    } catch {
      setMessage({ type: 'error', text: 'La synchronisation a échoué' })
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectGoogle()
      setConnected(false)
      setEmail('')
      setMessage({ type: 'success', text: 'Compte Google déconnecté' })
    } catch {
      setMessage({ type: 'error', text: 'La déconnexion a échoué' })
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between px-3 py-2"
            >
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className="text-accent" />
          <span className="text-sm font-medium">Synchronisation Google</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs ${connected ? 'text-emerald-600' : 'text-text-secondary'}`}>
            {loading ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : connected ? (
              <CheckCircle size={12} />
            ) : (
              <AlertCircle size={12} />
            )}
            {connected ? 'Connecté' : 'Non connecté'}
          </span>
          <ChevronDown size={14} className={`text-text-secondary transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-2">
              {message && (
                <div className={`flex items-start gap-2 text-xs p-2 rounded-lg ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {message.type === 'success' ? <CheckCircle size={13} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}

              {!connected ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm text-text">
                    <AlertCircle size={14} className="text-text-secondary" />
                    <span>Aucun compte Google connecté. Connectez votre agenda pour synchroniser vos événements CRM.</span>
                  </div>
                  <button onClick={handleConnect} disabled={loading} className="btn-primary text-sm w-full">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Chargement...' : 'Se connecter à Google'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-text">
                    <CheckCircle size={14} className="text-emerald-500" />
                    Connecté avec <span className="font-medium">{email || 'votre compte Google'}</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Paramètres</p>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-text">CRM → Google Agenda</span>
                      <button
                        onClick={() => setSyncDirection('crm-to-google')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${syncDirection === 'crm-to-google' ? 'bg-accent' : 'bg-border'}`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${syncDirection === 'crm-to-google' ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-text">Google Agenda → CRM</span>
                      <button
                        onClick={() => setSyncDirection('google-to-crm')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${syncDirection === 'google-to-crm' ? 'bg-accent' : 'bg-border'}`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${syncDirection === 'google-to-crm' ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </label>
                  </div>

                  <div className="text-xs text-text-secondary">
                    {lastSync ? `Dernière synchronisation : ${lastSync}` : 'Aucune synchronisation effectuée'}
                    {expiresAt && (
                      <span className="block mt-0.5">
                        Jeton expirant le {new Date(expiresAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <button onClick={handleSync} disabled={syncing || autoActive} className="btn-primary text-sm w-full">
                      <RefreshCw size={14} className={syncing || autoActive ? 'animate-spin' : ''} />
                      {syncing ? 'Synchronisation...' : autoActive ? 'Synchronisation automatique' : 'Synchroniser maintenant'}
                    </button>
                    <button onClick={handleDisconnect} className="btn-secondary text-sm text-error w-full">
                      Déconnecter
                    </button>
                  </div>
                  {autoActive && (
                    <p className="text-xs text-text-secondary">
                      La synchronisation automatique (Google Agenda → CRM) est active.
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
          </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
