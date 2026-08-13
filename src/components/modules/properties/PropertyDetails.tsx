import { useRef, useEffect, useState } from 'react';
import { InfoField } from '../../ui/InfoField';
import { Badge } from '../../ui/Badge';
import { Home, MapPin, Maximize2, Grid, Calendar, Layers, Hash, Sun, Briefcase, DollarSign, FileText, Clock, Navigation, Facebook, Percent, Wifi, Key, Lock, CheckCircle, XCircle, Settings } from 'react-feather';
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '../../../types/property';
import { ConfidentialValue } from '../confidentiality/ConfidentialField';
import { PermissionLocked } from '../confidentiality/PermissionLocked';
import { usePermission } from '../../../hooks/usePermission';
import { TEMPLATE_VARIABLES } from '../../../types/social';
import { TagifyText } from './TagifyText';
import {
  allPropertyTypes, locations
} from './AddPropertyForm/constants';

interface PropertyDetailsProps {
  property: any;
  showPreview?: boolean;
  showVariables?: boolean;
  previewText?: string;
  isGerant?: boolean;
}

const GERANT_STATUS_OVERRIDES: Record<string, string> = {
  mandate_pending: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  negotiation: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  under_compromise: 'bg-[#F0E2E2] text-[#7D5050] border-[#E0C6C6]',
  under_promise: 'bg-[#F0E2E2] text-[#7D5050] border-[#E0C6C6]',
  signing: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  option: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  urbanism: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
};

const statusColorCls = (status: string, isGerant: boolean): string =>
  isGerant && GERANT_STATUS_OVERRIDES[status]
    ? GERANT_STATUS_OVERRIDES[status]
    : (STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-50 text-gray-700 border-gray-200');

const FURNISHING_LABELS: Record<string, string> = { meuble: 'Meublé', semi_meuble: 'Semi-meublé', vide: 'Vide' }

const CONSTRUCTION_TYPE_LABELS: Record<string, string> = {}
for (const t of allPropertyTypes) {
  CONSTRUCTION_TYPE_LABELS[t.value] = t.label
}
const LEGACY_CONSTRUCTION_TYPE_LABELS: Record<string, string> = {
  villa: 'Villa',
  villa_de_standing: 'Villa de standing',
  riad: 'Riad',
  domaine: 'Domaine',
  chateau: 'Château',
  local_commercial: 'Local commercial',
  entrepot: 'Entrepôt',
  boutique: 'Boutique',
  bureau: 'Bureau',
  constructible: 'Terrain constructible',
  agricole: 'Terrain agricole',
  urbain: 'Terrain urbain',
  a_batir: 'Terrain à bâtir',
}
Object.assign(CONSTRUCTION_TYPE_LABELS, LEGACY_CONSTRUCTION_TYPE_LABELS)

const LOCATION_TYPE_LABELS: Record<string, string> = {}
for (const loc of locations) {
  LOCATION_TYPE_LABELS[loc.value] = loc.label
}

export const PropertyDetails = ({ property, showPreview, showVariables, previewText, isGerant = false }: PropertyDetailsProps) => {
  const canSeeAddress = usePermission('biens-afficher-adresse');
  const typeLabel = CONSTRUCTION_TYPE_LABELS[property.constructionType] || property.constructionType || PROPERTY_TYPE_LABELS[property.propertyType as keyof typeof PROPERTY_TYPE_LABELS] || property.propertyType;
  const transactionLabel = TRANSACTION_TYPE_LABELS[property.transactionType as keyof typeof TRANSACTION_TYPE_LABELS] || property.transactionType;
  const statusLabel = STATUS_LABELS[property.status as keyof typeof STATUS_LABELS] || property.status;
  const statusColor = statusColorCls(property.status, isGerant);
  const isSeasonal = property.transactionType === 'location_saisonniere';

  return (
    <div className="space-y-5">
      {/* Main grid */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <h3 className="font-semibold mb-4">Informations générales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InfoField label="Référence" value={property.reference} icon={<Hash size={14} />} />
          {property.propertyTitle && <InfoField label="Titre" value={property.propertyTitle} icon={<FileText size={14} />} />}
          {property.date && <InfoField label="Date" value={property.date} icon={<Calendar size={14} />} />}
          <InfoField label="Type de bien" value={typeLabel} icon={<Briefcase size={14} />} />
          {property.constructionSubType && (
            <InfoField label="Sous-type" value={CONSTRUCTION_TYPE_LABELS[property.constructionSubType] || property.constructionSubType} icon={<Briefcase size={14} />} />
          )}
          <InfoField label="Transaction" value={transactionLabel} icon={<Home size={14} />} />
          <div>
            <p className="text-[11px] text-text-secondary/60 mb-1">Statut</p>
            <Badge className={statusColor}>{statusLabel}</Badge>
          </div>
          <InfoField label="Surface" value={`${property.surface} m²`} icon={<Maximize2 size={14} />} />
          {property.buildableSurface && <InfoField label="Surface constructible" value={`${property.buildableSurface} m²`} icon={<Maximize2 size={14} />} />}
          {property.surfaceCarrez && <InfoField label="Surface Carrez" value={`${property.surfaceCarrez} m²`} icon={<Maximize2 size={14} />} />}
          {property.landSize && <InfoField label="Terrain" value={`${property.landSize} m²`} icon={<MapPin size={14} />} />}
          <InfoField label="Chambres" value={property.bedrooms_total ?? property.bedrooms} icon={<Grid size={14} />} />
          <InfoField label="Salles de bain" value={property.bathroom_count ?? property.bathrooms} icon={<Grid size={14} />} />
          {property.sleepingCapacity && (
            <InfoField label="Couchages" value={property.sleepingCapacity} icon={<Sun size={14} />} />
          )}
          {property.beds && <InfoField label="Lits" value={property.beds} icon={<Sun size={14} />} />}
          {property.yearBuilt && <InfoField label="Année construction" value={property.yearBuilt} icon={<Calendar size={14} />} />}
          {property.propertyState && <InfoField label="État" value={property.propertyState} icon={<Layers size={14} />} />}
          {property.furnishing && <InfoField label="Meublé" value={FURNISHING_LABELS[property.furnishing] || property.furnishing} icon={<Home size={14} />} />}
          {property.cadastralReference && <InfoField label="Réf. cadastrale" value={property.cadastralReference} icon={<Hash size={14} />} />}
          {property.mandateType && <InfoField label="Type de mandat" value={property.mandateType} icon={<FileText size={14} />} />}
          {(property.mandate_remuneration || property.mandateRemuneration) && <InfoField label="Rémunération" value={<ConfidentialValue>{`${property.mandate_remuneration || property.mandateRemuneration} %`}</ConfidentialValue>} icon={<DollarSign size={14} />} />}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <h3 className="font-semibold mb-4">{isSeasonal ? 'Prix' : 'Prix et Honoraires'}</h3>
        <PricingCarousel property={property} />
      </div>

      {/* Localisation */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <h3 className="font-semibold mb-4">Localisation</h3>
        <PermissionLocked allowed={canSeeAddress} label="Adresse masquée">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <InfoField label="Ville" value={property.city} icon={<MapPin size={14} />} highlight />
            {property.district && <InfoField label="Quartier" value={property.district} icon={<MapPin size={14} />} />}
            {property.location && <InfoField label="Type de localisation" value={LOCATION_TYPE_LABELS[property.location] || property.location} icon={<MapPin size={14} />} />}
            <InfoField label="Adresse" value={<ConfidentialValue>{property.hideExactAddress ? 'Confidentielle' : property.address}</ConfidentialValue>} icon={<MapPin size={14} />} />
            {property.latitude && property.longitude && (
              <InfoField label="Coordonnées" value={<ConfidentialValue>{`${property.latitude}, ${property.longitude}`}</ConfidentialValue>} icon={<Navigation size={14} />} />
            )}
            {property.exposition && <InfoField label="Exposition" value={property.exposition} icon={<Sun size={14} />} />}
            {property.currentUse && <InfoField label="Situation" value={property.currentUse} icon={<Clock size={14} />} />}
            {property.buildable && <InfoField label="Constructible" value="Oui" icon={<FileText size={14} />} />}
            {property.avna && <InfoField label="AVNA" value="Oui" icon={<DollarSign size={14} />} />}
          </div>
        </PermissionLocked>
      </div>

      {/* Description */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <h3 className="font-semibold mb-3">Description</h3>
        {property.description ? (
          <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
            {property.description.split(/\n{2,}/).map((paragraph: string, i: number) => (
              <p key={i} className="whitespace-pre-line">{paragraph.trim()}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary/50">Aucune description renseignée.</p>
        )}
      </div>

      {/* Features */}
      {property.features && property.features.length > 0 && (
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
          <h3 className="font-semibold mb-3">Caractéristiques</h3>
          <div className="flex flex-wrap gap-2">
            {property.features.map((f: any, i: number) => (
              <Badge key={i} variant="secondary" size="md">{f}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Règles (vacation only) */}
      {isSeasonal && property.horaires && (
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
            Règles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {property.horaires.arriveeAutonome !== undefined && (
              <InfoField label="Arrivée autonome" value={property.horaires.arriveeAutonome ? 'Oui' : 'Non'} icon={property.horaires.arriveeAutonome ? <CheckCircle size={14} /> : <XCircle size={14} />} />
            )}
            {property.horaires.pasDeFetes !== undefined && (
              <InfoField label="Pas de fêtes" value={property.horaires.pasDeFetes ? 'Oui' : 'Non'} icon={property.horaires.pasDeFetes ? <CheckCircle size={14} /> : <XCircle size={14} />} />
            )}
            {property.horaires.animauxInterdits !== undefined && (
              <InfoField label="Animaux interdits" value={property.horaires.animauxInterdits ? 'Oui' : 'Non'} icon={property.horaires.animauxInterdits ? <CheckCircle size={14} /> : <XCircle size={14} />} />
            )}
            {property.horaires.pasDeFumee !== undefined && (
              <InfoField label="Non-fumeur" value={property.horaires.pasDeFumee ? 'Oui' : 'Non'} icon={property.horaires.pasDeFumee ? <CheckCircle size={14} /> : <XCircle size={14} />} />
            )}
            {property.horaires.economieEnergie !== undefined && (
              <InfoField label="Économie d'énergie" value={property.horaires.economieEnergie ? 'Oui' : 'Non'} icon={property.horaires.economieEnergie ? <CheckCircle size={14} /> : <XCircle size={14} />} />
            )}
          </div>
          {property.horaires.autresRegles && (
            <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border/30">
              <p className="text-[11px] text-text-secondary/60 mb-1">Autres règles</p>
              <p className="text-sm text-text-secondary leading-relaxed">{property.horaires.autresRegles}</p>
            </div>
          )}
        </div>
      )}

      {/* Accès & Codes (vacation only) */}
      {isSeasonal && property.acces && (
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Key size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
            Accès & Codes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {property.acces.boiteCles?.presente !== undefined && (
              <InfoField label="Boîte à clés" value={property.acces.boiteCles.presente ? 'Présente' : 'Absente'} icon={<Key size={14} />} />
            )}
            {property.acces.boiteCles?.code && (
              <InfoField label="Code boîte à clés" value={<ConfidentialValue>{property.acces.boiteCles.code}</ConfidentialValue>} icon={<Lock size={14} />} />
            )}
            {property.acces.boiteCles?.emplacement && (
              <InfoField label="Emplacement clés" value={property.acces.boiteCles.emplacement} icon={<MapPin size={14} />} />
            )}
            {property.acces.portail?.code && (
              <InfoField label="Code portail" value={<ConfidentialValue>{property.acces.portail.code}</ConfidentialValue>} icon={<Lock size={14} />} />
            )}
            {property.acces.portail?.type && (
              <InfoField label="Type portail" value={property.acces.portail.type} icon={<Settings size={14} />} />
            )}
            {property.acces.appartement?.typeAcces && (
              <InfoField label="Type accès appartement" value={property.acces.appartement.typeAcces} icon={<Key size={14} />} />
            )}
            {property.acces.appartement?.code && (
              <InfoField label="Code appartement" value={<ConfidentialValue>{property.acces.appartement.code}</ConfidentialValue>} icon={<Lock size={14} />} />
            )}
            {property.acces.parking?.code && (
              <InfoField label="Code parking" value={<ConfidentialValue>{property.acces.parking.code}</ConfidentialValue>} icon={<Lock size={14} />} />
            )}
          </div>
        </div>
      )}

      {/* WiFi & Connectivité (vacation only) */}
      {isSeasonal && property.wifi && (property.wifi.reseau || property.wifi.motDePasse) && (
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Wifi size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
            WiFi & Connectivité
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {property.wifi.reseau && (
              <InfoField label="Réseau" value={property.wifi.reseau} icon={<Wifi size={14} />} />
            )}
            {property.wifi.motDePasse && (
              <InfoField label="Mot de passe" value={<ConfidentialValue>{property.wifi.motDePasse}</ConfidentialValue>} icon={<Lock size={14} />} />
            )}
          </div>
        </div>
      )}

      {/* Post Preview & Variables (content only, controlled from sidebar) */}
      {showVariables && (
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
          <p className="text-xs font-medium text-text-secondary mb-2">
            Variables disponibles :
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_VARIABLES.map(v => (
              <span
                key={v.variable}
                title={v.description}
                className="px-2 py-1 text-xs font-mono rounded border border-border/50 bg-card text-text-secondary"
              >
                {v.variable}
              </span>
            ))}
          </div>
        </div>
      )}

      {showPreview && (
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600"><Facebook size={14} /></span>
            <span className="text-xs font-medium text-text-secondary">
              Aperçu Facebook
            </span>
          </div>
          {property.images && property.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                {property.images.slice(0, 5).map((img: any, i: number) => (
                <img
                  key={i}
                  src={img}
                  alt={`${property.title} - ${i + 1}`}
                  className="h-48 w-full max-w-[200px] object-cover rounded-lg border border-border/50 flex-shrink-0"
                />
              ))}
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            <TagifyText text={previewText} color="#3b82f6" tagStyle={{ fontWeight: 600 }} mentionStyle={{ fontWeight: 600 }} />
          </p>
        </div>
      )}

    </div>
  );
};

function PricingCarousel({ property }: { property: any }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const animationRef = useRef<number>(0)

  const devise = property?.devise || 'MAD'
  const fmt = (v: number) => `${v.toLocaleString()} ${devise}`

  const displayPrice = property.prixNetVendeur && property.honorairesPct && property.honorairesType === 'inclus'
    ? Math.round(Number(property.prixNetVendeur) * (1 + Number(property.honorairesPct) / 100))
    : (property.prixNetVendeur || property.price)

  const items: { label: string; value: string | React.ReactNode }[] = []
  const isRental = property.transactionType === 'location_ld'
  const isSeasonal = property.transactionType === 'location_saisonniere'
  const isSale = property.transactionType === 'vente'

  if (property.devise) items.push({ label: 'Devise', value: property.devise })

  if (isRental) {
    if (property.loyerHC) items.push({ label: 'Loyer HC', value: <ConfidentialValue>{fmt(property.loyerHC)}</ConfidentialValue> })
    if (property.charges) items.push({ label: 'Charges', value: <ConfidentialValue>{fmt(property.charges)}</ConfidentialValue> })
    if (property.loyerHC && property.charges) {
      items.push({ label: 'Loyer CC', value: <ConfidentialValue>{fmt(Number(property.loyerHC) + Number(property.charges))}</ConfidentialValue> })
    }
    if (property.depotGarantie) {
      const depotLabels: Record<string, string> = { '1_mois': '1 mois', '2_mois': '2 mois', '3_mois': '3 mois' }
      items.push({ label: 'Dépôt garantie', value: depotLabels[property.depotGarantie] || property.depotGarantie })
    }
    if (property.honorairesLocation) items.push({ label: 'Honoraires location', value: <ConfidentialValue>{fmt(property.honorairesLocation)}</ConfidentialValue> })
  }

  if (isSale) {
    if (property.prixSurDemande) {
      items.push({ label: 'Prix', value: 'Sur demande' })
    } else {
      if (displayPrice) items.push({ label: 'Prix affiché', value: <ConfidentialValue>{fmt(displayPrice)}</ConfidentialValue> })
      if (property.prixNetVendeur) items.push({ label: 'Prix net vendeur', value: <ConfidentialValue>{fmt(property.prixNetVendeur)}</ConfidentialValue> })
    }
    if (property.honorairesType) {
      const label = property.honorairesType === 'inclus' ? 'Inclus dans le prix' : 'En sus du prix'
      items.push({ label: 'Honoraires', value: label })
    }
    if (property.honorairesPct) {
      items.push({ label: 'Taux honoraires', value: `${property.honorairesPct}%` })
    }
    if (property.prixNetVendeur && property.honorairesPct) {
      const montant = Math.round(Number(property.prixNetVendeur) * Number(property.honorairesPct) / 100)
      items.push({ label: 'Montant honoraires', value: <ConfidentialValue>{fmt(montant)}</ConfidentialValue> })
    }
    if (property.negociable !== undefined) items.push({ label: 'Négociable', value: property.negociable ? 'Oui' : 'Non' })
    if (property.prixMinimum || property.priceMin) items.push({ label: 'Prix minimum', value: <ConfidentialValue>{fmt(property.prixMinimum || property.priceMin)}</ConfidentialValue> })
    if (property.prixConfidentiel) items.push({ label: 'Prix confidentiel', value: 'Oui' })
    if (property.prixExpertise || property.priceMax) items.push({ label: 'Prix expertise', value: <ConfidentialValue>{fmt(property.prixExpertise || property.priceMax)}</ConfidentialValue> })
  }

  if (isSeasonal) {
    if (property.seasonalPriceMin) items.push({ label: 'Prix nuit (min)', value: fmt(property.seasonalPriceMin) })
    if (property.seasonalPriceMax) items.push({ label: 'Prix nuit (max)', value: fmt(property.seasonalPriceMax) })
    const sMin = Number(property.seasonalPriceMin) || 0
    const sMax = Number(property.seasonalPriceMax) || 0
    if (sMin || sMax) {
      items.push({ label: 'Prix semaine', value: `${fmt(sMin * 7)} ~ ${fmt(sMax * 7)}` })
      items.push({ label: 'Prix mois', value: `${fmt(sMin * 30)} ~ ${fmt(sMax * 30)}` })
    }
    if (property.sleepingCapacity) items.push({ label: 'Capacité max', value: `${property.sleepingCapacity} pers.` })
  }

  if (property.priceEstimate) items.push({ label: 'Estimation', value: <ConfidentialValue>{fmt(property.priceEstimate)}</ConfidentialValue> })

  const duplicated = items.length > 0 ? [...items, ...items] : []

  useEffect(() => {
    const el = containerRef.current
    if (!el || items.length === 0) return
    let running = true
    const scroll = () => {
      if (!running) return
      if (!isHovering) {
        el.scrollLeft += 0.5
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0
        }
      }
      animationRef.current = requestAnimationFrame(scroll)
    }
    animationRef.current = requestAnimationFrame(scroll)
    return () => { running = false; if (animationRef.current) cancelAnimationFrame(animationRef.current) }
  }, [isHovering, items.length])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !isHovering) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const progress = Math.max(0, Math.min(1, x / rect.width))
    const maxScroll = (containerRef.current.scrollWidth / 2) - containerRef.current.clientWidth
    containerRef.current.scrollLeft = progress * maxScroll
  }

  if (items.length === 0) return <p className="text-sm text-text-secondary/60 italic">Aucune information tarifaire</p>

  return (
    <div
      ref={containerRef}
      className="flex gap-3 overflow-x-hidden cursor-grab active:cursor-grabbing py-1"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      <div className="flex gap-3 flex-shrink-0">
        {duplicated.map((item, i) => (
          <div key={i} className="w-48 p-3 rounded-lg bg-background/50 border border-border/30 flex-shrink-0">
            <p className="text-[11px] text-text-secondary/60 mb-1 truncate">{item.label}</p>
            <p className="text-sm font-semibold truncate">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
