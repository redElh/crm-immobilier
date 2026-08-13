import { useEffect, useState, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { api } from '../../../../services/api';

const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const STATUT_MANDAT_OPTIONS = [
  { value: 'Non défini', label: 'Non défini' },
  { value: 'En attente de signature', label: 'En attente de signature' },
  { value: 'Actif', label: 'Actif' },
  { value: 'Expire', label: 'Expiré' },
  { value: 'Resilie', label: 'Résilié' },
  { value: 'Termine', label: 'Terminé' },
];

const TYPE_MANDAT_VENTE = [
  { value: 'Simple', label: 'Simple' },
  { value: 'Co-exclusif', label: 'Co-exclusif' },
  { value: 'Exclusif', label: 'Exclusif' },
  { value: 'Exclusif agence', label: 'Exclusif agence' },
  { value: 'Delegation', label: 'Délégation' },
  { value: 'Confrere', label: 'Confrère' },
];

const TYPE_MANDAT_BAILLEUR = [
  { value: 'Gestion', label: 'Gestion (location)' },
  { value: 'Location', label: 'Location (recherche locataire)' },
  { value: 'Co-gestion', label: 'Co-gestion' },
];

const REMUNERATION_TYPE_OPTIONS = [
  { value: 'Frais de gestion mensuels', label: 'Frais de gestion mensuels' },
  { value: 'Commission sur loyer', label: 'Commission sur loyer' },
  { value: 'Forfait annuel', label: 'Forfait annuel' },
];

const CONDITION_PAIEMENT_OPTIONS = [
  { value: 'Preleve sur loyer', label: 'Prélevé sur loyer' },
  { value: 'Facture annuellement', label: 'Facturé annuellement' },
];

const TYPE_HONORAIRES_MANDAT = [
  { value: 'inclus', label: 'Inclus dans le prix' },
  { value: 'en_sus', label: 'En sus du prix' },
];

const DOCUMENTS_VENTE = [
  { label: "Pièce d'identité du vendeur", required: true },
  { label: 'Titre de propriété', required: true },
  { label: 'Diagnostic technique (DPE)', required: true },
  { label: 'Règlement de copropriété', required: false },
  { label: 'Mandat signé (PDF)', required: true },
  { label: 'Autre document', required: false },
];

const DOCUMENTS_BAILLEUR = [
  { label: "Pièce d'identité du bailleur", required: true },
  { label: 'Titre de propriété', required: true },
  { label: 'Diagnostic technique (DPE)', required: true },
  { label: 'Règlement de copropriété', required: false },
  { label: 'Mandat de gestion signé (PDF)', required: true },
  { label: "Attestation d'assurance propriétaire non-occupant", required: false },
  { label: 'État des lieux (entrant)', required: false },
  { label: 'Autre document', required: false },
];

function SectionHeading({ children, isGerant = false }: { children: React.ReactNode; isGerant?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-0.5 h-4 rounded-full ${isGerant ? 'bg-[#905D5D]/60' : 'bg-accent/60'}`} />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{children}</h3>
    </div>
  );
}

function DocRow({ label, required, isGerant = false }: { label: string; required: boolean; isGerant?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
      <span className="text-sm text-text flex-1">{label}</span>
      {required ? (
        <span className="text-xs px-2 py-0.5 rounded bg-error/10 text-error font-medium">Obligatoire</span>
      ) : (
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>Recommandé</span>
      )}
      <button type="button" className={`text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-text-secondary transition-all ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'}`}>
        Parcourir...
      </button>
    </div>
  );
}

const USER_CACHE: Record<string, string> = {};

interface MandateTabProps {
  register: any;
  control: any;
  watch: any;
  setValue: any;
  propertyType: string;
  adminId?: string;
  agentId?: string;
  editId?: string | null;
  assignedTo?: string | null;
  assignedType?: string | null;
  isGerant?: boolean;
}

export function MandateTab({ register, control, watch, setValue, propertyType, adminId, agentId, editId, assignedTo, assignedType, isGerant = false }: MandateTabProps) {
  const transactionType = watch('transactionType');
  const isVente = transactionType === 'vente' || !transactionType;
  const clauseProtection = watch('mandate.clauseProtection');
  const formAgentId = watch('agentId');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  const isAdmin = !!adminId;
  const isAgent = !!agentId;
  const isEditing = !!editId;
  const adminAssignToAgent = isAdmin && assignedTo && assignedType === 'agent';
  const adminSelf = isAdmin && !assignedTo;

  useEffect(() => {
    api.get<any>('/auth/me').then((u: any) => {
      if (u) {
        setCurrentUser(u);
        const name = [u.first_name || '', u.last_name || ''].filter(Boolean).join(' ').trim() || u.email || 'Inconnu';
        USER_CACHE[String(u.id)] = name;
      }
    }).catch(() => {});

    if (adminId) {
      api.get<any[]>('/admin/users').then((list: any[]) => {
        if (Array.isArray(list)) {
          setUsers(list);
          for (const u of list) {
            const name = [u.first_name || '', u.last_name || ''].filter(Boolean).join(' ').trim() || u.email || 'Inconnu';
            USER_CACHE[String(u.id)] = name;
          }
        }
      }).catch(() => {});
    }
  }, [adminId]);

  const honorairesType = watch('honorairesType');
  const honorairesPct = watch('honorairesPct');
  const mandateNumero = watch('mandate.numeroMandat');
  const mandateType = watch('mandate.typeMandat');
  const mandateDateDebut = watch('mandate.dateDebut');
  const mandateDateExpiration = watch('mandate.dateExpiration');
  const clauseProtectionMois = watch('mandate.clauseProtectionMois');
  const conjoint = watch('mandate.conjoint');
  const societe = watch('mandate.societe');
  const typeHonorairesMandat = watch('mandate.typeHonorairesMandat');
  const montantHonoraires = watch('mandate.montantHonoraires');
  const commissionCoAgencement = watch('mandate.commissionCoAgencementMandat');
  const typeRemuneration = watch('mandate.typeRemuneration');
  const montantRemuneration = watch('mandate.montantRemuneration');
  const conditionPaiement = watch('mandate.conditionPaiement');
  const fraisMiseEnLocation = watch('mandate.fraisMiseEnLocation');
  const fraisEtatDesLieux = watch('mandate.fraisEtatDesLieux');
  const fraisRenouvellementBail = watch('mandate.fraisRenouvellementBail');

  function isSectionComplete() {
    // 1. Informations générales
    if (!mandateNumero?.trim() || !mandateDateDebut?.trim() || !mandateDateExpiration?.trim()) return false;
    // 2. Type de mandat
    if (!mandateType?.trim()) return false;
    // 3. Clause de protection
    if (clauseProtection && !clauseProtectionMois?.toString().trim()) return false;
    // 4. Parties au contrat
    if (!conjoint?.trim()) return false;
    // 5. Informations financières / Rémunération
    if (isVente) {
      if (!typeHonorairesMandat?.trim() || !montantHonoraires?.toString().trim() || !commissionCoAgencement?.toString().trim()) return false;
    } else {
      if (!typeRemuneration?.trim() || !montantRemuneration?.toString().trim() || !conditionPaiement?.trim()) return false;
      if (!fraisMiseEnLocation?.toString().trim() || !fraisEtatDesLieux?.toString().trim() || !fraisRenouvellementBail?.toString().trim()) return false;
    }
    return true;
  }

  useEffect(() => {
    if (honorairesType) {
      setValue('mandate.typeHonorairesMandat', honorairesType);
    }
  }, [honorairesType, setValue]);

  useEffect(() => {
    if (honorairesPct !== undefined && honorairesPct !== '') {
      setValue('mandate.montantHonoraires', honorairesPct);
    }
  }, [honorairesPct, setValue]);

  useEffect(() => {
    const newStatus = isSectionComplete() ? 'En attente de signature' : 'Non défini';
    setValue('mandate.statutMandat', newStatus);
  }, [
    mandateNumero, mandateType, mandateDateDebut, mandateDateExpiration,
    clauseProtection, clauseProtectionMois,
    conjoint,
    typeHonorairesMandat, montantHonoraires, commissionCoAgencement,
    typeRemuneration, montantRemuneration, conditionPaiement,
    fraisMiseEnLocation, fraisEtatDesLieux, fraisRenouvellementBail,
    isVente, setValue,
  ]);

  const userLabel = useMemo(() => {
    const id = isEditing ? formAgentId : adminAssignToAgent ? '' : adminSelf ? adminId : agentId;
    return id ? (USER_CACHE[id] || id) : '';
  }, [isEditing, formAgentId, adminAssignToAgent, adminSelf, adminId, agentId, users, currentUser]);

  function generateMandatNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return isVente ? `MV-${year}-${random}` : `MG-${year}-${random}`;
  }

  const defaultMandatNumber = generateMandatNumber();

  function renderAssignedField() {
    if (isEditing) {
      return <Input label="Assigné à" value={userLabel} disabled />;
    }
    if (adminAssignToAgent) {
      return (
        <Controller
          name="mandate.agentDesigne"
          control={control}
          render={({ field }) => (
            <Select
              label="Agent désigné"
              options={[
                { value: '', label: 'Sélectionner un agent...' },
                ...users.filter(u => u.role === 'agent').map(u => ({
                  value: String(u.id),
                  label: [u.first_name || '', u.last_name || ''].filter(Boolean).join(' ').trim() || u.email || 'Inconnu',
                })),
              ]}
              value={field.value || ''}
              onValueChange={field.onChange}
            />
          )}
        />
      );
    }
    if (adminSelf) {
      return <Input label="Agent désigné" value={userLabel} disabled />;
    }
    return <Input label="Agent désigné" value={userLabel} disabled />;
  }

  return (
    <MotionCard initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="p-0 overflow-hidden">
      <Accordion type="multiple" defaultValue={['mandate']} className="space-y-0">
        <AccordionItem value="mandate" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
              <span className="font-medium text-text">Mandat</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="flex items-center gap-2 mb-5">
              <span className={`w-1 h-6 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
              <h2 className="text-base font-semibold text-text">
                {isVente ? 'MANDAT DE VENTE' : 'MANDAT DE GESTION LOCATIVE'}
              </h2>
            </div>

            <motion.div variants={item} initial="hidden" animate="show" className="space-y-6">
              {/* 1. INFORMATIONS GÉNÉRALES */}
              <div>
                <SectionHeading isGerant={isGerant}>1. Informations générales du mandat</SectionHeading>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Numéro de mandat"
                    defaultValue={defaultMandatNumber}
                    placeholder={isVente ? 'MV-2026-001' : 'MG-2026-001'}
                    {...register('mandate.numeroMandat')}
                  />
                  <Controller
                    name="mandate.statutMandat"
                    control={control}
                    render={({ field }) => (
                      <Select label="Statut du mandat" options={STATUT_MANDAT_OPTIONS} value={field.value || ''} onValueChange={field.onChange} disabled />
                    )}
                  />
                  <Controller
                    name="mandate.dateDebut"
                    control={control}
                    render={({ field }) => (
                      <DatePicker label="Date de début" value={field.value} onChange={(e: any) => field.onChange(e.target?.value || e)} onBlur={field.onBlur} />
                    )}
                  />
                  <Controller
                    name="mandate.dateExpiration"
                    control={control}
                    render={({ field }) => (
                      <DatePicker label="Date d'expiration" value={field.value} onChange={(e: any) => field.onChange(e.target?.value || e)} onBlur={field.onBlur} />
                    )}
                  />
                </div>
              </div>

              {/* 2. TYPE DE MANDAT */}
              <div>
                <SectionHeading isGerant={isGerant}>2. Type de mandat</SectionHeading>
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                  <Controller
                    name="mandate.typeMandat"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Type de mandat"
                        options={isVente ? TYPE_MANDAT_VENTE : TYPE_MANDAT_BAILLEUR}
                        value={field.value || ''}
                        onValueChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>

              {/* 3. CLAUSE DE PROTECTION */}
              <div>
                <SectionHeading isGerant={isGerant}>3. Clause de protection</SectionHeading>
                <div className="space-y-3">
                  <Controller
                    name="mandate.clauseProtection"
                    control={control}
                    render={({ field }) => (
                      <Checkbox label="Activer la clause de protection" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                    )}
                  />
                  {clauseProtection && (
                    <Input
                      label="Nombre de mois de protection"
                      type="number"
                      min={1}
                      max={24}
                      placeholder="3"
                      className="max-w-xs"
                      {...register('mandate.clauseProtectionMois')}
                    />
                  )}
                  <p className="text-xs text-text-secondary/70">
                    {isVente
                      ? "Si l'acquéreur visitant pendant le mandat achète après expiration, l'agence conserve droit à commission."
                      : "Si le bailleur trouve un locataire par lui-même après expiration, l'agence n'a pas droit à commission."}
                  </p>
                </div>
              </div>

              {/* 4. PARTIES AU CONTRAT */}
              <div>
                <SectionHeading isGerant={isGerant}>4. Parties au contrat</SectionHeading>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isVente ? 'Vendeur(s)' : 'Bailleur(s)'}
                    value=""
                    placeholder="Pré-rempli depuis le contact"
                    disabled
                  />
                  <Input label="Conjoint" placeholder="Nom du conjoint" {...register('mandate.conjoint')} />
                  {!isVente && (
                    <Input label="Société (si SCI)" placeholder="Raison sociale" {...register('mandate.societe')} />
                  )}
                  {renderAssignedField()}
                </div>
              </div>

              {/* 5. INFORMATIONS FINANCIÈRES / RÉMUNÉRATION */}
              <div>
                <SectionHeading isGerant={isGerant}>
                  {isVente ? '5. Informations financières' : "5. Rémunération de l'agence"}
                </SectionHeading>
                {isVente ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Prix net vendeur"
                      type="number"
                      placeholder="Défini dans l'onglet Prix"
                      disabled
                      {...register('mandate.prixNetVendeurMandat')}
                    />
                    <Controller
                      name="mandate.typeHonorairesMandat"
                      control={control}
                      render={({ field }) => (
                        <Select label="Type d'honoraires" options={TYPE_HONORAIRES_MANDAT} value={field.value || ''} onValueChange={field.onChange} disabled />
                      )}
                    />
                    <Input label="Honoraires (%)" type="number" min={0} step={0.1} placeholder="5" disabled {...register('mandate.montantHonoraires')} />
                    <Input label="Commission de co-agencement" type="number" min={0} max={100} placeholder="50%" {...register('mandate.commissionCoAgencementMandat')} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      name="mandate.typeRemuneration"
                      control={control}
                      render={({ field }) => (
                        <Select label="Type de rémunération" options={REMUNERATION_TYPE_OPTIONS} value={field.value || ''} onValueChange={field.onChange} />
                      )}
                    />
                    <Input
                      label="Montant / Pourcentage"
                      type="number"
                      min={0}
                      step={0.1}
                      placeholder="Ex: 8% du loyer HC"
                      {...register('mandate.montantRemuneration')}
                    />
                    <Controller
                      name="mandate.conditionPaiement"
                      control={control}
                      render={({ field }) => (
                        <Select label="Condition de paiement" options={CONDITION_PAIEMENT_OPTIONS} value={field.value || ''} onValueChange={field.onChange} />
                      )}
                    />
                    <Input label="Frais de mise en location" type="number" min={0} placeholder="500" {...register('mandate.fraisMiseEnLocation')} />
                    <Input label="Frais d'état des lieux" type="number" min={0} placeholder="300" {...register('mandate.fraisEtatDesLieux')} />
                    <Input label="Frais de renouvellement de bail" type="number" min={0} placeholder="200" {...register('mandate.fraisRenouvellementBail')} />
                  </div>
                )}
              </div>

              {/* 6. DOCUMENTS JUSTIFICATIFS */}
              <div>
                <SectionHeading isGerant={isGerant}>6. Documents justificatifs</SectionHeading>
                <div className="space-y-3">
                  {(isVente ? DOCUMENTS_VENTE : DOCUMENTS_BAILLEUR).map((doc, i) => (
                    <DocRow key={i} label={doc.label} required={doc.required} isGerant={isGerant} />
                  ))}
                </div>
              </div>

              {/* 7. SIGNATURES */}
              <div>
                <SectionHeading isGerant={isGerant}>7. Signatures</SectionHeading>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-border bg-background/50">
                      <p className="text-sm font-medium text-text mb-2">
                        ✍️ Signature du {isVente ? 'vendeur' : 'bailleur'}
                      </p>
                      <div className="h-16 rounded border border-dashed border-text-secondary/30 flex items-center justify-center text-text-secondary text-xs">
                        Champ de signature électronique
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border border-border bg-background/50">
                      <p className="text-sm font-medium text-text mb-2">✍️ Signature de l'agent</p>
                      <div className="h-16 rounded border border-dashed border-text-secondary/30 flex items-center justify-center text-text-secondary text-xs">
                        Champ de signature électronique
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      name="mandate.dateSignatureMandat"
                      control={control}
                      render={({ field }) => (
                        <DatePicker label="Date de signature" value={field.value} onChange={(e: any) => field.onChange(e.target?.value || e)} onBlur={field.onBlur} />
                      )}
                    />
                    <div className="flex items-end">
                      <div className="flex-1 space-y-1.5">
                        <p className="text-sm font-medium text-text">Fichier du mandat signé</p>
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                          <span className="text-sm text-text-secondary flex-1">Upload PDF</span>
                          <button type="button" className={`text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-text-secondary transition-all ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'}`}>
                            Parcourir...
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}