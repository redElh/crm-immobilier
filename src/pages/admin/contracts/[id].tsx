import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, User, Home, DollarSign, Clock, Download, Plus,
  Trash2, ArrowLeft, Edit3, Phone, Mail, MapPin, Shield, Repeat,
  RefreshCw, AlertTriangle
} from 'react-feather'
import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import { Badge } from '../../../components/ui/Badge'
import Card from '../../../components/ui/Card'
import { BackLink } from '../../../components/ui/BackLink'
import { Dialog } from '../../../components/ui/Dialog'
import { DocumentCategorySection } from '../../../components/modules/documents/DocumentCategorySection'
import { mockContracts, ADMIN_AGENTS, CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from './mockData'
import { VENTE_ETAPE_LABELS, VENTE_ETAPE_COLORS, partyRoleColor } from '../../../types/contract'
import type { Contract, ContractStatus } from './mockData'

const STATUS_OPS: { value: ContractStatus; label: string }[] = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'confirme_actif', label: 'Confirmé / Actif' },
  { value: 'finalise_termine', label: 'Finalisé / Terminé' },
  { value: 'annule', label: 'Annulé' },
]

export default function AdminContractDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('apercu')
  const [showReassign, setShowReassign] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [statusNewVal, setStatusNewVal] = useState<ContractStatus | ''>('')

  const contract = mockContracts.find(c => c.id === id)
  if (!contract) {
    return (
      <div className="space-y-6 animate-fade-in">
        <BackLink to="/admin/contracts" />
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
          <FileText size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Contrat non trouvé</p>
          <p className="text-sm text-text-secondary/60 mt-1">Ce contrat n'existe pas ou a été supprimé</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/admin/contracts')}>Retour aux contrats</Button>
        </div>
      </div>
    )
  }

  const fmt = (p: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: contract.devise, maximumFractionDigits: 0 }).format(p)
  const fd = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
  const agentInfo = ADMIN_AGENTS.find(a => a.id === contract.agentId) || null

  const frd = (d: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return "Aujourd'hui"
    if (diff === 1) return 'Hier'
    if (diff < 30) return `Il y a ${diff} jours`
    return new Date(d).toLocaleDateString('fr-FR')
  }

  const InfoBox = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
    <div className="p-3 rounded-xl bg-background border border-border/50">
      <p className="text-[11px] text-text-secondary/60 mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${highlight ? 'text-accent' : 'text-text'}`}>{value}</p>
    </div>
  )

  const FinField = ({ label, value }: { label: string; value: string }) => (
    <div className="p-3 rounded-xl bg-background border border-border/50">
      <p className="text-[11px] text-text-secondary/60 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-text">{value}</p>
    </div>
  )

  const PartyCard = ({ label, name, type, phone, email }: { label: string; name: string; type: string; phone: string; email: string }) => (
    <div className="p-4 rounded-xl bg-background border border-border/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0"><User size={16} className="text-accent" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-text">{name}</p>
            <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border ${partyRoleColor(type)}`}>{type}</span>
          </div>
          <p className="text-xs text-text-secondary/60">{label}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-text-secondary flex items-center gap-1"><Phone size={10} /> {phone}</span>
            <span className="text-xs text-text-secondary flex items-center gap-1"><Mail size={10} /> {email}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'apercu', label: 'Aperçu', icon: <FileText size={15} /> },
    { id: 'parties', label: 'Parties', icon: <User size={15} /> },
    { id: 'financier', label: 'Financier', icon: <DollarSign size={15} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={15} /> },
    { id: 'historique', label: 'Historique', icon: <Clock size={15} /> },
  ]

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <BackLink to="/admin/contracts" />
      <Card className="p-3 border-accent/20 bg-accent/5">
        <div className="flex items-center gap-2 flex-wrap">
          <Shield size={14} className="text-accent" />
          <span className="text-xs font-medium text-accent mr-2">Actions Administrateur :</span>
          <Button variant="outline" size="sm" icon={<Repeat size={12} />} onClick={() => { setSelectedAgent(contract.agentId || ''); setShowReassign(true) }}>Réaffecter</Button>
          <Button variant="outline" size="sm" icon={<RefreshCw size={12} />} onClick={() => { setStatusNewVal(contract.status); setShowStatus(true) }}>Changer le statut</Button>
          <Button variant="outline" size="sm" icon={<Edit3 size={12} />} onClick={() => navigate('/admin/contracts')}>Modifier</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={12} />} onClick={() => { setDeleteConfirm(''); setShowDelete(true) }}>Supprimer</Button>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[11px] text-text-secondary/60 font-mono">{contract.reference}</p>
                <h1 className="text-xl font-bold mt-0.5 leading-snug">{CONTRACT_TYPE_LABELS[contract.type]}</h1>
              </div>
              <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>{CONTRACT_STATUS_LABELS[contract.status]}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <User size={13} /><span>{contract.partieA.name}</span><span className="text-text-secondary/40">→</span><span>{contract.partieB.name}</span>
            </div>
            {contract.type === 'vente' && contract.etape && (
              <div className="mt-3 flex items-center gap-2">
                <Badge className={VENTE_ETAPE_COLORS[contract.etape]}>{VENTE_ETAPE_LABELS[contract.etape]}</Badge>
                <span className="text-xs text-text-secondary">Étape en cours</span>
              </div>
            )}
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0"><Home size={16} className="text-accent" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{contract.propertyTitle}</p>
                <p className="text-xs text-text-secondary truncate">{contract.propertyAddress}</p>
              </div>
              <Button variant="ghost" size="sm" icon={<ArrowLeft size={13} className="rotate-180" />} onClick={() => navigate('/admin/properties/' + contract.propertyId)} />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              {agentInfo ? (
                <div className={`w-10 h-10 rounded-xl ${agentInfo.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{agentInfo.initials}</div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gray-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">NA</div>
              )}
              <div>
                <p className="text-xs text-text-secondary">Agent responsable</p>
                <p className="text-sm font-medium text-text">{contract.agentPrincipal}</p>
              </div>
            </div>
          </Card>
          {contract.type === 'vente' && contract.prixVente && (
            <Card className="p-4"><div className="flex items-center justify-between"><span className="text-xs text-text-secondary">Montant</span><span className="text-lg font-bold text-accent">{fmt(contract.prixVente)}</span></div></Card>
          )}
          {contract.type === 'location_classique' && contract.loyerMensuelHC && (
            <Card className="p-4"><div className="flex items-center justify-between"><span className="text-xs text-text-secondary">Loyer mensuel</span><span className="text-lg font-bold text-accent">{fmt(contract.loyerMensuelHC)}<span className="text-sm text-text-secondary font-normal">/mois</span></span></div></Card>
          )}
          {contract.type === 'location_saisonniere' && contract.prixTotalSejour && (
            <Card className="p-4"><div className="flex items-center justify-between"><span className="text-xs text-text-secondary">Total séjour</span><span className="text-lg font-bold text-accent">{fmt(contract.prixTotalSejour)}</span></div></Card>
          )}
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin border-b border-border/40">
          <div className="flex px-1 min-w-max">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === t.id ? 'text-accent border-accent' : 'text-text-secondary border-transparent hover:text-text hover:border-border'}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              {activeTab === 'apercu' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Dates clés</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <InfoBox label="Création" value={fd(contract.dateCreation)} />
                      {contract.type === 'vente' && <><InfoBox label="Offre" value={fd(contract.dateOffre)} /><InfoBox label="Réservation" value={fd(contract.dateReservation)} /><InfoBox label="Compromis" value={fd(contract.dateCompromis)} />{contract.dateActe && <InfoBox label="Acte authentique" value={fd(contract.dateActe)} />}</>}
                      {contract.type === 'location_classique' && <><InfoBox label="Début du bail" value={fd(contract.dateDebutBail)} /><InfoBox label="Fin du bail" value={fd(contract.dateFinBail)} /></>}
                      {contract.type === 'location_saisonniere' && <><InfoBox label="Arrivée" value={fd(contract.dateArrivee)} /><InfoBox label="Départ" value={fd(contract.dateDepart)} /></>}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Parties prenantes</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <PartyCard label={contract.partieA.role} name={contract.partieA.name} type={contract.partieA.type} phone={contract.partieA.phone} email={contract.partieA.email} />
                      <PartyCard label={contract.partieB.role} name={contract.partieB.name} type={contract.partieB.type} phone={contract.partieB.phone} email={contract.partieB.email} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Bien concerné</h3>
                    <div className="p-4 rounded-xl bg-background border border-border/50 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0"><Home size={16} className="text-accent" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text">{contract.propertyTitle}</p>
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-0.5"><MapPin size={11} /><span>{contract.propertyAddress}</span></div>
                        <div className="flex items-center gap-2 mt-1"><Badge variant="outline">{contract.propertyTypeLabel}</Badge><span className="text-[11px] text-text-secondary/60 font-mono">{contract.propertyRef}</span></div>
                      </div>
                      <Button variant="ghost" size="sm" icon={<ArrowLeft size={13} className="rotate-180" />} onClick={() => navigate('/admin/properties/' + contract.propertyId)}>Voir le bien</Button>
                    </div>
                  </div>
                  {contract.type === 'vente' && contract.etape && (
                    <div><h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Avancement</h3><div className="flex items-center gap-2"><Badge className={VENTE_ETAPE_COLORS[contract.etape]}>{VENTE_ETAPE_LABELS[contract.etape]}</Badge><span className="text-xs text-text-secondary">Étape actuelle</span></div></div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Résumé financier</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {contract.type === 'vente' && <><InfoBox label="Prix de vente" value={contract.prixVente ? fmt(contract.prixVente) : '—'} highlight /><InfoBox label="Net vendeur" value={contract.montantNetVendeur ? fmt(contract.montantNetVendeur) : '—'} />{contract.honorairesTTC && <InfoBox label="Honoraires TTC" value={fmt(contract.honorairesTTC)} />}{contract.sequestre && <InfoBox label="Séquestre" value={fmt(contract.sequestre)} />}</>}
                      {contract.type === 'location_classique' && <><InfoBox label="Loyer HC" value={contract.loyerMensuelHC ? fmt(contract.loyerMensuelHC) : '—'} highlight /><InfoBox label="Charges" value={contract.chargesMensuelles ? fmt(contract.chargesMensuelles) : '—'} /><InfoBox label="Dépôt de garantie" value={contract.depotGarantie ? fmt(contract.depotGarantie) : '—'} /></>}
                      {contract.type === 'location_saisonniere' && <><InfoBox label="Total séjour" value={contract.prixTotalSejour ? fmt(contract.prixTotalSejour) : '—'} highlight /><InfoBox label="Acompte versé" value={contract.acompteVerse ? fmt(contract.acompteVerse) : '—'} /><InfoBox label="Caution" value={contract.caution ? fmt(contract.caution) : '—'} /></>}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'parties' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Card className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div><p className="text-sm font-medium text-text">{contract.partieA.role}</p><p className="text-xs text-text-secondary">Partie A</p></div>
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-lg border ${partyRoleColor(contract.partieA.type)}`}>{contract.partieA.type}</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                          <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0"><span className="text-accent font-bold text-xs">{contract.partieA.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}</span></div>
                          <div><p className="text-sm font-medium text-text">{contract.partieA.name}</p></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-text-secondary"><Phone size={12} /><span>{contract.partieA.phone}</span></div>
                          <div className="flex items-center gap-2 text-text-secondary"><Mail size={12} /><span className="truncate">{contract.partieA.email}</span></div>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div><p className="text-sm font-medium text-text">{contract.partieB.role}</p><p className="text-xs text-text-secondary">Partie B</p></div>
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-lg border ${partyRoleColor(contract.partieB.type)}`}>{contract.partieB.type}</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                          <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0"><span className="text-accent font-bold text-xs">{contract.partieB.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}</span></div>
                          <div><p className="text-sm font-medium text-text">{contract.partieB.name}</p></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-text-secondary"><Phone size={12} /><span>{contract.partieB.phone}</span></div>
                          <div className="flex items-center gap-2 text-text-secondary"><Mail size={12} /><span className="truncate">{contract.partieB.email}</span></div>
                        </div>
                      </div>
                    </Card>
                  </div>
                  <div className="p-4 rounded-xl bg-background border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0"><User size={16} className="text-accent" /></div>
                      <div><p className="text-xs text-text-secondary">Agent principal</p><p className="font-medium text-text">{contract.agentPrincipal}</p></div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'financier' && (
                <div className="space-y-6">
                  {contract.type === 'vente' && <><h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Détails financiers - Vente</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"><FinField label="Prix de vente" value={contract.prixVente ? fmt(contract.prixVente) : '—'} /><FinField label="Net vendeur" value={contract.montantNetVendeur ? fmt(contract.montantNetVendeur) : '—'} /><FinField label="Honoraires TTC" value={contract.honorairesTTC ? fmt(contract.honorairesTTC) : '—'} />{contract.sequestre && <FinField label="Séquestre" value={fmt(contract.sequestre)} />}{contract.conditionPaiementHonoraires && <FinField label="Paiement" value={contract.conditionPaiementHonoraires} />}</div></>}
                  {contract.type === 'location_classique' && <><h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Détails financiers - Location</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"><FinField label="Loyer HC" value={contract.loyerMensuelHC ? fmt(contract.loyerMensuelHC) : '—'} /><FinField label="Charges" value={contract.chargesMensuelles ? fmt(contract.chargesMensuelles) : '—'} /><FinField label="Dépôt garantie" value={contract.depotGarantie ? fmt(contract.depotGarantie) : '—'} /><FinField label="Honoraires" value={contract.honorairesLocation ? fmt(contract.honorairesLocation) : '—'} /></div></>}
                  {contract.type === 'location_saisonniere' && <><h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Détails financiers - Saisonnier</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"><FinField label="Total séjour" value={contract.prixTotalSejour ? fmt(contract.prixTotalSejour) : '—'} /><FinField label="Acompte" value={contract.acompteVerse ? fmt(contract.acompteVerse) : '—'} /><FinField label="Caution" value={contract.caution ? fmt(contract.caution) : '—'} /></div></>}
                  {contract.notes && <div className="mt-4"><h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Notes</h3><p className="text-sm text-text/80 p-3 rounded-xl bg-background border border-border/50">{contract.notes}</p></div>}
                </div>
              )}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex justify-end"><Button variant="outline" size="sm" icon={<Plus size={14} />}>Ajouter un document</Button></div>
                  <DocumentCategorySection title="Documents du contrat" description="Pièces justificatives" icon={<Shield size={16} />}
                    documents={contract.documents.map(d => ({ ...d, category: d.category || 'contrat' }))}
                    onDownload={() => {}} onDelete={() => {}} emptyMessage="Aucun document lié à ce contrat" defaultOpen={true} />
                </div>
              )}
              {activeTab === 'historique' && (
                <div className="space-y-4">
                  {contract.history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-text-secondary"><Clock size={32} className="mb-3 opacity-40" /><p className="text-sm">Aucun historique</p></div>
                  ) : (
                    <div className="relative pl-6 space-y-0">
                      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                      {contract.history.map((entry, i) => (
                        <motion.div key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative pb-5 last:pb-0">
                          <div className="absolute -left-[21px] top-1 w-[10px] h-[10px] rounded-full border-2 border-accent bg-card" />
                          <div className="flex items-start justify-between gap-4">
                            <div><p className="text-sm font-medium text-text">{entry.action}</p>{entry.details && <p className="text-xs text-text-secondary mt-0.5">{entry.details}</p>}<p className="text-[11px] text-text-secondary/60 mt-1">par {entry.agent}</p></div>
                            <span className="text-[11px] text-text-secondary/60 whitespace-nowrap">{frd(entry.date)}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Dialog isOpen={showReassign} onClose={() => setShowReassign(false)} title="Réaffecter le contrat" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{contract.reference} · {CONTRACT_TYPE_LABELS[contract.type]}</p>
            <p className="text-xs text-text-secondary">{contract.partieA.name} → {contract.partieB.name}</p>
          </div>
          <div><p className="text-xs text-text-secondary mb-1.5">Agent actuel :</p><div className="flex items-center gap-2 text-sm">{agentInfo ? <><div className={`w-6 h-6 rounded-full ${agentInfo.color} flex items-center justify-center text-white text-[10px] font-bold`}>{agentInfo.initials}</div><span>{agentInfo.name}</span></> : <span className="text-text-secondary italic">Non assigné</span>}</div></div>
          <div><label className="text-sm font-medium mb-1.5 block">Nouvel agent</label><Select value={selectedAgent} onChange={(val) => setSelectedAgent(val)} options={[{ value: '', label: 'Sélectionner' }, ...ADMIN_AGENTS.map(a => ({ value: a.id, label: a.name }))]} /></div>
          <div className="flex items-center justify-end gap-3 pt-2"><Button variant="ghost" onClick={() => setShowReassign(false)}>Annuler</Button><Button variant="default" onClick={() => setShowReassign(false)} disabled={!selectedAgent}>Réaffecter</Button></div>
        </div>
      </Dialog>

      <Dialog isOpen={showStatus} onClose={() => setShowStatus(false)} title="Changer le statut" size="md">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50"><p className="text-sm font-medium">{contract.reference} · {CONTRACT_TYPE_LABELS[contract.type]}</p></div>
          <div><label className="text-sm font-medium mb-1.5 block">Statut actuel</label><span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${CONTRACT_STATUS_COLORS[contract.status]}`}>{CONTRACT_STATUS_LABELS[contract.status]}</span></div>
          <div><label className="text-sm font-medium mb-1.5 block">Nouveau statut</label><Select value={statusNewVal} onChange={(val) => setStatusNewVal(val as ContractStatus)} options={STATUS_OPS.map(s => ({ value: s.value, label: s.label }))} /></div>
          <div className="flex items-center justify-end gap-3 pt-2"><Button variant="ghost" onClick={() => setShowStatus(false)}>Annuler</Button><Button variant="default" onClick={() => setShowStatus(false)} disabled={statusNewVal === contract.status}>Changer le statut</Button></div>
        </div>
      </Dialog>

      <Dialog isOpen={showDelete} onClose={() => setShowDelete(false)} title="Supprimer le contrat" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50"><p className="text-sm font-medium">{contract.reference} · {CONTRACT_TYPE_LABELS[contract.type]}</p><p className="text-xs text-text-secondary">{contract.partieA.name} → {contract.partieB.name}</p></div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-2"><AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" /><div className="text-xs text-red-700 space-y-1"><p className="font-medium">Attention :</p><ul className="list-disc list-inside space-y-0.5"><li>Action IRREVERSIBLE</li><li>Contrat définitivement supprimé</li><li>Documents et historique effacés</li></ul></div></div>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">Confirmation</label><input type="text" className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error" placeholder='Tapez "SUPPRIMER" pour confirmer' value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} /></div>
          <div className="flex items-center justify-end gap-3 pt-2"><Button variant="ghost" onClick={() => setShowDelete(false)}>Annuler</Button><Button variant="danger" onClick={() => { setShowDelete(false); setDeleteConfirm('') }} disabled={deleteConfirm !== 'SUPPRIMER'}>Confirmer</Button></div>
        </div>
      </Dialog>
    </div>
  )
}
