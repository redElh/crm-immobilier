import { useRef, useEffect, useState } from 'react';
import { InfoField } from '../../ui/InfoField';
import { Badge } from '../../ui/Badge';
import { Home, MapPin, Maximize2, Grid, Calendar, Layers, Hash, Sun, Briefcase, DollarSign, FileText, Clock, Navigation, Facebook, Percent, Wifi, Key, Lock, CheckCircle, XCircle, Settings, Check, Heart, MessageCircle, Globe, Share2 } from 'react-feather';
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '../../../types/property';
import { ConfidentialValue } from '../confidentiality/ConfidentialField';
import { PermissionLocked } from '../confidentiality/PermissionLocked';
import { usePermission } from '../../../hooks/usePermission';
import { TEMPLATE_VARIABLES } from '../../../types/social';
import { TagifyText } from './TagifyText';
import {
  allPropertyTypes, locations
} from './AddPropertyForm/constants';
import { useStageChrome } from '../calendar/useStageChrome';
import { StagePanel, STAGE_HUES, useStageTheme } from '../../dashboard/Stage';
import type { StageHue } from '../../dashboard/Stage';

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

const STATUS_HUE_MAP: Record<string, StageHue> = {
  draft: STAGE_HUES.sky,
  active: STAGE_HUES.violet,
  negotiation: STAGE_HUES.amber,
  compromise: STAGE_HUES.fuchsia,
  sold: STAGE_HUES.emerald,
  rented: STAGE_HUES.emerald,
  sold_or_rented: STAGE_HUES.emerald,
};

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

/* ---------------------------------------------------------------------
   Shared pricing items — one source of truth for both variants
--------------------------------------------------------------------- */

interface PriceItem { label: string; value: string | React.ReactNode }

function buildPricingItems(property: any): PriceItem[] {
  const devise = property?.devise || 'MAD'
  const fmt = (v: number) => `${Number(v).toLocaleString('fr-FR')} ${devise}`

  const displayPrice = property.prixNetVendeur && property.honorairesPct && property.honorairesType === 'inclus'
    ? Math.round(Number(property.prixNetVendeur) * (1 + Number(property.honorairesPct) / 100))
    : (property.prixNetVendeur || property.price)

  const items: PriceItem[] = []
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

  return items
}

/* ---------------------------------------------------------------------
   Main component
--------------------------------------------------------------------- */

export const PropertyDetails = ({ property, showPreview, showVariables, previewText, isGerant = false }: PropertyDetailsProps) => {
  const canSeeAddress = usePermission('biens-afficher-adresse');
  const { staged, dark } = useStageChrome();
  const typeLabel = CONSTRUCTION_TYPE_LABELS[property.constructionType] || property.constructionType || PROPERTY_TYPE_LABELS[property.propertyType as keyof typeof PROPERTY_TYPE_LABELS] || property.propertyType;
  const transactionLabel = TRANSACTION_TYPE_LABELS[property.transactionType as keyof typeof TRANSACTION_TYPE_LABELS] || property.transactionType;
  const statusLabel = STATUS_LABELS[property.status as keyof typeof STATUS_LABELS] || property.status;
  const statusColor = statusColorCls(property.status, isGerant);
  const statusHue = STATUS_HUE_MAP[property.status] || STAGE_HUES.violet;
  const isSeasonal = property.transactionType === 'location_saisonniere';

  /* ===================================================================
     STAGE variant — Mission Control dossier sheets
  =================================================================== */
  if (staged) {
    return (
      <div className="space-y-5">
        {/* Informations générales */}
        <StagePanel title="Informations générales" icon={Hash} hue={STAGE_HUES.violet}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StageField icon={Hash} hue={STAGE_HUES.violet} label="Référence" value={property.reference} mono />
            {property.propertyTitle && <StageField icon={FileText} hue={STAGE_HUES.sky} label="Titre" value={property.propertyTitle} />}
            {property.date && <StageField icon={Calendar} hue={STAGE_HUES.fuchsia} label="Date" value={property.date} />}
            <StageField icon={Briefcase} hue={STAGE_HUES.amber} label="Type de bien" value={typeLabel} />
            {property.constructionSubType && (
              <StageField icon={Briefcase} hue={STAGE_HUES.amber} label="Sous-type" value={CONSTRUCTION_TYPE_LABELS[property.constructionSubType] || property.constructionSubType} />
            )}
            <StageField icon={Home} hue={STAGE_HUES.emerald} label="Transaction" value={transactionLabel} />
            <div
              className="rounded-xl border p-3"
              style={{
                borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)',
                background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
              }}
            >
              <div className="mb-1.5 flex items-center gap-1.5">
                <CheckCircle size={12} style={{ color: statusHue.a }} />
                <span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>Statut</span>
              </div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold"
                style={{
                  color: statusHue.line,
                  borderColor: `${statusHue.a}40`,
                  backgroundColor: `${statusHue.a}12`,
                  boxShadow: `0 0 12px ${statusHue.glow}`,
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusHue.line, boxShadow: `0 0 6px ${statusHue.line}` }} />
                {statusLabel}
              </span>
            </div>
            <StageField icon={Maximize2} hue={STAGE_HUES.violet} label="Surface" value={`${property.surface} m²`} />
            {property.buildableSurface && <StageField icon={Maximize2} hue={STAGE_HUES.violet} label="Surface constructible" value={`${property.buildableSurface} m²`} />}
            {property.surfaceCarrez && <StageField icon={Maximize2} hue={STAGE_HUES.violet} label="Surface Carrez" value={`${property.surfaceCarrez} m²`} />}
            {property.landSize && <StageField icon={MapPin} hue={STAGE_HUES.sky} label="Terrain" value={`${property.landSize} m²`} />}
            <StageField icon={Grid} hue={STAGE_HUES.sky} label="Chambres" value={property.bedrooms_total ?? property.bedrooms} />
            <StageField icon={Grid} hue={STAGE_HUES.fuchsia} label="Salles de bain" value={property.bathroom_count ?? property.bathrooms} />
            {property.sleepingCapacity && <StageField icon={Sun} hue={STAGE_HUES.amber} label="Couchages" value={property.sleepingCapacity} />}
            {property.beds && <StageField icon={Sun} hue={STAGE_HUES.amber} label="Lits" value={property.beds} />}
            {property.yearBuilt && <StageField icon={Calendar} hue={STAGE_HUES.fuchsia} label="Année construction" value={property.yearBuilt} />}
            {property.propertyState && <StageField icon={Layers} hue={STAGE_HUES.emerald} label="État" value={property.propertyState} />}
            {property.furnishing && <StageField icon={Home} hue={STAGE_HUES.emerald} label="Meublé" value={FURNISHING_LABELS[property.furnishing] || property.furnishing} />}
            {property.cadastralReference && <StageField icon={Hash} hue={STAGE_HUES.violet} label="Réf. cadastrale" value={property.cadastralReference} mono />}
            {property.mandateType && <StageField icon={FileText} hue={STAGE_HUES.sky} label="Type de mandat" value={property.mandateType} />}
            {(property.mandate_remuneration || property.mandateRemuneration) && <StageField icon={Percent} hue={STAGE_HUES.amber} label="Rémunération" value={<ConfidentialValue>{`${property.mandate_remuneration || property.mandateRemuneration} %`}</ConfidentialValue>} />}
          </div>
        </StagePanel>

        {/* Prix et Honoraires */}
        <StagePanel title={isSeasonal ? 'Prix' : 'Prix et Honoraires'} icon={DollarSign} hue={STAGE_HUES.emerald}>
          <StagedPricingCarousel property={property} />
        </StagePanel>

        {/* Localisation */}
        <StagePanel title="Localisation" icon={MapPin} hue={STAGE_HUES.sky}>
          <PermissionLocked allowed={canSeeAddress} label="Adresse masquée">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <StageField icon={MapPin} hue={STAGE_HUES.sky} label="Ville" value={property.city} highlight />
              {property.district && <StageField icon={MapPin} hue={STAGE_HUES.sky} label="Quartier" value={property.district} />}
              {property.location && <StageField icon={MapPin} hue={STAGE_HUES.sky} label="Type de localisation" value={LOCATION_TYPE_LABELS[property.location] || property.location} />}
              <StageField icon={MapPin} hue={STAGE_HUES.violet} label="Adresse" value={<ConfidentialValue>{property.hideExactAddress ? 'Confidentielle' : property.address}</ConfidentialValue>} />
              {property.latitude && property.longitude && (
                <StageField icon={Navigation} hue={STAGE_HUES.fuchsia} label="Coordonnées" value={<ConfidentialValue>{`${property.latitude}, ${property.longitude}`}</ConfidentialValue>} mono />
              )}
              {property.exposition && <StageField icon={Sun} hue={STAGE_HUES.amber} label="Exposition" value={property.exposition} />}
              {property.currentUse && <StageField icon={Clock} hue={STAGE_HUES.emerald} label="Situation" value={property.currentUse} />}
              {property.buildable && <StageField icon={FileText} hue={STAGE_HUES.emerald} label="Constructible" value="Oui" />}
              {property.avna && <StageField icon={DollarSign} hue={STAGE_HUES.amber} label="AVNA" value="Oui" />}
            </div>
          </PermissionLocked>
        </StagePanel>

        {/* Description */}
        <StagePanel title="Description" icon={FileText} hue={STAGE_HUES.fuchsia}>
            {property.description ? (
              <div className={`space-y-3 text-sm leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                {String(property.description).split(/\n{2,}/).map((paragraph: string, i: number) => (
                  <p key={i} className="whitespace-pre-line">{paragraph.trim()}</p>
                ))}
              </div>
            ) : (
              <p className={`text-sm italic ${dark ? 'text-slate-500' : 'text-teal-900/40'}`}>Aucune description renseignée.</p>
            )}
        </StagePanel>

        {/* Caractéristiques */}
        {property.features && property.features.length > 0 && (
          <StagePanel title="Caractéristiques" icon={CheckCircle} hue={STAGE_HUES.emerald}>
            <div className="flex flex-wrap gap-2">
              {property.features.map((f: any, i: number) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-transform duration-200 hover:-translate-y-px"
                  style={{
                    color: dark ? '#6EE7B7' : '#047857',
                    borderColor: dark ? 'rgba(52,211,153,0.28)' : 'rgba(5,150,105,0.20)',
                    backgroundColor: dark ? 'rgba(52,211,153,0.08)' : 'rgba(16,185,129,0.06)',
                  }}
                >
                  <Check size={11} strokeWidth={3} />
                  {f}
                </span>
              ))}
            </div>
          </StagePanel>
        )}

        {/* Règles (vacation only) */}
        {isSeasonal && property.horaires && (
          <StagePanel title="Règles" icon={Clock} hue={STAGE_HUES.amber}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {property.horaires.arriveeAutonome !== undefined && (
                <StageBoolField hue={STAGE_HUES.emerald} label="Arrivée autonome" value={!!property.horaires.arriveeAutonome} />
              )}
              {property.horaires.pasDeFetes !== undefined && (
                <StageBoolField hue={STAGE_HUES.emerald} label="Pas de fêtes" value={!!property.horaires.pasDeFetes} />
              )}
              {property.horaires.animauxInterdits !== undefined && (
                <StageBoolField hue={STAGE_HUES.emerald} label="Animaux interdits" value={!!property.horaires.animauxInterdits} />
              )}
              {property.horaires.pasDeFumee !== undefined && (
                <StageBoolField hue={STAGE_HUES.emerald} label="Non-fumeur" value={!!property.horaires.pasDeFumee} />
              )}
              {property.horaires.economieEnergie !== undefined && (
                <StageBoolField hue={STAGE_HUES.emerald} label="Économie d'énergie" value={!!property.horaires.economieEnergie} />
              )}
            </div>
            {property.horaires.autresRegles && (
              <div
                className="mt-3 rounded-xl border p-3"
                style={{
                  borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)',
                  background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
                }}
              >
                <p className={`mb-1 text-[10px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>Autres règles</p>
                <p className={`text-sm leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{property.horaires.autresRegles}</p>
              </div>
            )}
          </StagePanel>
        )}

        {/* Accès & Codes (vacation only) */}
        {isSeasonal && property.acces && (
          <StagePanel title="Accès & Codes" icon={Key} hue={STAGE_HUES.fuchsia}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {property.acces.boiteCles?.presente !== undefined && (
                <StageBoolField hue={STAGE_HUES.emerald} label="Boîte à clés" value={!!property.acces.boiteCles.presente} trueLabel="Présente" falseLabel="Absente" />
              )}
              {property.acces.boiteCles?.code && (
                <StageField icon={Lock} hue={STAGE_HUES.fuchsia} label="Code boîte à clés" value={<ConfidentialValue>{property.acces.boiteCles.code}</ConfidentialValue>} mono />
              )}
              {property.acces.boiteCles?.emplacement && (
                <StageField icon={MapPin} hue={STAGE_HUES.sky} label="Emplacement clés" value={property.acces.boiteCles.emplacement} />
              )}
              {property.acces.portail?.code && (
                <StageField icon={Lock} hue={STAGE_HUES.fuchsia} label="Code portail" value={<ConfidentialValue>{property.acces.portail.code}</ConfidentialValue>} mono />
              )}
              {property.acces.portail?.type && (
                <StageField icon={Settings} hue={STAGE_HUES.sky} label="Type portail" value={property.acces.portail.type} />
              )}
              {property.acces.appartement?.typeAcces && (
                <StageField icon={Key} hue={STAGE_HUES.fuchsia} label="Type accès appartement" value={property.acces.appartement.typeAcces} />
              )}
              {property.acces.appartement?.code && (
                <StageField icon={Lock} hue={STAGE_HUES.fuchsia} label="Code appartement" value={<ConfidentialValue>{property.acces.appartement.code}</ConfidentialValue>} mono />
              )}
              {property.acces.parking?.code && (
                <StageField icon={Lock} hue={STAGE_HUES.fuchsia} label="Code parking" value={<ConfidentialValue>{property.acces.parking.code}</ConfidentialValue>} mono />
              )}
            </div>
          </StagePanel>
        )}

        {/* WiFi & Connectivité (vacation only) */}
        {isSeasonal && property.wifi && (property.wifi.reseau || property.wifi.motDePasse) && (
          <StagePanel title="WiFi & Connectivité" icon={Wifi} hue={STAGE_HUES.sky}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {property.wifi.reseau && <StageField icon={Wifi} hue={STAGE_HUES.sky} label="Réseau" value={property.wifi.reseau} />}
              {property.wifi.motDePasse && (
                <StageField icon={Lock} hue={STAGE_HUES.fuchsia} label="Mot de passe" value={<ConfidentialValue>{property.wifi.motDePasse}</ConfidentialValue>} mono />
              )}
            </div>
          </StagePanel>
        )}

        {/* Post Preview & Variables (content only, controlled from sidebar) */}
        {showVariables && !showPreview && (
          <StagePanel title="Variables disponibles" icon={Settings} hue={STAGE_HUES.violet}
            badge={<span className={`text-[10px] font-semibold ${dark ? 'text-slate-500' : 'text-teal-900/40'}`}>cliquez pour copier</span>}
          >
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v: any) => (
                <VariableChip key={v.variable} variable={v.variable} description={v.description} />
              ))}
            </div>
          </StagePanel>
        )}

        {showPreview && (
          <StagePanel title="Aperçu Facebook" icon={Facebook} hue={STAGE_HUES.sky}
            badge={
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: '#60A5FA', borderColor: 'rgba(96,165,250,0.35)', backgroundColor: 'rgba(96,165,250,0.08)' }}
              >
                <Facebook size={10} /> Facebook
              </span>
            }
          >
            <div
              className="w-full overflow-hidden rounded-2xl border"
              style={{
                borderColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
                background: dark ? 'linear-gradient(180deg, rgba(17,24,50,0.85), rgba(9,13,30,0.92))' : 'rgba(255,255,255,0.85)',
                boxShadow: dark ? '0 24px 60px -28px rgba(2,4,18,0.9)' : '0 20px 50px -24px rgba(13,148,136,0.35)',
              }}
            >
              {/* accent beam */}
              <div
                aria-hidden="true"
                className="h-[3px] w-full"
                style={{ background: 'linear-gradient(90deg, transparent, #60A5FA, #2563EB, transparent)' }}
              />

              {/* post header */}
              <div className="flex items-center gap-3 p-5">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-extrabold"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #60A5FA26, #2563EB14)',
                    borderColor: 'rgba(96,165,250,0.35)',
                    color: '#60A5FA',
                    boxShadow: '0 4px 12px rgba(96,165,250,0.30), inset 0 1px 0 rgba(255,255,255,0.25)',
                  }}
                >
                  SM
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[15px] font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Square Meter</p>
                  <p className={`flex items-center gap-1 text-[11px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Globe size={10} /> Publication sponsorisée · Aperçu
                  </p>
                </div>
                <span className={`font-mono text-[11px] tabular-nums ${dark ? 'text-slate-600' : 'text-slate-400'}`}>···</span>
              </div>

              {/* media */}
              {property.images && property.images.length > 0 && (
                property.images.length === 1 ? (
                  <img src={property.images[0]} alt="" className="max-h-96 w-full object-cover" loading="lazy" />
                ) : (
                  <div
                    className="scrollbar-thin relative overflow-x-auto"
                    style={{ transform: 'translateZ(0)', scrollbarWidth: 'none' }}
                  >
                    <div className="flex">
                      {property.images.slice(0, 5).map((img: any, i: number) => (
                        <img
                          key={i}
                          src={img}
                          alt={`${property.title} - ${i + 1}`}
                          className={`h-64 w-auto max-w-[70%] shrink-0 object-cover ${i > 0 ? 'border-l' : ''}`}
                          style={{ borderColor: dark ? 'rgba(0,0,0,0.5)' : 'rgba(15,23,42,0.10)' }}
                          loading="lazy"
                        />
                      ))}
                      {property.images.length > 5 && (
                        <div className="relative shrink-0">
                          <img src={property.images[5]} alt="" className="h-64 w-auto max-w-[70%] object-cover opacity-50" loading="lazy" />
                          <span className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold text-white drop-shadow-lg">
                            +{property.images.length - 5}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* post body */}
              <div className="p-5">
                <p className={`whitespace-pre-wrap text-[15px] leading-relaxed ${dark ? 'text-slate-200' : 'text-slate-700'}`}>
                  <TagifyText text={previewText} color={dark ? '#7DD3FC' : '#2563eb'} tagStyle={{ fontWeight: 700 }} mentionStyle={{ fontWeight: 700 }} />
                </p>

                {/* engagement bar */}
                <div
                  className="mt-5 flex items-stretch gap-1 border-t pt-2"
                  style={{ borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)' }}
                >
                  {[
                    { icon: <Heart size={14} />, label: "J'aime" },
                    { icon: <MessageCircle size={14} />, label: 'Commenter' },
                    { icon: <Share2 size={14} />, label: 'Partager' },
                  ].map((b, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors ${
                        dark ? 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200' : 'text-slate-500 hover:bg-slate-900/[0.04] hover:text-slate-700'
                      }`}
                    >
                      {b.icon}
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </StagePanel>
        )}
      </div>
    );
  }

  /* ===================================================================
     Legacy variant (admin shell) — unchanged
  =================================================================== */
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

/* ---------------------------------------------------------------------
   Stage sub-components
--------------------------------------------------------------------- */

export function VariableChip({ variable, description }: { variable: string; description?: string }) {
  const dark = useStageTheme() === 'dark'
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(variable)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch { /* clipboard unavailable */ }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={description}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-xs transition-all duration-200 active:scale-95 ${
        copied
          ? ''
          : dark
            ? 'border-indigo-400/25 bg-indigo-400/[0.06] text-indigo-200 hover:bg-indigo-400/15'
            : 'border-indigo-500/20 bg-indigo-500/[0.04] text-indigo-700 hover:bg-indigo-500/10'
      }`}
      style={copied ? {
        color: STAGE_HUES.emerald.line,
        borderColor: `${STAGE_HUES.emerald.a}50`,
        backgroundColor: `${STAGE_HUES.emerald.a}12`,
      } : undefined}
    >
      {copied && <Check size={10} strokeWidth={3} />}
      {variable}
    </button>
  )
}

function StageField({
  icon: Icon, hue, label, value, highlight = false, mono = false,
}: {
  icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>
  hue: StageHue
  label: string
  value: string | number | React.ReactNode
  highlight?: boolean
  mono?: boolean
}) {
  const dark = useStageTheme() === 'dark'
  return (
    <div
      className={`rounded-xl border p-3 transition-all duration-200 hover:-translate-y-px ${mono ? 'font-mono' : ''}`}
      style={{
        borderColor: highlight ? `${hue.a}45` : dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)',
        background: highlight
          ? `linear-gradient(145deg, ${hue.a}12, transparent)`
          : dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
        boxShadow: highlight ? `0 4px 18px -6px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.08)` : 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Icon size={12} style={{ color: hue.a }} />
        <span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
          {label}
        </span>
      </div>
      <p className={`text-sm font-semibold break-words ${highlight ? '' : dark ? 'text-slate-100' : 'text-slate-800'}`} style={highlight ? { color: hue.line } : undefined}>
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </p>
    </div>
  )
}

function StageBoolField({
  hue, label, value, trueLabel = 'Oui', falseLabel = 'Non',
}: {
  hue: StageHue
  label: string
  value: boolean
  trueLabel?: string
  falseLabel?: string
}) {
  const dark = useStageTheme() === 'dark'
  const ok = STAGE_HUES.emerald
  const no = { a: '#94A3B8', line: '#94A3B8', glow: 'rgba(148,163,184,0.35)' }
  const c = value ? ok : no
  void hue
  return (
    <div
      className="rounded-xl border p-3 transition-all duration-200 hover:-translate-y-px"
      style={{
        borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)',
        background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="mb-1 flex items-center gap-1.5">
        {value
          ? <CheckCircle size={12} style={{ color: c.a }} />
          : <XCircle size={12} style={{ color: c.a }} />}
        <span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
          {label}
        </span>
      </div>
      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold"
        style={{ color: c.line, borderColor: `${c.a}40`, backgroundColor: `${c.a}12` }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.line, boxShadow: value ? `0 0 6px ${c.line}` : 'none' }} />
        {value ? trueLabel : falseLabel}
      </span>
    </div>
  )
}

function StagedPricingCarousel({ property }: { property: any }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const animationRef = useRef<number>(0)
  const dark = useStageTheme() === 'dark'
  const items = buildPricingItems(property)

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

  if (items.length === 0) {
    return <p className={`text-sm italic ${dark ? 'text-slate-500' : 'text-teal-900/40'}`}>Aucune information tarifaire</p>
  }

  const PRIMARY_LABELS = new Set(['Prix affiché', 'Loyer HC', 'Prix', 'Prix nuit (min)', 'Prix nuit (max)'])

  return (
    <div className="relative">
      {/* edge fade masks */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8"
        style={{ background: `linear-gradient(90deg, ${dark ? 'rgba(13,18,40,0.9)' : 'rgba(255,255,255,0.9)'}, transparent)` }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8"
        style={{ background: `linear-gradient(-90deg, ${dark ? 'rgba(13,18,40,0.9)' : 'rgba(255,255,255,0.9)'}, transparent)` }} />
      <div
        ref={containerRef}
        className="flex cursor-grab gap-3 overflow-x-hidden py-1 active:cursor-grabbing"
        style={{
          transform: 'translateZ(0)',
          scrollbarWidth: 'none',
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        <div className="flex shrink-0 gap-3">
          {duplicated.map((item, i) => {
            const primary = PRIMARY_LABELS.has(item.label)
            return (
              <div
                key={i}
                className="w-52 shrink-0 rounded-xl border p-3.5 transition-transform duration-200 hover:-translate-y-px"
                style={{
                  borderColor: primary ? `${STAGE_HUES.emerald.a}45` : dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)',
                  background: primary
                    ? `linear-gradient(145deg, ${STAGE_HUES.emerald.a}12, transparent)`
                    : dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
                  boxShadow: primary
                    ? `0 4px 18px -6px ${STAGE_HUES.emerald.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                <p className={`mb-1 truncate text-[10px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                  {item.label}
                </p>
                <p
                  className={`break-words text-sm font-extrabold tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}
                  style={primary ? {
                    backgroundImage: `linear-gradient(100deg, ${STAGE_HUES.emerald.a}, ${dark ? '#34D399' : '#059669'})`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  } : undefined}
                >
                  {item.value}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* Legacy pricing marquee (admin shell) */
function PricingCarousel({ property }: { property: any }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const animationRef = useRef<number>(0)

  const items = buildPricingItems(property)

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
