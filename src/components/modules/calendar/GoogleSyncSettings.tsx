import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, RefreshCw, CheckCircle } from 'react-feather'

interface GoogleSyncSettingsProps {
  isOpen: boolean
}

export default function GoogleSyncSettings({ isOpen }: GoogleSyncSettingsProps) {
  const [expanded, setExpanded] = useState(false)
  const [syncCrmToGoogle, setSyncCrmToGoogle] = useState(true)
  const [syncGoogleToCrm, setSyncGoogleToCrm] = useState(true)
  const [importMode, setImportMode] = useState<'crm-only' | 'all'>('crm-only')
  const [syncing, setSyncing] = useState(false)

  const handleSync = () => {
    setSyncing(true)
    setTimeout(() => setSyncing(false), 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={false}
          animate={expanded ? { height: 'auto', opacity: 1 } : { height: 48, opacity: 1 }}
          className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden"
        >
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className="text-accent" />
              <span className="text-sm font-medium">Synchronisation Google</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle size={12} />
                Connecté
              </span>
              <ChevronDown size={14} className={`text-text-secondary transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 pb-4 space-y-4 border-t border-border/30 pt-4"
            >
              <div className="flex items-center gap-2 text-sm text-text">
                <CheckCircle size={14} className="text-emerald-500" />
                Connecté avec <span className="font-medium">agence@squaremeter.com</span>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Paramètres</p>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-text">CRM → Google Agenda</span>
                  <button
                    onClick={() => setSyncCrmToGoogle(!syncCrmToGoogle)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${syncCrmToGoogle ? 'bg-accent' : 'bg-border'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${syncCrmToGoogle ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-text">Google Agenda → CRM</span>
                  <button
                    onClick={() => setSyncGoogleToCrm(!syncGoogleToCrm)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${syncGoogleToCrm ? 'bg-accent' : 'bg-border'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${syncGoogleToCrm ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </label>
              </div>

              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                  Événements importés depuis Google
                </p>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${importMode === 'crm-only' ? 'border-accent' : 'border-border'}`}>
                    {importMode === 'crm-only' && <div className="w-2 h-2 rounded-full bg-accent" />}
                  </div>
                  <input type="radio" name="importMode" checked={importMode === 'crm-only'} onChange={() => setImportMode('crm-only')} className="sr-only" />
                  <span className="text-sm text-text">Uniquement ceux créés dans le CRM</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${importMode === 'all' ? 'border-accent' : 'border-border'}`}>
                    {importMode === 'all' && <div className="w-2 h-2 rounded-full bg-accent" />}
                  </div>
                  <input type="radio" name="importMode2" checked={importMode === 'all'} onChange={() => setImportMode('all')} className="sr-only" />
                  <span className="text-sm text-text">Tous les événements</span>
                </label>
              </div>

              <div className="text-xs text-text-secondary">
                Dernière synchronisation : {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>

              <div className="flex gap-2">
                <button onClick={handleSync} disabled={syncing} className="btn-primary text-sm flex-1">
                  <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
                </button>
                <button className="btn-secondary text-sm text-error">Déconnecter</button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
