import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Search, X, ChevronDown, Send, Eye, User,
  BarChart2, Activity, MoreVertical, RefreshCw,
} from 'react-feather'
import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import {
  mockClients, allLogs, getClientLogs,
  computeActivityBadge, ACTIVITY_BADGE_CONFIG,
} from '../../types/extranet'
import type { ExtranetClient, ClientType, ActionType, AccessStatus, ConnectionLog } from '../../types/extranet'

const CURRENT_AGENT = 'Karim Eloui'

const ACTIONS: ActionType[] = ['Connexion', 'Visite', 'Proposition', 'Telechargement']
const CLIENT_TYPES: ClientType[] = ['Vendeur', 'Acheteur', 'Bailleur', 'Locataire', 'Voyageur']
const ACTION_LABELS: Record<ActionType, string> = {
  Connexion: 'Connexion',
  Visite: 'Visite',
  Proposition: 'Proposition',
  Telechargement: 'Telechargement',
}

const ACTION_COLORS: Record<ActionType, string> = {
  Connexion: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  Visite: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  Proposition: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Telechargement: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
}

const CLIENT_TYPE_COLORS: Record<ClientType, string> = {
  Vendeur: 'bg-blue-500',
  Acheteur: 'bg-emerald-500',
  Bailleur: 'bg-amber-500',
  Locataire: 'bg-violet-500',
  Voyageur: 'bg-rose-500',
}

const STATUS_COLORS: Record<AccessStatus, string> = {
  actif: 'text-emerald-500',
  inactif: 'text-amber-500',
  bloque: 'text-red-500',
}

function formatDate(d: string) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatDateShort(d: string) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(d: string) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function AgentExtranetPage() {
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<ClientType[]>(CLIENT_TYPES)
  const [selectedStatuses, setSelectedStatuses] = useState<AccessStatus[]>(['actif', 'inactif', 'bloque'])
  const [showFilters, setShowFilters] = useState(true)

  const [detailClient, setDetailClient] = useState<ExtranetClient | null>(null)
  const [detailLogs, setDetailLogs] = useState<ConnectionLog[]>([])

  const [reminderClient, setReminderClient] = useState<ExtranetClient | null>(null)
  const [sendToAgent, setSendToAgent] = useState(false)

  const agentClients = useMemo(() => {
    return mockClients.filter(c => c.agent === CURRENT_AGENT)
  }, [])

  const filtered = useMemo(() => {
    return agentClients.filter(c => {
      if (search) {
        const q = search.toLowerCase()
        if (!c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !c.product.toLowerCase().includes(q)) return false
      }
      if (!selectedTypes.includes(c.type)) return false
      if (!selectedStatuses.includes(c.status)) return false
      return true
    })
  }, [search, selectedTypes, selectedStatuses, agentClients])

  const totalConns = filtered.reduce((s, c) => s + c.totalConnections, 0)

  const openDetail = useCallback((c: ExtranetClient) => {
    setDetailClient(c)
    setDetailLogs(getClientLogs(c.id))
  }, [])

  const closeDetail = useCallback(() => {
    setDetailClient(null)
    setDetailLogs([])
  }, [])

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Globe size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Extranet</h1>
            <p className="text-sm text-text-secondary">Clients ayant acces a leur espace personnel</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/5 border border-accent/20 text-xs text-accent font-medium">
          <User size={12} />
          Agent: {CURRENT_AGENT}
        </div>
      </div>

      {/* Quick summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text">{agentClients.length}</p>
            <p className="text-xs text-text-secondary">Clients extranet</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Activity size={20} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text">{agentClients.filter(c => c.status === 'actif').length}</p>
            <p className="text-xs text-text-secondary">Actifs</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <BarChart2 size={20} className="text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text">{totalConns}</p>
            <p className="text-xs text-text-secondary">Connexions totales</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <X size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text">{agentClients.filter(c => c.status === 'inactif').length}</p>
            <p className="text-xs text-text-secondary">Inactifs</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-text"
        >
          <span className="flex items-center gap-2"><Search size={15} className="text-accent" /> Filtres</span>
          <ChevronDown size={15} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-5 pb-4 space-y-4 border-t border-border/50 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary w-24">Type client :</span>
                  {CLIENT_TYPES.map(t => (
                    <button key={t} onClick={() => setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                      className={`px-3 py-1 text-xs rounded-lg border transition-all ${selectedTypes.includes(t) ? 'bg-accent text-white border-accent' : 'bg-card text-text-secondary border-border hover:border-accent/50'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary w-24">Statut acces :</span>
                  {(['actif', 'inactif', 'bloque'] as AccessStatus[]).map(s => (
                    <button key={s} onClick={() => setSelectedStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                      className={`px-3 py-1 text-xs rounded-lg border capitalize transition-all ${selectedStatuses.includes(s) ? 'bg-accent text-white border-accent' : 'bg-card text-text-secondary border-border hover:border-accent/50'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary w-24">Recherche :</span>
                  <div className="relative flex-1 max-w-sm">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary/60" />
                    <input type="text" placeholder="Nom, email ou produit..." value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full h-8 pl-8 pr-8 text-xs rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary/60"><X size={12} /></button>}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSearch(''); setSelectedTypes([...CLIENT_TYPES]); setSelectedStatuses(['actif', 'inactif', 'bloque'])
                  }}>
                    Reinitialiser
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
          <p className="text-sm font-medium flex items-center gap-2">
            <Activity size={14} className="text-accent" />
            Mes clients extranet
            <span className="text-xs text-text-secondary font-normal">({filtered.length} client{filtered.length > 1 ? 's' : ''})</span>
          </p>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border/50 text-[11px]">
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Contact</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Produit</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Type</th>
                <th className="text-center px-4 py-2.5 font-medium text-text-secondary">Acces</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Activite</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Derniere action</th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-text-secondary text-sm">Aucun resultat</td></tr>
              ) : (
                filtered.map((c, i) => {
                  const badge = computeActivityBadge(c.totalConnections, c.status)
                  const badgeCfg = ACTIVITY_BADGE_CONFIG[badge]
                  return (
                    <motion.tr key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-background/50 transition-colors cursor-pointer" onClick={() => openDetail(c)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${c.status === 'actif' ? 'bg-emerald-500' : c.status === 'inactif' ? 'bg-amber-400' : 'bg-red-500'}`} />
                          <div>
                            <p className="text-sm font-medium text-text">{c.name}</p>
                            <p className="text-[10px] text-text-secondary/60 font-mono">{c.lastIp}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-text">{c.product}</p>
                        {c.lastBrowser !== '-' && <p className="text-[10px] text-text-secondary/60">{c.lastBrowser}/{c.lastOs}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium text-white ${CLIENT_TYPE_COLORS[c.type]}`}>
                          {c.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-semibold ${STATUS_COLORS[c.status]}`}>{c.totalConnections}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${badgeCfg.color} ${badgeCfg.bg}`}>
                          {badgeCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.lastDate ? (
                          <div>
                            <p className="text-sm text-text">{formatDate(c.lastDate)}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${ACTION_COLORS[c.lastAction]}`}>
                              {ACTION_LABELS[c.lastAction]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-secondary/60 text-xs">Jamais</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={e => { e.stopPropagation(); openDetail(c) }}
                          className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-accent transition-all">
                          <Eye size={13} />
                        </button>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between text-[10px] text-text-secondary/60">
          <span>{filtered.length} client{filtered.length > 1 ? 's' : ''} &middot; {totalConns} connexions</span>
        </div>
      </Card>

      {/* Detail modal */}
      <AnimatePresence>
        {detailClient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40 backdrop-blur-sm"
            onClick={closeDetail}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-xl border border-border/50 shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <h2 className="text-base font-semibold">Details des connexions &mdash; {detailClient.name}</h2>
                <button onClick={closeDetail} className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-background border border-border/50">
                  <div>
                    <p className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Email</p>
                    <p className="text-sm text-text mt-0.5">{detailClient.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Statut</p>
                    <p className={`text-sm font-medium mt-0.5 ${STATUS_COLORS[detailClient.status]} capitalize`}>
                      {detailClient.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Activation</p>
                    <p className="text-sm text-text mt-0.5">{detailClient.activationDate ? formatDateShort(detailClient.activationDate) : '\u2014'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Total connexions</p>
                    <p className="text-sm font-semibold text-text mt-0.5">{detailClient.totalConnections}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Historique detaille</h3>
                  {detailLogs.length === 0 ? (
                    <p className="text-sm text-text-secondary/60 py-4 text-center">Aucun historique de connexion</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-background border-b border-border text-[11px]">
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">Date</th>
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">Action</th>
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">IP</th>
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">Appareil</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {detailLogs.map(log => (
                            <tr key={log.id} className="hover:bg-background/50">
                              <td className="px-3 py-2 text-xs text-text">
                                {new Date(log.date).toLocaleDateString('fr-FR')} {formatTime(log.date)}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`text-[11px] px-2 py-0.5 rounded border ${ACTION_COLORS[log.action]}`}>
                                  {ACTION_LABELS[log.action]}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[11px] text-text-secondary font-mono">{log.ip}</td>
                              <td className="px-3 py-2 text-[11px] text-text-secondary">{log.userAgent}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                  <Button size="sm" icon={<Send size={13} />} onClick={() => { closeDetail(); setReminderClient(detailClient) }}>
                    Envoyer un rappel
                  </Button>
                  <Button size="sm" variant="outline" icon={<RefreshCw size={13} />}>
                    Reinitialiser mot de passe
                  </Button>
                  <Button size="sm" variant="ghost" onClick={closeDetail}>Fermer</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send reminder dialog */}
      <Dialog isOpen={!!reminderClient} onClose={() => setReminderClient(null)} title="Envoyer un rappel de connexion" size="lg">
        {reminderClient && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-background border border-border/50 text-sm">
              <div>
                <span className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Client</span>
                <p className="text-text font-medium">{reminderClient.name}</p>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Type</span>
                <p className="text-text font-medium">{reminderClient.type}</p>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Derniere connexion</span>
                <p className="text-text font-medium">{reminderClient.lastDate ? formatDateShort(reminderClient.lastDate) : 'Jamais'}</p>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Statut</span>
                <p className={`text-sm font-medium capitalize ${STATUS_COLORS[reminderClient.status]}`}>{reminderClient.status}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2">Message :</p>
              <div className="p-4 rounded-lg bg-background border border-border/50 text-sm text-text leading-relaxed">
                <p>Bonjour {reminderClient.name},</p>
                <br />
                <p>Nous avons remarque que vous n'avez pas encore active votre espace client.</p>
                <p>Connectez-vous des maintenant pour :</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Consulter les informations de votre bien</li>
                  <li>Acceder a vos documents</li>
                  <li>Suivre vos transactions</li>
                </ul>
                <br />
                <p>Lien de connexion : <span className="text-accent font-medium">https://espace.squaremeter.ma</span></p>
                <br />
                <p>Cordialement,</p>
                <p>L'equipe Square Meter</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sendToAgent} onChange={e => setSendToAgent(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent/20" />
              <span className="text-sm text-text-secondary">M'envoyer une copie</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" onClick={() => setReminderClient(null)}>Annuler</Button>
              <Button size="md" icon={<Send size={13} />}>Envoyer</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
