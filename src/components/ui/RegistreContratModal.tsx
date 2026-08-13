import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  FileText, Users, Home, DollarSign, Calendar,
  Download, Send, Edit3, Trash2, ArrowRightCircle,
  RefreshCw, ExternalLink, Clipboard, MessageSquare,
  Zap, Clock, MapPin
} from 'react-feather'
import { Dialog } from './Dialog'
import { Badge } from './Badge'
import { Button } from './Button'
import { api } from '../../services/api'
import { fetchRegistre } from '../../services/registreService'
import {
  MANDAT_TYPE_LABELS,
  TRANSACTION_ETAPE_LABELS,
  TRANSACTION_ETAPE_COLORS,
  CLIENT_TYPE_LABELS,
  CLIENT_TYPE_COLORS,
} from '../../types/transactions'
import type { Transaction, MandatType, TransactionEtape } from '../../types/transactions'

interface RegistreContratModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
}

interface ClientData {
  id: string
  name: string
  clientType: string
  email: string
  phone: string
  address: string
  profession: string
  notes: string
  mandatPdfUrl: string
  mandatPdfName: string
  docIdentiteUrl: string
  docIdentiteName: string
  docDomicileUrl: string
  docDomicileName: string
  [key: string]: any
}

interface PropertyData {
  id: string
  reference: string
  title: string
  propertyType: string
  transactionType: string
  status: string
  price: number
  surface: number
  landSize: number
  rooms: number
  bedrooms: number
  bathrooms: number
  address: string
  city: string
  district: string
  location: string
  description: string
  isSeasonal: boolean
  sleepingCapacity: number
  documents: { fileTree: Array<{ name: string; url: string }> }
  features: string[]
  [key: string]: any
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-background/50 border-b border-border/40">
        <Icon size={14} className="text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{title}</span>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        {children}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-text-secondary shrink-0">{label}</span>
      <span className="text-sm text-text text-right">{value}</span>
    </div>
  )
}

function ClientCard({ label, client, clientPath, onClose }: { label: string; client: ClientData | null; clientPath: string | null; onClose: () => void }) {
  if (!client) {
    return (
      <div className="p-3 rounded-lg bg-background/50 border border-border/30">
        <p className="text-xs text-text-secondary/60">{label} : Non renseigné</p>
      </div>
    )
  }
  return (
    <div className="p-3 rounded-lg bg-background/50 border border-border/30 space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary/60">{label}</p>
      <p className="text-sm font-medium text-text">{client.name}</p>
      {client.email && (
        <p className="text-xs text-text-secondary flex items-center gap-1.5">
          <span className="text-text-secondary/40">•</span> {client.email}
        </p>
      )}
      {client.phone && (
        <p className="text-xs text-text-secondary flex items-center gap-1.5">
          <span className="text-text-secondary/40">•</span> {client.phone}
        </p>
      )}
      {clientPath && (
        <Link
          to={clientPath}
          onClick={onClose}
          className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors mt-1"
        >
          Voir la fiche client <ExternalLink size={10} />
        </Link>
      )}
    </div>
  )
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR')
  } catch {
    return dateStr
  }
}

function getDisplayPrice(prop: PropertyData): number {
  if (prop.prixNetVendeur && prop.honorairesPct && prop.honorairesType === 'inclus') {
    return Math.round(Number(prop.prixNetVendeur) * (1 + Number(prop.honorairesPct) / 100))
  }
  return prop.prixNetVendeur || prop.price || 0
}

const COUNTERPART_MAP: Record<string, string> = {
  'Vendeur': 'Acheteur',
  'Acheteur': 'Vendeur',
  'Bailleur': 'Locataire',
  'Locataire': 'Bailleur',
  'Voyageur': 'Bailleur',
}

const ETAPE_STATUS_LABELS: Record<string, string> = {
  reservation: 'Réservation',
  signe: 'Signé',
  annule: 'Annulé',
  cloture: 'Finalisé / Terminé',
  actif: 'Confirmé / Actif',
  en_attente: 'En attente',
  expire: 'Expiré',
  resilie: 'Résilié',
}

export function RegistreContratModal({ isOpen, onClose, transaction }: RegistreContratModalProps) {
  const location = useLocation()
  const [client, setClient] = useState<ClientData | null>(null)
  const [counterpartClient, setCounterpartClient] = useState<ClientData | null>(null)
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !transaction) return
    setLoading(true)
    setClient(null)
    setCounterpartClient(null)
    setProperty(null)
    setContract(null)

    const fetches: Promise<any>[] = []

    if (transaction.clientId) {
      fetches.push(
        api.get<ClientData>(`/clients/${transaction.clientId}`)
          .then(c => {
            setClient(c)
          })
          .catch(() => {})
      )
    }

    if (transaction.propertyId) {
      fetches.push(
        api.get<PropertyData>(`/properties/${transaction.propertyId}`)
          .then(p => setProperty(p))
          .catch(() => {})
      )
    }

    const counterpartType = COUNTERPART_MAP[transaction.clientType]
    if (counterpartType && transaction.propertyId) {
      fetches.push(
        fetchRegistre({ property_id: transaction.propertyId })
          .then((entries: any[]) => {
            const match = Array.isArray(entries)
              ? entries.find((e: any) => e.clientType === counterpartType && e.clientId !== transaction.clientId)
              : null
            if (match?.clientId) {
              return api.get<ClientData>(`/clients/${match.clientId}`)
                .then(c => setCounterpartClient(c))
                .catch(() => {})
            }
          })
          .catch(() => {})
      )
    }

    if (transaction.clientId) {
      fetches.push(
        api.get<any[]>('/contracts', { client_id: transaction.clientId })
          .then((contracts: any[]) => {
            if (!Array.isArray(contracts)) return
            const match = contracts.find((c: any) =>
              c.propertyId === transaction.propertyId ||
              (!transaction.propertyId && c.clientType === transaction.clientType)
            )
            if (match) setContract(match)
          })
          .catch(() => {})
      )
    }

    Promise.all(fetches).finally(() => setLoading(false))
  }, [isOpen, transaction])

  if (!transaction) return null

  const t = transaction
  const clientType = t.clientType || ''
  const isVente = clientType === 'Vendeur' || clientType === 'Acheteur'
  const isLocation = clientType === 'Bailleur' || clientType === 'Locataire'
  const isVoyageur = clientType === 'Voyageur'

  const contractRef = contract?.reference || t.reference

  const modalTitle = isVente
    ? `Contrat de Vente - ${contractRef}`
    : isVoyageur
      ? `Contrat de Location Saisonnière - ${contractRef}`
      : `Contrat de Location Classique - ${contractRef}`

  const subtitle = t.propertyTitle || ''

  const etapeLabel = ETAPE_STATUS_LABELS[t.etape] || TRANSACTION_ETAPE_LABELS[t.etape as TransactionEtape] || t.etape

  const getClientDetailPath = (c?: ClientData | null) => {
    const clientId = c?.id || t.clientId
    if (!clientId) return null
    const path = location.pathname
    const adminMatch = path.match(/^\/admin\/([^/]+)/)
    if (adminMatch) return `/admin/${adminMatch[1]}/clients/${clientId}`
    const agentMatch = path.match(/^\/([^/]+)\/(?:register|clients|properties|contracts|messages)/)
    if (agentMatch) return `/${agentMatch[1]}/clients/${clientId}`
    return null
  }

  const getPropertyDetailPath = () => {
    const id = t.propertyId
    if (!id) return '#'
    const path = location.pathname
    const adminMatch = path.match(/^\/admin\/([^/]+)/)
    if (adminMatch) return `/admin/${adminMatch[1]}/properties/${id}`
    const agentMatch = path.match(/^\/([^/]+)\/(?:register|clients|properties|contracts|messages)/)
    if (agentMatch) return `/${agentMatch[1]}/properties/${id}`
    return '#'
  }

  const clientData = client as any
  const propData = property as any

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="2xl"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Subtitle */}
        {subtitle && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <FileText size={14} />
            <span className="font-medium text-text">{subtitle}</span>
            {t.propertyRef && (
              <>
                <span className="text-border">·</span>
                <span className="font-mono text-xs">{t.propertyRef}</span>
              </>
            )}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={20} className="text-text-secondary/30 animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* ===== INFORMATIONS GÉNÉRALES ===== */}
            <Section icon={Clipboard} title="Informations générales">
              <Field label="Référence" value={
                <span className="font-mono">{contract?.reference || t.reference}</span>
              } />
              <Field label="Type" value={
                contract?.contractType
                  ? ({ vente: 'Vente', location_classique: 'Location classique', location_saisonniere: 'Location saisonnière' } as Record<string, string>)[contract.contractType as string] || contract.contractType
                  : (MANDAT_TYPE_LABELS[t.type as MandatType] || t.type)
              } />
              <Field label="Statut" value={
                <Badge className={TRANSACTION_ETAPE_COLORS[t.etape as TransactionEtape]}>
                  {contract?.status
                    ? ({ en_cours: 'En cours', confirme_actif: 'Confirmé / Actif', paye: 'Payé', finalise_termine: 'Finalisé / Terminé', annule: 'Annulé', occupe: 'Occupé' } as Record<string, string>)[contract.status as string] || contract.status
                    : etapeLabel
                  }
                </Badge>
              } />
              {(contract?.createdAt || (t as any).createdAt) && (
                <Field label="Date de création" value={formatDate(contract?.createdAt || String((t as any).createdAt))} />
              )}
              {(contract?.startDate || t.dateContrat) && (
                <Field label="Date de signature" value={formatDate(contract?.startDate || t.dateContrat)} />
              )}
              {isVente && (clientData?.dateExpiration || contract?.endDate || t.dateExpiration) && (
                <Field label="Date d'expiration du mandat" value={formatDate(clientData?.dateExpiration || contract?.endDate || t.dateExpiration)} />
              )}
              {isLocation && clientData?.dateExpiration && (
                <>
                  <Field label="Date de début" value={formatDate(clientData.dateDebut || t.dateContrat)} />
                  <Field label="Date de fin" value={formatDate(clientData.dateExpiration)} />
                </>
              )}
              {t.dateExpiration && !isLocation && (
                <Field label="Date d'expiration" value={formatDate(t.dateExpiration)} />
              )}
              {t.agentName && <Field label="Agent" value={t.agentName} />}
            </Section>

            {/* ===== PARTIES ===== */}
            <Section icon={Users} title="Parties">
              {isVente && (
                <>
                  <ClientCard
                    label={clientType === 'Vendeur' ? 'Vendeur' : 'Acheteur'}
                    client={client}
                    clientPath={getClientDetailPath(client)}
                    onClose={onClose}
                  />
                  <ClientCard
                    label={clientType === 'Vendeur' ? 'Acheteur' : 'Vendeur'}
                    client={counterpartClient}
                    clientPath={getClientDetailPath(counterpartClient)}
                    onClose={onClose}
                  />
                </>
              )}
              {isLocation && (
                <>
                  <ClientCard
                    label={clientType === 'Bailleur' ? 'Bailleur' : 'Locataire'}
                    client={client}
                    clientPath={getClientDetailPath(client)}
                    onClose={onClose}
                  />
                  <ClientCard
                    label={clientType === 'Bailleur' ? 'Locataire' : 'Bailleur'}
                    client={counterpartClient}
                    clientPath={getClientDetailPath(counterpartClient)}
                    onClose={onClose}
                  />
                </>
              )}
              {isVoyageur && (
                <>
                  <ClientCard
                    label="Bailleur"
                    client={counterpartClient}
                    clientPath={getClientDetailPath(counterpartClient)}
                    onClose={onClose}
                  />
                  <ClientCard
                    label="Voyageur"
                    client={client}
                    clientPath={getClientDetailPath(client)}
                    onClose={onClose}
                  />
                </>
              )}
            </Section>

            {/* ===== BIEN CONCERNÉ ===== */}
            <Section icon={Home} title="Bien concerné">
              {property ? (
                <>
                  <Field label="Bien" value={property.title} />
                  <Field label="Référence" value={<span className="font-mono">{property.reference}</span>} />
                  {property.address && <Field label="Adresse" value={property.address} />}
                  {property.city && <Field label="Ville" value={property.city} />}
                  {property.surface > 0 && <Field label="Surface" value={`${property.surface} m²`} />}
                  {property.landSize > 0 && <Field label="Terrain" value={`${property.landSize} m²`} />}
                  {property.rooms > 0 && <Field label="Pièces" value={property.rooms} />}
                  {property.bedrooms > 0 && <Field label="Chambres" value={property.bedrooms} />}
                  {property.bathrooms > 0 && <Field label="SDB" value={property.bathrooms} />}
                  {isVoyageur && property.sleepingCapacity > 0 && (
                    <Field label="Couchages" value={property.sleepingCapacity} />
                  )}
                  <Link
                    to={getPropertyDetailPath()}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                  >
                    Voir la fiche bien <ExternalLink size={10} />
                  </Link>
                </>
              ) : t.propertyTitle ? (
                <>
                  <Field label="Bien" value={t.propertyTitle} />
                  {t.propertyRef && <Field label="Référence" value={<span className="font-mono">{t.propertyRef}</span>} />}
                </>
              ) : (
                <p className="text-xs text-text-secondary/60 py-1">Aucun bien associé</p>
              )}
            </Section>

            {/* ===== INFORMATIONS FINANCIÈRES - VENTE ===== */}
            {isVente && (
              <Section icon={DollarSign} title="Informations financières">
                {clientData?.prixVenteFAI && (
                  <Field label="Prix de vente FAI" value={`${Number(clientData.prixVenteFAI).toLocaleString('fr-FR')} MAD`} />
                )}
                {propData?.price > 0 && !clientData?.prixVenteFAI && (
                  <Field label="Prix de vente" value={`${Number(propData.price).toLocaleString('fr-FR')} MAD`} />
                )}
                {clientData?.prixNetVendeur && (
                  <Field label="Prix net vendeur" value={`${Number(clientData.prixNetVendeur).toLocaleString('fr-FR')} MAD`} />
                )}
                {clientData?.montantRemuneration && (
                  <Field label="Honoraires" value={
                    clientData.remunerationIsPercentage
                      ? `${clientData.montantRemuneration}%`
                      : `${Number(clientData.montantRemuneration).toLocaleString('fr-FR')} MAD`
                  } />
                )}
                {clientData?.typeRemuneration && (
                  <Field label="Type d'honoraires" value={clientData.typeRemuneration} />
                )}
                {clientData?.sequestre !== undefined && clientData?.sequestre !== null && clientData?.sequestre !== '' && (
                  <Field label="Séquestre" value={`${Number(clientData.sequestre || 0).toLocaleString('fr-FR')} MAD`} />
                )}
                {t.montant && (
                  <Field label="Montant transaction" value={t.montant} />
                )}
              </Section>
            )}

            {/* ===== INFORMATIONS FINANCIÈRES - LOCATION CLASSIQUE ===== */}
            {isLocation && (
              <Section icon={DollarSign} title="Informations financières">
                {clientData?.loyerHC && (
                  <Field label="Loyer HC" value={`${Number(clientData.loyerHC).toLocaleString('fr-FR')} MAD / mois`} />
                )}
                {clientData?.charges && (
                  <Field label="Charges" value={`${Number(clientData.charges).toLocaleString('fr-FR')} MAD / mois`} />
                )}
                {clientData?.loyerHC && clientData?.charges && (
                  <Field label="Loyer CC" value={`${Number(clientData.loyerHC + clientData.charges).toLocaleString('fr-FR')} MAD / mois`} />
                )}
                {clientData?.depotGarantie && (
                  <Field label="Dépôt de garantie" value={`${Number(clientData.depotGarantie).toLocaleString('fr-FR')} MAD`} />
                )}
                {clientData?.montantRemuneration && (
                  <Field label="Honoraires de location" value={
                    clientData.remunerationIsPercentage
                      ? `${clientData.montantRemuneration}%`
                      : `${Number(clientData.montantRemuneration).toLocaleString('fr-FR')} MAD`
                  } />
                )}
                {clientData?.fraisMiseEnLocation && (
                  <Field label="Frais mise en location" value={`${Number(clientData.fraisMiseEnLocation).toLocaleString('fr-FR')} MAD`} />
                )}
              </Section>
            )}

            {/* ===== DÉTAILS DU SÉJOUR - VOYAGEUR ===== */}
            {isVoyageur && (
              <Section icon={Clock} title="Détails du séjour">
                {clientData?.numeroReservation && (
                  <Field label="Numéro de réservation" value={<span className="font-mono">{clientData.numeroReservation}</span>} />
                )}
                {clientData?.dateArrivee && <Field label="Date d'arrivée" value={formatDate(clientData.dateArrivee)} />}
                {clientData?.dateDepart && <Field label="Date de départ" value={formatDate(clientData.dateDepart)} />}
                {clientData?.nbNuits && <Field label="Nombre de nuits" value={clientData.nbNuits} />}
                {clientData?.nbAdultes && <Field label="Nombre d'adultes" value={clientData.nbAdultes} />}
                {clientData?.nbEnfants && clientData.nbEnfants > 0 && (
                  <Field label="Nombre d'enfants" value={clientData.nbEnfants} />
                )}
                {clientData?.dateReservation && (
                  <Field label="Date de réservation" value={formatDate(clientData.dateReservation)} />
                )}
              </Section>
            )}

            {/* ===== INFORMATIONS FINANCIÈRES - VOYAGEUR ===== */}
            {isVoyageur && (
              <Section icon={DollarSign} title="Informations financières">
                {clientData?.tarifNuit && (
                  <Field label="Tarif par nuit" value={`${Number(clientData.tarifNuit).toLocaleString('fr-FR')} MAD`} />
                )}
                {clientData?.nbNuits && (
                  <Field label="Nombre de nuits" value={clientData.nbNuits} />
                )}
                {clientData?.montantTotalHorsOptions && (
                  <Field label="Montant total (hors options)" value={`${Number(clientData.montantTotalHorsOptions).toLocaleString('fr-FR')} MAD`} />
                )}
                {clientData?.optionsMontant && clientData.optionsMontant > 0 && (
                  <Field label="Options" value={`${Number(clientData.optionsMontant).toLocaleString('fr-FR')} MAD`} />
                )}
                {clientData?.montantTotalAvecOptions && (
                  <Field label="Montant total (avec options)" value={`${Number(clientData.montantTotalAvecOptions).toLocaleString('fr-FR')} MAD`} />
                )}
                {clientData?.acompteMontant && (
                  <Field label="Acompte versé" value={`${Number(clientData.acompteMontant).toLocaleString('fr-FR')} MAD`} />
                )}
                {clientData?.soldeRestant && (
                  <Field label="Solde restant" value={`${Number(clientData.soldeRestant).toLocaleString('fr-FR')} MAD`} />
                )}
                {clientData?.cautionMontant && (
                  <Field label="Caution" value={`${Number(clientData.cautionMontant).toLocaleString('fr-FR')} MAD`} />
                )}
              </Section>
            )}

            {/* ===== DOCUMENTS LIÉS ===== */}
            <Section icon={FileText} title="Documents liés">
              <div className="space-y-2">
                {client?.mandatPdfUrl && (
                  <a
                    href={client.mandatPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/30 hover:border-accent/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText size={14} className="text-accent shrink-0" />
                      <span className="text-sm text-text truncate">{client.mandatPdfName || 'Contrat signé'}</span>
                    </div>
                    <Download size={14} className="text-text-secondary group-hover:text-accent shrink-0 transition-colors" />
                  </a>
                )}
                {client?.docIdentiteUrl && (
                  <a
                    href={client.docIdentiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/30 hover:border-accent/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText size={14} className="text-text-secondary shrink-0" />
                      <span className="text-sm text-text truncate">{client.docIdentiteName || "Pièce d'identité"}</span>
                    </div>
                    <Download size={14} className="text-text-secondary group-hover:text-accent shrink-0 transition-colors" />
                  </a>
                )}
                {client?.docDomicileUrl && (
                  <a
                    href={client.docDomicileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/30 hover:border-accent/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText size={14} className="text-text-secondary shrink-0" />
                      <span className="text-sm text-text truncate">{client.docDomicileName || 'Justificatif de domicile'}</span>
                    </div>
                    <Download size={14} className="text-text-secondary group-hover:text-accent shrink-0 transition-colors" />
                  </a>
                )}
                {property?.documents?.fileTree?.map((doc: any, i: number) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/30 hover:border-accent/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText size={14} className="text-text-secondary shrink-0" />
                      <span className="text-sm text-text truncate">{doc.name}</span>
                    </div>
                    <Download size={14} className="text-text-secondary group-hover:text-accent shrink-0 transition-colors" />
                  </a>
                ))}
                {!client?.mandatPdfUrl && !client?.docIdentiteUrl && !client?.docDomicileUrl &&
                  (!property?.documents?.fileTree || property.documents.fileTree.length === 0) && (
                  <p className="text-xs text-text-secondary/60 py-2">Aucun document lié</p>
                )}
              </div>
            </Section>

            {/* ===== NOTES ===== */}
            {(t.notes || client?.notes) && (
              <Section icon={MessageSquare} title="Notes">
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {t.notes || client?.notes}
                </p>
              </Section>
            )}

            {/* ===== ACTIONS ===== */}
            <Section icon={Zap} title="Actions">
              <div className="flex flex-wrap gap-2">
                <Button variant="default" size="sm" className="text-xs" onClick={() => {}}>
                  <Download size={12} className="mr-1.5" />
                  Télécharger le contrat
                </Button>
                <Button variant="default" size="sm" className="text-xs" onClick={() => {}}>
                  <Send size={12} className="mr-1.5" />
                  Envoyer au client
                </Button>
                <Button variant="default" size="sm" className="text-xs" onClick={() => {}}>
                  <ExternalLink size={12} className="mr-1.5" />
                  Exporter PDF
                </Button>
                <Button variant="default" size="sm" className="text-xs" onClick={() => {}}>
                  <Edit3 size={12} className="mr-1.5" />
                  Modifier
                </Button>
                <Button variant="default" size="sm" className="text-xs" onClick={() => {}}>
                  <ArrowRightCircle size={12} className="mr-1.5" />
                  Changer le statut
                </Button>
                <Button variant="danger" size="sm" className="text-xs" onClick={() => {}}>
                  <Trash2 size={12} className="mr-1.5" />
                  Supprimer
                </Button>
              </div>
            </Section>
          </>
        )}
      </div>
    </Dialog>
  )
}
