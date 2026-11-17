import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { Target, Home, Key, Briefcase, Compass, UserPlus } from 'react-feather';
import { Client } from '../../../types/client';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { DatePicker } from '../../ui/DatePicker';
import { Checkbox } from '../../ui/Checkbox';
import { cn } from '../../../lib/utils';
import StageModal, { useStageFormClasses, useStageModalButtons } from '../calendar/StageModal';
import { useStageChrome } from '../calendar/useStageChrome';
import { STAGE_HUES, ShimmerProgress, StageTabSwap, type StageHue } from '../../dashboard/Stage';

interface ClientFormModalProps {
  onClose: () => void;
  onSubmit: (client: Omit<Client, 'id'>) => void;
  clientType: 'Acheteur' | 'Vendeur' | 'Bailleur' | 'Locataire' | 'Voyageur';
  isGerant?: boolean;
}

type FormData = Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'events' | 'lastContact'> & {
  currentSituation?: string;
  moveInDate?: string;
  furnished?: boolean;
  guarantor?: boolean;
  propertyCondition?: string;
  reasonForSelling?: string;
  mustHaveFeatures?: string;
  urgency?: string;
  preferredTenant?: string;
  minRentalDuration?: number;
  includedUtilities?: string;
  employmentStatus?: string;
  currentAddress?: string;
  travelDates?: string;
  accommodationType?: string;
  specialRequirements?: string;
  source?: string;
  notes?: string;
};

/* Light-mode identity shared app-wide (sidebar, cards, modals): teal-emerald */
const SIDEBAR_EMERALD: StageHue = {
  a: '#2DD4BF',
  b: '#0D9488',
  glow: 'rgba(13,148,136,0.35)',
  line: '#14B8A6',
};

const TYPE_HUES: Record<string, StageHue> = {
  Acheteur: STAGE_HUES.violet,
  Vendeur: STAGE_HUES.sky,
  Bailleur: STAGE_HUES.emerald,
  Locataire: STAGE_HUES.amber,
  Voyageur: STAGE_HUES.fuchsia,
};

const TYPE_ICONS: Record<string, ComponentType<{ size?: number | string; className?: string }>> = {
  Acheteur: Target,
  Vendeur: Home,
  Bailleur: Briefcase,
  Locataire: Key,
  Voyageur: Compass,
};

type StepDef = { id: number; label: string };

const TYPE_STEPS: Record<string, StepDef[]> = {
  Acheteur: [
    { id: 1, label: 'Général' },
    { id: 2, label: 'Situation' },
    { id: 3, label: 'Critères' },
    { id: 4, label: 'Financement' },
    { id: 5, label: 'Notes' },
  ],
  Locataire: [
    { id: 1, label: 'Général' },
    { id: 2, label: 'Situation' },
    { id: 3, label: 'Critères' },
    { id: 4, label: 'Notes' },
  ],
  Bailleur: [
    { id: 1, label: 'Général' },
    { id: 2, label: 'Bien' },
    { id: 3, label: 'Location' },
    { id: 4, label: 'Notes' },
  ],
  Vendeur: [
    { id: 1, label: 'Général' },
    { id: 2, label: 'Bien' },
    { id: 3, label: 'Motivation' },
    { id: 4, label: 'Notes' },
  ],
  Voyageur: [
    { id: 1, label: 'Général' },
    { id: 2, label: 'Voyage' },
    { id: 3, label: 'Préférences' },
    { id: 4, label: 'Notes' },
  ],
};

const DEFAULT_STEPS: StepDef[] = [
  { id: 1, label: 'Général' },
  { id: 2, label: 'Notes' },
];

/* Which step holds which fields — lets validation jump to the first error tab */
const TYPE_STEP_FIELDS: Record<string, Record<number, (keyof FormData)[]>> = {
  Acheteur: {
    2: ['currentSituation', 'urgency', 'moveInDate'],
    3: ['propertyType', 'area', 'minSurface', 'rooms', 'budget', 'devise', 'mustHaveFeatures'],
    4: ['financingType', 'contribution', 'loanDuration'],
  },
  Locataire: {
    2: ['currentAddress', 'employmentStatus', 'moveInDate', 'guarantor'],
    3: ['propertyType', 'area', 'minSurface', 'budget', 'devise'],
  },
  Bailleur: {
    2: ['propertyType', 'area', 'minSurface', 'rooms', 'propertyCondition'],
    3: ['preferredTenant', 'minRentalDuration', 'furnished', 'includedUtilities'],
  },
  Vendeur: {
    2: ['propertyType', 'area', 'minSurface', 'rooms', 'propertyCondition'],
    3: ['reasonForSelling'],
  },
  Voyageur: {
    2: ['area', 'travelDates', 'accommodationType', 'budget'],
    3: ['specialRequirements'],
  },
};

const PROPERTY_TYPES = [
  { value: 'Appartement', label: 'Appartement' },
  { value: 'Maison', label: 'Maison' },
  { value: 'Terrain', label: 'Terrain' },
  { value: 'Local commercial', label: 'Local commercial' },
];

const FINANCING_TYPES = [
  { value: 'Prêt bancaire', label: 'Prêt bancaire' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Mixte', label: 'Mixte' },
];

const CURRENT_SITUATION = [
  { value: 'Locataire', label: 'Locataire' },
  { value: 'Propriétaire', label: 'Propriétaire' },
  { value: 'Chez des parents', label: 'Chez des parents' },
  { value: 'Autre', label: 'Autre' },
];

const PROPERTY_CONDITIONS = [
  { value: 'Neuf', label: 'Neuf' },
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Bon', label: 'Bon' },
  { value: 'À rénover', label: 'À rénover' },
];

const URGENCY_LEVELS = [
  { value: 'Immédiat', label: 'Immédiat' },
  { value: '1-3 mois', label: '1-3 mois' },
  { value: '3-6 mois', label: '3-6 mois' },
  { value: '6+ mois', label: '6+ mois' },
];

const PREFERRED_TENANTS = [
  { value: 'Famille', label: 'Famille' },
  { value: 'Professionnel', label: 'Professionnel' },
  { value: 'Étudiant', label: 'Étudiant' },
  { value: 'Retraité', label: 'Retraité' },
  { value: 'Peu importe', label: 'Peu importe' },
];

const EMPLOYMENT_STATUS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Indépendant', label: 'Indépendant' },
  { value: 'Étudiant', label: 'Étudiant' },
  { value: 'Retraité', label: 'Retraité' },
];

const ACCOMMODATION_TYPES = [
  { value: 'Hôtel', label: 'Hôtel' },
  { value: 'Appartement', label: 'Appartement' },
  { value: 'Maison', label: 'Maison' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Résidence', label: 'Résidence' },
];

const SOURCES = [
  { value: 'Site web', label: 'Site web' },
  { value: 'Réseaux sociaux', label: 'Réseaux sociaux' },
  { value: 'Référence', label: 'Référence' },
  { value: 'Publicité', label: 'Publicité' },
  { value: 'Porte à porte', label: 'Porte à porte' },
  { value: 'Autre', label: 'Autre' },
];

const CURRENCIES = [
  { value: 'MAD', label: 'MAD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CHF', label: 'CHF' },
];

const isFilledValue = (v: unknown): boolean =>
  v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '');

export const ClientFormModal = ({ onClose, onSubmit, clientType, isGerant = false }: ClientFormModalProps) => {
  const steps = TYPE_STEPS[clientType] || DEFAULT_STEPS;
  const lastStep = steps[steps.length - 1].id;

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(0);
  const [ready, setReady] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: clientType,
    phone: '',
    email: '',
    propertyType: undefined,
    area: '',
    minSurface: undefined,
    rooms: '',
    budget: undefined,
    devise: 'EUR',
    contribution: undefined,
    financingType: undefined,
    loanDuration: undefined,
    status: 'Actif',
    currentSituation: undefined,
    moveInDate: undefined,
    furnished: undefined,
    guarantor: undefined,
    propertyCondition: undefined,
    reasonForSelling: undefined,
    mustHaveFeatures: undefined,
    urgency: undefined,
    preferredTenant: undefined,
    minRentalDuration: undefined,
    includedUtilities: undefined,
    employmentStatus: undefined,
    currentAddress: undefined,
    travelDates: undefined,
    accommodationType: undefined,
    specialRequirements: undefined,
    source: undefined,
    notes: undefined
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { staged, dark } = useStageChrome();
  const { label } = useStageFormClasses();
  const btns = useStageModalButtons();

  const goTo = (n: number) => {
    if (n === step) return;
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  /* Mount the fields only after the modal's entry spring has settled:
     anchoring floating pickers mid-animation left first-mount overlays
     broken until a tab switch remounted them. */
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 320);
    return () => window.clearTimeout(t);
  }, []);

  /* Measured content height → the modal body glides between tab sizes. */
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (el) setContentH(el.offsetHeight);
  }, [ready, step, errors, formData]);

  const handleChange = (field: keyof FormData, value: string | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  /* Chip groups: tapping the active chip clears optional values */
  const handleChipSelect = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: prev[field] === value ? undefined : value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const stepFields: Record<number, (keyof FormData)[]> = {
    1: ['name', 'phone', 'email', 'source'],
    [lastStep]: ['notes'],
    ...(TYPE_STEP_FIELDS[clientType] || {}),
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.name?.trim()) newErrors.name = 'Le nom est requis';
    else if (formData.name.length < 2) newErrors.name = 'Minimum 2 caractères';
    
    if (!formData.phone?.trim()) newErrors.phone = 'Le téléphone est requis';
    else if (formData.phone.length < 10) newErrors.phone = 'Numéro invalide';
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    // Type-specific validations
    switch(clientType) {
      case 'Acheteur':
        if (!formData.area?.trim()) newErrors.area = 'Le secteur est requis';
        if (formData.budget === undefined) newErrors.budget = 'Le budget est requis';
        if (!formData.currentSituation) newErrors.currentSituation = 'Ce champ est requis';
        if (!formData.urgency) newErrors.urgency = 'Ce champ est requis';
        if (formData.financingType === 'Prêt bancaire') {
          if (formData.contribution === undefined) newErrors.contribution = 'Ce champ est requis';
          if (formData.loanDuration === undefined) newErrors.loanDuration = 'Ce champ est requis';
        }
        break;
        
      case 'Locataire':
        if (!formData.area?.trim()) newErrors.area = 'Le secteur est requis';
        if (formData.budget === undefined) newErrors.budget = 'Le budget est requis';
        if (!formData.moveInDate) newErrors.moveInDate = 'La date souhaitée est requise';
        if (!formData.employmentStatus) newErrors.employmentStatus = 'Ce champ est requis';
        break;
        
      case 'Bailleur':
        if (!formData.propertyType) newErrors.propertyType = 'Le type de bien est requis';
        if (!formData.area?.trim()) newErrors.area = 'Le secteur est requis';
        if (formData.furnished === undefined) newErrors.furnished = 'Ce champ est requis';
        if (!formData.preferredTenant) newErrors.preferredTenant = 'Ce champ est requis';
        break;
        
      case 'Vendeur':
        if (!formData.propertyType) newErrors.propertyType = 'Le type de bien est requis';
        if (!formData.area?.trim()) newErrors.area = 'Le secteur est requis';
        if (!formData.propertyCondition) newErrors.propertyCondition = 'Ce champ est requis';
        if (!formData.reasonForSelling) newErrors.reasonForSelling = 'Ce champ est requis';
        break;

      case 'Voyageur':
        if (!formData.travelDates) newErrors.travelDates = 'Les dates sont requises';
        if (!formData.accommodationType) newErrors.accommodationType = 'Ce champ est requis';
        break;
    }

    setErrors(newErrors);

    const errKeys = Object.keys(newErrors) as (keyof FormData)[];
    if (errKeys.length) {
      const target = steps.find(s => (stepFields[s.id] || []).some(f => errKeys.includes(f)));
      if (target && target.id !== step) goTo(target.id);
    }
    return errKeys.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    onSubmit({
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user-id'
    });
  };

  const sectionTitle = 'mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80';
  const section = (hue: string, text: string) => (
    <p className={cn(sectionTitle, hue)}>
      <span className="h-px w-4 bg-gradient-to-r from-current to-transparent" />
      {text}
    </p>
  );

  const tabClass = (active: boolean) =>
    cn(
      'flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200',
      active
        ? staged
          ? dark
            ? 'btn-stage-pill-dark border border-white/25 text-white'
            : 'btn-stage-pill-light border border-white/25 text-white'
          : 'border border-accent bg-accent text-white'
        : staged
          ? dark
            ? 'border border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white'
            : 'border border-transparent text-teal-900/60 hover:bg-white hover:text-teal-900'
          : 'border border-transparent text-text-secondary hover:text-text',
    );

  const chipClass = (active: boolean) =>
    cn(
      'rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all duration-200',
      active
        ? staged
          ? dark
            ? 'border-violet-400/50 bg-gradient-to-b from-violet-500/30 to-indigo-600/25 text-violet-100 shadow-[0_0_12px_-4px_rgba(124,92,255,0.9)]'
            : 'border-teal-500/50 bg-teal-500/15 text-teal-800 shadow-[0_0_12px_-4px_rgba(13,148,136,0.8)]'
          : 'border-accent/40 bg-accent-light text-text'
        : staged
          ? dark
            ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
            : 'border-teal-900/10 bg-white/70 text-teal-900/65 hover:bg-white'
          : 'border-border bg-card text-text-secondary hover:text-text',
    );

  const errClass = cn('text-xs', staged ? (dark ? 'text-rose-300' : 'text-rose-500') : 'text-error');

  const renderRadioGroup = (
    title: string,
    field: keyof FormData,
    options: { value: string; label: string }[],
    error?: string,
  ) => (
    <div className="space-y-2">
      <p className={label}>{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = formData[field] === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChipSelect(field, opt.value)}
              className={chipClass(isSelected)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && <p className={errClass}>{error}</p>}
    </div>
  );

  const completionFields: (keyof FormData)[] = (() => {
    const base: (keyof FormData)[] = ['name', 'phone', 'email', 'source', 'notes'];
    switch (clientType) {
      case 'Acheteur':
        return [
          ...base, 'currentSituation', 'urgency', 'moveInDate', 'propertyType', 'area',
          'minSurface', 'rooms', 'budget', 'devise', 'mustHaveFeatures', 'financingType',
          ...(formData.financingType === 'Prêt bancaire' ? ['contribution', 'loanDuration'] as (keyof FormData)[] : []),
        ];
      case 'Locataire':
        return [...base, 'currentAddress', 'employmentStatus', 'moveInDate', 'guarantor', 'propertyType', 'area', 'minSurface', 'budget', 'devise'];
      case 'Bailleur':
        return [...base, 'propertyType', 'area', 'minSurface', 'rooms', 'propertyCondition', 'preferredTenant', 'minRentalDuration', 'furnished', 'includedUtilities'];
      case 'Vendeur':
        return [...base, 'propertyType', 'area', 'minSurface', 'rooms', 'propertyCondition', 'reasonForSelling'];
      case 'Voyageur':
        return [...base, 'area', 'travelDates', 'accommodationType', 'budget', 'specialRequirements'];
      default:
        return base;
    }
  })();
  const completion = Math.round((completionFields.filter(f => isFilledValue(formData[f])).length / completionFields.length) * 100);
  const completionHue = completion >= 80
    ? { a: '#34D399', b: '#059669', glow: 'rgba(52,211,153,0.45)' }
    : completion >= 50
      ? { a: '#FBBF24', b: '#B45309', glow: 'rgba(251,191,36,0.40)' }
      : { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.40)' };

  const typeHue = TYPE_HUES[clientType] || STAGE_HUES.violet;
  const TypeIcon = TYPE_ICONS[clientType] || UserPlus;
  const typeName = clientType || 'Client';
const primaryClass = btns.primary;
  const isBankLoan = formData.financingType === 'Prêt bancaire';

  return (
    <StageModal
      open
      onClose={onClose}
      eyebrow="Création"
      title={`${typeName === 'Acheteur' ? 'Nouvel' : 'Nouveau'} ${typeName.toLowerCase()}`}
      subtitle="Complétez la fiche puis validez pour suivre le client."
      icon={TypeIcon}
      hue={dark ? typeHue : SIDEBAR_EMERALD}
      accent={dark ? typeHue.a : '#14B8A6'}
      badge={
        <span
          className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums"
          style={{ color: dark ? completionHue.a : completionHue.b, borderColor: `${completionHue.a}55`, background: `${completionHue.a}1A` }}
        >
          {completion}%
        </span>
      }
      maxWidth="max-w-2xl"
      centered
      bodyClassName="max-h-[calc(100vh-280px)] min-h-[120px] overflow-y-auto scrollbar-thin space-y-4 pt-1"
      footer={
        <>
          {step > 1 && (
            <button type="button" onClick={() => goTo(step - 1)} className={btns.ghost}>
              Précédent
            </button>
          )}
          <button type="button" onClick={onClose} className={cn(btns.ghost, 'disabled:opacity-60')} disabled={isSubmitting}>
            Annuler
          </button>
          {step < lastStep ? (
            <button type="button" onClick={() => goTo(step + 1)} className={btns.primary}>
              Suivant
            </button>
          ) : (
            <button type="submit" form="client-form" className={cn(primaryClass, 'disabled:opacity-60')} disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          )}
        </>
      }
    >
      <div className={cn('flex gap-1 rounded-xl border p-1', staged ? (dark ? 'border-white/10 bg-white/[0.03]' : 'border-teal-900/10 bg-white/60') : 'border-border bg-background')}>
        {steps.map((s) => (
          <button key={s.id} type="button" onClick={() => goTo(s.id)} className={tabClass(step === s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ShimmerProgress
            pct={completion}
            colorFrom={completionHue.a}
            colorTo={completionHue.b}
            glow={completionHue.glow}
            height={5}
            intense={staged && dark}
          />
        </div>
        <span className="text-[11px] font-bold tabular-nums" style={{ color: dark ? completionHue.a : completionHue.b }}>
          {completion}% complété
        </span>
      </div>

      <form id="client-form" onSubmit={handleSubmit}>
        <motion.div
          initial={false}
          animate={{ height: contentH }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div ref={contentRef} className="pt-1">
            {ready ? (
              <StageTabSwap key={step} tabId={String(step)} duration={0.3} direction={dir}>
                {step === 1 && (
                  <>
                    {section('text-violet-400', 'Informations de base')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Input
                          label="Nom complet*"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          error={errors.name}
                          placeholder="Jean Dupont"
                        />
                      </div>
                      <Input
                        label="Téléphone*"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        error={errors.phone}
                        placeholder="0612345678"
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleChange('email', e.target.value)}
                        error={errors.email}
                        placeholder="jean.dupont@example.com"
                      />
                      <Select
                        label="Source"
                        options={SOURCES}
                        value={formData.source || ''}
                        onChange={(value: string) => handleChange('source', value)}
                        error={errors.source}
                      />
                    </div>
                  </>
                )}

                {clientType === 'Acheteur' && step === 2 && (
                  <>
                    {section('text-sky-400', 'Situation actuelle')}
                    {renderRadioGroup('Situation actuelle', 'currentSituation', CURRENT_SITUATION, errors.currentSituation)}
                    {renderRadioGroup('Urgence', 'urgency', URGENCY_LEVELS, errors.urgency)}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DatePicker
                        label="Date souhaitée d'emménagement"
                        value={formData.moveInDate || ''}
                        onChange={(e) => handleChange('moveInDate', e.target.value)}
                        error={errors.moveInDate}
                      />
                    </div>
                  </>
                )}

                {clientType === 'Acheteur' && step === 3 && (
                  <>
                    {section('text-amber-400', 'Critères de recherche')}
                    {renderRadioGroup('Type de bien', 'propertyType', PROPERTY_TYPES, errors.propertyType)}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Input
                          label="Secteur géographique*"
                          value={formData.area}
                          onChange={(e) => handleChange('area', e.target.value)}
                          error={errors.area}
                          placeholder="Paris 15ème"
                        />
                      </div>
                      <Input
                        label="Surface min (m²)"
                        type="number"
                        min="0"
                        value={formData.minSurface?.toString() || ''}
                        onChange={(e) => handleChange('minSurface', e.target.value ? parseInt(e.target.value) : undefined)}
                        error={errors.minSurface}
                      />
                      <Input
                        label="Pièces"
                        value={formData.rooms}
                        onChange={(e) => handleChange('rooms', e.target.value)}
                        error={errors.rooms}
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            label={`Budget max (${formData.devise})*`}
                            type="number"
                            min="0"
                            value={formData.budget?.toString() || ''}
                            onChange={(e) => handleChange('budget', e.target.value ? parseInt(e.target.value) : undefined)}
                            error={errors.budget}
                          />
                        </div>
                        <div className="w-24">
                          <Select
                            label="Devise"
                            options={CURRENCIES}
                            value={formData.devise}
                            onChange={(v) => handleChange('devise', v)}
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <Textarea
                          label="Caractéristiques indispensables"
                          value={formData.mustHaveFeatures || ''}
                          onChange={(e) => handleChange('mustHaveFeatures', e.target.value)}
                          error={errors.mustHaveFeatures}
                          placeholder="Balcon, parking, ascenseur..."
                        />
                      </div>
                    </div>
                  </>
                )}

                {clientType === 'Acheteur' && step === 4 && (
                  <>
                    {section('text-emerald-400', 'Financement')}
                    {renderRadioGroup('Type de financement', 'financingType', FINANCING_TYPES, errors.financingType)}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={`Apport (${formData.devise})`}
                        type="number"
                        min="0"
                        value={formData.contribution?.toString() || ''}
                        onChange={(e) => handleChange('contribution', e.target.value ? parseInt(e.target.value) : undefined)}
                        error={errors.contribution}
                        disabled={!isBankLoan}
                      />
                      <Input
                        label="Durée prêt (années)"
                        type="number"
                        min="0"
                        value={formData.loanDuration?.toString() || ''}
                        onChange={(e) => handleChange('loanDuration', e.target.value ? parseInt(e.target.value) : undefined)}
                        error={errors.loanDuration}
                        disabled={!isBankLoan}
                      />
                    </div>
                  </>
                )}

                {clientType === 'Locataire' && step === 2 && (
                  <>
                    {section('text-sky-400', 'Situation actuelle')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Input
                          label="Adresse actuelle"
                          value={formData.currentAddress || ''}
                          onChange={(e) => handleChange('currentAddress', e.target.value)}
                          error={errors.currentAddress}
                          placeholder="123 Rue de Paris, 75001"
                        />
                      </div>
                    </div>
                    {renderRadioGroup('Situation professionnelle', 'employmentStatus', EMPLOYMENT_STATUS, errors.employmentStatus)}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DatePicker
                        label="Date souhaitée d'emménagement*"
                        value={formData.moveInDate || ''}
                        onChange={(e) => handleChange('moveInDate', e.target.value)}
                        error={errors.moveInDate}
                      />
                      <div className="flex items-center pt-1 sm:pt-6">
                        <Checkbox
                          label="Garant disponible"
                          checked={formData.guarantor || false}
                          onChange={(checked) => handleChange('guarantor', checked)}
                          error={errors.guarantor}
                        />
                      </div>
                    </div>
                  </>
                )}

                {clientType === 'Locataire' && step === 3 && (
                  <>
                    {section('text-amber-400', 'Critères de recherche')}
                    {renderRadioGroup('Type de bien', 'propertyType', PROPERTY_TYPES, errors.propertyType)}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Input
                          label="Secteur géographique*"
                          value={formData.area}
                          onChange={(e) => handleChange('area', e.target.value)}
                          error={errors.area}
                          placeholder="Paris 15ème"
                        />
                      </div>
                      <Input
                        label="Surface min (m²)"
                        type="number"
                        min="0"
                        value={formData.minSurface?.toString() || ''}
                        onChange={(e) => handleChange('minSurface', e.target.value ? parseInt(e.target.value) : undefined)}
                        error={errors.minSurface}
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            label={`Budget max (${formData.devise})*`}
                            type="number"
                            min="0"
                            value={formData.budget?.toString() || ''}
                            onChange={(e) => handleChange('budget', e.target.value ? parseInt(e.target.value) : undefined)}
                            error={errors.budget}
                          />
                        </div>
                        <div className="w-24">
                          <Select
                            label="Devise"
                            options={CURRENCIES}
                            value={formData.devise}
                            onChange={(v) => handleChange('devise', v)}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {clientType === 'Bailleur' && step === 2 && (
                  <>
                    {section('text-sky-400', 'Informations sur le bien')}
                    {renderRadioGroup('Type de bien', 'propertyType', PROPERTY_TYPES, errors.propertyType)}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Input
                          label="Secteur géographique*"
                          value={formData.area}
                          onChange={(e) => handleChange('area', e.target.value)}
                          error={errors.area}
                          placeholder="Paris 15ème"
                        />
                      </div>
                      <Input
                        label="Surface (m²)"
                        type="number"
                        min="0"
                        value={formData.minSurface?.toString() || ''}
                        onChange={(e) => handleChange('minSurface', e.target.value ? parseInt(e.target.value) : undefined)}
                        error={errors.minSurface}
                      />
                      <Input
                        label="Pièces"
                        value={formData.rooms}
                        onChange={(e) => handleChange('rooms', e.target.value)}
                        error={errors.rooms}
                      />
                    </div>
                    {renderRadioGroup('État du bien', 'propertyCondition', PROPERTY_CONDITIONS, errors.propertyCondition)}
                  </>
                )}

                {clientType === 'Bailleur' && step === 3 && (
                  <>
                    {section('text-amber-400', 'Préférences de location')}
                    {renderRadioGroup('Type de locataire préféré', 'preferredTenant', PREFERRED_TENANTS, errors.preferredTenant)}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Durée minimum (mois)"
                        type="number"
                        min="0"
                        value={formData.minRentalDuration?.toString() || ''}
                        onChange={(e) => handleChange('minRentalDuration', e.target.value ? parseInt(e.target.value) : undefined)}
                        error={errors.minRentalDuration}
                      />
                      <div className="flex items-center pt-1 sm:pt-6">
                        <Checkbox
                          label="Meublé*"
                          checked={formData.furnished || false}
                          onChange={(checked) => handleChange('furnished', checked)}
                          error={errors.furnished}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Textarea
                          label="Services inclus"
                          value={formData.includedUtilities || ''}
                          onChange={(e) => handleChange('includedUtilities', e.target.value)}
                          error={errors.includedUtilities}
                          placeholder="Eau, électricité, internet..."
                        />
                      </div>
                    </div>
                  </>
                )}

                {clientType === 'Vendeur' && step === 2 && (
                  <>
                    {section('text-sky-400', 'Informations sur le bien')}
                    {renderRadioGroup('Type de bien', 'propertyType', PROPERTY_TYPES, errors.propertyType)}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Input
                          label="Secteur géographique*"
                          value={formData.area}
                          onChange={(e) => handleChange('area', e.target.value)}
                          error={errors.area}
                          placeholder="Paris 15ème"
                        />
                      </div>
                      <Input
                        label="Surface (m²)"
                        type="number"
                        min="0"
                        value={formData.minSurface?.toString() || ''}
                        onChange={(e) => handleChange('minSurface', e.target.value ? parseInt(e.target.value) : undefined)}
                        error={errors.minSurface}
                      />
                      <Input
                        label="Pièces"
                        value={formData.rooms}
                        onChange={(e) => handleChange('rooms', e.target.value)}
                        error={errors.rooms}
                      />
                    </div>
                    {renderRadioGroup('État du bien', 'propertyCondition', PROPERTY_CONDITIONS, errors.propertyCondition)}
                  </>
                )}

                {clientType === 'Vendeur' && step === 3 && (
                  <>
                    {section('text-amber-400', 'Motivation')}
                    <Textarea
                      label="Raison de la vente*"
                      value={formData.reasonForSelling || ''}
                      onChange={(e) => handleChange('reasonForSelling', e.target.value)}
                      error={errors.reasonForSelling}
                      placeholder="Mutation professionnelle, héritage..."
                    />
                  </>
                )}

                {clientType === 'Voyageur' && step === 2 && (
                  <>
                    {section('text-sky-400', 'Voyage')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Destination souhaitée"
                        value={formData.area}
                        onChange={(e) => handleChange('area', e.target.value)}
                        error={errors.area}
                        placeholder="New York, Tokyo..."
                      />
                      <Input
                        label="Dates du voyage*"
                        value={formData.travelDates || ''}
                        onChange={(e) => handleChange('travelDates', e.target.value)}
                        error={errors.travelDates}
                        placeholder="01/07/2023 - 15/07/2023"
                      />
                    </div>
                    {renderRadioGroup("Type d'hébergement", 'accommodationType', ACCOMMODATION_TYPES, errors.accommodationType)}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={`Budget (${formData.devise})`}
                        type="number"
                        min="0"
                        value={formData.budget?.toString() || ''}
                        onChange={(e) => handleChange('budget', e.target.value ? parseInt(e.target.value) : undefined)}
                        error={errors.budget}
                      />
                    </div>
                  </>
                )}

                {clientType === 'Voyageur' && step === 3 && (
                  <>
                    {section('text-amber-400', 'Préférences')}
                    <Textarea
                      label="Besoins spécifiques"
                      value={formData.specialRequirements || ''}
                      onChange={(e) => handleChange('specialRequirements', e.target.value)}
                      error={errors.specialRequirements}
                      placeholder="Accessibilité, animaux, cuisine équipée..."
                    />
                  </>
                )}

                {step === lastStep && (
                  <>
                    {section('text-slate-400', 'Notes')}
                    <Textarea
                      label="Informations complémentaires"
                      value={formData.notes || ''}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      error={errors.notes}
                      placeholder="Toutes informations utiles..."
                    />
                  </>
                )}
              </StageTabSwap>
            ) : (
              <div className="h-[230px]" aria-hidden="true" />
            )}
          </div>
        </motion.div>
      </form>
    </StageModal>
  );
};
