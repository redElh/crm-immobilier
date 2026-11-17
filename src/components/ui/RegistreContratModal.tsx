import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FileText, Users, Home, DollarSign, Calendar, Clock, Tag, User,
  Download, Send, Edit3, Trash2, ArrowRightCircle, RefreshCw,
  ExternalLink, Clipboard, MessageSquare, Zap, MapPin, Square, Mail, Phone,
  Percent, Shield, Briefcase, Plus, Lock,
} from 'react-feather'
import { Dialog } from './Dialog'
import { api } from '../../services/api'
import { fetchRegistre } from '../../services/registreService'
import { TRANSACTION_ETAPE_LABELS, type Transaction } from '../../types/transactions'
import { useStageTheme, STAGE_HUES, SLATE_HUE } from '../dashboard/Stage'
import type { StageHue } from '../dashboard/Stage'
import { RED_HUE } from '../modules/prospects/ProspectCard'
import {
  regTypeHue, regTypeLabel, regEtapeHue, HuePill, PartyAvatar,
  RegistreModalHero, RegistreModalTabs, useRegistreAccent,
} from '../modules/registre/RegistreStage'
import {
  StageField, StageSection, StageEmpty,
} from '../modules/prospects/ProspectDetailStage'

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

function formatDate(dateStr?: string | null) {
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

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  en_cours: 'En cours',
  confirme_actif: 'Confirmé / Actif',
  paye: 'Payé',
  finalise_termine: 'Finalisé / Terminé',
  annule: 'Annulé',
  occupe: 'Occupé',
}

const CONTRACT_STATUS_HUES: Record<string, StageHue> = {
  en_cours: STAGE_HUES.emerald,
  confirme_actif: STAGE_HUES.emerald,
  paye: STAGE_HUES.emerald,
  finalise_termine: SLATE_HUE,
  annule: RED_HUE,
  occupe: STAGE_HUES.sky,
}

export function RegistreContratModal({ isOpen, onClose, transaction }: RegistreContratModalProps) {
  const location = useLocation()
  const [client, setClient] = useState<ClientData | null>(null)
  const [counterpartClient, setCounterpartClient] = useState<ClientData | null>(null)
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('infos')
  const scrollRef = useRef<HTMLDivElement>(null)
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const { accent, ink, isAdmin: isRegistreAdmin } = useRegistreAccent()

  const clientType = transaction?.clientType || ''
  const isVente = clientType === 'Vendeur' || clientType === 'Acheteur'
  const isVoyageur = clientType === 'Voyageur'

  const tabs = useMemo(() => {
    const arr: { id: string; label: string }[] = [{ id: 'infos', label: 'Informations' }]
    if (clientType) arr.push({ id: 'parties', label: 'Parties' })
    arr.push({ id: 'bien', label: 'Bien concerné' })
    if (isVoyageur) arr.push({ id: 'sejour', label: 'Séjour' })
    if (clientType) arr.push({ id: 'finances', label: 'Finances' })
    arr.push({ id: 'documents', label: 'Documents' })
    return arr
  }, [clientType, isVoyageur])

  useEffect(() => {
    if (!isOpen || !transaction) return
    setLoading(true)
    setClient(null)
    setCounterpartClient(null)
    setProperty(null)
    setContract(null)
    setActiveTab('infos')

    const fetches: Promise<any>[] = []

    if (transaction.clientId) {
      fetches.push(
        api.get<ClientData>(`/clients/${transaction.clientId}`)
          .then(c => setClient(c))
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

  useEffect(() => {
    if (activeTab && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeTab, isOpen, transaction?.id])

  if (!transaction) return null

  const t = transaction
  const clientData = client as any
  const propData = property as any
  const contractRef = contract?.reference || t.reference

  const instanceLabel = isVente
    ? 'Contrat de vente'
    : isVoyageur
      ? 'Contrat de location saisonnière'
      : 'Contrat de location classique'

  const statutLabel = contract?.status
    ? CONTRACT_STATUS_LABELS[contract.status as string] || contract.status
    : ETAPE_STATUS_LABELS[t.etape] || TRANSACTION_ETAPE_LABELS[t.etape as keyof typeof TRANSACTION_ETAPE_LABELS] || t.etape
  const statutHue = contract?.status
    ? CONTRACT_STATUS_HUES[contract.status as string] || regEtapeHue(t.etape)
    : regEtapeHue(t.etape)

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

  const F = (icon: any, label: string, value: any, delay = 0) => {
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

  const linkColor = isDark ? '#C4B5FD' : isRegistreAdmin ? '#C2410C' : '#0D9488'
  const glassRowClass = `flex min-w-0 items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
    isDark ? 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.16]' : 'border-slate-200/70 bg-white/70 hover:border-teal-500/30'
  }`

  const StagedPartyCard = ({ label, party, partyPath }: { label: string; party: ClientData | null; partyPath: string | null }) => (
    <div
      className={`md:col-span-2 flex items-start justify-between gap-3 rounded-2xl border p-3 backdrop-blur-sm ${
        isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'
      }`}
    >
      {party ? (
        <>
          <div className="flex min-w-0 items-start gap-3">
            <PartyAvatar name={party.name} role={label} isDark={isDark} />
            <div className="min-w-0">
              <p className={`text-[10px] font-extrabold uppercase tracking-[0.16em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
              <p className={`truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{party.name}</p>
              <div className={`mt-0.5 flex flex-wrap gap-x-3 text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {party.email && <span className="inline-flex items-center gap-1"><Mail size={10} /> {party.email}</span>}
                {party.phone && <span className="inline-flex items-center gap-1"><Phone size={10} /> {party.phone}</span>}
              </div>
            </div>
          </div>
          {partyPath && (
            <Link
              to={partyPath}
              onClick={onClose}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-bold hover:underline"
              style={{ color: linkColor }}
            >
              Voir la fiche <ExternalLink size={10} />
            </Link>
          )}
        </>
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[11px] font-extrabold"
              style={isDark ? { background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)', color: '#94A3B8' } : { background: 'rgba(15,23,42,0.04)', borderColor: 'rgba(148,163,184,0.35)', color: '#64748B' }}
            >
              ?
            </span>
            <div>
              <p className={`text-[10px] font-extrabold uppercase tracking-[0.16em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
              <p className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Non renseigné</p>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const docRow = (href: string, name: string, iconColor?: string) => (
    <a
      key={name}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={glassRowClass}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <FileText size={14} className="shrink-0" style={{ color: iconColor || linkColor }} />
        <span className={`truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{name}</span>
      </div>
      <Download size={14} className="shrink-0" style={{ color: linkColor }} />
    </a>
  )

  const kpiChips = [
    { icon: FileText, label: 'Référence', value: contractRef, mono: true },
    (contract?.createdAt || (t as any).createdAt) && { icon: Calendar, label: 'Créé le', value: formatDate(contract?.createdAt || String((t as any).createdAt)) || '—' },
    (contract?.startDate || t.dateContrat) && { icon: Calendar, label: isVoyageur ? 'Réservé' : 'Signature', value: formatDate(contract?.startDate || t.dateContrat) || '—' },
    (contract?.endDate || t.dateExpiration) && { icon: Clock, label: isVoyageur ? 'Départ' : 'Expire', value: formatDate(contract?.endDate || t.dateExpiration) || '—' },
    t.agentName && { icon: User, label: 'Agent', value: t.agentName },
  ].filter(Boolean) as { icon: any; label: string; value: string; mono?: boolean }[]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'infos':
        return (
          <StageSection icon={Clipboard} title="Informations générales" accent={accent} ink={ink} isDark={isDark}>
            {F(FileText, 'Référence', <span className="font-mono">{contractRef}</span>, 0.05)}
            {F(Tag, 'Type', contract?.contractType
              ? ({ vente: 'Vente', location_classique: 'Location classique', location_saisonniere: 'Location saisonnière' } as Record<string, string>)[contract.contractType as string] || contract.contractType
              : regTypeLabel(t.type), 0.08)}
            {F(Zap, 'Statut', (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: statutHue.line, boxShadow: `0 0 6px ${statutHue.glow}` }} />
                {statutLabel}
              </span>
            ), 0.11)}
            {(contract?.createdAt || (t as any).createdAt) &&
              F(Calendar, 'Date de création', formatDate(contract?.createdAt || String((t as any).createdAt)), 0.14)}
            {(contract?.startDate || t.dateContrat) &&
              F(Calendar, 'Date de signature', formatDate(contract?.startDate || t.dateContrat), 0.17)}
            {isVente && (clientData?.dateExpiration || contract?.endDate || t.dateExpiration) &&
              F(Calendar, 'Exp. du mandat', formatDate(clientData?.dateExpiration || contract?.endDate || t.dateExpiration), 0.20)}
            {isVoyageur && clientData?.dateDebut && F(Calendar, 'Date de début', formatDate(clientData.dateDebut || t.dateContrat), 0.20)}
            {isVoyageur && clientData?.dateExpiration && F(Calendar, 'Date de fin', formatDate(clientData.dateExpiration), 0.23)}
            {t.dateExpiration && !isVoyageur && !(clientType === 'Locataire') &&
              F(Calendar, 'Date d\'expiration', formatDate(t.dateExpiration), 0.20)}
            {F(User, 'Agent', t.agentName, 0.23)}
          </StageSection>
        )

      case 'parties':
        return (
          <StageSection icon={Users} title="Parties" accent={accent} ink={ink} isDark={isDark}>
            {isVente && (
              <>
                <StagedPartyCard
                  label={clientType === 'Vendeur' ? 'Vendeur' : 'Acheteur'}
                  party={client}
                  partyPath={getClientDetailPath(client)}
                />
                <StagedPartyCard
                  label={clientType === 'Vendeur' ? 'Acheteur' : 'Vendeur'}
                  party={counterpartClient}
                  partyPath={getClientDetailPath(counterpartClient)}
                />
              </>
            )}
            {(clientType === 'Bailleur' || clientType === 'Locataire') && (
              <>
                <StagedPartyCard
                  label={clientType === 'Bailleur' ? 'Bailleur' : 'Locataire'}
                  party={client}
                  partyPath={getClientDetailPath(client)}
                />
                <StagedPartyCard
                  label={clientType === 'Bailleur' ? 'Locataire' : 'Bailleur'}
                  party={counterpartClient}
                  partyPath={getClientDetailPath(counterpartClient)}
                />
              </>
            )}
            {isVoyageur && (
              <>
                <StagedPartyCard
                  label="Bailleur"
                  party={counterpartClient}
                  partyPath={getClientDetailPath(counterpartClient)}
                />
                <StagedPartyCard
                  label="Voyageur"
                  party={client}
                  partyPath={getClientDetailPath(client)}
                />
              </>
            )}
          </StageSection>
        )

      case 'bien':
        return (
          <StageSection icon={Home} title="Bien concerné" accent={accent} ink={ink} isDark={isDark}>
            {property ? (
              <>
                {F(Home, 'Bien', property.title, 0.05)}
                {F(FileText, 'Référence', property.reference ? <span className="font-mono">{property.reference}</span> : null, 0.08)}
                {F(MapPin, 'Adresse', property.address, 0.11)}
                {F(MapPin, 'Ville', property.city, 0.14)}
                {F(Square, 'Surface', property.surface > 0 ? `${property.surface} m²` : null, 0.17)}
                {F(Square, 'Terrain', property.landSize > 0 ? `${property.landSize} m²` : null, 0.20)}
                {F(Square, 'Pièces', property.rooms > 0 ? String(property.rooms) : null, 0.23)}
                {F(Tag, 'Chambres', property.bedrooms > 0 ? String(property.bedrooms) : null, 0.26)}
                {F(Tag, 'SDB', property.bathrooms > 0 ? String(property.bathrooms) : null, 0.29)}
                {isVoyageur && property.sleepingCapacity > 0 && F(Users, 'Couchages', String(property.sleepingCapacity), 0.32)}
                {getDisplayPrice(property) > 0 &&
                  F(DollarSign, isVoyageur ? 'Tarif' : 'Prix', `${Number(getDisplayPrice(property)).toLocaleString('fr-FR')} MAD`, 0.35)}
                {getPropertyDetailPath() !== '#' && (
                  <div className="md:col-span-2">
                    <Link
                      to={getPropertyDetailPath()}
                      onClick={onClose}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${
                        isDark ? 'border-white/[0.10] bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]' : 'border-teal-500/25 bg-white/70 text-teal-800 hover:bg-white'
                      }`}
                    >
                      Voir la fiche bien <ExternalLink size={12} />
                    </Link>
                  </div>
                )}
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
                  hint="Le bien concerné n'est pas encore rattaché à ce contrat."
                  accent={accent}
                  ink={ink}
                  isDark={isDark}
                />
              </div>
            )}
          </StageSection>
        )

      case 'sejour':
        return (
          <StageSection icon={Clock} title="Détails du séjour" accent={accent} ink={ink} isDark={isDark}>
            {F(FileText, 'N° réservation', clientData?.numeroReservation ? <span className="font-mono">{clientData.numeroReservation}</span> : null, 0.05)}
            {F(Calendar, 'Date d\'arrivée', formatDate(clientData?.dateArrivee), 0.08)}
            {F(Calendar, 'Date de départ', formatDate(clientData?.dateDepart), 0.11)}
            {F(Clock, 'Nombre de nuits', clientData?.nbNuits, 0.14)}
            {F(User, 'Nombre d\'adultes', clientData?.nbAdultes, 0.17)}
            {(clientData?.nbEnfants && clientData.nbEnfants > 0) && F(Users, 'Nombre d\'enfants', clientData.nbEnfants, 0.20)}
            {F(Calendar, 'Date de réservation', formatDate(clientData?.dateReservation), 0.23)}
          </StageSection>
        )

      case 'finances':
        return isVente ? (
          <StageSection icon={DollarSign} title="Informations financières" accent={accent} ink={ink} isDark={isDark}>
            {F(DollarSign, 'Prix de vente FAI', clientData?.prixVenteFAI ? `${Number(clientData.prixVenteFAI).toLocaleString('fr-FR')} MAD` : null, 0.05)}
            {(propData?.price > 0 && !clientData?.prixVenteFAI) &&
              F(DollarSign, 'Prix de vente', `${Number(propData.price).toLocaleString('fr-FR')} MAD`, 0.08)}
            {F(DollarSign, 'Prix net vendeur', clientData?.prixNetVendeur ? `${Number(clientData.prixNetVendeur).toLocaleString('fr-FR')} MAD` : null, 0.11)}
            {F(Percent, 'Honoraires', clientData?.montantRemuneration
              ? (clientData.remunerationIsPercentage
                ? `${clientData.montantRemuneration}%`
                : `${Number(clientData.montantRemuneration).toLocaleString('fr-FR')} MAD`)
              : null, 0.14)}
            {F(Tag, 'Type d\'honoraires', clientData?.typeRemuneration, 0.17)}
            {(clientData?.sequestre !== undefined && clientData?.sequestre !== null && clientData?.sequestre !== '') &&
              F(Shield, 'Séquestre', `${Number(clientData.sequestre || 0).toLocaleString('fr-FR')} MAD`, 0.20)}
            {F(DollarSign, 'Montant transaction', t.montant, 0.23)}
          </StageSection>
        ) : isVoyageur ? (
          <StageSection icon={DollarSign} title="Informations financières" accent={accent} ink={ink} isDark={isDark}>
            {F(DollarSign, 'Tarif par nuit', clientData?.tarifNuit ? `${Number(clientData.tarifNuit).toLocaleString('fr-FR')} MAD` : null, 0.05)}
            {F(Clock, 'Nombre de nuits', clientData?.nbNuits, 0.08)}
            {F(Briefcase, 'Total (hors options)', clientData?.montantTotalHorsOptions ? `${Number(clientData.montantTotalHorsOptions).toLocaleString('fr-FR')} MAD` : null, 0.11)}
            {(clientData?.optionsMontant && clientData.optionsMontant > 0) &&
              F(Plus, 'Options', `${Number(clientData.optionsMontant).toLocaleString('fr-FR')} MAD`, 0.14)}
            {F(DollarSign, 'Total (avec options)', clientData?.montantTotalAvecOptions ? `${Number(clientData.montantTotalAvecOptions).toLocaleString('fr-FR')} MAD` : null, 0.17)}
            {F(Percent, 'Acompte versé', clientData?.acompteMontant ? `${Number(clientData.acompteMontant).toLocaleString('fr-FR')} MAD` : null, 0.20)}
            {F(Shield, 'Solde restant', clientData?.soldeRestant ? `${Number(clientData.soldeRestant).toLocaleString('fr-FR')} MAD` : null, 0.23)}
            {F(Lock, 'Caution', clientData?.cautionMontant ? `${Number(clientData.cautionMontant).toLocaleString('fr-FR')} MAD` : null, 0.26)}
          </StageSection>
        ) : (
          <StageSection icon={DollarSign} title="Informations financières" accent={accent} ink={ink} isDark={isDark}>
            {F(DollarSign, 'Loyer HC', clientData?.loyerHC ? `${Number(clientData.loyerHC).toLocaleString('fr-FR')} MAD / mois` : null, 0.05)}
            {F(Briefcase, 'Charges', clientData?.charges ? `${Number(clientData.charges).toLocaleString('fr-FR')} MAD / mois` : null, 0.08)}
            {(clientData?.loyerHC && clientData?.charges) &&
              F(DollarSign, 'Loyer CC', `${Number(clientData.loyerHC + clientData.charges).toLocaleString('fr-FR')} MAD / mois`, 0.11)}
            {F(Shield, 'Dépôt de garantie', clientData?.depotGarantie ? `${Number(clientData.depotGarantie).toLocaleString('fr-FR')} MAD` : null, 0.14)}
            {F(Percent, 'Honoraires de location', clientData?.montantRemuneration
              ? (clientData.remunerationIsPercentage
                ? `${clientData.montantRemuneration}%`
                : `${Number(clientData.montantRemuneration).toLocaleString('fr-FR')} MAD`)
              : null, 0.17)}
            {F(DollarSign, 'Frais mise en location', clientData?.fraisMiseEnLocation ? `${Number(clientData.fraisMiseEnLocation).toLocaleString('fr-FR')} MAD` : null, 0.20)}
          </StageSection>
        )

      case 'documents':
        return (
          <StageSection icon={FileText} title="Documents liés" accent={accent} ink={ink} isDark={isDark}>
            <div className="md:col-span-2 space-y-2">
              {client?.mandatPdfUrl && docRow(client.mandatPdfUrl, client.mandatPdfName || 'Contrat signé')}
              {client?.docIdentiteUrl && docRow(client.docIdentiteUrl, client.docIdentiteName || "Pièce d'identité", isDark ? '#94A3B8' : '#64748B')}
              {client?.docDomicileUrl && docRow(client.docDomicileUrl, client.docDomicileName || 'Justificatif de domicile', isDark ? '#94A3B8' : '#64748B')}
              {property?.documents?.fileTree?.map((d: any) => docRow(d.url, d.name, isDark ? '#94A3B8' : '#64748B'))}
              {!client?.mandatPdfUrl && !client?.docIdentiteUrl && !client?.docDomicileUrl &&
                (!property?.documents?.fileTree || property.documents.fileTree.length === 0) && (
                <StageEmpty
                  icon={FileText}
                  title="Aucun document lié"
                  hint="Les pièces du contrat apparaîtront ici."
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
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={instanceLabel}
      size="2xl"
    >
      <div ref={scrollRef} className="max-h-[70vh] space-y-4 overflow-y-auto scrollbar-thin pr-1" style={{ scrollBehavior: 'smooth' }}>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl border"
              style={{ background: isDark ? `${accent.a}14` : `${accent.a}12`, borderColor: `${accent.a}30` }}
            >
              <RefreshCw size={18} className="animate-spin" style={{ color: isDark ? accent.a : ink }} />
            </span>
          </div>
        ) : (
          <>
            <RegistreModalHero
              t={t}
              isDark={isDark}
              icon={FileText}
              instanceLabel={instanceLabel}
              amountLabel="Montant transaction"
              titleOverride={(t.propertyTitle || t.clientName) ?? undefined}
              badges={
                <>
                  <HuePill hue={regTypeHue(t.type)} label={regTypeLabel(t.type)} isDark={isDark} />
                  <HuePill hue={statutHue} label={statutLabel} isDark={isDark} />
                </>
              }
              kpiChips={kpiChips}
            />

            {(t.notes || client?.notes) && (
              <div
                className={`rounded-2xl border p-3 backdrop-blur-sm ${
                  isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <MessageSquare size={12} style={{ color: isDark ? accent.a : ink }} />
                  <span className={`text-[10px] font-extrabold uppercase tracking-[0.16em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Notes</span>
                </div>
                <p className={`text-sm font-medium leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {t.notes || client?.notes}
                </p>
              </div>
            )}

            <RegistreModalTabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>

            <StageSection icon={Zap} title="Actions" accent={accent} ink={ink} isDark={isDark}>
              <div className="md:col-span-2 flex flex-wrap gap-2">
                {[
                  { icon: Download, label: 'Télécharger le contrat' },
                  { icon: Send, label: 'Envoyer au client' },
                  { icon: ExternalLink, label: 'Exporter PDF' },
                  { icon: Edit3, label: 'Modifier' },
                  { icon: ArrowRightCircle, label: 'Changer le statut' },
                ].map(a => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => {}}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                      isDark
                        ? 'border-white/[0.10] bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                        : 'border-teal-900/10 bg-white/70 text-teal-900/80 hover:bg-white'
                    }`}
                  >
                    <a.icon size={13} style={{ color: isDark ? accent.a : ink }} />
                    {a.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {}}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                    isDark ? 'border-rose-400/25 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20' : 'border-rose-300/50 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <Trash2 size={13} />
                  Supprimer
                </button>
              </div>
            </StageSection>
          </>
        )}
      </div>
    </Dialog>
  )
}
