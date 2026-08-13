import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  User, Home, FileText, DollarSign, Calendar,
  Download, Edit3, Send, ArrowRightCircle,
  RefreshCw, ExternalLink, Plus, ChevronRight
} from 'react-feather'
import { Dialog } from './Dialog'
import { Badge } from './Badge'
import { Button } from './Button'
import { api } from '../../services/api'
import {
  MANDAT_TYPE_LABELS,
  TRANSACTION_ETAPE_LABELS,
  TRANSACTION_ETAPE_COLORS,
  CLIENT_TYPE_LABELS,
  CLIENT_TYPE_COLORS,
} from '../../types/transactions'
import type { Transaction, MandatType, TransactionEtape } from '../../types/transactions'

interface RegistreDetailModalProps {
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
  statutMetier: string
  mandatStatus: string
  data?: Record<string, any>
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
  prixNetVendeur?: number
  honorairesPct?: number
  honorairesType?: string
  surface: number
  landSize: number
  bedrooms: number
  bathrooms: number
  rooms: number
  sleepingCapacity: number
  location: string
  address: string
  city: string
  district: string
  mandateType: string
  isSeasonal: boolean
  data?: Record<string, any>
  [key: string]: any
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-background/50 border-b border-border/40">
        <Icon size={14} className="text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{title}</span>
      </div>
      <div className="px-4 py-3 space-y-2">
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

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR')
  } catch {
    return dateStr
  }
}

function daysUntil(dateStr?: string) {
  if (!dateStr) return null
  try {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? `J-${diff}` : diff === 0 ? "Aujourd'hui" : `Expire depuis ${Math.abs(diff)}j`
  } catch {
    return null
  }
}

function getDisplayPrice(prop: PropertyData): number {
  if (prop.prixNetVendeur && prop.honorairesPct && prop.honorairesType === 'inclus') {
    return Math.round(Number(prop.prixNetVendeur) * (1 + Number(prop.honorairesPct) / 100))
  }
  return prop.prixNetVendeur || prop.price || 0
}

export function RegistreDetailModal({ isOpen, onClose, transaction }: RegistreDetailModalProps) {
  const [client, setClient] = useState<ClientData | null>(null)
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [linkedProperties, setLinkedProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (!isOpen || !transaction) return
    setLoading(true)
    setClient(null)
    setProperty(null)
    setLinkedProperties([])

    const fetches: Promise<any>[] = []

    if (transaction.clientId) {
      fetches.push(
        api.get<ClientData>(`/clients/${transaction.clientId}`)
          .then(c => {
            setClient(c)
            const bienId = (c as any).bienConcerneId || (c as any).mandat_id
            if (bienId) {
              api.get<PropertyData>(`/properties/${bienId}`)
                .then(p => setLinkedProperties([p]))
                .catch(() => {})
            }
          })
          .catch(() => {})
      )

      const clientType = transaction.clientType || ''
      if (clientType === 'Locataire') {
        fetches.push(
          api.get<PropertyData[]>('/properties', { client_id: String(transaction.clientId) })
            .then(data => setLinkedProperties(Array.isArray(data) ? data : []))
            .catch(() => {})
        )
      }
    }

    if (transaction.propertyId) {
      fetches.push(
        api.get<PropertyData>(`/properties/${transaction.propertyId}`)
          .then(setProperty)
          .catch(() => {})
      )
    }

    Promise.all(fetches).finally(() => setLoading(false))
  }, [isOpen, transaction])

  if (!transaction) return null

  const t = transaction
  const clientType = t.clientType || ''
  const data = client || ({} as ClientData)
  const mandatLabel = MANDAT_TYPE_LABELS[t.type as MandatType] || t.type
  const etapeLabel = TRANSACTION_ETAPE_LABELS[t.etape as TransactionEtape] || t.etape

  const typeTitle: Record<string, string> = {
    Acheteur: 'Recherche achat',
    Vendeur: 'Vente',
    Bailleur: 'Location gestion',
    Locataire: 'Recherche location',
    Voyageur: 'Location saisonnière',
  }

  const isVoyageur = clientType === 'Voyageur'
  const modalTitle = isVoyageur
    ? `Détail du contrat - ${typeTitle[clientType] || mandatLabel}`
    : `Détail du mandat - ${typeTitle[clientType] || mandatLabel}`

  const getClientDetailPath = () => {
    if (!client?.id) return null
    const path = location.pathname
    const adminMatch = path.match(/^\/admin\/([^/]+)/)
    if (adminMatch) return `/admin/${adminMatch[1]}/clients/${client.id}`
    const agentMatch = path.match(/^\/([^/]+)\/(?:register|clients|properties|contracts|messages)/)
    if (agentMatch) return `/${agentMatch[1]}/clients/${client.id}`
    return null
  }
  const clientDetailPath = getClientDetailPath()

  const getPropertyDetailPath = (propId?: string) => {
    const id = propId || transaction?.propertyId
    if (!id) return '#'
    const path = location.pathname
    const adminMatch = path.match(/^\/admin\/([^/]+)/)
    if (adminMatch) return `/admin/${adminMatch[1]}/properties/${id}`
    const agentMatch = path.match(/^\/([^/]+)\/(?:register|clients|properties|contracts|messages)/)
    if (agentMatch) return `/${agentMatch[1]}/properties/${id}`
    return '#'
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={modalTitle} size="2xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Subtitle */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <FileText size={14} />
          <span className="font-mono">{t.reference}</span>
          <span className="text-border">·</span>
          <span className="font-medium text-text">{t.clientName}</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={20} className="text-text-secondary/30 animate-spin" />
          </div>
        )}

        {/* Client Info - always shown */}
        <Section icon={User} title="Informations client">
          <Field label="Client" value={t.clientName} />
          <Field label="Type" value={
            <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-lg border ${CLIENT_TYPE_COLORS[clientType] || ''}`}>
              {CLIENT_TYPE_LABELS[clientType] || clientType}
            </span>
          } />
          {client?.email && <Field label="Email" value={
            <a href={`mailto:${client.email}`} className="text-accent hover:underline flex items-center gap-1">
              {client.email} <ExternalLink size={10} />
            </a>
          } />}
          {client?.phone && <Field label="Téléphone" value={
            <a href={`tel:${client.phone}`} className="text-accent hover:underline">{client.phone}</a>
          } />}
          {client?.profession && <Field label="Profession" value={client.profession} />}
          {client?.address && <Field label="Adresse" value={client.address} />}
          {clientDetailPath && (
            <div className="pt-2 mt-2 border-t border-border/30">
              <Link
                to={clientDetailPath}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                Voir la fiche client <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </Section>

        {/* ACHETEUR - Search Criteria */}
        {clientType === 'Acheteur' && (
          <Section icon={Home} title="Critères de recherche">
            {(data.prixMin || data.prixMax) && (
              <Field label="Budget" value={
                data.prixMin && data.prixMax
                  ? `${Number(data.prixMin).toLocaleString('fr-FR')} ~ ${Number(data.prixMax).toLocaleString('fr-FR')} MAD`
                  : data.prixMin
                    ? `${Number(data.prixMin).toLocaleString('fr-FR')} MAD (min)`
                    : `${Number(data.prixMax).toLocaleString('fr-FR')} MAD (max)`
              } />
            )}
            {(data.surfaceMin || data.surfaceMax) && (
              <Field label="Surface" value={
                data.surfaceMin && data.surfaceMax
                  ? `${data.surfaceMin} ~ ${data.surfaceMax} m²`
                  : data.surfaceMin
                    ? `${data.surfaceMin} m² (min)`
                    : `${data.surfaceMax} m² (max)`
              } />
            )}
            {data.pieces && <Field label="Pièces" value={data.pieces} />}
            {data.chambres && <Field label="Chambres" value={data.chambres} />}
            {(data.localisation || data.secteur) && (
              <Field label="Localisation" value={
                [data.localisation, data.secteur].filter(Boolean).join(', ')
              } />
            )}
            {(data.typeBien || client?.propertyType) && <Field label="Type de bien" value={data.typeBien || client?.propertyType} />}
            {data.standing && <Field label="Standing" value={data.standing} />}
            {data.attributsPersonnalises?.length > 0 && (
              <Field label="Préférences" value={
                <div className="flex flex-wrap gap-1 justify-end">
                  {data.attributsPersonnalises.map((c: string, i: number) => (
                    <span key={i} className="px-1.5 py-0.5 text-[10px] rounded bg-accent/10 text-accent">{c}</span>
                  ))}
                </div>
              } />
            )}
            {data.criteres?.length > 0 && (
              <Field label="Critères" value={
                <div className="flex flex-wrap gap-1 justify-end">
                  {data.criteres.map((c: string, i: number) => (
                    <span key={i} className="px-1.5 py-0.5 text-[10px] rounded bg-accent/10 text-accent">{c}</span>
                  ))}
                </div>
              } />
            )}
          </Section>
        )}

        {/* VENDEUR / BAILLEUR - Property Info */}
        {(clientType === 'Vendeur' || clientType === 'Bailleur') && (
          <Section icon={Home} title="Informations du bien">
            {property ? (
              <>
                <Field label="Bien" value={property.title} />
                <Field label="Référence" value={<span className="font-mono">{property.reference}</span>} />
                {property.address && <Field label="Adresse" value={property.address} />}
                {property.city && <Field label="Ville" value={property.city} />}
                {property.surface > 0 && <Field label="Surface" value={`${property.surface} m²`} />}
                {property.landSize > 0 && <Field label="Terrain" value={`${property.landSize} m²`} />}
                {(property.rooms > 0 || property.bedrooms > 0 || property.bathrooms > 0) && (
                  <Field label="Pièces" value={
                    [
                      property.rooms > 0 && `${property.rooms} pièce${property.rooms > 1 ? 's' : ''}`,
                      property.bedrooms > 0 && `${property.bedrooms} ch.`,
                      property.bathrooms > 0 && `${property.bathrooms} SDB`,
                    ].filter(Boolean).join(' · ')
                  } />
                )}
                {property.sleepingCapacity && <Field label="Capacité" value={`${property.sleepingCapacity} couchages`} />}
                {clientType === 'Vendeur' && getDisplayPrice(property) > 0 && (
                  <Field label="Prix" value={`${Number(getDisplayPrice(property)).toLocaleString('fr-FR')} MAD`} />
                )}
                {clientType === 'Bailleur' && property.price > 0 && (
                  <Field label="Loyer" value={`${Number(property.price).toLocaleString('fr-FR')} MAD/mois`} />
                )}
              </>
            ) : (
              <div className="py-2">
                {t.propertyTitle ? (
                  <div className="space-y-1">
                    <Field label="Bien" value={t.propertyTitle} />
                    {t.propertyRef && <Field label="Référence" value={<span className="font-mono">{t.propertyRef}</span>} />}
                  </div>
                ) : (
                  <p className="text-xs text-text-secondary/60">Aucun bien associé</p>
                )}
              </div>
            )}
          </Section>
        )}

        {/* LOCATAIRE - Search Criteria */}
        {clientType === 'Locataire' && (
          <Section icon={Home} title="Critères de recherche">
            {data.budget && <Field label="Budget" value={`${Number(data.budget).toLocaleString('fr-FR')} MAD/mois`} />}
            {(data.minSurface || data.surface) && (
              <Field label="Surface" value={
                data.minSurface && data.surfaceMax
                  ? `${data.minSurface} ~ ${data.surfaceMax} m²`
                  : `${data.surface || data.minSurface} m²`
              } />
            )}
            {data.pieces && <Field label="Pièces" value={data.pieces} />}
            {data.chambres && <Field label="Chambres" value={data.chambres} />}
            {data.localisation && <Field label="Localisation" value={data.localisation} />}
            {data.propertyType && <Field label="Type de bien" value={data.propertyType} />}
            {data.furnished !== undefined && <Field label="Meublé" value={data.furnished ? 'Oui' : 'Non'} />}
          </Section>
        )}

        {/* VOYAGEUR - Stay Info */}
        {clientType === 'Voyageur' && (
          <>
            <Section icon={Home} title="Informations du séjour">
              {property ? (
                <>
                  <Field label="Bien" value={property.title} />
                  <Field label="Référence" value={<span className="font-mono">{property.reference}</span>} />
                  {property.address && <Field label="Adresse" value={property.address} />}
                  {property.surface > 0 && <Field label="Surface" value={`${property.surface} m²`} />}
                  {(property.rooms > 0 || property.bedrooms > 0) && (
                    <Field label="Pièces" value={
                      [
                        property.rooms > 0 && `${property.rooms} pièces`,
                        property.bedrooms > 0 && `${property.bedrooms} ch.`,
                      ].filter(Boolean).join(' · ')
                    } />
                  )}
                  {property.sleepingCapacity && <Field label="Couchages" value={property.sleepingCapacity} />}
                </>
              ) : (
                <div className="space-y-1">
                  {t.propertyTitle ? (
                    <>
                      <Field label="Bien" value={t.propertyTitle} />
                      {t.propertyRef && <Field label="Référence" value={<span className="font-mono">{t.propertyRef}</span>} />}
                    </>
                  ) : (
                    <p className="text-xs text-text-secondary/60">Aucun bien associé</p>
                  )}
                </div>
              )}
            </Section>
            <Section icon={Calendar} title="Détails de la réservation">
              {data.numeroReservation && <Field label="N° réservation" value={<span className="font-mono">{data.numeroReservation}</span>} />}
              {data.dateReservation && <Field label="Date réservation" value={formatDate(data.dateReservation)} />}
              {data.dateArrivee && <Field label="Date d'arrivée" value={formatDate(data.dateArrivee)} />}
              {data.dateDepart && <Field label="Date de départ" value={formatDate(data.dateDepart)} />}
              {data.nbNuits && <Field label="Nombre de nuits" value={data.nbNuits} />}
              {(data.nbAdultes !== undefined && data.nbAdultes > 0) && <Field label="Nombre d'adultes" value={data.nbAdultes} />}
              {(data.nbEnfants !== undefined && data.nbEnfants > 0) && <Field label="Nombre d'enfants" value={data.nbEnfants} />}
              {data.statutReservation && <Field label="Statut" value={
                <Badge className={data.statutReservation === 'Confirmée' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                  {data.statutReservation}
                </Badge>
              } />}
              {t.agentName && <Field label="Agent" value={t.agentName} />}
            </Section>
          </>
        )}

        {/* ACHETEUR / LOCATAIRE - Proposed Properties */}
        {(clientType === 'Acheteur' || clientType === 'Locataire') && (
          <Section icon={Home} title="Biens proposés">
            {linkedProperties.length === 0 ? (
              <p className="text-xs text-text-secondary/60 py-2">Aucun bien lié pour le moment</p>
            ) : (
              <div className="space-y-2">
                {linkedProperties.map(prop => (
                  <div key={prop.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-background/50 border border-border/30 hover:border-accent/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {prop.title}{prop.city ? ` - ${prop.city}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {getDisplayPrice(prop) > 0 && (
                        <p className="text-sm font-semibold text-text">
                          {Number(getDisplayPrice(prop)).toLocaleString('fr-FR')} MAD
                        </p>
                      )}
                      <Link
                        to={getPropertyDetailPath(prop.id)}
                        onClick={onClose}
                        className="text-xs font-medium text-accent hover:underline whitespace-nowrap"
                      >
                        Voir →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {clientDetailPath && (
              <div className="pt-2 mt-2 border-t border-border/30">
                <Link
                  to={clientDetailPath}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                >
                  <Plus size={14} /> Proposer un nouveau bien
                </Link>
              </div>
            )}
          </Section>
        )}

        {/* Mandat Status - hidden for Voyageur */}
        {clientType !== 'Voyageur' && (
        <Section icon={FileText} title="Statut du mandat">
          <Field label="Référence" value={<span className="font-mono">{client?.numeroMandat || t.reference}</span>} />
          <Field label="Type" value={mandatLabel} />
          <Field label="Étape" value={
            <Badge className={TRANSACTION_ETAPE_COLORS[t.etape as TransactionEtape]}>
              {client?.statutMandat || etapeLabel}
            </Badge>
          } />
          {(client?.dateSignature || t.dateContrat) && (
            <Field label="Date signature" value={formatDate(client?.dateSignature || t.dateContrat)} />
          )}
          {(client?.dateExpiration || t.dateExpiration) && (
            <Field label="Date d'expiration" value={
              <span className="flex items-center gap-1.5">
                {formatDate(client?.dateExpiration || t.dateExpiration)}
                {daysUntil(client?.dateExpiration || t.dateExpiration) && (
                  <span className="text-[10px] text-text-secondary/60">({daysUntil(client?.dateExpiration || t.dateExpiration)})</span>
                )}
              </span>
            } />
          )}
          {t.montant && <Field label="Montant" value={<span className="font-semibold">{t.montant}</span>} />}
          {t.agentName && <Field label="Agent" value={t.agentName} />}
        </Section>
        )}

        {/* Financial Info - VENDEUR */}
        {clientType === 'Vendeur' && (
          <Section icon={DollarSign} title="Informations financières">
            {data.prixNetVendeur && <Field label="Prix net vendeur" value={`${Number(data.prixNetVendeur).toLocaleString('fr-FR')} MAD`} />}
            {(data.montantRemuneration || data.valeurHonoraires) && <Field label="Honoraires" value={
              (data.remunerationIsPercentage === true)
                ? `${data.montantRemuneration || data.valeurHonoraires}%`
                : `${Number(data.montantRemuneration || data.valeurHonoraires).toLocaleString('fr-FR')} MAD`
            } />}
            {data.sequestre !== undefined && <Field label="Séquestre" value={`${Number(data.sequestre || 0).toLocaleString('fr-FR')} MAD`} />}
          </Section>
        )}

        {/* Financial Info - BAILLEUR */}
        {clientType === 'Bailleur' && (
          <Section icon={DollarSign} title="Informations financières">
            {data.loyerHC && <Field label="Loyer mensuel" value={`${Number(data.loyerHC).toLocaleString('fr-FR')} MAD`} />}
            {data.charges && <Field label="Charges" value={`${Number(data.charges).toLocaleString('fr-FR')} MAD`} />}
            {data.typeLoyer && <Field label="Type loyer" value={data.typeLoyer} />}
            {data.depotGarantie && <Field label="Dépôt de garantie" value={`${Number(data.depotGarantie).toLocaleString('fr-FR')} MAD`} />}
            {data.fraisMiseEnLocation && <Field label="Frais mise en location" value={`${Number(data.fraisMiseEnLocation).toLocaleString('fr-FR')} MAD`} />}
          </Section>
        )}

        {/* Financial Info - VOYAGEUR */}
        {clientType === 'Voyageur' && (
          <Section icon={DollarSign} title="Informations financières">
            {data.tarifNuit && <Field label="Tarif par nuit" value={`${Number(data.tarifNuit).toLocaleString('fr-FR')} MAD`} />}
            {data.montantTotalHorsOptions && <Field label="Montant total (hors options)" value={`${Number(data.montantTotalHorsOptions).toLocaleString('fr-FR')} MAD`} />}
            {data.optionsMontant !== undefined && <Field label="Options" value={`${Number(data.optionsMontant || 0).toLocaleString('fr-FR')} MAD`} />}
            {data.montantTotalAvecOptions && <Field label="Montant total" value={<span className="font-semibold">{Number(data.montantTotalAvecOptions).toLocaleString('fr-FR')} MAD</span>} />}
            {data.acompteMontant && <Field label="Acompte" value={`${Number(data.acompteMontant).toLocaleString('fr-FR')} MAD${data.acompteVersee ? ` (${data.acompteVersee}%)` : ''}`} />}
            {data.soldeRestant && <Field label="Solde restant" value={`${Number(data.soldeRestant).toLocaleString('fr-FR')} MAD`} />}
            {data.cautionMontant && <Field label="Caution" value={`${Number(data.cautionMontant).toLocaleString('fr-FR')} MAD`} />}
          </Section>
        )}

        {/* DEMANDES DE VISITE / LOCATION - VENDEUR / BAILLEUR */}
        {(clientType === 'Vendeur' || clientType === 'Bailleur') && (
          <Section icon={Calendar} title={clientType === 'Bailleur' ? 'Demandes de location' : 'Demandes de visite'}>
            <p className="text-xs text-text-secondary/60 py-2">
              {clientType === 'Bailleur' ? 'Aucune demande de location pour le moment' : 'Aucune demande de visite pour le moment'}
            </p>
          </Section>
        )}

        {/* DOCUMENTS - VOYAGEUR */}
        {clientType === 'Voyageur' && (
          <Section icon={FileText} title="Documents liés">
            {client?.mandatPdfUrl ? (
              <div className="space-y-1.5">
                <a
                  href={client.mandatPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/50 border border-border/30 hover:border-accent/30 transition-colors"
                >
                  <span className="text-sm text-text truncate">{client.mandatPdfName || 'Contrat signé'}</span>
                  <Download size={14} className="text-accent shrink-0" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-text-secondary/60 py-2">Aucun document lié</p>
            )}
          </Section>
        )}

        {/* Actions */}
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-background/50 border-b border-border/40">
            <ArrowRightCircle size={14} className="text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Actions</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" icon={<Edit3 size={13} />}>Modifier</Button>
              <Button variant="outline" size="sm" icon={<Send size={13} />}>Envoyer au client</Button>
              <Button variant="outline" size="sm" icon={<Download size={13} />}>Exporter PDF</Button>
              <Button variant="outline" size="sm" icon={<ArrowRightCircle size={13} />}>Changer l'étape</Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
