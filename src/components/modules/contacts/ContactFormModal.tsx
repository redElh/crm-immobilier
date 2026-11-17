import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, CheckCircle, UserPlus, User } from 'react-feather';
import { Contact } from '../../../types/contact';
import { DatePicker } from '../../ui/DatePicker';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { cn } from '../../../lib/utils';
import StageModal, { useStageFormClasses, useStageModalButtons } from '../calendar/StageModal';
import { useStageChrome } from '../calendar/useStageChrome';
import { STAGE_HUES, GERANT_MAUVE_HUE, ShimmerProgress, StageTabSwap, useStageAccent, useStageScope, type StageHue } from '../../dashboard/Stage';
import { saveDraft, getDraft, deleteDraft } from '../../../services/contactDraftStorage';

interface ContactFormModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<Contact, 'id' | 'mandats' | 'createdAt' | 'updatedAt'>) => void;
  contact?: Contact;
  draftId?: string;
  userId?: string;
  isGerant?: boolean;
  onDraftChange?: () => void;
}

type FormData = Omit<Contact, 'id' | 'mandats' | 'createdAt' | 'updatedAt'>;

/* Light-mode identity shared app-wide (sidebar, cards, modals): teal-emerald */
const SIDEBAR_EMERALD: StageHue = {
  a: '#2DD4BF',
  b: '#0D9488',
  glow: 'rgba(13,148,136,0.35)',
  line: '#14B8A6',
};

const TYPES = [
  { value: 'Particulier', label: 'Particulier' },
  { value: 'Professionnel', label: 'Professionnel' },
  { value: 'Indivision / Succession', label: 'Indivision / Succession' },
];

const CIVILITIES = [
  { value: 'M.', label: 'M.' },
  { value: 'Mme', label: 'Mme' },
  { value: 'Mlle', label: 'Mlle' },
  { value: 'Autre', label: 'Autre' },
];

const LANGUAGES = [
  { value: 'Français', label: 'Français' },
  { value: 'Anglais', label: 'Anglais' },
  { value: 'Arabe', label: 'Arabe' },
  { value: 'Berbère', label: 'Berbère' },
  { value: 'Espagnol', label: 'Espagnol' },
  { value: 'Allemand', label: 'Allemand' },
  { value: 'Italien', label: 'Italien' },
  { value: 'Portugais', label: 'Portugais' },
  { value: 'Néerlandais', label: 'Néerlandais' },
  { value: 'Russe', label: 'Russe' },
  { value: 'Chinois', label: 'Chinois' },
  { value: 'Japonais', label: 'Japonais' },
  { value: 'Turc', label: 'Turc' },
  { value: 'Hébreu', label: 'Hébreu' },
];

const CONTACT_METHODS = [
  { value: 'Email', label: 'Email' },
  { value: 'Téléphone', label: 'Téléphone' },
  { value: 'SMS', label: 'SMS' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Facebook Messenger', label: 'Facebook Messenger' },
  { value: 'Instagram', label: 'Instagram' },
];

const CURRENCIES = [
  { value: 'MAD', label: 'MAD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CHF', label: 'CHF' },
  { value: 'CAD', label: 'CAD' },
];

const SITUATIONS_FAMILIALES = [
  { value: 'Célibataire', label: 'Célibataire' },
  { value: 'Marié', label: 'Marié' },
  { value: 'Divorcé', label: 'Divorcé' },
  { value: 'Veuf', label: 'Veuf' },
];

const REGIMES_MATRIMONIAUX = [
  { value: 'Communauté de biens', label: 'Communauté de biens' },
  { value: 'Communauté universelle', label: 'Communauté universelle' },
  { value: 'Séparation des biens', label: 'Séparation des biens' },
];

const COUNTRIES = [
  { value: 'Maroc', label: 'Maroc' },
  { value: 'France', label: 'France' },
  { value: 'Belgique', label: 'Belgique' },
  { value: 'Suisse', label: 'Suisse' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Algérie', label: 'Algérie' },
  { value: 'Tunisie', label: 'Tunisie' },
  { value: 'Sénégal', label: 'Sénégal' },
  { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
  { value: 'Égypte', label: 'Égypte' },
  { value: 'Émirats Arabes Unis', label: 'Émirats Arabes Unis' },
  { value: 'Espagne', label: 'Espagne' },
  { value: 'Italie', label: 'Italie' },
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Royaume-Uni', label: 'Royaume-Uni' },
  { value: 'Allemagne', label: 'Allemagne' },
  { value: 'Pays-Bas', label: 'Pays-Bas' },
  { value: 'Luxembourg', label: 'Luxembourg' },
  { value: 'Turquie', label: 'Turquie' },
  { value: 'États-Unis', label: 'États-Unis' },
  { value: 'Autre', label: 'Autre' },
];

const COUNTRY_CODES = [
  { value: '+212', label: '+212 (Maroc)' },
  { value: '+33', label: '+33 (France)' },
  { value: '+32', label: '+32 (Belgique)' },
  { value: '+41', label: '+41 (Suisse)' },
  { value: '+1', label: '+1 (Canada/États-Unis)' },
  { value: '+44', label: '+44 (Royaume-Uni)' },
  { value: '+49', label: '+49 (Allemagne)' },
  { value: '+34', label: '+34 (Espagne)' },
  { value: '+39', label: '+39 (Italie)' },
  { value: '+31', label: '+31 (Pays-Bas)' },
  { value: '+351', label: '+351 (Portugal)' },
  { value: '+352', label: '+352 (Luxembourg)' },
  { value: '+216', label: '+216 (Tunisie)' },
  { value: '+213', label: '+213 (Algérie)' },
  { value: '+221', label: '+221 (Sénégal)' },
  { value: '+225', label: "+225 (Côte d'Ivoire)" },
  { value: '+20', label: '+20 (Égypte)' },
  { value: '+971', label: '+971 (Émirats Arabes Unis)' },
  { value: '+90', label: '+90 (Turquie)' },
  { value: '+86', label: '+86 (Chine)' },
  { value: '+81', label: '+81 (Japon)' },
  { value: '+65', label: '+65 (Singapour)' },
  { value: '+91', label: '+91 (Inde)' },
  { value: '+61', label: '+61 (Australie)' },
];

const parsePhone = (value: string) => {
  if (!value) return { code: '+212', number: '' };
  const sorted = COUNTRY_CODES.map((c) => c.value).sort((a, b) => b.length - a.length);
  for (const code of sorted) {
    if (value.startsWith(code)) return { code, number: value.slice(code.length).trim() };
  }
  return { code: '+212', number: value };
};

export const ContactFormModal = ({ onClose, onSubmit, contact: editContact, draftId: initialDraftId, userId, isGerant = false, onDraftChange }: ContactFormModalProps) => {
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(0);
  const [ready, setReady] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const { staged, dark } = useStageChrome();
  const { label } = useStageFormClasses();
  const btns = useStageModalButtons();
  const scope = useStageScope();
  const stageAccent = useStageAccent();
  const isAdminScope = staged && scope === 'admin';
  const interfaceHue = isGerant ? GERANT_MAUVE_HUE : stageAccent;

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
  }, [ready, step]);

  const steps = [
    { id: 1, label: 'Général' },
    { id: 2, label: 'Coordonnées' },
    { id: 3, label: 'Adresse' },
    { id: 4, label: 'Compléments' },
  ];

  const sectionTitle = 'mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80';
  const section = (hue: string, text: string) => (
    <p className={cn(sectionTitle, hue)} style={isAdminScope ? { color: interfaceHue.line } : undefined}>
      <span className="h-px w-4 bg-gradient-to-r from-current to-transparent" />
      {text}
    </p>
  );

  const tabClass = (active: boolean) =>
    cn(
      'flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200',
      active
        ? staged
          ? cn(
              dark ? 'btn-stage-pill-dark' : 'btn-stage-pill-light',
              'border border-white/25 text-white',
              isGerant && 'btn-gerant-pill',
            )
          : 'border border-accent bg-accent text-white'
        : staged
          ? dark
            ? 'border border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white'
            : isAdminScope
              ? 'border border-transparent text-slate-500 hover:bg-slate-900/[0.05] hover:text-slate-900'
              : 'border border-transparent text-teal-900/60 hover:bg-white hover:text-teal-900'
          : 'border border-transparent text-text-secondary hover:text-text',
    );

  const chipClass = (active: boolean) =>
    cn(
      'rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all duration-200',
      active
        ? staged
          ? dark
            ? isGerant
              ? 'border-[#A56E6E]/50 bg-gradient-to-b from-[#A56E6E]/30 to-[#7D5050]/25 text-[#F0DADA] shadow-[0_0_12px_-4px_rgba(144,93,93,0.9)]'
              : isAdminScope
                ? 'border-rose-400/50 bg-gradient-to-b from-rose-500/30 to-violet-600/25 text-rose-100 shadow-[0_0_12px_-4px_rgba(244,63,94,0.9)]'
                : 'border-violet-400/50 bg-gradient-to-b from-violet-500/30 to-indigo-600/25 text-violet-100 shadow-[0_0_12px_-4px_rgba(124,92,255,0.9)]'
            : isGerant
              ? 'border-[#A56E6E]/50 bg-[#905D5D]/15 text-[#7D5050] shadow-[0_0_12px_-4px_rgba(144,93,93,0.8)]'
              : isAdminScope
                ? 'border-orange-500/50 bg-orange-500/15 text-orange-800 shadow-[0_0_12px_-4px_rgba(249,115,22,0.8)]'
                : 'border-teal-500/50 bg-teal-500/15 text-teal-800 shadow-[0_0_12px_-4px_rgba(13,148,136,0.8)]'
          : 'border-accent/40 bg-accent-light text-text'
        : staged
          ? dark
            ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
            : isGerant
              ? 'border-[#905D5D]/15 bg-white/70 text-[#7D5050]/70 hover:bg-white'
              : isAdminScope
                ? 'border-orange-900/10 bg-white/70 text-orange-900/65 hover:bg-white'
                : 'border-teal-900/10 bg-white/70 text-teal-900/65 hover:bg-white'
          : 'border-border bg-card text-text-secondary hover:text-text',
    );

  const errClass = cn('text-xs', staged ? (dark ? 'text-rose-300' : 'text-rose-500') : 'text-error');

  const [formData, setFormData] = useState<FormData>({
    type: editContact?.type || 'Particulier',
    civility: editContact?.civility || 'M.',
    lastName: editContact?.lastName || '',
    firstName: editContact?.firstName || '',
    emailPrincipal: editContact?.emailPrincipal || '',
    emailSecondaire: editContact?.emailSecondaire || '',
    mobile: editContact?.mobile || '',
    telephoneFixe: editContact?.telephoneFixe || '',
    profession: editContact?.profession || '',
    lieuNaissance: editContact?.lieuNaissance || '',
    dateNaissance: editContact?.dateNaissance || '',
    nationalite: editContact?.nationalite || '',
    numeroFiscal: editContact?.numeroFiscal || '',
    adresse: editContact?.adresse || '',
    adresse2: editContact?.adresse2 || '',
    codePostal: editContact?.codePostal || '',
    ville: editContact?.ville || '',
    pays: editContact?.pays || '',
    moyenContactPrefere: editContact?.moyenContactPrefere || '',
    langueParlee: editContact?.langueParlee || [],
    devisePreferee: editContact?.devisePreferee || '',
    situationFamiliale: editContact?.situationFamiliale || undefined,
    nombreEnfants: editContact?.nombreEnfants || undefined,
    prescripteur: editContact?.prescripteur || '',
    regimeMatrimonial: editContact?.regimeMatrimonial || '',
    siteInternet: editContact?.siteInternet || '',
    commentairePrive: editContact?.commentairePrive || '',
    originalProspectId: editContact?.originalProspectId || undefined,
  });

  const [savedDraftId, setSavedDraftId] = useState<string | undefined>(initialDraftId || undefined);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const calcCompletion = (data: FormData): number => {
    const check = (v: any) => v !== undefined && v !== null && String(v).trim() !== '';
    const fields = [
      data.firstName, data.lastName, data.emailPrincipal, data.emailSecondaire,
      data.mobile, data.telephoneFixe, data.profession, data.lieuNaissance,
      data.dateNaissance, data.nationalite, data.numeroFiscal, data.adresse,
      data.adresse2, data.codePostal, data.ville, data.pays,
      data.moyenContactPrefere, data.langueParlee?.length > 0 ? 'x' : '',
      data.devisePreferee, data.situationFamiliale, data.nombreEnfants,
      data.prescripteur, data.regimeMatrimonial, data.siteInternet, data.commentairePrive,
    ];
    const filled = fields.filter(f => check(f)).length;
    return Math.round((filled / fields.length) * 100);
  };

  // Restore draft on mount
  useEffect(() => {
    if (!initialDraftId || !userId) return;
    const draft = getDraft(userId, initialDraftId);
    if (draft) {
      setFormData(prev => ({ ...prev, ...draft.data }));
    }
  }, []);

  // Auto-save debounced 2s
  useEffect(() => {
    if (!savedDraftId || !userId) return;
    const timer = setTimeout(() => {
      const data = formDataRef.current;
      const completion = calcCompletion(data);
      saveDraft(userId, data.type, { ...data, _draftId: savedDraftId }, completion);
      onDraftChange?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData, savedDraftId]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePhoneChange = (field: 'mobile' | 'telephoneFixe', code: string, number: string) => {
    const value = `${code} ${number}`.trim();
    handleChange(field, value);
  };

  const handleCheckboxGroup = (field: 'langueParlee', value: string) => {
    setFormData((prev) => {
      const current = prev[field] as string[];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleSaveDraft = () => {
    if (!userId) return;
    const data = { ...formDataRef.current, _draftId: savedDraftId };
    const draft = saveDraft(userId, formData.type, data, calcCompletion(formData));
    if (!savedDraftId) setSavedDraftId(draft.id);
    onDraftChange?.();
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Prénom requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Nom requis';
    if (!formData.emailPrincipal.trim()) newErrors.emailPrincipal = 'Email requis';
    else if (!/^\S+@\S+\.\S+$/.test(formData.emailPrincipal)) newErrors.emailPrincipal = 'Email invalide';
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (savedDraftId && userId) deleteDraft(userId, savedDraftId);
    onSubmit(formData);
  };

  const renderCheckboxGroup = (
    title: string,
    field: 'langueParlee',
    options: { value: string; label: string }[],
  ) => (
    <div className="space-y-2">
      <p className={label}>{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = (formData[field] as string[]).includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleCheckboxGroup(field, opt.value)}
              className={chipClass(isSelected)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderRadioGroup = (
    title: string,
    field: keyof FormData,
    options: { value: string; label: string }[],
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
              onClick={() => handleChange(field, opt.value)}
              className={chipClass(isSelected)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const parsedMobile = parsePhone(formData.mobile);
  const parsedFixe = parsePhone(formData.telephoneFixe || '');
  const completion = calcCompletion(formData);
  const panelHue: StageHue = staged ? interfaceHue : dark ? STAGE_HUES.violet : SIDEBAR_EMERALD;
  const completionHue: StageHue =
    completion >= 80
      ? STAGE_HUES.emerald
      : completion >= 50
        ? STAGE_HUES.amber
        : { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.40)', line: '#F87171' };

  return (
    <StageModal
      open
      onClose={onClose}
      eyebrow={editContact ? 'Modification' : 'Création'}
      title={editContact ? 'Modifier le contact' : 'Nouveau contact'}
      subtitle="Identité, coordonnées, adresse et préférences du contact."
      icon={editContact ? User : UserPlus}
      hue={panelHue}
      accent={interfaceHue.a}
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
          <div className="mr-auto">
            {!savedDraftId ? (
              <button type="button" onClick={handleSaveDraft} className={btns.ghost}>
                <Save size={14} /> Brouillon
              </button>
            ) : (
              <span className={cn('flex items-center gap-1.5 text-[11px] font-medium', staged && dark ? 'text-emerald-300' : 'text-emerald-600')}>
                <CheckCircle size={12} /> Auto-sauvegarde
              </span>
            )}
          </div>
          {step > 1 && (
            <button type="button" onClick={() => goTo(step - 1)} className={btns.ghost}>
              Précédent
            </button>
          )}
          <button type="button" onClick={onClose} className={btns.ghost}>
            Annuler
          </button>
          {step < 4 ? (
            <button type="button" onClick={() => goTo(step + 1)} className={`${btns.primary} ${isGerant ? 'btn-gerant-pill' : ''}`}>
              Suivant
            </button>
          ) : (
            <button type="submit" form="contact-form" className={`${btns.primary} ${isGerant ? 'btn-gerant-pill' : ''}`}>
              {editContact ? 'Enregistrer' : 'Créer le contact'}
            </button>
          )}
        </>
      }
    >
      <div className={cn('flex gap-1 rounded-xl border p-1', staged ? (dark ? 'border-white/10 bg-white/[0.03]' : isAdminScope ? 'border-slate-900/10 bg-white/60' : 'border-teal-900/10 bg-white/60') : 'border-border bg-background')}>
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

      <form id="contact-form" onSubmit={handleSubmit}>
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
                  <div className="space-y-4">
                    {section('text-sky-400', 'Type de contact')}
                    {renderRadioGroup('', 'type', TYPES)}
                    {section('text-violet-400', 'Identité')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select label="Civilité" options={CIVILITIES} value={formData.civility} onValueChange={(v) => handleChange('civility', v)} />
                      <Input label="Prénom" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} error={errors.firstName} placeholder="Jean" />
                      <Input label="Nom" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} error={errors.lastName} placeholder="Dupont" />
                      <Input label="Profession" value={formData.profession || ''} onChange={(e) => handleChange('profession', e.target.value)} placeholder="Métier..." />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    {section('text-sky-400', 'Coordonnées')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Email principal" type="email" value={formData.emailPrincipal} onChange={(e) => handleChange('emailPrincipal', e.target.value)} error={errors.emailPrincipal} placeholder="jean@email.com" />
                      <Input label="Email secondaire" type="email" value={formData.emailSecondaire || ''} onChange={(e) => handleChange('emailSecondaire', e.target.value)} placeholder="autre@email.com" />
                      <div className="space-y-1.5">
                        <label className={label}>Mobile</label>
                        <div className="flex gap-2">
                          <div className="w-36 shrink-0">
                            <Select options={COUNTRY_CODES} value={parsedMobile.code} onValueChange={(code) => handlePhoneChange('mobile', code, parsedMobile.number)} />
                          </div>
                          <div className="flex-1">
                            <Input value={parsedMobile.number} onChange={(e) => handlePhoneChange('mobile', parsedMobile.code, e.target.value)} placeholder="6 12 34 56 78" />
                          </div>
                        </div>
                        {errors.mobile && <p className="text-xs text-error">{errors.mobile}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className={label}>Téléphone fixe</label>
                        <div className="flex gap-2">
                          <div className="w-36 shrink-0">
                            <Select options={COUNTRY_CODES} value={parsedFixe.code} onValueChange={(code) => handlePhoneChange('telephoneFixe', code, parsedFixe.number)} />
                          </div>
                          <div className="flex-1">
                            <Input value={parsedFixe.number} onChange={(e) => handlePhoneChange('telephoneFixe', parsedFixe.code, e.target.value)} placeholder="5 XX XX XX XX" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {section('text-amber-400', 'Préférences de contact')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select label="Moyen de contact préféré" options={CONTACT_METHODS} value={formData.moyenContactPrefere || ''} onValueChange={(v) => handleChange('moyenContactPrefere', v)} />
                      <Select label="Devise préférée" options={CURRENCIES} value={formData.devisePreferee || ''} onValueChange={(v) => handleChange('devisePreferee', v)} />
                      <div className="sm:col-span-2">
                        {renderCheckboxGroup('Langue(s) parlée(s)', 'langueParlee', LANGUAGES)}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    {section('text-emerald-400', 'Adresse')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Input label="Adresse" value={formData.adresse || ''} onChange={(e) => handleChange('adresse', e.target.value)} placeholder="Numéro et rue" />
                      </div>
                      <Input label="Adresse (2)" value={formData.adresse2 || ''} onChange={(e) => handleChange('adresse2', e.target.value)} placeholder="Complément d'adresse" />
                      <Input label="Code postal" value={formData.codePostal || ''} onChange={(e) => handleChange('codePostal', e.target.value)} placeholder="Code postal" />
                      <Input label="Ville" value={formData.ville || ''} onChange={(e) => handleChange('ville', e.target.value)} placeholder="Ville" />
                      <Select label="Pays" options={COUNTRIES} value={formData.pays || ''} onValueChange={(v) => handleChange('pays', v)} />
                    </div>
                    {section('text-amber-400', 'Administratif')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Nationalité" value={formData.nationalite || ''} onChange={(e) => handleChange('nationalite', e.target.value)} placeholder="Nationalité" />
                      <Input label="Lieu de naissance" value={formData.lieuNaissance || ''} onChange={(e) => handleChange('lieuNaissance', e.target.value)} placeholder="Ville de naissance" />
                      <DatePicker label="Date de naissance" value={formData.dateNaissance || ''} onChange={(e) => handleChange('dateNaissance', e.target.value)} />
                      <Input label="N° fiscal" value={formData.numeroFiscal || ''} onChange={(e) => handleChange('numeroFiscal', e.target.value)} placeholder="Numéro fiscal" />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    {section('text-emerald-400', 'Informations complémentaires')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select label="Situation familiale" options={SITUATIONS_FAMILIALES} value={formData.situationFamiliale || ''} onValueChange={(v) => handleChange('situationFamiliale', v || undefined)} />
                      <Input label="Nombre d'enfants" type="number" min="0" value={formData.nombreEnfants?.toString() || ''} onChange={(e) => handleChange('nombreEnfants', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" />
                      <Input label="Prescripteur" value={formData.prescripteur || ''} onChange={(e) => handleChange('prescripteur', e.target.value)} placeholder="Nom du prescripteur" />
                      <Select label="Régime matrimonial" options={REGIMES_MATRIMONIAUX} value={formData.regimeMatrimonial || ''} onValueChange={(v) => handleChange('regimeMatrimonial', v)} />
                      <Input label="Site Internet personnel" type="url" value={formData.siteInternet || ''} onChange={(e) => handleChange('siteInternet', e.target.value)} placeholder="https://" />
                    </div>
                    {section('text-violet-400', 'Interne')}
                    <Textarea label="Commentaire privé" value={formData.commentairePrive || ''} onChange={(e) => handleChange('commentairePrive', e.target.value)} placeholder="Notes internes..." rows={3} />
                  </div>
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
