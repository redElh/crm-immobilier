import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, CheckCircle, UserPlus } from 'react-feather';
import { Prospect } from '../../../types/prospect';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { DatePicker } from '../../ui/DatePicker';
import { TimePicker } from '../../ui/TimePicker';
import { cn } from '../../../lib/utils';
import StageModal, { useStageFormClasses, useStageModalButtons } from '../calendar/StageModal';
import { useStageChrome } from '../calendar/useStageChrome';
import { STAGE_HUES, ShimmerProgress, StageTabSwap, type StageHue } from '../../dashboard/Stage';
import { saveDraft, getDraft, deleteDraft } from '../../../services/prospectDraftStorage';
import { calcProspectCompletion } from '../../../utils/prospectCompletion';

interface ProspectFormModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt'>) => void;
  prospect?: Prospect;
  draftId?: string;
  userId?: string;
  onDraftChange?: () => void;
}

type FormData = Omit<Prospect, 'id' | 'createdAt' | 'updatedAt'>;

/* Light-mode identity shared app-wide (sidebar, cards, modals): teal-emerald */
const SIDEBAR_EMERALD: StageHue = {
  a: '#2DD4BF',
  b: '#0D9488',
  glow: 'rgba(13,148,136,0.35)',
  line: '#14B8A6',
};

const TYPES = [
  { value: 'Acheter', label: 'Acheter' },
  { value: 'Louer', label: 'Louer' },
  { value: 'Vendre', label: 'Vendre' },
  { value: 'Faire estimer', label: 'Faire estimer' },
];

const ORIGINS = [
  { value: 'Site web', label: 'Site web' },
  { value: 'Portail', label: 'Portail' },
  { value: 'Référence', label: 'Référence' },
  { value: 'Appel téléphonique', label: 'Appel téléphonique' },
  { value: 'Réseaux sociaux', label: 'Réseaux sociaux' },
  { value: 'Visite agence', label: 'Visite agence' },
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

const CIVILITIES = [
  { value: 'M.', label: 'M.' },
  { value: 'Mme', label: 'Mme' },
  { value: 'Mlle', label: 'Mlle' },
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
  { value: '+974', label: '+974 (Qatar)' },
  { value: '+966', label: '+966 (Arabie Saoudite)' },
  { value: '+90', label: '+90 (Turquie)' },
  { value: '+86', label: '+86 (Chine)' },
  { value: '+81', label: '+81 (Japon)' },
  { value: '+82', label: '+82 (Corée du Sud)' },
  { value: '+65', label: '+65 (Singapour)' },
  { value: '+91', label: '+91 (Inde)' },
  { value: '+61', label: '+61 (Australie)' },
];

const MEANS_OF_CONTACT = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook_messenger', label: 'Facebook Messenger' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'wechat', label: 'WeChat' },
  { value: 'line', label: 'Line' },
  { value: 'telegram', label: 'Telegram' },
];

const CATEGORIES = [
  { value: 'Vente', label: 'Vente' },
  { value: 'Location', label: 'Location' },
  { value: 'Location saisonnière', label: 'Location saisonnière' },
  { value: 'Programme', label: 'Programme' },
  { value: 'Viager', label: 'Viager' },
  { value: 'Enchère', label: 'Enchère' },
];

const PROPERTY_TYPES = [
  { value: 'Appartement', label: 'Appartement' },
  { value: 'Maison', label: 'Maison' },
  { value: 'Terrain', label: 'Terrain' },
  { value: 'Commerce', label: 'Commerce' },
  { value: 'Garage / Parking', label: 'Garage / Parking' },
  { value: 'Immeuble', label: 'Immeuble' },
  { value: 'Bureau', label: 'Bureau' },
  { value: 'Bateau', label: 'Bateau' },
  { value: 'Locaux activité / Entrepos', label: 'Locaux activité / Entrepos' },
  { value: 'Cave / Box', label: 'Cave / Box' },
];

const CURRENCIES = [
  { value: 'MAD', label: 'MAD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
];

const VIEW_TYPES = [
  { value: 'Aperçu', label: 'Aperçu' },
  { value: 'Dégagée', label: 'Dégagée' },
  { value: 'Externe', label: 'Externe' },
  { value: 'Interne', label: 'Interne' },
  { value: 'Panoramique', label: 'Panoramique' },
  { value: 'Vis-à-vis', label: 'Vis-à-vis' },
];

const VIEW_DETAILS = [
  { value: 'Campagne', label: 'Campagne' },
  { value: 'Ciel', label: 'Ciel' },
  { value: 'Collines', label: 'Collines' },
  { value: 'Cour', label: 'Cour' },
  { value: 'Fleuve', label: 'Fleuve' },
  { value: 'Forêt', label: 'Forêt' },
  { value: 'Golf', label: 'Golf' },
  { value: 'Jardin', label: 'Jardin' },
  { value: 'Lac', label: 'Lac' },
  { value: 'Mer', label: 'Mer' },
  { value: 'Montagnes', label: 'Montagnes' },
  { value: 'Monument', label: 'Monument' },
  { value: 'Parc', label: 'Parc' },
  { value: 'Piscine', label: 'Piscine' },
  { value: 'Pistes de ski', label: 'Pistes de ski' },
  { value: 'Place', label: 'Place' },
  { value: 'Port', label: 'Port' },
  { value: 'Rivière', label: 'Rivière' },
  { value: 'Rue', label: 'Rue' },
  { value: 'Verdure', label: 'Verdure' },
  { value: 'Vignes', label: 'Vignes' },
  { value: 'Village', label: 'Village' },
  { value: 'Ville', label: 'Ville' },
];

const parsePhone = (value: string) => {
  if (!value) return { code: '+212', number: '' };
  const sorted = COUNTRY_CODES.map((c) => c.value).sort((a, b) => b.length - a.length);
  for (const code of sorted) {
    if (value.startsWith(code)) return { code, number: value.slice(code.length).trim() };
  }
  return { code: '+212', number: value };
};

const today = new Date().toISOString().slice(0, 10);
const nowTime = new Date().toTimeString().slice(0, 5);

export const ProspectFormModal = ({ onClose, onSubmit, prospect, draftId: initialDraftId, userId, onDraftChange }: ProspectFormModalProps) => {
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(0);
  const [ready, setReady] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
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
  }, [ready, step]);

  const steps = [
    { id: 1, label: 'Général' },
    { id: 2, label: 'Contact' },
    { id: 3, label: 'Produit' },
    { id: 4, label: 'Critères' },
  ];

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

  const initialDate = prospect?.date ? String(prospect.date).split('T')[0] : today;
  const initialTime = prospect?.date ? String(prospect.date).split('T')[1]?.slice(0, 5) || nowTime : nowTime;
  const [formDate, setFormDate] = useState(initialDate);
  const [formTime, setFormTime] = useState(initialTime);

  const [formData, setFormData] = useState<FormData>(() => {
    if (prospect) {
      const { id, createdAt, updatedAt, ...rest } = prospect;
      return rest;
    }
    return {
      type: 'Acheter',
      origin: 'Site web',
      date: `${today}T${nowTime}`,
      message: '',
      civility: 'M.',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      mobile: '',
      spokenLanguage: 'Français',
      meansOfContact: ['email'],
      categories: '',
      propertyTypes: [],
      location: '',
      rooms: undefined,
      bedrooms: undefined,
      minSurface: undefined,
      maxPrice: undefined,
      currency: 'MAD',
      viewType: '',
      viewDetail: '',
      status: 'Nouveau',
    };
  });

  const [savedDraftId, setSavedDraftId] = useState<string | undefined>(initialDraftId || undefined);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Restore draft on mount
  useEffect(() => {
    if (!initialDraftId || !userId) return;
    const draft = getDraft(userId, initialDraftId);
    if (draft) {
      setFormData(prev => ({ ...prev, ...draft.data }));
      if (draft.data.date) {
        const parts = String(draft.data.date).split('T');
        if (parts[0]) setFormDate(parts[0]);
        if (parts[1]) setFormTime(parts[1].slice(0, 5));
      }
    }
  }, []);

  // Auto-save debounced 2s
  useEffect(() => {
    if (!savedDraftId || !userId) return;
    const timer = setTimeout(() => {
      const data = formDataRef.current;
      const completion = calcProspectCompletion(data as Prospect);
      saveDraft(userId, { ...data, _draftId: savedDraftId }, completion);
      onDraftChange?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData, savedDraftId]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePhoneChange = (field: 'phone' | 'mobile', code: string, number: string) => {
    const value = `${code} ${number}`.trim();
    handleChange(field, value);
  };

  const handleCheckboxGroup = (field: 'propertyTypes' | 'meansOfContact', value: string) => {
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
    const draft = saveDraft(userId, data, calcProspectCompletion(formData as Prospect));
    if (!savedDraftId) setSavedDraftId(draft.id);
    onDraftChange?.();
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Prénom requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Nom requis';
    if (!formData.email.trim()) newErrors.email = 'Email requis';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.phone.trim()) newErrors.phone = 'Téléphone requis';
    if (!formData.categories) newErrors.categories = 'Sélectionnez une catégorie';
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
    field: 'propertyTypes' | 'meansOfContact',
    options: { value: string; label: string }[],
    error?: string,
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
      {error && <p className={errClass}>{error}</p>}
    </div>
  );

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
              onClick={() => handleChange(field, opt.value)}
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

  const parsedPhone = parsePhone(formData.phone);
  const parsedMobile = parsePhone(formData.mobile || '');
  const completion = calcProspectCompletion(formData as Prospect);
  const completionHue = completion >= 80
    ? { a: '#34D399', b: '#059669', glow: 'rgba(52,211,153,0.45)' }
    : completion >= 50
      ? { a: '#FBBF24', b: '#B45309', glow: 'rgba(251,191,36,0.40)' }
      : { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.40)' };

  return (
    <StageModal
      open
      onClose={onClose}
      eyebrow={prospect ? 'Modification' : 'Création'}
      title={prospect ? 'Modifier le prospect' : 'Nouveau prospect'}
      subtitle="Renseignez les informations puis validez pour suivre le prospect."
      icon={UserPlus}
      hue={dark ? STAGE_HUES.violet : SIDEBAR_EMERALD}
      accent={dark ? '#8B7CFF' : '#14B8A6'}
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
            <button type="button" onClick={() => goTo(step + 1)} className={btns.primary}>
              Suivant
            </button>
          ) : (
            <button type="submit" form="prospect-form" className={btns.primary}>
              {prospect ? 'Enregistrer' : 'Créer le prospect'}
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

      <form id="prospect-form" onSubmit={handleSubmit}>
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
                {section('text-violet-400', 'Informations générales')}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Type" options={TYPES} value={formData.type} onValueChange={(v) => handleChange('type', v)} />
                  <Select label="Origine" options={ORIGINS} value={formData.origin} onValueChange={(v) => handleChange('origin', v)} />
                  <DatePicker
                    label="Date"
                    value={formDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormDate(v);
                      handleChange('date', `${v}T${formTime}`);
                    }}
                  />
                  <TimePicker
                    label="Heure"
                    value={formTime}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormTime(v);
                      handleChange('date', `${formDate}T${v}`);
                    }}
                  />
                </div>
                <Textarea label="Message / Notes" value={formData.message} onChange={(e) => handleChange('message', e.target.value)} placeholder="Message initial du prospect..." rows={3} />
              </>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {section('text-sky-400', 'Identité & coordonnées')}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Langue parlée" options={LANGUAGES} value={formData.spokenLanguage} onValueChange={(v) => handleChange('spokenLanguage', v)} />
                  <Select label="Civilité" options={CIVILITIES} value={formData.civility} onValueChange={(v) => handleChange('civility', v)} />
                  <Input label="Prénom" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} error={errors.firstName} placeholder="Jean" />
                  <Input label="Nom" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} error={errors.lastName} placeholder="Dupont" />
                  <Input label="Email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} error={errors.email} placeholder="jean@email.com" />
                  <div className="space-y-1.5">
                    <label className={label}>Téléphone</label>
                    <div className="flex gap-2">
                      <div className="w-36 shrink-0">
                        <Select options={COUNTRY_CODES} value={parsedPhone.code} onValueChange={(code) => handlePhoneChange('phone', code, parsedPhone.number)} />
                      </div>
                      <div className="flex-1">
                        <Input value={parsedPhone.number} onChange={(e) => handlePhoneChange('phone', parsedPhone.code, e.target.value)} placeholder="6 12 34 56 78" />
                      </div>
                    </div>
                    {errors.phone && <p className="text-xs text-error">{errors.phone}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className={label}>Mobile</label>
                    <div className="flex gap-2">
                      <div className="w-36 shrink-0">
                        <Select options={COUNTRY_CODES} value={parsedMobile.code} onValueChange={(code) => handlePhoneChange('mobile', code, parsedMobile.number)} />
                      </div>
                      <div className="flex-1">
                        <Input value={parsedMobile.number} onChange={(e) => handlePhoneChange('mobile', parsedMobile.code, e.target.value)} placeholder="6 98 76 54 32" />
                      </div>
                    </div>
                  </div>
                </div>
                {renderCheckboxGroup('Moyens de contact', 'meansOfContact', MEANS_OF_CONTACT)}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                {section('text-amber-400', 'Catégories & biens')}
                {renderRadioGroup('Catégories', 'categories', CATEGORIES, errors.categories)}
                {renderCheckboxGroup('Types de bien', 'propertyTypes', PROPERTY_TYPES)}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                {section('text-emerald-400', 'Critères de recherche')}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input label="Localisation" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="Ville, quartier..." />
                  </div>
                  <Input label="Pièces" type="number" min="0" value={formData.rooms?.toString() || ''} onChange={(e) => handleChange('rooms', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="3" />
                  <Input label="Chambres" type="number" min="0" value={formData.bedrooms?.toString() || ''} onChange={(e) => handleChange('bedrooms', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="2" />
                  <Input label="Surface min (m²)" type="number" min="0" value={formData.minSurface?.toString() || ''} onChange={(e) => handleChange('minSurface', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="80" />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input label="Budget max" type="number" min="0" value={formData.maxPrice?.toString() || ''} onChange={(e) => handleChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="500000" />
                    </div>
                    <div className="w-24">
                      <Select label="Devise" options={CURRENCIES} value={formData.currency} onValueChange={(v) => handleChange('currency', v)} />
                    </div>
                  </div>
                  <Select label="Vue" options={VIEW_TYPES} value={formData.viewType || ''} onValueChange={(v) => handleChange('viewType', v)} />
                  <Select label="Détail vue" options={VIEW_DETAILS} value={formData.viewDetail || ''} onValueChange={(v) => handleChange('viewDetail', v)} />
                </div>
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
