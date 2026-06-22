import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, ChevronRight, ChevronLeft, MoreVertical, Activity, ToggleLeft, Trash2,
  BarChart2, Zap, Mail, MessageSquare, Smartphone, Calendar, Crosshair, FileText, Globe, Users,
  Check, CheckCircle, XCircle, Clock, Play, Eye, Search,
} from 'react-feather'
import Card from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import {
  mockAutomators, mockModeles, mockLogs, CATEGORIE_LABELS, CATEGORIE_ICONES,
  getModeleById, getAutomatorLogs, LOG_STATUT_LABELS,
} from '../../types/automator'
import type { Automator, AutomatorModele, AutomatorNotification, NotificationCanal, AutomatorCategorie, AutomatorLog } from '../../types/automator'

const CURRENT_AGENT = 'Karim Eloui'

const CANAL_ICONES: Record<NotificationCanal, { icon: any; label: string }> = {
  email: { icon: Mail, label: 'Email' },
  sms: { icon: MessageSquare, label: 'SMS' },
  push: { icon: Smartphone, label: 'Push' },
  application_mobile: { icon: Smartphone, label: 'App Mobile' },
}

const CATEGORIE_ICONS: Record<AutomatorCategorie, any> = {
  calendrier: Calendar,
  prospects: Crosshair,
  contrats: FileText,
  extranet: Globe,
  contacts: Users,
}

type WizardStep = 1 | 2 | 3

export default function AutomatorPage() {
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState<WizardStep>(1)
  const [selectedModele, setSelectedModele] = useState<AutomatorModele | null>(null)
  const [showLogsFor, setShowLogsFor] = useState<Automator | null>(null)
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null)
  const [logDetail, setLogDetail] = useState<AutomatorLog | null>(null)
  const [emailActif, setEmailActif] = useState(true)
  const [smsActif, setSmsActif] = useState(true)
  const [appActif, setAppActif] = useState(false)
  const [langue, setLangue] = useState('fr')

  const myAutomators = useMemo(() => {
    return mockAutomators.filter(a => a.createdBy === CURRENT_AGENT)
  }, [])

  const startWizard = () => {
    setSelectedModele(null); setWizardStep(1); setShowWizard(true)
    setEmailActif(true); setSmsActif(true); setAppActif(false); setLangue('fr')
  }

  const selectModele = (m: AutomatorModele) => {
    setSelectedModele(m); setWizardStep(2)
  }

  const categories = useMemo(() => {
    const cats: AutomatorCategorie[] = ['calendrier', 'prospects', 'contrats', 'extranet', 'contacts']
    return cats.map(c => ({
      key: c, label: CATEGORIE_LABELS[c], icone: CATEGORIE_ICONES[c],
      modeles: mockModeles.filter(m => m.categorie === c),
    }))
  }, [])

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Zap size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Automator</h1>
            <p className="text-sm text-text-secondary">Automatisez vos actions recurrentes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/5 border border-accent/20 text-xs text-accent font-medium">
            <Users size={12} />
            {CURRENT_AGENT}
          </div>
          <Button onClick={startWizard} icon={<Plus size={14} />}>Nouvel automator</Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 text-xs text-text-secondary bg-card border border-border/50 rounded-xl px-5 py-3">
        <span className="font-medium text-text">{myAutomators.length} automation{myAutomators.length > 1 ? 's' : ''}</span>
        <span className="w-px h-4 bg-border/50" />
        <span className="text-emerald-600 font-medium">{myAutomators.filter(a => a.actif).length} active{myAutomators.filter(a => a.actif).length > 1 ? 's' : ''}</span>
        <span className="w-px h-4 bg-border/50" />
        <span className="text-text-secondary/60">{myAutomators.filter(a => !a.actif).length} inactive{myAutomators.filter(a => !a.actif).length > 1 ? 's' : ''}</span>
        <span className="w-px h-4 bg-border/50" />
        <span>{mockLogs.filter(l => myAutomators.some(a => a.id === l.automatorId)).length} executions</span>
      </div>

      {/* Dashboard */}
      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
          <p className="text-sm font-medium">Mes automations</p>
          <span className="text-xs text-text-secondary">{myAutomators.filter(a => a.actif).length} actif{myAutomators.filter(a => a.actif).length > 1 ? 's' : ''} sur {myAutomators.length}</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border/50 text-[11px]">
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Ref.</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Modele</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Notifications</th>
                <th className="text-center px-4 py-2.5 font-medium text-text-secondary">Statut</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Frequence</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Derniere execution</th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {myAutomators.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-text-secondary text-sm">Aucune automation</td></tr>
              ) : (
                myAutomators.map((a, i) => {
                  const modele = getModeleById(a.modeleId)
                  const CatIcon = modele ? CATEGORIE_ICONS[modele.categorie] : null
                  const dernierLog = mockLogs.filter(l => l.automatorId === a.id).sort((x, y) => new Date(y.executeLe).getTime() - new Date(x.executeLe).getTime())[0]
                  return (
                    <motion.tr key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">#{a.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-text inline-flex items-center gap-1.5">
                          {CatIcon && <CatIcon size={13} className="text-accent" />}{modele?.nom || '\u2014'}
                        </p>
                        <p className="text-[10px] text-text-secondary/60">{a.niveauLabel}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {a.notifications.map(n => {
                            const info = CANAL_ICONES[n.canal]
                            if (!n.actif) return null
                            const Icon = info.icon
                            return <span key={n.id} className="px-1.5 py-0.5 text-[10px] rounded bg-background border border-border flex items-center gap-1" title={info.label}>
                              <Icon size={10} className="text-text-secondary" />
                            </span>
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${a.actif ? 'bg-emerald-500' : 'bg-text-secondary/30'}`} />
                          <span className={`text-[10px] font-medium ${a.actif ? 'text-emerald-600' : 'text-text-secondary/60'}`}>
                            {a.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{a.frequence}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-text">{a.derniereExecution ? new Date(a.derniereExecution).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '\u2014'}</p>
                        {dernierLog && (
                          <span className={`inline-flex items-center gap-0.5 text-[10px] ${dernierLog.statut === 'succes' ? 'text-emerald-600' : dernierLog.statut === 'echec' ? 'text-red-500' : 'text-amber-600'}`}>
                            {dernierLog.statut === 'succes' ? <CheckCircle size={8} /> : dernierLog.statut === 'echec' ? <XCircle size={8} /> : <Clock size={8} />}
                            {LOG_STATUT_LABELS[dernierLog.statut]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right relative">
                        <button onClick={() => setShowActionMenu(showActionMenu === a.id ? null : a.id)}
                          className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors">
                          <MoreVertical size={14} />
                        </button>
                        {showActionMenu === a.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowActionMenu(null)} />
                            <div className="absolute right-4 top-10 z-20 w-44 bg-card border border-border/50 rounded-xl shadow-dropdown py-1">
                              {[
                                { icon: Activity, label: 'Modifier' },
                                { icon: Eye, label: 'Voir le detail' },
                                { icon: Play, label: 'Forcer execution', highlight: true },
                                { icon: ToggleLeft, label: a.actif ? 'Desactiver' : 'Activer' },
                                { icon: BarChart2, label: "Logs d'execution", onClick: () => { setShowActionMenu(null); setShowLogsFor(a); setLogDetail(null) } },
                                { icon: Trash2, label: 'Supprimer', danger: true },
                              ].map(action => (
                                <button key={action.label} onClick={() => { if (action.onClick) action.onClick(); else setShowActionMenu(null) }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                                    action.danger ? 'text-red-500 hover:bg-red-50' : action.highlight ? 'text-accent hover:bg-accent/5' : 'text-text hover:bg-background'
                                  }`}>
                                  <action.icon size={13} />
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Wizard modal */}
      <AnimatePresence>
        {showWizard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowWizard(false)}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-xl border border-border/50 shadow-modal w-full max-w-2xl mx-4 my-4 max-h-[85vh] overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div className="flex items-center gap-3 text-sm">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 1 ? 'bg-accent text-white' : 'bg-background text-text-secondary'}`}>1</span>
                  <span className="text-text-secondary">Modele</span>
                  <ChevronRight size={14} className="text-text-secondary/40" />
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 2 ? 'bg-accent text-white' : 'bg-background text-text-secondary'}`}>2</span>
                  <span className="text-text-secondary">Notifications</span>
                  <ChevronRight size={14} className="text-text-secondary/40" />
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 3 ? 'bg-accent text-white' : 'bg-background text-text-secondary'}`}>3</span>
                  <span className="text-text-secondary">Synthese</span>
                </div>
                <button onClick={() => setShowWizard(false)} className="p-1.5 rounded-lg hover:bg-background text-text-secondary"><X size={16} /></button>
              </div>
              <div className="p-6">
                {wizardStep === 1 && (
                  <div className="space-y-5">
                    <p className="text-sm font-medium">Choisissez un modele d'automation</p>
                    {categories.map(cat => (
                      <div key={cat.key}>
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          {(() => { const Icon = CATEGORIE_ICONS[cat.key]; return Icon ? <Icon size={14} className="text-accent" /> : null })()} {cat.label}
                        </p>
                        <div className="space-y-1.5">
                          {cat.modeles.map(m => (
                            <button key={m.id} onClick={() => selectModele(m)}
                              className="w-full text-left p-3 rounded-lg border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all">
                              <p className="text-sm font-medium text-text">{m.nom}</p>
                              <p className="text-xs text-text-secondary mt-0.5">{m.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3 border-t border-border/30">
                      <Button variant="ghost" onClick={() => setShowWizard(false)}>Annuler</Button>
                    </div>
                  </div>
                )}
                {wizardStep === 2 && selectedModele && (
                  <div className="space-y-5">
                    <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                      <p className="text-sm font-medium text-accent flex items-center gap-1.5">
                        {(() => { const Icon = CATEGORIE_ICONS[selectedModele.categorie]; return Icon ? <Icon size={15} className="text-accent" /> : null })()} {selectedModele.nom}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-border/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium"><Mail size={15} className="text-accent" /> Email</label>
                        <button onClick={() => setEmailActif(!emailActif)}
                          className={`w-9 h-5 rounded-full transition-colors relative ${emailActif ? 'bg-accent' : 'bg-border'}`}>
                          <span className={`absolute w-3.5 h-3.5 bg-white rounded-full top-0.5 transition-transform ${emailActif ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      {emailActif && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-secondary">Langue :</span>
                            {['fr', 'en', 'es', 'ar'].map(l => (
                              <button key={l} onClick={() => setLangue(l)}
                                className={`px-2 py-0.5 text-xs rounded border ${langue === l ? 'bg-accent text-white border-accent' : 'bg-card text-text-secondary border-border'}`}>
                                {l === 'fr' ? 'Francais' : l === 'en' ? 'Anglais' : l === 'es' ? 'Espagnol' : 'Arabe'}
                              </button>
                            ))}
                          </div>
                          <div>
                            <p className="text-[11px] text-text-secondary mb-1">Objet :</p>
                            <div className="p-2.5 rounded-lg bg-background border border-border text-xs text-text font-mono leading-relaxed">
                              Rappel de rendez-vous {'{'}% if _target.contact.firstname %{'}'}{'{{'}_target.contact.firstname{'}}'} {'{'}% endif %{'}'} le {'{{'}_target.start_at|date('d/m/Y'){'}}'}
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] text-text-secondary mb-1">Message :</p>
                            <div className="p-2.5 rounded-lg bg-background border border-border text-xs text-text font-mono leading-relaxed whitespace-pre-line">
                              Bonjour,{'\n\n'}
                              Votre rendez-vous avec {'{{'}_target.contact.firstname{'}}'} a lieu le {'{{'}_target.start_at|date('d/m/Y'){'}}'} a {'{{'}_target.start_at|date('H:i'){'}}'}.{'\n\n'}
                              Adresse : {'{{'}_target.property.address{'}}'}{'\n\n'}
                              Cordialement,{'\n'}
                              L'equipe Square Meter
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="p-4 rounded-xl border border-border/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium"><MessageSquare size={15} className="text-accent" /> SMS</label>
                        <button onClick={() => setSmsActif(!smsActif)}
                          className={`w-9 h-5 rounded-full transition-colors relative ${smsActif ? 'bg-accent' : 'bg-border'}`}>
                          <span className={`absolute w-3.5 h-3.5 bg-white rounded-full top-0.5 transition-transform ${smsActif ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      {smsActif && (
                        <div className="p-2.5 rounded-lg bg-background border border-border text-xs text-text font-mono">
                          Rappel: RDV le {'{{'}_target.start_at|date('d/m/Y'){'}}'} a {'{{'}_target.start_at|date('H:i'){'}}'} - {'{{'}_target.property.address{'}}'}
                        </div>
                      )}
                    </div>
                    <div className="p-4 rounded-xl border border-border/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium"><Smartphone size={15} className="text-text-secondary" /> Application mobile</label>
                        <button onClick={() => setAppActif(!appActif)}
                          className={`w-9 h-5 rounded-full transition-colors relative ${appActif ? 'bg-accent' : 'bg-border'}`}>
                          <span className={`absolute w-3.5 h-3.5 bg-white rounded-full top-0.5 transition-transform ${appActif ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border/30">
                      <Button variant="ghost" onClick={() => setWizardStep(1)} icon={<ChevronLeft size={14} />}>Precedent</Button>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setShowWizard(false)}>Annuler</Button>
                        <Button onClick={() => setWizardStep(3)}>Suivant <ChevronRight size={14} /></Button>
                      </div>
                    </div>
                  </div>
                )}
                {wizardStep === 3 && selectedModele && (
                  <div className="space-y-5">
                    <p className="text-sm font-medium">Recapitulatif</p>
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-background border border-border/50 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Modele</span>
                          <span className="text-text font-medium">{(() => { const Icon = CATEGORIE_ICONS[selectedModele.categorie]; return Icon ? <Icon size={14} className="inline-block mr-1.5 text-accent" /> : null })()} {selectedModele.nom}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Niveau</span>
                          <span className="text-text">Agence &middot; Square Meter</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-background border border-border/50 space-y-1.5">
                        <p className="text-xs font-medium text-text-secondary mb-2">Notifications activees :</p>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${emailActif ? 'bg-accent/10 text-accent border-accent/20' : 'bg-text-secondary/5 text-text-secondary/40 border-border'}`}>
                            {emailActif ? <Check size={10} /> : <X size={10} />} Email ({langue === 'fr' ? 'Francais' : langue === 'en' ? 'Anglais' : langue === 'es' ? 'Espagnol' : 'Arabe'})
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${smsActif ? 'bg-accent/10 text-accent border-accent/20' : 'bg-text-secondary/5 text-text-secondary/40 border-border'}`}>
                            {smsActif ? <Check size={10} /> : <X size={10} />} SMS
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${appActif ? 'bg-accent/10 text-accent border-accent/20' : 'bg-text-secondary/5 text-text-secondary/40 border-border'}`}>
                            {appActif ? <Check size={10} /> : <X size={10} />} App Mobile
                          </span>
                        </div>
                      </div>
                      {emailActif && (
                        <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 space-y-2">
                          <p className="text-xs font-semibold text-accent flex items-center gap-1.5"><Mail size={12} /> Apercu de l'email</p>
                          <p className="text-[11px] text-text font-medium">Objet : Rappel de rendez-vous avec Jean Dupont le 15/06/2026 a 14h30</p>
                          <div className="text-xs text-text leading-relaxed">
                            Bonjour,{'\n\n'}
                            Votre rendez-vous avec Jean Dupont a lieu le 15/06/2026 a 14h30.{'\n\n'}
                            Adresse : 12 Rue de la Liberte, Casablanca{'\n\n'}
                            Cordialement,{'\n'}
                            L'equipe Square Meter
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border/30">
                      <Button variant="ghost" onClick={() => setWizardStep(2)} icon={<ChevronLeft size={14} />}>Precedent</Button>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setShowWizard(false)}>Annuler</Button>
                        <Button onClick={() => { setShowWizard(false) }}>AJOUTER L'AUTOMATOR</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logs modal */}
      <AnimatePresence>
        {showLogsFor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => { setShowLogsFor(null); setLogDetail(null) }}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-xl border border-border/50 shadow-modal w-full max-w-3xl mx-4 my-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <BarChart2 size={16} className="text-accent" />
                  Logs d'execution &mdash; #{showLogsFor.id}
                </h2>
                <button onClick={() => { setShowLogsFor(null); setLogDetail(null) }} className="p-1.5 rounded-lg hover:bg-background text-text-secondary"><X size={16} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-background border-b border-border text-[11px]">
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Date</th>
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Evenement</th>
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Destinataire</th>
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Statut</th>
                        <th className="text-right px-3 py-2 font-medium text-text-secondary">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {getAutomatorLogs(showLogsFor.id).map(log => (
                        <tr key={log.id} className="hover:bg-background/50 transition-colors">
                          <td className="px-3 py-2 text-xs text-text">
                            {new Date(log.executeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="px-3 py-2 text-xs text-text">{log.evenement}</td>
                          <td className="px-3 py-2 text-xs text-text-secondary">{log.destinataire}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 text-xs ${log.statut === 'succes' ? 'text-emerald-600' : log.statut === 'echec' ? 'text-red-600' : 'text-amber-600'}`}>
                              {log.statut === 'succes' ? <CheckCircle size={12} /> : log.statut === 'echec' ? <XCircle size={12} /> : <Clock size={12} />}
                              {LOG_STATUT_LABELS[log.statut]}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => setLogDetail(logDetail?.id === log.id ? null : log)}
                              className="px-2 py-1 text-[10px] rounded bg-background border border-border text-text-secondary hover:text-text transition-colors">
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {logDetail && (
                  <div className="p-4 rounded-xl bg-background border border-border/50 space-y-2">
                    <p className="text-xs font-semibold text-text-secondary">Detail de l'execution</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-text-secondary">Date :</span> <span className="text-text">{new Date(logDetail.executeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
                      <div><span className="text-text-secondary">Automator :</span> <span className="text-text">#{showLogsFor.id} &mdash; {getModeleById(showLogsFor.modeleId)?.nom}</span></div>
                      <div><span className="text-text-secondary">Evenement :</span> <span className="text-text">{logDetail.evenement}</span></div>
                      <div><span className="text-text-secondary">Destinataire :</span> <span className="text-text">{logDetail.destinataire}</span></div>
                    </div>
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-[11px] text-text-secondary mb-1">Notifications envoyees :</p>
                      <div className="text-xs text-text font-mono whitespace-pre-line bg-card p-2 rounded-lg border border-border">
                        {logDetail.contenu || '\u2014'}
                      </div>
                    </div>
                    {logDetail.messageErreur && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                        Erreur : {logDetail.messageErreur}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
