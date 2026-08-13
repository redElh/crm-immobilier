import { useState, useEffect } from 'react'
import {
  User, Home, FileText, DollarSign, Calendar,
  RefreshCw, Save
} from 'react-feather'
import { Dialog } from './Dialog'
import { Badge } from './Badge'
import { Input } from './Input'
import { Select } from './Select'
import { Button } from './Button'
import { DatePicker } from './DatePicker'
import { useToast } from './Toast'
import { api } from '../../services/api'
import {
  MANDAT_TYPE_LABELS,
  TRANSACTION_ETAPE_LABELS,
  TRANSACTION_ETAPE_COLORS,
  CLIENT_TYPE_LABELS,
  CLIENT_TYPE_COLORS,
} from '../../types/transactions'
import type { Transaction, MandatType, TransactionEtape } from '../../types/transactions'

const LOCALISATION_OPTIONS = [
  { value: 'Maroc', label: 'Maroc' },
  { value: 'France', label: 'France' },
  { value: 'Belgique', label: 'Belgique' },
  { value: 'Suisse', label: 'Suisse' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Espagne', label: 'Espagne' },
  { value: 'Italie', label: 'Italie' },
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Tunisie', label: 'Tunisie' },
  { value: 'Algerie', label: 'Algerie' },
  { value: 'Emirats Arabes Unis', label: 'Emirats Arabes Unis' },
  { value: 'Autre', label: 'Autre' },
]

const SECTEUR_OPTIONS = [
  { value: 'Argana', label: 'Argana' },
  { value: 'Azlef', label: 'Azlef' },
  { value: 'Douar Laraab', label: 'Douar Laraab' },
  { value: 'Erraounak', label: 'Erraounak' },
  { value: 'Ghazoua', label: 'Ghazoua' },
  { value: 'Medina', label: 'Medina' },
  { value: 'Sidi Magdoul', label: 'Sidi Magdoul' },
]

const TYPE_BIEN_OPTIONS = [
  { value: 'Appartement', label: 'Appartement' },
  { value: 'Maison', label: 'Maison' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Riad', label: 'Riad' },
  { value: 'Terrain', label: 'Terrain' },
  { value: 'Ferme', label: 'Ferme' },
  { value: 'Local commercial', label: 'Local commercial' },
  { value: 'Bureau', label: 'Bureau' },
  { value: 'Immeuble', label: 'Immeuble' },
  { value: 'Garage / Parking', label: 'Garage / Parking' },
  { value: 'Commerce', label: 'Commerce' },
  { value: 'Bateau', label: 'Bateau' },
  { value: 'Locaux activite', label: 'Locaux activite' },
  { value: 'Cave / Box', label: 'Cave / Box' },
]

interface RegistreEditModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  onSaved?: () => void
}

interface ClientData {
  id: string
  name: string
  type: string
  email: string
  phone: string
  address: string
  profession: string
  notes: string
  statutMetier: string
  mandatStatus: string
  numeroMandat: string
  statutMandat: string
  typeMandat: string
  dateSignature: string
  dateDebut: string
  dateExpiration: string
  propertyType: string
  montantRemuneration: number
  remunerationIsPercentage: boolean
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
      <div className="px-4 py-3 space-y-3">
        {children}
      </div>
    </div>
  )
}

function ROField({ label, value }: { label: string; value: React.ReactNode }) {
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

function getDisplayPrice(prop: PropertyData): number {
  if (prop.prixNetVendeur && prop.honorairesPct && prop.honorairesType === 'inclus') {
    return Math.round(Number(prop.prixNetVendeur) * (1 + Number(prop.honorairesPct) / 100))
  }
  return prop.prixNetVendeur || prop.price || 0
}

export function RegistreEditModal({ isOpen, onClose, transaction, onSaved }: RegistreEditModalProps) {
  const [client, setClient] = useState<ClientData | null>(null)
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [form, setForm] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!isOpen || !transaction) return
    setLoading(true)
    setClient(null)
    setProperty(null)
    setForm({})

    const fetches: Promise<any>[] = []

    if (transaction.clientId) {
      fetches.push(
        api.get<ClientData>(`/clients/${transaction.clientId}`)
          .then(c => {
            setClient(c)
            const bienId = (c as any).bienConcerneId || (c as any).mandat_id
            if (bienId) {
              api.get<PropertyData>(`/properties/${bienId}`)
                .then(setProperty)
                .catch(() => {})
            }
          })
          .catch(() => {})
      )
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
    if (!client) return
    const c = client as any
    setForm({
      email: client.email || '',
      phone: client.phone || '',
      profession: client.profession || '',
      address: client.address || '',
      surfaceMin: c.surfaceMin ?? c.minSurface ?? '',
      surfaceMax: client.surfaceMax ?? '',
      budget: c.budget ?? c.prixMin ?? '',
      prixMin: client.prixMin ?? '',
      prixMax: client.prixMax ?? '',
      pieces: c.pieces ?? '',
      chambres: client.chambres ?? '',
      localisation: c.localisation || '',
      secteur: client.secteur || '',
      typeBien: c.typeBien || client.propertyType || '',
      prixNetVendeur: c.prixNetVendeur ?? '',
      montantRemuneration: client.montantRemuneration ?? '',
      remunerationIsPercentage: c.remunerationIsPercentage ?? false,
      loyerHC: c.loyerHC ?? '',
      charges: c.charges ?? '',
      depotGarantie: c.depotGarantie ?? '',
      fraisMiseEnLocation: c.fraisMiseEnLocation ?? '',
      dateArrivee: c.dateArrivee || '',
      dateDepart: c.dateDepart || '',
      dateReservation: c.dateReservation || '',
      nbNuits: c.nbNuits ?? '',
      nbAdultes: c.nbAdultes ?? '',
      nbEnfants: c.nbEnfants ?? '',
      tarifNuit: c.tarifNuit ?? '',
      montantTotalHorsOptions: c.montantTotalHorsOptions ?? '',
      optionsMontant: c.optionsMontant ?? '',
      montantTotalAvecOptions: c.montantTotalAvecOptions ?? '',
      acompteMontant: c.acompteMontant ?? '',
      soldeRestant: c.soldeRestant ?? '',
      cautionMontant: c.cautionMontant ?? '',
      dateSignature: c.dateSignature || '',
      dateExpirationClient: c.dateExpiration || '',
    })
  }, [client, transaction])

  if (!transaction) return null

  const t = transaction
  const clientType = t.clientType || ''
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
    ? `Modifier le contrat - ${typeTitle[clientType] || mandatLabel}`
    : `Modifier le mandat - ${typeTitle[clientType] || mandatLabel}`

  const updateField = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!client?.id) return
    setSaving(true)
    try {
      const clientUpdates: Record<string, any> = {}

      const clientFields: [string, string][] = [
        ['email', 'email'],
        ['phone', 'phone'],
        ['profession', 'profession'],
        ['address', 'address'],
      ]
      for (const [formKey, apiField] of clientFields) {
        if (form[formKey] !== undefined && form[formKey] !== (client as any)[apiField]) {
          clientUpdates[apiField] = form[formKey]
        }
      }

      const jsonbFields: string[] = [
        'surfaceMin', 'surfaceMax', 'minSurface', 'prixMin', 'prixMax', 'budget', 'pieces', 'chambres',
        'localisation', 'secteur', 'typeBien',
        'prixNetVendeur', 'montantRemuneration', 'remunerationIsPercentage', 'modeCalculHonoraires',
        'loyerHC', 'charges', 'depotGarantie', 'fraisMiseEnLocation',
        'dateArrivee', 'dateDepart', 'dateReservation', 'nbNuits', 'nbAdultes', 'nbEnfants',
        'tarifNuit', 'montantTotalHorsOptions', 'optionsMontant',
        'montantTotalAvecOptions', 'acompteMontant', 'soldeRestant', 'cautionMontant',
        'dateSignature', 'dateExpiration',
      ]
      for (const field of jsonbFields) {
        const val = form[field]
        if (val !== undefined && val !== '' && val !== null) {
          clientUpdates[field] = val
        }
      }

      if (form.dateExpirationClient && form.dateExpirationClient !== (client as any).dateExpiration) {
        clientUpdates.dateExpiration = form.dateExpirationClient
      }

      if ('remunerationIsPercentage' in clientUpdates) {
        clientUpdates.modeCalculHonoraires = clientUpdates.remunerationIsPercentage ? 'pourcentage' : 'montant_fixe'
      }

      if (Object.keys(clientUpdates).length > 0) {
        await api.put(`/clients/${client.id}`, clientUpdates)
      }

      onSaved?.()
      toast('success', 'Modifications enregistrées avec succès')
      onClose()
    } catch (err) {
      console.error('Save failed:', err)
      toast('error', 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const isDirty = client ? JSON.stringify(form) !== JSON.stringify({
    email: client.email || '',
    phone: client.phone || '',
    profession: client.profession || '',
    address: client.address || '',
    surfaceMin: (client as any).surfaceMin ?? (client as any).minSurface ?? '',
    surfaceMax: client.surfaceMax ?? '',
    budget: (client as any).budget ?? (client as any).prixMin ?? '',
    prixMin: client.prixMin ?? '',
    prixMax: client.prixMax ?? '',
    pieces: (client as any).pieces ?? '',
    chambres: client.chambres ?? '',
    localisation: (client as any).localisation || '',
    secteur: client.secteur || '',
    typeBien: (client as any).typeBien || client.propertyType || '',
    prixNetVendeur: (client as any).prixNetVendeur ?? '',
    montantRemuneration: client.montantRemuneration ?? '',
    remunerationIsPercentage: (client as any).remunerationIsPercentage ?? false,
    loyerHC: (client as any).loyerHC ?? '',
    charges: (client as any).charges ?? '',
    depotGarantie: (client as any).depotGarantie ?? '',
    fraisMiseEnLocation: (client as any).fraisMiseEnLocation ?? '',
    dateArrivee: (client as any).dateArrivee || '',
    dateDepart: (client as any).dateDepart || '',
    dateReservation: (client as any).dateReservation || '',
    nbNuits: (client as any).nbNuits ?? '',
    nbAdultes: (client as any).nbAdultes ?? '',
    nbEnfants: (client as any).nbEnfants ?? '',
    tarifNuit: (client as any).tarifNuit ?? '',
    montantTotalHorsOptions: (client as any).montantTotalHorsOptions ?? '',
    optionsMontant: (client as any).optionsMontant ?? '',
    montantTotalAvecOptions: (client as any).montantTotalAvecOptions ?? '',
    acompteMontant: (client as any).acompteMontant ?? '',
    soldeRestant: (client as any).soldeRestant ?? '',
    cautionMontant: (client as any).cautionMontant ?? '',
    dateSignature: (client as any).dateSignature || '',
    dateExpirationClient: (client as any).dateExpiration || '',
  }) : false

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="2xl"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
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

        {/* Client Info */}
        <Section icon={User} title="Informations client">
          <ROField label="Client" value={t.clientName} />
          <ROField label="Type" value={
            <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-lg border ${CLIENT_TYPE_COLORS[clientType] || ''}`}>
              {CLIENT_TYPE_LABELS[clientType] || clientType}
            </span>
          } />
          <Input label="Email" value={form.email || ''} onChange={e => updateField('email', e.target.value)} type="email" />
          <Input label="Téléphone" value={form.phone || ''} onChange={e => updateField('phone', e.target.value)} />
          <Input label="Profession" value={form.profession || ''} onChange={e => updateField('profession', e.target.value)} />
          <Input label="Adresse" value={form.address || ''} onChange={e => updateField('address', e.target.value)} />
        </Section>

        {/* ACHETEUR - Search Criteria */}
        {clientType === 'Acheteur' && (
          <Section icon={Home} title="Critères de recherche">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Budget min (MAD)" type="number" value={form.prixMin || ''} onChange={e => updateField('prixMin', e.target.value ? Number(e.target.value) : '')} />
              <Input label="Budget max (MAD)" type="number" value={form.prixMax || ''} onChange={e => updateField('prixMax', e.target.value ? Number(e.target.value) : '')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Surface min (m²)" type="number" value={form.surfaceMin || ''} onChange={e => updateField('surfaceMin', e.target.value ? Number(e.target.value) : '')} />
              <Input label="Surface max (m²)" type="number" value={form.surfaceMax || ''} onChange={e => updateField('surfaceMax', e.target.value ? Number(e.target.value) : '')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Pièces" type="number" value={form.pieces || ''} onChange={e => updateField('pieces', e.target.value ? Number(e.target.value) : '')} />
              <Input label="Chambres" type="number" value={form.chambres || ''} onChange={e => updateField('chambres', e.target.value ? Number(e.target.value) : '')} />
            </div>
            <Select label="Localisation" options={LOCALISATION_OPTIONS} value={form.localisation || ''} onChange={v => updateField('localisation', v)} placeholder="Sélectionner..." />
            <Select label="Secteur géographique" options={SECTEUR_OPTIONS} value={form.secteur || ''} onChange={v => updateField('secteur', v)} placeholder="Sélectionner..." />
            <Select label="Type de bien" options={TYPE_BIEN_OPTIONS} value={form.typeBien || ''} onChange={v => updateField('typeBien', v)} placeholder="Sélectionner..." />
          </Section>
        )}

        {/* LOCATAIRE - Search Criteria */}
        {clientType === 'Locataire' && (
          <Section icon={Home} title="Critères de recherche">
            <Input label="Budget (MAD)" type="number" value={form.budget || ''} onChange={e => updateField('budget', e.target.value ? Number(e.target.value) : '')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Surface min (m²)" type="number" value={form.surfaceMin || ''} onChange={e => updateField('surfaceMin', e.target.value ? Number(e.target.value) : '')} />
              <Input label="Surface max (m²)" type="number" value={form.surfaceMax || ''} onChange={e => updateField('surfaceMax', e.target.value ? Number(e.target.value) : '')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Pièces" type="number" value={form.pieces || ''} onChange={e => updateField('pieces', e.target.value ? Number(e.target.value) : '')} />
              <Input label="Chambres" type="number" value={form.chambres || ''} onChange={e => updateField('chambres', e.target.value ? Number(e.target.value) : '')} />
            </div>
            <Select label="Localisation" options={LOCALISATION_OPTIONS} value={form.localisation || ''} onChange={v => updateField('localisation', v)} placeholder="Sélectionner..." />
            <Select label="Secteur géographique" options={SECTEUR_OPTIONS} value={form.secteur || ''} onChange={v => updateField('secteur', v)} placeholder="Sélectionner..." />
            <Select label="Type de bien" options={TYPE_BIEN_OPTIONS} value={form.typeBien || ''} onChange={v => updateField('typeBien', v)} placeholder="Sélectionner..." />
          </Section>
        )}

        {/* VENDEUR / BAILLEUR - Property Info (read-only) */}
        {(clientType === 'Vendeur' || clientType === 'Bailleur') && (
          <Section icon={Home} title="Informations du bien">
            {property ? (
              <>
                <ROField label="Bien" value={property.title} />
                <ROField label="Référence" value={<span className="font-mono">{property.reference}</span>} />
                {property.address && <ROField label="Adresse" value={property.address} />}
                {property.city && <ROField label="Ville" value={property.city} />}
                {property.surface > 0 && <ROField label="Surface" value={`${property.surface} m²`} />}
                {property.rooms > 0 && <ROField label="Pièces" value={property.rooms} />}
                {property.bedrooms > 0 && <ROField label="Chambres" value={property.bedrooms} />}
              </>
            ) : (
              <div className="space-y-1">
                {t.propertyTitle ? (
                  <>
                    <ROField label="Bien" value={t.propertyTitle} />
                    {t.propertyRef && <ROField label="Référence" value={<span className="font-mono">{t.propertyRef}</span>} />}
                  </>
                ) : (
                  <p className="text-xs text-text-secondary/60">Aucun bien associé</p>
                )}
              </div>
            )}
          </Section>
        )}

        {/* VOYAGEUR - Stay Info (read-only) */}
        {clientType === 'Voyageur' && (
          <Section icon={Home} title="Informations du séjour">
            {property ? (
              <>
                <ROField label="Bien" value={property.title} />
                <ROField label="Référence" value={<span className="font-mono">{property.reference}</span>} />
                {property.address && <ROField label="Adresse" value={property.address} />}
                {property.city && <ROField label="Ville" value={property.city} />}
              </>
            ) : (
              <div className="space-y-1">
                {t.propertyTitle ? (
                  <>
                    <ROField label="Bien" value={t.propertyTitle} />
                    {t.propertyRef && <ROField label="Référence" value={<span className="font-mono">{t.propertyRef}</span>} />}
                  </>
                ) : (
                  <p className="text-xs text-text-secondary/60">Aucun bien associé</p>
                )}
              </div>
            )}
          </Section>
        )}

        {/* VOYAGEUR - Reservation Details */}
        {clientType === 'Voyageur' && (
          <Section icon={Calendar} title="Détails de la réservation">
            <ROField label="N° réservation" value={<span className="font-mono">{(client as any)?.numeroReservation || '—'}</span>} />
            <div className="grid grid-cols-2 gap-3">
              <DatePicker label="Date d'arrivée" value={form.dateArrivee || ''} onChange={e => updateField('dateArrivee', e.target.value)} />
              <DatePicker label="Date de départ" value={form.dateDepart || ''} onChange={e => updateField('dateDepart', e.target.value)} />
            </div>
            <DatePicker label="Date de réservation" value={form.dateReservation || ''} onChange={e => updateField('dateReservation', e.target.value)} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Nombre de nuits" type="number" value={form.nbNuits || ''} onChange={e => updateField('nbNuits', e.target.value ? Number(e.target.value) : '')} />
              <Input label="Nombre d'adultes" type="number" value={form.nbAdultes || ''} onChange={e => updateField('nbAdultes', e.target.value ? Number(e.target.value) : '')} />
              <Input label="Nombre d'enfants" type="number" value={form.nbEnfants || ''} onChange={e => updateField('nbEnfants', e.target.value ? Number(e.target.value) : '')} />
            </div>
            <ROField label="Statut" value={
              <Badge className={(client as any)?.statutReservation === 'Confirmée' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                {(client as any)?.statutReservation || '—'}
              </Badge>
            } />
            <ROField label="Agent" value={t.agentName} />
          </Section>
        )}

        {/* VOYAGEUR - Financial Info */}
        {clientType === 'Voyageur' && (
          <Section icon={DollarSign} title="Informations financières">
            <Input label="Tarif par nuit (MAD)" type="number" value={form.tarifNuit || ''} onChange={e => updateField('tarifNuit', e.target.value ? Number(e.target.value) : '')} />
            <Input label="Montant total hors options (MAD)" type="number" value={form.montantTotalHorsOptions || ''} onChange={e => updateField('montantTotalHorsOptions', e.target.value ? Number(e.target.value) : '')} />
            <Input label="Options (MAD)" type="number" value={form.optionsMontant || ''} onChange={e => updateField('optionsMontant', e.target.value ? Number(e.target.value) : '')} />
            <Input label="Montant total (MAD)" type="number" value={form.montantTotalAvecOptions || ''} onChange={e => updateField('montantTotalAvecOptions', e.target.value ? Number(e.target.value) : '')} />
            <Input label="Acompte (MAD)" type="number" value={form.acompteMontant || ''} onChange={e => updateField('acompteMontant', e.target.value ? Number(e.target.value) : '')} />
            <Input label="Solde restant (MAD)" type="number" value={form.soldeRestant || ''} onChange={e => updateField('soldeRestant', e.target.value ? Number(e.target.value) : '')} />
            <Input label="Caution (MAD)" type="number" value={form.cautionMontant || ''} onChange={e => updateField('cautionMontant', e.target.value ? Number(e.target.value) : '')} />
          </Section>
        )}

        {/* VENDEUR - Financial Info */}
        {clientType === 'Vendeur' && (
          <Section icon={DollarSign} title="Informations financières">
            <Input label="Prix net vendeur (MAD)" type="number" value={form.prixNetVendeur || ''} onChange={e => updateField('prixNetVendeur', e.target.value ? Number(e.target.value) : '')} />
            <div className="space-y-1.5 w-full">
              <label className="text-sm font-medium text-text">Honoraires</label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  className={`flex-1 h-9 text-sm font-medium transition-colors ${
                    !form.remunerationIsPercentage
                      ? 'bg-accent text-white'
                      : 'bg-card text-text-secondary hover:text-text'
                  }`}
                  onClick={() => updateField('remunerationIsPercentage', false)}
                >
                  MAD
                </button>
                <button
                  type="button"
                  className={`flex-1 h-9 text-sm font-medium transition-colors ${
                    form.remunerationIsPercentage
                      ? 'bg-accent text-white'
                      : 'bg-card text-text-secondary hover:text-text'
                  }`}
                  onClick={() => updateField('remunerationIsPercentage', true)}
                >
                  %
                </button>
              </div>
              <Input
                label=""
                type="number"
                suffix={<span className="text-xs">{form.remunerationIsPercentage ? '%' : 'MAD'}</span>}
                value={form.montantRemuneration || ''}
                onChange={e => updateField('montantRemuneration', e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </Section>
        )}

        {/* BAILLEUR - Financial Info */}
        {clientType === 'Bailleur' && (
          <Section icon={DollarSign} title="Informations financières">
            <Input label="Loyer mensuel (MAD)" type="number" value={form.loyerHC || ''} onChange={e => updateField('loyerHC', e.target.value ? Number(e.target.value) : '')} />
            <Input label="Charges (MAD)" type="number" value={form.charges || ''} onChange={e => updateField('charges', e.target.value ? Number(e.target.value) : '')} />
            <Input label="Dépôt garantie (MAD)" type="number" value={form.depotGarantie || ''} onChange={e => updateField('depotGarantie', e.target.value ? Number(e.target.value) : '')} />
            <Input label="Frais mise en location (MAD)" type="number" value={form.fraisMiseEnLocation || ''} onChange={e => updateField('fraisMiseEnLocation', e.target.value ? Number(e.target.value) : '')} />
          </Section>
        )}

        {/* Mandat Status - NOT Voyageur */}
        {clientType !== 'Voyageur' && (
          <Section icon={FileText} title="Statut du mandat">
            <ROField label="Référence" value={<span className="font-mono">{(client as any)?.numeroMandat || t.reference}</span>} />
            <ROField label="Type" value={mandatLabel} />
            <ROField label="Étape" value={
              <Badge className={TRANSACTION_ETAPE_COLORS[t.etape as TransactionEtape]}>
                {(client as any)?.statutMandat || etapeLabel}
              </Badge>
            } />
            <DatePicker label="Date signature" value={form.dateSignature || ''} onChange={e => updateField('dateSignature', e.target.value)} />
            <DatePicker label="Date d'expiration" value={form.dateExpirationClient || ''} onChange={e => updateField('dateExpirationClient', e.target.value)} />
          </Section>
        )}

        {/* Action buttons */}
        <div className="sticky bottom-0 bg-card pt-3 pb-1 border-t border-border/30 flex items-center justify-end gap-3">
          <Button variant="default" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving || !isDirty} loading={saving}>
            <Save size={14} className="mr-1.5" />
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
