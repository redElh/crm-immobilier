import Card from '../../ui/Card'
import { Badge } from '../../ui/Badge'
import { InfoField } from '../../ui/InfoField'
import { User, Briefcase, FileText, DollarSign, Calendar, MapPin, Phone, Mail, Hash, CheckSquare, Users, Shield, Download, Image } from 'react-feather'
import { ConfidentialValue } from '../confidentiality/ConfidentialField'
import { PermissionLocked, PermissionValue } from '../confidentiality/PermissionLocked'
import { usePermission } from '../../../hooks/usePermission'

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
  return (
    <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
      <div className={`w-0.5 h-4 rounded-full ${isGerant ? 'bg-[#905D5D]/60' : 'bg-accent/60'}`} />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{children}</h3>
    </div>
  )
}

export default function PropertyOwnerDetail({ property, isGerant = false }: { property: any; isGerant?: boolean }) {
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

  const ownerFields: React.ReactNode[] = []

  if (ownerType === 'societe') {
    if (companyName) ownerFields.push(<InfoField key="companyName" label="Dénomination sociale" value={companyName} icon={<Briefcase size={14} />} highlight />)
    if (legalForm) ownerFields.push(<InfoField key="legalForm" label="Forme sociale" value={legalForm} icon={<FileText size={14} />} />)
    if (siren) ownerFields.push(<InfoField key="siren" label="N° Siren" value={siren} icon={<Hash size={14} />} />)
    if (companyAddress) ownerFields.push(<InfoField key="companyAddress" label="Adresse" value={companyAddress} icon={<MapPin size={14} />} />)
  } else {
    if (ownerName) ownerFields.push(<InfoField key="name" label="Nom complet" value={<PermissionValue allowed={canSeeName && canSeeCoords}>{ownerName}</PermissionValue>} icon={<User size={14} />} highlight />)
    if (civilite) ownerFields.push(<InfoField key="civilite" label="Civilité" value={civilite} icon={<User size={14} />} />)
    if (profession) ownerFields.push(<InfoField key="profession" label="Profession" value={profession} icon={<Briefcase size={14} />} />)
    if (address) ownerFields.push(<InfoField key="address" label="Adresse" value={address} icon={<MapPin size={14} />} />)
  }

  if (phone) ownerFields.push(<InfoField key="phone" label="Téléphone" value={<ConfidentialValue>{phone}</ConfidentialValue>} icon={<Phone size={14} />} />)
  if (email) ownerFields.push(<InfoField key="email" label="Email" value={<ConfidentialValue>{email}</ConfidentialValue>} icon={<Mail size={14} />} />)

  if (origin) ownerFields.push(<InfoField key="origin" label="Origine" value={origin} icon={<FileText size={14} />} />)
  if (saleMotivation) ownerFields.push(<InfoField key="saleInfo" label="Motif de vente/location" value={saleMotivation} icon={<DollarSign size={14} />} />)
  if (purchaseDate) ownerFields.push(<InfoField key="purchaseDate" label="Date d'achat" value={purchaseDate ? formatDate(purchaseDate) : ''} icon={<Calendar size={14} />} />)
  if (listingDuration) ownerFields.push(<InfoField key="listingDuration" label="Durée de mise en vente/location" value={listingDuration} icon={<Calendar size={14} />} />)
  if (otherProperties && otherPropertiesDescription) ownerFields.push(
    <InfoField key="otherProperties" label="Autres biens" value={otherPropertiesDescription} icon={<Briefcase size={14} />} />
  )

  if (ownerFields.length === 0 && !hasMandateInfo) {
    return <p className="text-center text-text-secondary py-8">Aucune information propriétaire supplémentaire</p>
  }

  return (
    <PermissionLocked allowed={canSeeCoords} label="Coordonnées propriétaire masquées">
      <div className="space-y-5">
        {ownerFields.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            Détails propriétaire
            <Badge variant="secondary" size="sm">{ownerType === 'societe' ? 'Société' : 'Particulier'}</Badge>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{ownerFields}</div>
        </Card>
      )}

      {hasMandateInfo && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
            {isSeasonal ? 'Contrat de location saisonnière' : isVente ? 'Mandat de vente' : 'Mandat de gestion locative'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-border rounded-lg p-3 space-y-3">
              <SectionHeading isGerant={isGerant}>1. Informations générales</SectionHeading>
              <div className="space-y-2">
                {mNumero && <InfoField label="Numéro de mandat" value={mNumero} icon={<Hash size={14} />} />}
                {mStatut && <InfoField label="Statut" value={STATUT_LABELS[mStatut] || mStatut} icon={<FileText size={14} />} />}
                {mDateDebut && <InfoField label="Date de début" value={formatDate(mDateDebut)} icon={<Calendar size={14} />} />}
                {mDateExpiration && <InfoField label="Date d'expiration" value={formatDate(mDateExpiration)} icon={<Calendar size={14} />} />}
              </div>
            </div>

            {(mTypeMandat || mClauseProtection || mConjoint || mSociete || mAgentDesigne) && (
              <div className="border border-border rounded-lg p-3 space-y-4">
                <div className="space-y-3">
                  <SectionHeading isGerant={isGerant}>2. Type de mandat</SectionHeading>
                  <div className="space-y-2">
                    {mTypeMandat && (
                      <InfoField
                        label="Type de mandat"
                        value={isVente ? (TYPE_MANDAT_VENTE_LABELS[mTypeMandat] || mTypeMandat) : (TYPE_MANDAT_BAILLEUR_LABELS[mTypeMandat] || mTypeMandat)}
                        icon={<FileText size={14} />}
                      />
                    )}
                  </div>
                </div>

                {mClauseProtection && (
                  <div className="space-y-3">
                    <SectionHeading isGerant={isGerant}>3. Clause de protection</SectionHeading>
                    <div className="space-y-2">
                      <InfoField
                        label="Clause de protection"
                        value={mClauseProtectionMois ? `Active (${mClauseProtectionMois} mois)` : 'Active'}
                        icon={<Shield size={14} />}
                      />
                    </div>
                  </div>
                )}

                {(mConjoint || mSociete || mAgentDesigne) && (
                  <div className="space-y-3">
                    <SectionHeading isGerant={isGerant}>4. Parties au contrat</SectionHeading>
                    <div className="space-y-2">
                      {mConjoint && <InfoField label="Conjoint" value={mConjoint} icon={<Users size={14} />} />}
                      {!isVente && mSociete && <InfoField label="Société (SCI)" value={mSociete} icon={<Briefcase size={14} />} />}
                      {mAgentDesigne && <InfoField label="Agent désigné" value={mAgentDesigne} icon={<User size={14} />} />}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(isVente ? (mHonorairesType || mMontantHonoraires || mCommissionCo || mPrixNet) : (mRemunerationType || mMontantRemuneration || mConditionPaiement || mFraisMiseEnLocation || mFraisEtatDesLieux || mFraisRenouvellement || legacyMandateRemuneration)) && (
              <div className="border border-border rounded-lg p-3 space-y-3">
                <SectionHeading isGerant={isGerant}>{isVente ? '5. Informations financières' : "5. Rémunération de l'agence"}</SectionHeading>
                <div className="space-y-2">
                  {isVente ? (
                    <>
                      {mPrixNet && <InfoField label="Prix net vendeur" value={`${Number(mPrixNet).toLocaleString('fr-FR')} €`} icon={<DollarSign size={14} />} />}
                      {mHonorairesType && <InfoField label="Type d'honoraires" value={TYPE_HONORAIRES_LABELS[mHonorairesType] || mHonorairesType} icon={<FileText size={14} />} />}
                      {mMontantHonoraires && <InfoField label="Montant des honoraires" value={mMontantHonoraires} icon={<DollarSign size={14} />} />}
                      {mCommissionCo && <InfoField label="Commission co-agencement" value={`${mCommissionCo} %`} icon={<DollarSign size={14} />} />}
                    </>
                  ) : (
                    <>
                      {mRemunerationType && <InfoField label="Type de rémunération" value={REMUNERATION_LABELS[mRemunerationType] || mRemunerationType} icon={<FileText size={14} />} />}
                      {mMontantRemuneration && <InfoField label="Montant" value={mMontantRemuneration} icon={<DollarSign size={14} />} />}
                      {mConditionPaiement && <InfoField label="Condition de paiement" value={CONDITION_PAIEMENT_LABELS[mConditionPaiement] || mConditionPaiement} icon={<FileText size={14} />} />}
                      {mFraisMiseEnLocation && <InfoField label="Frais de mise en location" value={`${Number(mFraisMiseEnLocation).toLocaleString('fr-FR')} €`} icon={<DollarSign size={14} />} />}
                      {mFraisEtatDesLieux && <InfoField label="Frais d'état des lieux" value={`${Number(mFraisEtatDesLieux).toLocaleString('fr-FR')} €`} icon={<DollarSign size={14} />} />}
                      {mFraisRenouvellement && <InfoField label="Frais de renouvellement de bail" value={`${Number(mFraisRenouvellement).toLocaleString('fr-FR')} €`} icon={<DollarSign size={14} />} />}
                      {legacyMandateRemuneration && <InfoField label="Rémunération / Honoraires" value={<ConfidentialValue>{`${legacyMandateRemuneration} %`}</ConfidentialValue>} icon={<DollarSign size={14} />} />}
                    </>
                  )}
                </div>
              </div>
            )}

            {isSeasonal && (property.seasonalPriceMin || property.seasonalPriceMax) && (
              <div className="border border-border rounded-lg p-3 space-y-3">
                <SectionHeading isGerant={isGerant}>6. Tarification</SectionHeading>
                <div className="space-y-2">
                  {property.seasonalPriceMin && property.seasonalPriceMax && (
                    <InfoField label="Prix par nuit" value={`${Number(property.seasonalPriceMin).toLocaleString('fr-FR')} ~ ${Number(property.seasonalPriceMax).toLocaleString('fr-FR')} ${property.devise || 'MAD'}`} icon={<DollarSign size={14} />} />
                  )}
                  {property.seasonalPriceWeek && <InfoField label="Prix semaine" value={`${Number(property.seasonalPriceWeek).toLocaleString('fr-FR')} ${property.devise || 'MAD'}`} icon={<DollarSign size={14} />} />}
                  {property.seasonalPriceMonth && <InfoField label="Prix mois" value={`${Number(property.seasonalPriceMonth).toLocaleString('fr-FR')} ${property.devise || 'MAD'}`} icon={<DollarSign size={14} />} />}
                </div>
              </div>
            )}

            {mDateSignature && (
              <div className="border border-border rounded-lg p-3 space-y-3">
                <SectionHeading isGerant={isGerant}>7. Signature</SectionHeading>
                <div className="space-y-2">
                  {mDateSignature && <InfoField label="Date de signature" value={formatDate(mDateSignature)} icon={<Calendar size={14} />} />}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
      </div>
    </PermissionLocked>
  )
}