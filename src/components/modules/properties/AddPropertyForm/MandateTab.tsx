import { useEffect, useState, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { api } from '../../../../services/api';
import { FileText, Shield, PenTool, Upload, Calendar, Check, Paperclip, Award } from 'react-feather';
import { SectionCard } from './stage';
import { useStageChrome } from '../../calendar/useStageChrome';
import { useStageTheme, STAGE_HUES } from '../../../dashboard/Stage';

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

/* ── Stage primitives ── */
function StageDocRow({ label, required, isDark }: { label: string; required: boolean; isDark: boolean }) {
  return (
    <div
      className="group flex items-center gap-3 rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-[1px] hover:shadow-lg"
      style={{
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.62)',
        boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.85), 0 8px 22px -14px rgba(13,148,136,0.22)',
      }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
        style={{
          borderColor: required ? (isDark ? 'rgba(251,113,133,0.30)' : 'rgba(251,113,133,0.22)') : isDark ? 'rgba(167,139,250,0.22)' : 'rgba(20,184,166,0.18)',
          background: required ? (isDark ? 'rgba(251,113,133,0.14)' : 'rgba(251,113,133,0.08)') : isDark ? 'rgba(167,139,250,0.10)' : 'rgba(20,184,166,0.08)',
          color: required ? (isDark ? '#FDA4AF' : '#BE123C') : isDark ? '#A78BFA' : '#0D9488',
          boxShadow: required ? (isDark ? '0 0 14px -6px rgba(251,113,133,0.5)' : '0 4px 14px -8px rgba(251,113,133,0.35)') : isDark ? '0 0 14px -8px rgba(167,139,250,0.35)' : '0 4px 14px -10px rgba(13,148,136,0.25)',
        }}
      >
        <FileText size={14} />
      </span>
      <span className={`flex-1 text-sm font-medium leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{label}</span>
      <span
        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide"
        style={{
          color: required ? (isDark ? '#FDA4AF' : '#BE123C') : isDark ? '#A78BFA' : '#0D9488',
          borderColor: required ? (isDark ? 'rgba(251,113,133,0.28)' : 'rgba(251,113,133,0.18)') : isDark ? 'rgba(167,139,250,0.24)' : 'rgba(20,184,166,0.18)',
          background: required ? (isDark ? 'rgba(251,113,133,0.10)' : 'rgba(251,113,133,0.06)') : isDark ? 'rgba(167,139,250,0.10)' : 'rgba(20,184,166,0.08)',
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: required ? (isDark ? '#FDA4AF' : '#E11D48') : isDark ? '#A78BFA' : '#14B8A6' }} />
        {required ? 'Obligatoire' : 'Recommandé'}
      </span>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-all duration-200 hover:-translate-y-px active:scale-95"
        style={{
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.10)',
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
          color: isDark ? 'rgba(226,232,240,0.85)' : 'rgba(15,23,42,0.75)',
          boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        <Paperclip size={12} />
        Parcourir...
      </button>
    </div>
  );
}

function StageSignatureCard({ title, subtitle, isDark }: { title: string; subtitle: string; isDark: boolean }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-[1px]"
      style={{
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.62)',
        boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 28px -18px rgba(0,0,0,0.45)' : 'inset 0 1px 0 rgba(255,255,255,0.85), 0 12px 28px -16px rgba(13,148,136,0.22)',
      }}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl border"
          style={{
            borderColor: isDark ? 'rgba(167,139,250,0.22)' : 'rgba(20,184,166,0.18)',
            background: isDark ? 'rgba(167,139,250,0.12)' : 'rgba(20,184,166,0.10)',
            color: isDark ? '#A78BFA' : '#0D9488',
          }}
        >
          <PenTool size={13} />
        </span>
        <div>
          <p className={`text-sm font-semibold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</p>
          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-teal-900/45'}`}>{subtitle}</p>
        </div>
        <span
          className="ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{
            color: isDark ? 'rgba(148,163,184,0.75)' : 'rgba(15,23,42,0.45)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
          }}
        >
          En attente
        </span>
      </div>
      <div
        className="flex h-[84px] items-center justify-center rounded-xl border-2 border-dashed"
        style={{
          borderColor: isDark ? 'rgba(167,139,250,0.22)' : 'rgba(20,184,166,0.22)',
          background: isDark ? 'rgba(167,139,250,0.04)' : 'rgba(20,184,166,0.04)',
        }}
      >
        <div className="text-center">
          <PenTool size={18} className="mx-auto mb-1" style={{ color: isDark ? 'rgba(167,139,250,0.55)' : 'rgba(13,148,136,0.55)' }} />
          <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Champ de signature électronique</p>
          <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-teal-900/30'}`}>Cliquer pour signer</p>
        </div>
      </div>
    </div>
  );
}

function StageFileUpload({ isDark, isGerant }: { isDark: boolean; isGerant: boolean }) {
  return (
    <div className="space-y-2">
      <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}>Fichier du mandat signé</p>
      <div
        className="group relative flex items-center gap-3 rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-[1px]"
        style={{
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.62)',
          boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.85), 0 8px 22px -14px rgba(13,148,136,0.18)',
        }}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
          style={{
            borderColor: isDark ? 'rgba(20,184,166,0.22)' : 'rgba(20,184,166,0.18)',
            background: isDark ? 'rgba(20,184,166,0.12)' : 'rgba(20,184,166,0.10)',
            color: isDark ? '#6EE7B7' : '#0D9488',
          }}
        >
          <Upload size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Upload PDF</p>
          <p className={`truncate text-xs ${isDark ? 'text-slate-400' : 'text-teal-900/45'}`}>Glissez-déposez ou parcourez · PDF jusqu’à 10 Mo</p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold backdrop-blur-md transition-all duration-200 hover:-translate-y-px active:scale-95"
          style={{
            borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.12)',
            background: isDark ? 'linear-gradient(145deg, #2DD4BF, #0D9488)' : 'linear-gradient(145deg, #2DD4BF, #0D9488)',
            color: 'white',
            boxShadow: isDark ? '0 8px 20px -10px rgba(20,184,166,0.55), inset 0 1px 0 rgba(255,255,255,0.35)' : '0 8px 20px -12px rgba(13,148,136,0.45), inset 0 1px 0 rgba(255,255,255,0.4)',
          }}
        >
          <Paperclip size={13} />
          Parcourir...
        </button>
      </div>
      <p className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-slate-500' : 'text-teal-900/35'}`}>
        <Shield size={11} />
        PDF signé, tamponné et paraphé sur chaque page
      </p>
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
  const { staged, dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = staged ? dark : theme === 'dark';

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
    if (!mandateNumero?.trim() || !mandateDateDebut?.trim() || !mandateDateExpiration?.trim()) return false;
    if (!mandateType?.trim()) return false;
    if (clauseProtection && !clauseProtectionMois?.toString().trim()) return false;
    if (!conjoint?.trim()) return false;
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
    <div className="space-y-5">
      <SectionCard value="mandate" title="Mandat" icon={FileText} subtitle={isVente ? 'Mandat de vente' : 'Mandat de gestion locative'} defaultOpen>
        <div className="flex items-center gap-2 mb-5">
          <span className={`w-1 h-6 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
          <h2 className="text-base font-semibold text-text">
            {isVente ? 'MANDAT DE VENTE' : 'MANDAT DE GESTION LOCATIVE'}
          </h2>
        </div>

        <div className="space-y-6">
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
            {staged ? (
              <div
                className="overflow-hidden rounded-2xl border"
                style={{
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
                  boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 12px 28px -18px rgba(13,148,136,0.18)',
                }}
              >
                <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}` }}>
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: isDark ? 'rgba(167,139,250,0.22)' : 'rgba(20,184,166,0.18)',
                      background: isDark ? 'rgba(167,139,250,0.12)' : 'rgba(20,184,166,0.10)',
                      color: isDark ? '#A78BFA' : '#0D9488',
                    }}
                  >
                    <Shield size={14} />
                  </span>
                  <div className="flex-1">
                    <h3 className={`text-sm font-bold tracking-[-0.1px] ${isDark ? 'text-white' : 'text-slate-900'}`}>6. Documents justificatifs</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>{isVente ? 'Vente' : 'Bailleur'} · {(isVente ? DOCUMENTS_VENTE : DOCUMENTS_BAILLEUR).length} pièces · badge Obligatoire/Recommandé</p>
                  </div>
                  <span
                    className="hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold"
                    style={{
                      color: isDark ? 'rgba(148,163,184,0.85)' : 'rgba(15,23,42,0.55)',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <Award size={11} />
                    Dossier complet requis
                  </span>
                </div>
                <div className="space-y-2.5 p-3">
                  {(isVente ? DOCUMENTS_VENTE : DOCUMENTS_BAILLEUR).map((doc, i) => (
                    <StageDocRow key={i} label={doc.label} required={doc.required} isDark={isDark} />
                  ))}
                </div>
                <div className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] ${isDark ? 'text-slate-500' : 'text-teal-900/35'}`} style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}` }}>
                  <FileText size={11} />
                  Formats acceptés : PDF, JPG, PNG · 10 Mo max par fichier
                </div>
              </div>
            ) : (
              <>
                <SectionHeading isGerant={isGerant}>6. Documents justificatifs</SectionHeading>
                <div className="space-y-3">
                  {(isVente ? DOCUMENTS_VENTE : DOCUMENTS_BAILLEUR).map((doc, i) => (
                    <DocRow key={i} label={doc.label} required={doc.required} isGerant={isGerant} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 7. SIGNATURES */}
          <div>
            {staged ? (
              <div
                className="overflow-hidden rounded-2xl border"
                style={{
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
                  boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 12px 28px -18px rgba(13,148,136,0.18)',
                }}
              >
                <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}` }}>
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: isDark ? 'rgba(167,139,250,0.22)' : 'rgba(20,184,166,0.18)',
                      background: isDark ? 'rgba(167,139,250,0.12)' : 'rgba(20,184,166,0.10)',
                      color: isDark ? '#A78BFA' : '#0D9488',
                    }}
                  >
                    <PenTool size={14} />
                  </span>
                  <div className="flex-1">
                    <h3 className={`text-sm font-bold tracking-[-0.1px] ${isDark ? 'text-white' : 'text-slate-900'}`}>7. Signatures</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Électronique & fichier signé</p>
                  </div>
                  <span
                    className="hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      color: isDark ? '#FBBF24' : '#92400E',
                      borderColor: isDark ? 'rgba(251,191,36,0.22)' : 'rgba(251,191,36,0.22)',
                      background: isDark ? 'rgba(251,191,36,0.10)' : 'rgba(251,191,36,0.12)',
                    }}
                  >
                    <Check size={11} />
                    En attente
                  </span>
                </div>
                <div className="space-y-4 p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <StageSignatureCard title={`Signature du ${isVente ? 'vendeur' : 'bailleur'}`} subtitle={isVente ? 'Vendeur(s)' : 'Bailleur(s)'} isDark={isDark} />
                    <StageSignatureCard title="Signature de l'agent" subtitle="Mandataire" isDark={isDark} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      name="mandate.dateSignatureMandat"
                      control={control}
                      render={({ field }) => (
                        <DatePicker label="Date de signature" value={field.value} onChange={(e: any) => field.onChange(e.target?.value || e)} onBlur={field.onBlur} />
                      )}
                    />
                    <StageFileUpload isDark={isDark} isGerant={isGerant} />
                  </div>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
