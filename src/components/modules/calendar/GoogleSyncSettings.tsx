import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, RefreshCw, CheckCircle, AlertCircle } from 'react-feather'
import { cn } from '../../../lib/utils'
import { useStageChrome } from './useStageChrome'
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

  /* Cosmic chrome (Mission Control / Lagoon) with token fallback for admin */
  const { staged, dark } = useStageChrome()
  const t = (darkCls: string, lightCls: string) => (staged ? (dark ? darkCls : lightCls) : '')
  const primaryBtn =
    'w-full inline-flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-50 ' +
    (staged
      ? dark
        ? 'border border-white/25 bg-gradient-to-b from-[#8B7CFF] to-[#5646C9] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_26px_-8px_rgba(124,92,255,0.8)] hover:brightness-110'
        : 'border border-white/50 bg-gradient-to-b from-teal-400 to-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_26px_-10px_rgba(13,148,136,0.7)] hover:brightness-105'
      : '')
  const dangerBtn = staged
    ? dark
      ? 'w-full inline-flex items-center justify-center gap-2 h-9 rounded-xl border border-rose-400/30 bg-rose-500/10 text-sm font-semibold text-rose-300 transition-all duration-200 hover:bg-rose-500/20 active:scale-[0.98]'
      : 'w-full inline-flex items-center justify-center gap-2 h-9 rounded-xl border border-rose-500/30 bg-rose-500/10 text-sm font-semibold text-rose-700 transition-all duration-200 hover:bg-rose-500/20 active:scale-[0.98]'
    : 'btn-secondary text-sm text-error w-full'
  const toggleTrack = (on: boolean) =>
    !staged
      ? on ? 'bg-accent' : 'bg-border'
      : dark
        ? on
          ? 'bg-gradient-to-r from-violet-500 to-indigo-500 shadow-[0_0_12px_-2px_rgba(124,92,255,0.9)]'
          : 'bg-white/10'
        : on
          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 shadow-[0_0_12px_-2px_rgba(13,148,136,0.8)]'
          : 'bg-teal-900/15'

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
          <div className={cn('overflow-hidden', staged ? 'stage-glass' : 'bg-card rounded-xl border border-border/50 shadow-card')}>
            <button
              onClick={() => setExpanded(!expanded)}
              className={cn('w-full flex items-center justify-between px-3 py-2 transition-colors', t('hover:bg-white/[0.04]', 'hover:bg-teal-900/[0.04]'))}
            >
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className={cn(t('text-violet-300 drop-shadow-[0_0_6px_rgba(139,124,255,0.8)]', 'text-teal-700'), !staged && 'text-accent')} />
          <span className={cn('text-sm font-medium', t('text-slate-100', 'text-teal-950'))}>Synchronisation Google</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('flex items-center gap-1 text-xs', connected ? cn('font-semibold', t('text-emerald-300', 'text-emerald-700'), !staged && 'text-emerald-600') : t('text-slate-500', 'text-teal-900/45'))}>
            {loading ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : connected ? (
              <CheckCircle size={12} />
            ) : (
              <AlertCircle size={12} />
            )}
            {connected ? 'Connecté' : 'Non connecté'}
          </span>
          <ChevronDown size={14} className={cn('transition-transform', t('text-slate-500', 'text-teal-900/40'), !staged && 'text-text-secondary', expanded && 'rotate-180')} />
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
            <div className={cn('px-3 pb-3 space-y-3 border-t pt-2', staged ? (dark ? 'border-white/[0.07]' : 'border-teal-900/[0.10]') : 'border-border/30')}>
              {message && (
                <div className={cn(
                  'flex items-start gap-2 text-xs p-2 rounded-lg',
                  message.type === 'success'
                    ? staged
                      ? dark
                        ? 'bg-emerald-500/10 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.25)]'
                        : 'bg-emerald-500/10 text-emerald-800 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.35)]'
                      : 'bg-emerald-50 text-emerald-700'
                    : staged
                      ? dark
                        ? 'bg-rose-500/10 text-rose-300 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.25)]'
                        : 'bg-rose-500/10 text-rose-700 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.3)]'
                      : 'bg-red-50 text-red-700'
                )}>
                  {message.type === 'success' ? <CheckCircle size={13} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}

              {!connected ? (
                <div className="space-y-2.5">
                  <div className={cn('flex items-center gap-2 text-sm', t('text-slate-300', 'text-teal-950/85'), !staged && 'text-text')}>
                    <AlertCircle size={14} className={t('text-slate-500', 'text-teal-900/45')} />
                    <span>Aucun compte Google connecté. Connectez votre agenda pour synchroniser vos événements CRM.</span>
                  </div>
                  <button onClick={handleConnect} disabled={loading} className={cn(primaryBtn, !staged && 'btn-primary text-sm w-full')}>
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Chargement...' : 'Se connecter à Google'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={cn('flex items-center gap-2 text-sm', t('text-slate-200', 'text-teal-950/90'), !staged && 'text-text')}>
                    <CheckCircle size={14} className={cn('text-emerald-500', staged && dark && 'drop-shadow-[0_0_6px_rgba(52,211,153,0.9)]')} />
                    Connecté avec <span className="font-medium">{email || 'votre compte Google'}</span>
                  </div>

                  <div className="space-y-2">
                    <p className={cn('text-xs font-medium uppercase tracking-wider', t('text-[10px] font-bold tracking-[0.18em] text-slate-500', 'text-[10px] font-bold tracking-[0.18em] text-teal-900/45'), !staged && 'text-text-secondary')}>Paramètres</p>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={cn('text-sm', t('text-slate-200', 'text-teal-950/90'), !staged && 'text-text')}>CRM → Google Agenda</span>
                      <button
                        onClick={() => setSyncDirection('crm-to-google')}
                        className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200', toggleTrack(syncDirection === 'crm-to-google'))}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${syncDirection === 'crm-to-google' ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={cn('text-sm', t('text-slate-200', 'text-teal-950/90'), !staged && 'text-text')}>Google Agenda → CRM</span>
                      <button
                        onClick={() => setSyncDirection('google-to-crm')}
                        className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200', toggleTrack(syncDirection === 'google-to-crm'))}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${syncDirection === 'google-to-crm' ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </label>
                  </div>

                  <div
                    className={cn(
                      'rounded-lg px-2.5 py-2 text-xs tabular-nums',
                      t('bg-white/[0.03] text-slate-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]', 'bg-white/60 text-teal-900/60 shadow-[inset_0_0_0_1px_rgba(13,148,136,0.12)]'),
                      !staged && 'text-text-secondary',
                    )}
                  >
                    {lastSync ? `Dernière synchronisation : ${lastSync}` : 'Aucune synchronisation effectuée'}
                    {expiresAt && (
                      <span className="block mt-0.5">
                        Jeton expirant le {new Date(expiresAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <button onClick={handleSync} disabled={syncing || autoActive} className={cn(primaryBtn, !staged && 'btn-primary text-sm w-full')}>
                      <RefreshCw size={14} className={syncing || autoActive ? 'animate-spin' : ''} />
                      {syncing ? 'Synchronisation...' : autoActive ? 'Synchronisation automatique' : 'Synchroniser maintenant'}
                    </button>
                    <button onClick={handleDisconnect} className={cn(dangerBtn, !staged && 'btn-secondary text-sm text-error w-full')}>
                      Déconnecter
                    </button>
                  </div>
                  {autoActive && (
                    <p className={cn('text-xs', t('text-slate-500', 'text-teal-900/50'), !staged && 'text-text-secondary')}>
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
