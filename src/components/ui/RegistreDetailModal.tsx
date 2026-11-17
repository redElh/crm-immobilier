import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  User, Home, FileText, DollarSign, Calendar, Clock, Tag,
  Download, Edit3, Send, ArrowRightCircle, RefreshCw, ExternalLink, Plus,
  ChevronRight, Mail, Phone, MapPin, Briefcase, Square, Grid, Star, Key,
  Moon, Shield, Percent, Users, Maximize, Sliders, Lock,
} from 'react-feather'
import { Dialog } from './Dialog'
import { api } from '../../services/api'
import { TRANSACTION_ETAPE_LABELS, type Transaction } from '../../types/transactions'
import { useStageTheme, STAGE_HUES } from '../dashboard/Stage'
import {
  ORANGE_HUE, regTypeHue, regTypeLabel, regEtapeHue, regRoleHue, HuePill,
  RegistreModalHero, RegistreModalTabs, useRegistreAccent, StageTooltip,
} from '../modules/registre/RegistreStage'
import {
  StageField, StageSection, StageTags, StageEmpty, stagePillStyle,
} from '../modules/prospects/ProspectDetailStage'

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

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR')
  } catch {
    return dateStr
  }
}

function daysUntil(dateStr?: string | null) {
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

type IconType = React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties }>

export function RegistreDetailModal({ isOpen, onClose, transaction }: RegistreDetailModalProps) {
  const [client, setClient] = useState<ClientData | null>(null)
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [linkedProperties, setLinkedProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('client')
  const scrollRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const { accent, ink, isAdmin: isRegistreAdmin } = useRegistreAccent()

  const clientType = transaction?.clientType || ''

  const tabs = useMemo(() => {
    const arr: { id: string; label: string }[] = [{ id: 'client', label: 'Client' }]
    if (clientType === 'Acheteur' || clientType === 'Locataire') {
      arr.push({ id: 'criteres', label: 'Critères' }, { id: 'biens', label: 'Biens proposés' }, { id: 'mandat', label: 'Statut du mandat' })
    }
    if (clientType === 'Vendeur' || clientType === 'Bailleur') {
      arr.push(
        { id: 'bien', label: 'Information du bien' },
        { id: 'mandat', label: 'Mandat & finances' },
        { id: 'demandes', label: clientType === 'Bailleur' ? 'Demandes de location' : 'Demandes de visite' },
      )
    }
    if (clientType === 'Voyageur') {
      arr.push(
        { id: 'sejour', label: 'Séjour' },
        { id: 'reservation', label: 'Réservation' },
        { id: 'finances', label: 'Finances' },
        { id: 'documents', label: 'Documents' },
      )
    }
    return arr
  }, [clientType])

  useEffect(() => {
    if (!isOpen || !transaction) return
    setLoading(true)
    setClient(null)
    setProperty(null)
    setLinkedProperties([])
    setActiveTab('client')

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

      const type = transaction.clientType || ''
      if (type === 'Locataire') {
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

  useEffect(() => {
    if (activeTab && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeTab, isOpen, transaction?.id])

  if (!transaction) return null

  const t = transaction
  const data = client || ({} as ClientData)
  const isVoyageur = clientType === 'Voyageur'
  const etapeLabel = TRANSACTION_ETAPE_LABELS[t.etape as keyof typeof TRANSACTION_ETAPE_LABELS] || t.etape

  const F = (icon: IconType, label: string, value: any, delay = 0) => {
    if (value === null || value === undefined || value === '' || value === false) return null
    return (
      <StageField
        key={label}
        icon={icon}
        label={label}
        value={value}
        accent={accent}
        ink={ink}
        isDark={isDark}
        delay={delay}
      />
    )
  }

  const linkClass = `break-all font-semibold no-underline hover:underline`
  const linkColor = isDark ? '#C4B5FD' : isRegistreAdmin ? '#C2410C' : '#0D9488'
  const mailLink = client?.email ? (
    <a href={`mailto:${client.email}`} className={linkClass} style={{ color: linkColor }}>
      <span className="inline-flex items-center gap-1">{client.email} <ExternalLink size={10} /></span>
    </a>
  ) : null
  const phoneLink = client?.phone ? (
    <a href={`tel:${client.phone}`} className={linkClass} style={{ color: linkColor }}>{client.phone}</a>
  ) : null

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

  /* Hero kpi chips — hidden when data missing. */
  const expLabel = daysUntil(client?.dateExpiration || t.dateExpiration)
  const kpiChips = [
    t.agentName && { icon: User, label: 'Agent', value: t.agentName },
    (client?.dateSignature || t.dateContrat) && { icon: Calendar, label: 'Signé', value: formatDate(client?.dateSignature || t.dateContrat) || '—' },
    (client?.dateExpiration || t.dateExpiration) && { icon: Clock, label: 'Expire', value: `${formatDate(client?.dateExpiration || t.dateExpiration) || '—'}${expLabel ? ` (${expLabel})` : ''}` },
    client?.numeroMandat && { icon: FileText, label: 'N° mandat', value: client.numeroMandat, mono: true },
  ].filter(Boolean) as { icon: IconType; label: string; value: string; mono?: boolean }[]

  const glassRowClass = `flex min-w-0 items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
    isDark ? 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.16]' : 'border-slate-200/70 bg-white/70 hover:border-teal-500/30'
  }`

  const renderTabContent = () => {
    switch (activeTab) {
      case 'client':
        return (
          <StageSection icon={User} title={`Informations ${isVoyageur ? 'voyageur' : 'client'}`} accent={accent} ink={ink} isDark={isDark}>
            {F(User, 'Nom', t.clientName, 0.05)}
            {F(Tag, 'Rôle', (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: regRoleHue(clientType).line, boxShadow: `0 0 6px ${regRoleHue(clientType).glow}` }} />
                {clientType || '—'}
              </span>
            ), 0.08)}
            {F(Mail, 'E-mail', mailLink, 0.11)}
            {F(Phone, 'Téléphone', phoneLink, 0.14)}
            {F(Briefcase, 'Profession', client?.profession, 0.17)}
            {F(MapPin, 'Adresse', client?.address, 0.20)}
          </StageSection>
        )

      case 'criteres':
        return (
          <>
            <StageSection icon={Sliders} title="Critères de recherche" accent={accent} ink={ink} isDark={isDark}>
              {clientType === 'Acheteur' && (
                <>
                  {F(DollarSign, 'Budget', (data.prixMin || data.prixMax) ? (
                    data.prixMin && data.prixMax
                      ? `${Number(data.prixMin).toLocaleString('fr-FR')} ~ ${Number(data.prixMax).toLocaleString('fr-FR')} MAD`
                      : data.prixMin
                        ? `${Number(data.prixMin).toLocaleString('fr-FR')} MAD (min)`
                        : `${Number(data.prixMax).toLocaleString('fr-FR')} MAD (max)`
                  ) : null, 0.05)}
                  {F(Maximize, 'Surface', (data.surfaceMin || data.surfaceMax) ? (
                    data.surfaceMin && data.surfaceMax
                      ? `${data.surfaceMin} ~ ${data.surfaceMax} m²`
                      : data.surfaceMin
                        ? `${data.surfaceMin} m² (min)`
                        : `${data.surfaceMax} m² (max)`
                  ) : null, 0.08)}
                  {F(Grid, 'Pièces', data.pieces, 0.11)}
                  {F(Key, 'Chambres', data.chambres, 0.14)}
                  {F(MapPin, 'Localisation', [data.localisation, data.secteur].filter(Boolean).join(', ') || null, 0.17)}
                  {F(Tag, 'Type de bien', data.typeBien || client?.propertyType || null, 0.20)}
                  {F(Star, 'Standing', data.standing, 0.23)}
                </>
              )}
              {clientType === 'Locataire' && (
                <>
                  {F(DollarSign, 'Budget', data.budget ? `${Number(data.budget).toLocaleString('fr-FR')} MAD/mois` : null, 0.05)}
                  {F(Maximize, 'Surface', (data.minSurface || data.surface) ? (
                    data.minSurface && data.surfaceMax
                      ? `${data.minSurface} ~ ${data.surfaceMax} m²`
                      : `${data.surface || data.minSurface} m²`
                  ) : null, 0.08)}
                  {F(Grid, 'Pièces', data.pieces, 0.11)}
                  {F(Key, 'Chambres', data.chambres, 0.14)}
                  {F(MapPin, 'Localisation', data.localisation, 0.17)}
                  {F(Tag, 'Type de bien', data.propertyType, 0.20)}
                  {data.furnished !== undefined && F(Home, 'Meublé', data.furnished ? 'Oui' : 'Non', 0.23)}
                </>
              )}
            </StageSection>
            {(data.attributsPersonnalises?.length > 0 || data.criteres?.length > 0) && (
              <div className="mt-4 space-y-3">
                {data.attributsPersonnalises?.length > 0 && (
                  <StageTags icon={Star} label="Préférences" items={data.attributsPersonnalises} accent={accent} ink={ink} isDark={isDark} />
                )}
                {data.criteres?.length > 0 && (
                  <StageTags icon={Tag} label="Critères" items={data.criteres} accent={accent} ink={ink} isDark={isDark} />
                )}
              </div>
            )}
          </>
        )

      case 'biens':
        return (
          <StageSection icon={Home} title="Biens proposés" accent={accent} ink={ink} isDark={isDark}>
            <div className="md:col-span-2 space-y-2">
              {linkedProperties.length === 0 ? (
                <StageEmpty
                  icon={Home}
                  title="Aucun bien lié pour le moment"
                  hint="Les biens associés à la recherche de ce client apparaîtront ici."
                  accent={accent}
                  ink={ink}
                  isDark={isDark}
                />
              ) : linkedProperties.map((prop, i) => (
                <div key={prop.id} className={glassRowClass} style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {prop.title}{prop.city ? ` - ${prop.city}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {getDisplayPrice(prop) > 0 && (
                      <p className={`text-sm font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {Number(getDisplayPrice(prop)).toLocaleString('fr-FR')} MAD
                      </p>
                    )}
                    <Link
                      to={getPropertyDetailPath(prop.id)}
                      onClick={onClose}
                      className="inline-flex items-center gap-0.5 text-xs font-bold whitespace-nowrap hover:underline"
                      style={{ color: linkColor }}
                    >
                      Voir <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
              {clientDetailPath && (
                <Link
                  to={clientDetailPath}
                  onClick={onClose}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${
                    isDark ? 'border-white/[0.10] bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]' : 'border-teal-500/25 bg-white/70 text-teal-800 hover:bg-white'
                  }`}
                >
                  <Plus size={13} /> Proposer un nouveau bien
                </Link>
              )}
            </div>
          </StageSection>
        )

      case 'bien':
        return (
          <StageSection icon={Home} title="Informations du bien" accent={accent} ink={ink} isDark={isDark}>
            {property ? (
              <>
                {F(Home, 'Bien', property.title, 0.05)}
                {F(FileText, 'Référence', property.reference ? <span className="font-mono">{property.reference}</span> : null, 0.08)}
                {F(MapPin, 'Adresse', property.address, 0.11)}
                {F(MapPin, 'Ville', property.city, 0.14)}
                {F(Square, 'Surface', property.surface > 0 ? `${property.surface} m²` : null, 0.17)}
                {F(Square, 'Terrain', property.landSize > 0 ? `${property.landSize} m²` : null, 0.20)}
                {(property.rooms > 0 || property.bedrooms > 0 || property.bathrooms > 0) &&
                  F(Grid, 'Pièces', [
                    property.rooms > 0 && `${property.rooms} pièce${property.rooms > 1 ? 's' : ''}`,
                    property.bedrooms > 0 && `${property.bedrooms} ch.`,
                    property.bathrooms > 0 && `${property.bathrooms} SDB`,
                  ].filter(Boolean).join(' · '), 0.23)}
                {F(Users, 'Capacité', property.sleepingCapacity ? `${property.sleepingCapacity} couchages` : null, 0.26)}
                {clientType === 'Vendeur' && getDisplayPrice(property) > 0 &&
                  F(DollarSign, 'Prix', `${Number(getDisplayPrice(property)).toLocaleString('fr-FR')} MAD`, 0.29)}
                {clientType === 'Bailleur' && property.price > 0 &&
                  F(DollarSign, 'Loyer', `${Number(property.price).toLocaleString('fr-FR')} MAD/mois`, 0.29)}
              </>
            ) : (t.propertyTitle || t.propertyRef) ? (
              <>
                {F(Home, 'Bien', t.propertyTitle, 0.05)}
                {F(FileText, 'Référence', t.propertyRef ? <span className="font-mono">{t.propertyRef}</span> : null, 0.08)}
              </>
            ) : (
              <div className="md:col-span-2">
                <StageEmpty
                  icon={Home}
                  title="Aucun bien associé"
                  hint="Le bien concerné n'est pas encore rattaché à ce mandat."
                  accent={accent}
                  ink={ink}
                  isDark={isDark}
                />
              </div>
            )}
          </StageSection>
        )

      case 'mandat':
        return (
          <>
            <StageSection icon={FileText} title="Statut du mandat" accent={accent} ink={ink} isDark={isDark}>
              {F(FileText, 'Référence', <span className="font-mono">{client?.numeroMandat || t.reference}</span>, 0.05)}
              {F(Tag, 'Type', regTypeLabel(t.type), 0.08)}
              {F(Clock, 'Étape', (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: regEtapeHue(t.etape).line, boxShadow: `0 0 6px ${regEtapeHue(t.etape).glow}` }} />
                  {client?.statutMandat || etapeLabel}
                </span>
              ), 0.11)}
              {F(Calendar, 'Date signature', formatDate(client?.dateSignature || t.dateContrat), 0.14)}
              {F(Calendar, 'Date d\'expiration', (client?.dateExpiration || t.dateExpiration) ? (
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  {formatDate(client?.dateExpiration || t.dateExpiration)}
                  {expLabel && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                      style={stagePillStyle((t.etape === 'cloture' ? STAGE_HUES.emerald : ORANGE_HUE), isDark)}
                    >
                      {expLabel}
                    </span>
                  )}
                </span>
              ) : null, 0.17)}
              {F(DollarSign, 'Montant', t.montant, 0.20)}
              {F(User, 'Agent', t.agentName, 0.23)}
            </StageSection>

            {clientType === 'Vendeur' && (
              <div className="mt-4">
                <StageSection icon={Percent} title="Informations financières" accent={accent} ink={ink} isDark={isDark}>
                  {F(DollarSign, 'Prix net vendeur', data.prixNetVendeur ? `${Number(data.prixNetVendeur).toLocaleString('fr-FR')} MAD` : null, 0.05)}
                  {(data.montantRemuneration || data.valeurHonoraires) &&
                    F(Percent, 'Honoraires', (data.remunerationIsPercentage === true)
                      ? `${data.montantRemuneration || data.valeurHonoraires}%`
                      : `${Number(data.montantRemuneration || data.valeurHonoraires).toLocaleString('fr-FR')} MAD`, 0.08)}
                  {data.sequestre !== undefined &&
                    F(Shield, 'Séquestre', `${Number(data.sequestre || 0).toLocaleString('fr-FR')} MAD`, 0.11)}
                </StageSection>
              </div>
            )}

            {clientType === 'Bailleur' && (
              <div className="mt-4">
                <StageSection icon={Percent} title="Informations financières" accent={accent} ink={ink} isDark={isDark}>
                  {F(DollarSign, 'Loyer mensuel', data.loyerHC ? `${Number(data.loyerHC).toLocaleString('fr-FR')} MAD` : null, 0.05)}
                  {F(Briefcase, 'Charges', data.charges ? `${Number(data.charges).toLocaleString('fr-FR')} MAD` : null, 0.08)}
                  {F(Tag, 'Type loyer', data.typeLoyer, 0.11)}
                  {F(Shield, 'Dépôt de garantie', data.depotGarantie ? `${Number(data.depotGarantie).toLocaleString('fr-FR')} MAD` : null, 0.14)}
                  {F(DollarSign, 'Frais mise en location', data.fraisMiseEnLocation ? `${Number(data.fraisMiseEnLocation).toLocaleString('fr-FR')} MAD` : null, 0.17)}
                </StageSection>
              </div>
            )}
          </>
        )

      case 'demandes':
        return (
          <StageEmpty
            icon={Calendar}
            title={clientType === 'Bailleur' ? 'Aucune demande de location' : 'Aucune demande de visite'}
            hint="Les demandes entrantes pour ce bien apparaîtront ici."
            accent={accent}
            ink={ink}
            isDark={isDark}
          />
        )

      case 'sejour':
        return (
          <StageSection icon={Home} title="Informations du séjour" accent={accent} ink={ink} isDark={isDark}>
            {property ? (
              <>
                {F(Home, 'Bien', property.title, 0.05)}
                {F(FileText, 'Référence', property.reference ? <span className="font-mono">{property.reference}</span> : null, 0.08)}
                {F(MapPin, 'Adresse', property.address, 0.11)}
                {F(Square, 'Surface', property.surface > 0 ? `${property.surface} m²` : null, 0.14)}
                {(property.rooms > 0 || property.bedrooms > 0) &&
                  F(Grid, 'Pièces', [
                    property.rooms > 0 && `${property.rooms} pièces`,
                    property.bedrooms > 0 && `${property.bedrooms} ch.`,
                  ].filter(Boolean).join(' · '), 0.17)}
                {F(Users, 'Couchages', property.sleepingCapacity, 0.20)}
              </>
            ) : (t.propertyTitle || t.propertyRef) ? (
              <>
                {F(Home, 'Bien', t.propertyTitle, 0.05)}
                {F(FileText, 'Référence', t.propertyRef ? <span className="font-mono">{t.propertyRef}</span> : null, 0.08)}
              </>
            ) : (
              <div className="md:col-span-2">
                <StageEmpty
                  icon={Home}
                  title="Aucun bien associé"
                  hint="Le bien du séjour n'est pas encore rattaché à cette réservation."
                  accent={accent}
                  ink={ink}
                  isDark={isDark}
                />
              </div>
            )}
          </StageSection>
        )

      case 'reservation':
        return (
          <StageSection icon={Calendar} title="Détails de la réservation" accent={accent} ink={ink} isDark={isDark}>
            {F(FileText, 'N° réservation', data.numeroReservation ? <span className="font-mono">{data.numeroReservation}</span> : null, 0.05)}
            {F(Calendar, 'Date réservation', formatDate(data.dateReservation), 0.08)}
            {F(Calendar, 'Date d\'arrivée', formatDate(data.dateArrivee), 0.11)}
            {F(Calendar, 'Date de départ', formatDate(data.dateDepart), 0.14)}
            {F(Moon, 'Nombre de nuits', data.nbNuits, 0.17)}
            {(data.nbAdultes !== undefined && data.nbAdultes > 0) && F(User, 'Nombre d\'adultes', data.nbAdultes, 0.20)}
            {(data.nbEnfants !== undefined && data.nbEnfants > 0) && F(Users, 'Nombre d\'enfants', data.nbEnfants, 0.23)}
            {data.statutReservation && F(Tag, 'Statut', (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                style={stagePillStyle(data.statutReservation === 'Confirmée' ? STAGE_HUES.emerald : STAGE_HUES.amber, isDark)}
              >
                {data.statutReservation}
              </span>
            ), 0.26)}
            {F(User, 'Agent', t.agentName, 0.29)}
          </StageSection>
        )

      case 'finances':
        return (
          <StageSection icon={DollarSign} title="Informations financières" accent={accent} ink={ink} isDark={isDark}>
            {F(DollarSign, 'Tarif par nuit', data.tarifNuit ? `${Number(data.tarifNuit).toLocaleString('fr-FR')} MAD` : null, 0.05)}
            {F(Briefcase, 'Montant total (hors options)', data.montantTotalHorsOptions ? `${Number(data.montantTotalHorsOptions).toLocaleString('fr-FR')} MAD` : null, 0.08)}
            {data.optionsMontant !== undefined && F(Plus, 'Options', `${Number(data.optionsMontant || 0).toLocaleString('fr-FR')} MAD`, 0.11)}
            {data.montantTotalAvecOptions &&
              F(DollarSign, 'Montant total', <span className="font-extrabold">{Number(data.montantTotalAvecOptions).toLocaleString('fr-FR')} MAD</span>, 0.14)}
            {data.acompteMontant &&
              F(Percent, 'Acompte', `${Number(data.acompteMontant).toLocaleString('fr-FR')} MAD${data.acompteVersee ? ` (${data.acompteVersee}%)` : ''}`, 0.17)}
            {F(Shield, 'Solde restant', data.soldeRestant ? `${Number(data.soldeRestant).toLocaleString('fr-FR')} MAD` : null, 0.20)}
            {F(Lock, 'Caution', data.cautionMontant ? `${Number(data.cautionMontant).toLocaleString('fr-FR')} MAD` : null, 0.23)}
          </StageSection>
        )

      case 'documents':
        return (
          <StageSection icon={FileText} title="Documents liés" accent={accent} ink={ink} isDark={isDark}>
            <div className="md:col-span-2">
              {client?.mandatPdfUrl ? (
                <a
                  href={client.mandatPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={glassRowClass}
                >
                  <span className={`truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {client.mandatPdfName || 'Contrat signé'}
                  </span>
                  <Download size={15} className="shrink-0" style={{ color: linkColor }} />
                </a>
              ) : (
                <StageEmpty
                  icon={FileText}
                  title="Aucun document lié"
                  hint="Le contrat signé apparaîtra ici une fois téléversé."
                  accent={accent}
                  ink={ink}
                  isDark={isDark}
                />
              )}
            </div>
          </StageSection>
        )

      default:
        return null
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={isVoyageur ? 'Détail du contrat' : 'Détail du mandat'} size="2xl">
      <div ref={scrollRef} className="max-h-[70vh] space-y-4 overflow-y-auto scrollbar-thin pr-1" style={{ scrollBehavior: 'smooth' }}>
        <RegistreModalHero
          t={t}
          isDark={isDark}
          icon={FileText}
          instanceLabel={isVoyageur ? 'Détail du contrat' : 'Détail du mandat'}
          amountLabel="Montant"
          badges={
            <>
              <HuePill hue={regTypeHue(t.type)} label={regTypeLabel(t.type)} isDark={isDark} />
              <HuePill hue={regEtapeHue(t.etape)} label={etapeLabel} isDark={isDark} />
            </>
          }
          kpiChips={kpiChips}
        />

        <RegistreModalTabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl border"
              style={isDark ? { background: `${accent.a}14`, borderColor: `${accent.a}30` } : { background: `${accent.a}12`, borderColor: `${accent.a}30` }}
            >
              <RefreshCw size={18} className="animate-spin" style={{ color: isDark ? accent.a : ink }} />
            </span>
          </div>
        ) : (
          <AnimatePresenceShell id={activeTab}>{renderTabContent()}</AnimatePresenceShell>
        )}

        {/* Actions (deactivated — visual parity) */}
        <StageSection icon={ArrowRightCircle} title="Actions" accent={accent} ink={ink} isDark={isDark}>
          <div className="md:col-span-2 flex flex-wrap gap-2">
            {[
              { icon: Edit3, label: 'Modifier' },
              { icon: Send, label: 'Envoyer au client' },
              { icon: Download, label: 'Exporter PDF' },
              { icon: ArrowRightCircle, label: "Changer l'étape" },
            ].map(a => (
              <StageTooltip key={a.label} label="Action bientôt disponible" isDark={isDark} accent={accent.a} position="top">
                <button
                  type="button"
                  disabled
                  className={`inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold opacity-70 transition-colors ${
                    isDark
                      ? 'border-white/[0.10] bg-white/[0.04] text-slate-200'
                      : 'border-teal-900/10 bg-white/70 text-teal-900/80'
                  }`}
                >
                  <a.icon size={13} style={{ color: isDark ? accent.a : ink }} />
                  {a.label}
                </button>
              </StageTooltip>
            ))}
          </div>
        </StageSection>
      </div>
    </Dialog>
  )
}

function AnimatePresenceShell({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
