import Card from '../../ui/Card'
import { Badge } from '../../ui/Badge'
import { InfoField } from '../../ui/InfoField'
import { User, Briefcase, FileText, DollarSign, Calendar, MapPin, Phone, Mail, Hash, CheckSquare, Users, Shield, Download, Image } from 'react-feather'
import { ConfidentialValue } from '../confidentiality/ConfidentialField'
import { PermissionLocked, PermissionValue } from '../confidentiality/PermissionLocked'
import { usePermission } from '../../../hooks/usePermission'
import { useStageChrome } from '../calendar/useStageChrome'
import { StagePanel, STAGE_HUES } from '../../dashboard/Stage'
import type { StageHue } from '../../dashboard/Stage'

function formatDate(val: string): string {
  if (!val) return val
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function getMandateVal(property: any, key: string): string {
  return property[`mandate_${key}`] || property.mandate?.[key] || ''
}

const STATUT_LABELS: Record<string, string> = {
  'Non défini': 'Non défini',
  'En attente de signature': 'En attente de signature',
  Actif: 'Actif',
  Expire: 'Expiré',
  Resilie: 'Résilié',
  Termine: 'Terminé',
}

const TYPE_MANDAT_VENTE_LABELS: Record<string, string> = {
  Simple: 'Simple',
  'Co-exclusif': 'Co-exclusif',
  Exclusif: 'Exclusif',
  'Exclusif agence': 'Exclusif agence',
  Delegation: 'Délégation',
  Confrere: 'Confrère',
}

const TYPE_MANDAT_BAILLEUR_LABELS: Record<string, string> = {
  Gestion: 'Gestion (location)',
  Location: 'Location (recherche locataire)',
  'Co-gestion': 'Co-gestion',
}

const REMUNERATION_LABELS: Record<string, string> = {
  'Frais de gestion mensuels': 'Frais de gestion mensuels',
  'Commission sur loyer': 'Commission sur loyer',
  'Forfait annuel': 'Forfait annuel',
}

const CONDITION_PAIEMENT_LABELS: Record<string, string> = {
  'Preleve sur loyer': 'Prélevé sur loyer',
  'Facture annuellement': 'Facturé annuellement',
}

const TYPE_HONORAIRES_LABELS: Record<string, string> = {
  inclus: 'Inclus dans le prix',
  en_sus: 'En sus du prix',
}

function SectionHeading({ children, isGerant = false }: { children: React.ReactNode; isGerant?: boolean }) {
  const { staged, dark } = useStageChrome()
  return (
    <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
      <div
        className="w-0.5 h-4 rounded-full"
        style={staged ? {
          background: dark
            ? 'linear-gradient(180deg, #8B7CFF, #5646C9)'
            : 'linear-gradient(180deg, #2DD4BF, #0D9488)',
          boxShadow: dark ? '0 0 8px rgba(139,124,255,0.7)' : '0 0 8px rgba(13,148,136,0.6)',
        } : undefined}
      />
      <h3 className={`text-xs font-semibold uppercase tracking-[0.14em] ${staged ? (dark ? 'text-slate-400' : 'text-teal-900/55') : 'text-text-secondary'}`}>
        {children}
      </h3>
    </div>
  )
}

const FIELD_HUE: Record<string, StageHue> = {
  User: STAGE_HUES.violet,
  Hash: STAGE_HUES.violet,
  Briefcase: STAGE_HUES.amber,
  FileText: STAGE_HUES.sky,
  MapPin: STAGE_HUES.sky,
  Phone: STAGE_HUES.sky,
  Mail: STAGE_HUES.fuchsia,
  DollarSign: STAGE_HUES.emerald,
  Calendar: STAGE_HUES.fuchsia,
  Users: STAGE_HUES.emerald,
  Shield: STAGE_HUES.emerald,
}

/* Field bridge: StageField glass tile inside the Stage shell, legacy InfoField otherwise */
function OwnerField({ staged, dark, label, value, icon: Icon, hue, highlight = false, mono = false }: {
  staged: boolean
  dark: boolean
  label: string
  value: React.ReactNode
  icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>
  hue?: StageHue
  highlight?: boolean
  mono?: boolean
}) {
  const resolvedHue = hue || FIELD_HUE[(Icon as any).name] || STAGE_HUES.violet
  if (!staged) {
    return <InfoField label={label} value={value} icon={<Icon size={14} />} highlight={highlight} />
  }
  return <StageField icon={Icon} hue={resolvedHue} label={label} value={value} highlight={highlight} mono={mono} />
}

/* StageField — glass tile (same anatomy as the Informations tab) */
function StageField({ icon: Icon, hue, label, value, highlight = false, mono = false }: {
  icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>
  hue: StageHue
  label: string
  value: React.ReactNode
  highlight?: boolean
  mono?: boolean
}) {
  const { dark } = useStageChrome()
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
      <p className={`text-sm font-semibold break-words ${dark ? 'text-slate-100' : 'text-slate-800'}`}>
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </p>
      {highlight && <div className="mt-2 h-px w-full" style={{ background: `linear-gradient(90deg, ${hue.a}55, transparent)` }} />}
    </div>
  )
}



export default function PropertyOwnerDetail({ property, isGerant = false }: { property: any; isGerant?: boolean }) {
  const { staged, dark } = useStageChrome()
  const canSeeName = usePermission('biens-afficher-nom-contact')
  const canSeeCoords = usePermission('biens-afficher-coordonnees-contact')
  const isVente = property.transactionType === 'vente' || !property.transactionType
  const isSeasonal = property.transactionType === 'location_saisonniere'
  const ownerType = property.ownerType

  const firstName = property.owner_firstName || property.owner?.firstName || ''
  const lastName = property.owner_lastName || property.owner?.lastName || ''
  const ownerName = [firstName, lastName].filter(Boolean).join(' ') || property.owner?.name || ''

  const companyName = property.company?.name || property.company_name || ''
  const legalForm = property.company?.legalForm || property.company_legalForm || ''
  const siren = property.company?.siren || property.company_siren || ''
  const companyAddress = property.company?.address || property.company_address || ''

  const address = property.owner_address || property.owner?.address || ''
  const phone = property.owner_phone || property.owner?.phone || property.ownerPhone || ''
  const email = property.owner_email || property.owner?.email || property.ownerEmail || ''
  const profession = property.owner_profession || property.owner?.profession || ''

  const civilite = property.ownerCivilite || property.owner_civilite || ''
  const origin = property.ownerOrigin || property.owner_origin || ''

  const saleMotivation = typeof property.saleInfo === 'string' ? property.saleInfo : property.saleInfo?.motivation || ''
  const purchaseDate = property.saleInfo?.purchaseDate || ''
  const listingDuration = property.saleInfo?.listingDuration || ''
  const otherProperties = property.saleInfo?.otherProperties || false
  const otherPropertiesDescription = property.saleInfo?.otherPropertiesDescription || ''

  // Legacy mandate columns
  const legacyMandateType = property.mandateType || ''
  const legacyMandateStart = property.mandateDate || property.mandateStartDate || property.mandate_startDate || ''
  const legacyMandateEnd = property.mandateEndDate || ''
  const legacyMandateRemuneration = property.mandate_remuneration || property.mandateRemuneration || ''

  // New mandate fields from form_data
  const mNumero = getMandateVal(property, 'numeroMandat')
  const mStatut = getMandateVal(property, 'statutMandat')
  const mDateDebut = getMandateVal(property, 'dateDebut') || legacyMandateStart
  const mDateExpiration = getMandateVal(property, 'dateExpiration') || legacyMandateEnd
  const mTypeMandat = getMandateVal(property, 'typeMandat') || legacyMandateType
  const mClauseProtection = getMandateVal(property, 'clauseProtection')
  const mClauseProtectionMois = getMandateVal(property, 'clauseProtectionMois')
  const mConjoint = getMandateVal(property, 'conjoint')
  const mSociete = getMandateVal(property, 'societe')
  const mAgentDesigne = getMandateVal(property, 'agentDesigne')
  const mDateSignature = property.mandate_dateSignatureMandat || property.mandate?.dateSignatureMandat || ''
  const mHonorairesType = getMandateVal(property, 'typeHonorairesMandat')
  const mMontantHonoraires = getMandateVal(property, 'montantHonoraires')
  const mCommissionCo = getMandateVal(property, 'commissionCoAgencementMandat')
  const mPrixNet = getMandateVal(property, 'prixNetVendeurMandat')
  const mRemunerationType = getMandateVal(property, 'typeRemuneration')
  const mMontantRemuneration = getMandateVal(property, 'montantRemuneration')
  const mConditionPaiement = getMandateVal(property, 'conditionPaiement')
  const mFraisMiseEnLocation = getMandateVal(property, 'fraisMiseEnLocation')
  const mFraisEtatDesLieux = getMandateVal(property, 'fraisEtatDesLieux')
  const mFraisRenouvellement = getMandateVal(property, 'fraisRenouvellementBail')

  const hasMandateInfo = mNumero || mStatut || mDateDebut || mDateExpiration || mTypeMandat ||
    mClauseProtection || mConjoint || mSociete || mAgentDesigne || mDateSignature ||
    mHonorairesType || mMontantHonoraires || mCommissionCo || mPrixNet ||
    mRemunerationType || mMontantRemuneration || mConditionPaiement ||
    mFraisMiseEnLocation || mFraisEtatDesLieux || mFraisRenouvellement ||
    legacyMandateRemuneration

  const mandateBoxCls = staged
    ? dark
      ? 'border-white/[0.06] bg-white/[0.02]'
      : 'border-teal-900/[0.07] bg-white/60'
    : 'border-border'

  const ownerFields: React.ReactNode[] = []

  if (ownerType === 'societe') {
    if (companyName) ownerFields.push(<OwnerField staged={staged} dark={dark} key="companyName" label="Dénomination sociale" value={companyName} icon={ Briefcase } hue={STAGE_HUES.amber} highlight />)
    if (legalForm) ownerFields.push(<OwnerField staged={staged} dark={dark} key="legalForm" label="Forme sociale" value={legalForm} icon={ FileText } hue={STAGE_HUES.sky} />)
    if (siren) ownerFields.push(<OwnerField staged={staged} dark={dark} key="siren" label="N° Siren" value={siren} icon={ Hash } hue={STAGE_HUES.violet} />)
    if (companyAddress) ownerFields.push(<OwnerField staged={staged} dark={dark} key="companyAddress" label="Adresse" value={companyAddress} icon={ MapPin } hue={STAGE_HUES.sky} />)
  } else {
    if (ownerName) ownerFields.push(<OwnerField staged={staged} dark={dark} key="name" label="Nom complet" value={<PermissionValue allowed={canSeeName && canSeeCoords}>{ownerName}</PermissionValue>} icon={ User } hue={STAGE_HUES.violet} highlight />)
    if (civilite) ownerFields.push(<OwnerField staged={staged} dark={dark} key="civilite" label="Civilité" value={civilite} icon={ User } hue={STAGE_HUES.violet} />)
    if (profession) ownerFields.push(<OwnerField staged={staged} dark={dark} key="profession" label="Profession" value={profession} icon={ Briefcase } hue={STAGE_HUES.amber} />)
    if (address) ownerFields.push(<OwnerField staged={staged} dark={dark} key="address" label="Adresse" value={address} icon={ MapPin } hue={STAGE_HUES.sky} />)
  }

  if (phone) ownerFields.push(<OwnerField staged={staged} dark={dark} key="phone" label="Téléphone" value={<ConfidentialValue>{phone}</ConfidentialValue>} icon={ Phone } hue={STAGE_HUES.sky} />)
  if (email) ownerFields.push(<OwnerField staged={staged} dark={dark} key="email" label="Email" value={<ConfidentialValue>{email}</ConfidentialValue>} icon={ Mail } hue={STAGE_HUES.fuchsia} />)

  if (origin) ownerFields.push(<OwnerField staged={staged} dark={dark} key="origin" label="Origine" value={origin} icon={ FileText } hue={STAGE_HUES.sky} />)
  if (saleMotivation) ownerFields.push(<OwnerField staged={staged} dark={dark} key="saleInfo" label="Motif de vente/location" value={saleMotivation} icon={ DollarSign } hue={STAGE_HUES.emerald} />)
  if (purchaseDate) ownerFields.push(<OwnerField staged={staged} dark={dark} key="purchaseDate" label="Date d'achat" value={purchaseDate ? formatDate(purchaseDate) : ''} icon={ Calendar } hue={STAGE_HUES.fuchsia} />)
  if (listingDuration) ownerFields.push(<OwnerField staged={staged} dark={dark} key="listingDuration" label="Durée de mise en vente/location" value={listingDuration} icon={ Calendar } hue={STAGE_HUES.fuchsia} />)
  if (otherProperties && otherPropertiesDescription) ownerFields.push(
    <OwnerField staged={staged} dark={dark} key="otherProperties" label="Autres biens" value={otherPropertiesDescription} icon={ Briefcase } hue={STAGE_HUES.amber} />
  )

  if (ownerFields.length === 0 && !hasMandateInfo) {
    return (
      <p className={`py-8 text-center ${staged ? (dark ? 'text-slate-500' : 'text-teal-900/40') : 'text-text-secondary'}`}>
        Aucune information propriétaire supplémentaire
      </p>
    )
  }

  const mandateBody = (
    <>
          <div className={`rounded-xl border p-3 space-y-3 ${mandateBoxCls}`}>
            <SectionHeading isGerant={isGerant}>1. Informations générales</SectionHeading>
            <div className="space-y-2">
              {mNumero && <OwnerField staged={staged} dark={dark} label="Numéro de mandat" value={mNumero} icon={ Hash } hue={STAGE_HUES.violet} />}
              {mStatut && <OwnerField staged={staged} dark={dark} label="Statut" value={STATUT_LABELS[mStatut] || mStatut} icon={ FileText } hue={STAGE_HUES.sky} />}
              {mDateDebut && <OwnerField staged={staged} dark={dark} label="Date de début" value={formatDate(mDateDebut)} icon={ Calendar } hue={STAGE_HUES.fuchsia} />}
              {mDateExpiration && <OwnerField staged={staged} dark={dark} label="Date d'expiration" value={formatDate(mDateExpiration)} icon={ Calendar } hue={STAGE_HUES.fuchsia} />}
            </div>
          </div>

          {(mTypeMandat || mClauseProtection || mConjoint || mSociete || mAgentDesigne) && (
            <div className={`rounded-xl border p-3 space-y-4 ${mandateBoxCls}`}>
              <div className="space-y-3">
                <SectionHeading isGerant={isGerant}>2. Type de mandat</SectionHeading>
                <div className="space-y-2">
                  {mTypeMandat && (
                    <OwnerField staged={staged} dark={dark}
                      label="Type de mandat"
                      value={isVente ? (TYPE_MANDAT_VENTE_LABELS[mTypeMandat] || mTypeMandat) : (TYPE_MANDAT_BAILLEUR_LABELS[mTypeMandat] || mTypeMandat)}
                      icon={FileText}
                      hue={STAGE_HUES.sky}
                    />
                  )}
                </div>
              </div>

              {mClauseProtection && (
                <div className="space-y-3">
                  <SectionHeading isGerant={isGerant}>3. Clause de protection</SectionHeading>
                  <div className="space-y-2">
                    <OwnerField staged={staged} dark={dark}
                      label="Clause de protection"
                      value={mClauseProtectionMois ? `Active (${mClauseProtectionMois} mois)` : 'Active'}
                      icon={Shield}
                      hue={STAGE_HUES.emerald}
                    />
                  </div>
                </div>
              )}

              {(mConjoint || mSociete || mAgentDesigne) && (
                <div className="space-y-3">
                  <SectionHeading isGerant={isGerant}>4. Parties au contrat</SectionHeading>
                  <div className="space-y-2">
                    {mConjoint && <OwnerField staged={staged} dark={dark} label="Conjoint" value={mConjoint} icon={ Users } hue={STAGE_HUES.emerald} />}
                    {!isVente && mSociete && <OwnerField staged={staged} dark={dark} label="Société (SCI)" value={mSociete} icon={ Briefcase } hue={STAGE_HUES.amber} />}
                    {mAgentDesigne && <OwnerField staged={staged} dark={dark} label="Agent désigné" value={mAgentDesigne} icon={ User } hue={STAGE_HUES.violet} />}
                  </div>
                </div>
              )}
            </div>
          )}

          {(isVente ? (mHonorairesType || mMontantHonoraires || mCommissionCo || mPrixNet) : (mRemunerationType || mMontantRemuneration || mConditionPaiement || mFraisMiseEnLocation || mFraisEtatDesLieux || mFraisRenouvellement || legacyMandateRemuneration)) && (
            <div className={`rounded-xl border p-3 space-y-3 ${mandateBoxCls}`}>
              <SectionHeading isGerant={isGerant}>{isVente ? '5. Informations financières' : "5. Rémunération de l'agence"}</SectionHeading>
              <div className="space-y-2">
                {isVente ? (
                  <>
                    {mPrixNet && <OwnerField staged={staged} dark={dark} label="Prix net vendeur" value={`${Number(mPrixNet).toLocaleString('fr-FR')} €`} icon={ DollarSign } hue={STAGE_HUES.emerald} />}
                    {mHonorairesType && <OwnerField staged={staged} dark={dark} label="Type d'honoraires" value={TYPE_HONORAIRES_LABELS[mHonorairesType] || mHonorairesType} icon={ FileText } hue={STAGE_HUES.sky} />}
                    {mMontantHonoraires && <OwnerField staged={staged} dark={dark} label="Montant des honoraires" value={mMontantHonoraires} icon={ DollarSign } hue={STAGE_HUES.emerald} />}
                    {mCommissionCo && <OwnerField staged={staged} dark={dark} label="Commission co-agencement" value={`${mCommissionCo} %`} icon={ DollarSign } hue={STAGE_HUES.emerald} />}
                  </>
                ) : (
                  <>
                    {mRemunerationType && <OwnerField staged={staged} dark={dark} label="Type de rémunération" value={REMUNERATION_LABELS[mRemunerationType] || mRemunerationType} icon={ FileText } hue={STAGE_HUES.sky} />}
                    {mMontantRemuneration && <OwnerField staged={staged} dark={dark} label="Montant" value={mMontantRemuneration} icon={ DollarSign } hue={STAGE_HUES.emerald} />}
                    {mConditionPaiement && <OwnerField staged={staged} dark={dark} label="Condition de paiement" value={CONDITION_PAIEMENT_LABELS[mConditionPaiement] || mConditionPaiement} icon={ FileText } hue={STAGE_HUES.sky} />}
                    {mFraisMiseEnLocation && <OwnerField staged={staged} dark={dark} label="Frais de mise en location" value={`${Number(mFraisMiseEnLocation).toLocaleString('fr-FR')} €`} icon={ DollarSign } hue={STAGE_HUES.emerald} />}
                    {mFraisEtatDesLieux && <OwnerField staged={staged} dark={dark} label="Frais d'état des lieux" value={`${Number(mFraisEtatDesLieux).toLocaleString('fr-FR')} €`} icon={ DollarSign } hue={STAGE_HUES.emerald} />}
                    {mFraisRenouvellement && <OwnerField staged={staged} dark={dark} label="Frais de renouvellement de bail" value={`${Number(mFraisRenouvellement).toLocaleString('fr-FR')} €`} icon={ DollarSign } hue={STAGE_HUES.emerald} />}
                    {legacyMandateRemuneration && <OwnerField staged={staged} dark={dark} label="Rémunération / Honoraires" value={<ConfidentialValue>{`${legacyMandateRemuneration} %`}</ConfidentialValue>} icon={ DollarSign } hue={STAGE_HUES.emerald} />}
                  </>
                )}
              </div>
            </div>
          )}

          {isSeasonal && (property.seasonalPriceMin || property.seasonalPriceMax) && (
            <div className={`rounded-xl border p-3 space-y-3 ${mandateBoxCls}`}>
              <SectionHeading isGerant={isGerant}>6. Tarification</SectionHeading>
              <div className="space-y-2">
                {property.seasonalPriceMin && property.seasonalPriceMax && (
                  <OwnerField staged={staged} dark={dark} label="Prix par nuit" value={`${Number(property.seasonalPriceMin).toLocaleString('fr-FR')} ~ ${Number(property.seasonalPriceMax).toLocaleString('fr-FR')} ${property.devise || 'MAD'}`} icon={ DollarSign } hue={STAGE_HUES.emerald} />
                )}
                {property.seasonalPriceWeek && <OwnerField staged={staged} dark={dark} label="Prix semaine" value={`${Number(property.seasonalPriceWeek).toLocaleString('fr-FR')} ${property.devise || 'MAD'}`} icon={ DollarSign } hue={STAGE_HUES.emerald} />}
                {property.seasonalPriceMonth && <OwnerField staged={staged} dark={dark} label="Prix mois" value={`${Number(property.seasonalPriceMonth).toLocaleString('fr-FR')} ${property.devise || 'MAD'}`} icon={ DollarSign } hue={STAGE_HUES.emerald} />}
              </div>
            </div>
          )}

          {mDateSignature && (
            <div className={`rounded-xl border p-3 space-y-3 ${mandateBoxCls}`}>
              <SectionHeading isGerant={isGerant}>7. Signature</SectionHeading>
              <div className="space-y-2">
                {mDateSignature && <OwnerField staged={staged} dark={dark} label="Date de signature" value={formatDate(mDateSignature)} icon={ Calendar } hue={STAGE_HUES.fuchsia} />}
              </div>
            </div>
          )}
    </>
  );

  return (
    <PermissionLocked allowed={canSeeCoords} label="Coordonnées propriétaire masquées">
      <div className="space-y-5">
        {ownerFields.length > 0 && (staged ? (
          <StagePanel
            title="Détails propriétaire"
            icon={User}
            hue={STAGE_HUES.violet}
            badge={
              <span
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{
                  color: STAGE_HUES.violet.a,
                  borderColor: `${STAGE_HUES.violet.a}40`,
                  backgroundColor: `${STAGE_HUES.violet.a}10`,
                }}
              >
                {ownerType === 'societe' ? 'Société' : 'Particulier'}
              </span>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{ownerFields}</div>
          </StagePanel>
        ) : (
          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              Détails propriétaire
              <Badge variant="secondary" size="sm">{ownerType === 'societe' ? 'Société' : 'Particulier'}</Badge>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{ownerFields}</div>
          </Card>
        ))}

        {hasMandateInfo && (staged ? (
          <StagePanel
            title={isSeasonal ? 'Contrat de location saisonnière' : isVente ? 'Mandat de vente' : 'Mandat de gestion locative'}
            icon={FileText}
            hue={STAGE_HUES.fuchsia}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            </div>
          </StagePanel>
        ) : (
          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
              {isSeasonal ? 'Contrat de location saisonni\u00e8re' : isVente ? 'Mandat de vente' : 'Mandat de gestion locative'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{mandateBody}</div>
          </Card>
        ))}
      </div>
    </PermissionLocked>
  )
}
