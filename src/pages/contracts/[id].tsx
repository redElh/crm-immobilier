import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, User, Home, DollarSign, Calendar, Clock, Download, Plus, Trash2, ArrowLeft, Edit3, Phone, Mail, MapPin, Shield } from 'react-feather'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { BackLink } from '../../components/ui/BackLink'
import { DocumentCategorySection } from '../../components/modules/documents/DocumentCategorySection'
import {
  mockContracts,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  VENTE_ETAPE_LABELS,
  VENTE_ETAPE_COLORS,
  partyRoleColor,
} from '../../types/contract'
import type { Contract } from '../../types/contract'

interface TabItem {
  id: string
  label: string
  icon: React.ReactNode
}

export default function ContractDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('apercu')

  const contract = mockContracts.find(c => c.id === id)

  if (!contract) {
    return (
      <div className="space-y-6 animate-fade-in">
        <BackLink />
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
          <FileText size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Contrat non trouvé</p>
          <p className="text-sm text-text-secondary/60 mt-1">Ce contrat n'existe pas ou a été supprimé</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/contracts')}>
            Retour aux contrats
          </Button>
        </div>
      </div>
    )
  }

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: contract.devise, maximumFractionDigits: 0 }).format(p)

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  const tabs: TabItem[] = [
    { id: 'apercu', label: 'Aperçu', icon: <FileText size={15} /> },
    { id: 'parties', label: 'Parties', icon: <User size={15} /> },
    { id: 'financier', label: 'Financier', icon: <DollarSign size={15} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={15} /> },
    { id: 'historique', label: 'Historique', icon: <Clock size={15} /> },
  ]

  const formatRelativeDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return "Aujourd'hui"
    if (days === 1) return 'Hier'
    if (days < 30) return `Il y a ${days} jours`
    return date.toLocaleDateString('fr-FR')
  }

  const renderApercu = () => (
    <div className="space-y-6">
      {/* Key dates */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Dates clés</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InfoBox label="Création" value={formatDate(contract.dateCreation)} />
          {contract.type === 'vente' && (
            <>
              <InfoBox label="Offre" value={formatDate(contract.dateOffre)} />
              <InfoBox label="Réservation" value={formatDate(contract.dateReservation)} />
              <InfoBox label="Compromis" value={formatDate(contract.dateCompromis)} />
              {contract.dateActe && <InfoBox label="Acte authentique" value={formatDate(contract.dateActe)} />}
            </>
          )}
          {contract.type === 'location_classique' && (
            <>
              <InfoBox label="Début du bail" value={formatDate(contract.dateDebutBail)} />
              <InfoBox label="Fin du bail" value={formatDate(contract.dateFinBail)} />
            </>
          )}
          {contract.type === 'location_saisonniere' && (
            <>
              <InfoBox label="Arrivée" value={formatDate(contract.dateArrivee)} />
              <InfoBox label="Départ" value={formatDate(contract.dateDepart)} />
            </>
          )}
        </div>
      </div>

      {/* Parties */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Parties prenantes</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PartyCard
            label={contract.partieA.role}
            name={contract.partieA.name}
            type={contract.partieA.type}
            phone={contract.partieA.phone}
            email={contract.partieA.email}
          />
          <PartyCard
            label={contract.partieB.role}
            name={contract.partieB.name}
            type={contract.partieB.type}
            phone={contract.partieB.phone}
            email={contract.partieB.email}
          />
        </div>
      </div>

      {/* Property */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Bien concerné</h3>
        <div className="p-4 rounded-xl bg-background border border-border/50 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
            <Home size={16} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-text">{contract.propertyTitle}</p>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-0.5">
              <MapPin size={11} />
              <span>{contract.propertyAddress}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{contract.propertyTypeLabel}</Badge>
              <span className="text-[11px] text-text-secondary/60 font-mono">{contract.propertyRef}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={13} className="rotate-180" />} onClick={() => navigate(`/properties/${contract.propertyId}`)}>
            Voir le bien
          </Button>
        </div>
      </div>

      {/* Etape for vente */}
      {contract.type === 'vente' && contract.etape && (
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Avancement</h3>
          <div className="flex items-center gap-2">
            <Badge className={VENTE_ETAPE_COLORS[contract.etape]}>
              {VENTE_ETAPE_LABELS[contract.etape]}
            </Badge>
            <span className="text-xs text-text-secondary">Étape actuelle</span>
          </div>
        </div>
      )}

      {/* Financial summary */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Résumé financier</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {contract.type === 'vente' && (
            <>
              <InfoBox label="Prix de vente" value={contract.prixVente ? formatPrice(contract.prixVente) : '—'} highlight />
              <InfoBox label="Net vendeur" value={contract.montantNetVendeur ? formatPrice(contract.montantNetVendeur) : '—'} />
              {contract.honorairesTTC && <InfoBox label="Honoraires TTC" value={formatPrice(contract.honorairesTTC)} />}
              {contract.sequestre && <InfoBox label="Séquestre" value={formatPrice(contract.sequestre)} />}
            </>
          )}
          {contract.type === 'location_classique' && (
            <>
              <InfoBox label="Loyer HC" value={contract.loyerMensuelHC ? formatPrice(contract.loyerMensuelHC) : '—'} highlight />
              <InfoBox label="Charges" value={contract.chargesMensuelles ? formatPrice(contract.chargesMensuelles) : '—'} />
              <InfoBox label="Dépôt de garantie" value={contract.depotGarantie ? formatPrice(contract.depotGarantie) : '—'} />
            </>
          )}
          {contract.type === 'location_saisonniere' && (
            <>
              <InfoBox label="Total séjour" value={contract.prixTotalSejour ? formatPrice(contract.prixTotalSejour) : '—'} highlight />
              <InfoBox label="Acompte versé" value={contract.acompteVerse ? formatPrice(contract.acompteVerse) : '—'} />
              <InfoBox label="Caution" value={contract.caution ? formatPrice(contract.caution) : '—'} />
            </>
          )}
        </div>
      </div>
    </div>
  )

  const renderParties = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PartyDetailCard
          title={contract.partieA.role}
          subtitle="Partie A — Côté propriétaire"
          party={contract.partieA}
        />
        <PartyDetailCard
          title={contract.partieB.role}
          subtitle="Partie B — Côté acquéreur"
          party={contract.partieB}
        />
      </div>
      <div className="p-4 rounded-xl bg-background border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-accent" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Agent principal</p>
            <p className="font-medium text-text">{contract.agentPrincipal}</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderFinancier = () => (
    <div className="space-y-6">
      {contract.type === 'vente' && (
        <>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Détails financiers — Vente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FinField label="Prix de vente" value={contract.prixVente ? formatPrice(contract.prixVente) : '—'} />
            <FinField label="Montant net vendeur" value={contract.montantNetVendeur ? formatPrice(contract.montantNetVendeur) : '—'} />
            <FinField label="Honoraires TTC" value={contract.honorairesTTC ? formatPrice(contract.honorairesTTC) : '—'} />
            {contract.sequestre && <FinField label="Séquestre" value={formatPrice(contract.sequestre)} />}
            {contract.conditionPaiementHonoraires && <FinField label="Paiement des honoraires" value={contract.conditionPaiementHonoraires} />}
          </div>
        </>
      )}
      {contract.type === 'location_classique' && (
        <>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Détails financiers — Location classique</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FinField label="Loyer mensuel HC" value={contract.loyerMensuelHC ? formatPrice(contract.loyerMensuelHC) : '—'} />
            <FinField label="Charges mensuelles" value={contract.chargesMensuelles ? formatPrice(contract.chargesMensuelles) : '—'} />
            <FinField label="Loyer total CC" value={contract.loyerMensuelHC && contract.chargesMensuelles ? formatPrice(contract.loyerMensuelHC + contract.chargesMensuelles) : '—'} />
            <FinField label="Dépôt de garantie" value={contract.depotGarantie ? formatPrice(contract.depotGarantie) : '—'} />
            <FinField label="Honoraires de location" value={contract.honorairesLocation ? formatPrice(contract.honorairesLocation) : '—'} />
          </div>
        </>
      )}
      {contract.type === 'location_saisonniere' && (
        <>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Détails financiers — Location saisonnière</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FinField label="Prix total du séjour" value={contract.prixTotalSejour ? formatPrice(contract.prixTotalSejour) : '—'} />
            <FinField label="Acompte versé (30%)" value={contract.acompteVerse ? formatPrice(contract.acompteVerse) : '—'} />
            <FinField label="Solde restant" value={contract.soldeRestant ? formatPrice(contract.soldeRestant) : '—'} />
            <FinField label="Caution" value={contract.caution ? formatPrice(contract.caution) : '—'} />
          </div>
        </>
      )}
      {contract.notes && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Notes</h3>
          <p className="text-sm text-text/80 p-3 rounded-xl bg-background border border-border/50">{contract.notes}</p>
        </div>
      )}
    </div>
  )

  const renderDocuments = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" icon={<Plus size={14} />}>
          Ajouter un document
        </Button>
      </div>
      <DocumentCategorySection
        title="Documents du contrat"
        description="Pièces justificatives et contrats signés"
        icon={<Shield size={16} />}
        documents={contract.documents.map(d => ({ ...d, category: d.category || 'contrat' }))}
        onDownload={() => {}}
        onDelete={() => {}}
        emptyMessage="Aucun document lié à ce contrat"
        defaultOpen={true}
      />
    </div>
  )

  const renderHistorique = () => (
    <div className="space-y-4">
      {contract.history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
          <Clock size={32} className="mb-3 opacity-40" />
          <p className="text-sm">Aucun historique disponible</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-0">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
          {contract.history.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
              className="relative pb-5 last:pb-0"
            >
              <div className="absolute -left-[21px] top-1 w-[10px] h-[10px] rounded-full border-2 border-accent bg-card" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-text">{entry.action}</p>
                  {entry.details && <p className="text-xs text-text-secondary mt-0.5">{entry.details}</p>}
                  <p className="text-[11px] text-text-secondary/60 mt-1">par {entry.agent}</p>
                </div>
                <span className="text-[11px] text-text-secondary/60 whitespace-nowrap">{formatRelativeDate(entry.date)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <BackLink />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download size={14} />}>
            Exporter PDF
          </Button>
          <Button variant="outline" size="sm" icon={<Edit3 size={14} />}>
            Modifier
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[11px] text-text-secondary/60 font-mono">{contract.reference}</p>
                <h1 className="text-xl font-bold mt-0.5 leading-snug">
                  {CONTRACT_TYPE_LABELS[contract.type]}
                </h1>
              </div>
              <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
                {CONTRACT_STATUS_LABELS[contract.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <User size={13} />
              <span>{contract.partieA.name}</span>
              <span className="text-text-secondary/40">→</span>
              <span>{contract.partieB.name}</span>
            </div>
            {contract.type === 'vente' && contract.etape && (
              <div className="mt-3 flex items-center gap-2">
                <Badge className={VENTE_ETAPE_COLORS[contract.etape]}>
                  {VENTE_ETAPE_LABELS[contract.etape]}
                </Badge>
                <span className="text-xs text-text-secondary">Étape en cours</span>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
                <Home size={16} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{contract.propertyTitle}</p>
                <p className="text-xs text-text-secondary truncate">{contract.propertyAddress}</p>
              </div>
              <Button variant="ghost" size="sm" icon={<ArrowLeft size={13} className="rotate-180" />} onClick={() => navigate(`/properties/${contract.propertyId}`)} />
            </div>
          </Card>

          {contract.type === 'vente' && contract.prixVente && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Montant</span>
                <span className="text-lg font-bold text-accent">{formatPrice(contract.prixVente)}</span>
              </div>
            </Card>
          )}
          {contract.type === 'location_classique' && contract.loyerMensuelHC && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Loyer mensuel</span>
                <span className="text-lg font-bold text-accent">{formatPrice(contract.loyerMensuelHC)}<span className="text-sm text-text-secondary font-normal">/mois</span></span>
              </div>
            </Card>
          )}
          {contract.type === 'location_saisonniere' && contract.prixTotalSejour && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Total séjour</span>
                <span className="text-lg font-bold text-accent">{formatPrice(contract.prixTotalSejour)}</span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin border-b border-border/40">
          <div className="flex px-1 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-accent border-accent'
                    : 'text-text-secondary border-transparent hover:text-text hover:border-border'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'apercu' && renderApercu()}
              {activeTab === 'parties' && renderParties()}
              {activeTab === 'financier' && renderFinancier()}
              {activeTab === 'documents' && renderDocuments()}
              {activeTab === 'historique' && renderHistorique()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ---- Sub-components ----

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
      <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
        <User size={16} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-text">{name}</p>
          <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border ${partyRoleColor(type)}`}>
            {type}
          </span>
        </div>
        <p className="text-xs text-text-secondary/60">{label}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-text-secondary flex items-center gap-1">
            <Phone size={10} /> {phone}
          </span>
          <span className="text-xs text-text-secondary flex items-center gap-1">
            <Mail size={10} /> {email}
          </span>
        </div>
      </div>
    </div>
  </div>
)

const PartyDetailCard = ({ title, subtitle, party }: { title: string; subtitle: string; party: Contract['partieA'] }) => (
  <Card className="p-5">
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        <p className="text-xs text-text-secondary">{subtitle}</p>
      </div>
      <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-lg border ${partyRoleColor(party.type)}`}>
        {party.type}
      </span>
    </div>
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
        <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
          <span className="text-accent font-bold text-xs">{party.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-text">{party.name}</p>
          <p className="text-xs text-text-secondary/60">{party.role}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2 text-text-secondary">
          <Phone size={12} />
          <span>{party.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <Mail size={12} />
          <span className="truncate">{party.email}</span>
        </div>
      </div>
    </div>
  </Card>
)
