import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { Award } from 'react-feather';
import { Prospect } from '../../../types/prospect';
import { DatePicker } from '../../ui/DatePicker';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { cn } from '../../../lib/utils';
import StageModal, { useStageFormClasses, useStageModalButtons } from '../calendar/StageModal';
import { useStageChrome } from '../calendar/useStageChrome';
import { STAGE_HUES, ShimmerProgress, StageTabSwap, type StageHue } from '../../dashboard/Stage';

interface QualificationFormModalProps {
  onClose: () => void;
  onSubmit: (data: {
    type: string;
    civility: string;
    firstName: string;
    lastName: string;
    emailPrincipal: string;
    emailSecondaire: string;
    mobile: string;
    telephoneFixe: string;
    profession: string;
    lieuNaissance: string;
    dateNaissance: string;
    nationalite: string;
    numeroFiscal: string;
    adresse: string;
    adresse2: string;
    codePostal: string;
    pays: string;
    devisePreferee: string;
    situationFamiliale: string;
    nombreEnfants: string;
    prescripteur: string;
    regimeMatrimonial: string;
    siteInternet: string;
    langueParlee: string;
  }) => void;
  prospect: Prospect;
}

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

const REGIMES_MATRIMONIAUX = [
  { value: 'Communauté de biens', label: 'Communauté de biens' },
  { value: 'Communauté universelle', label: 'Communauté universelle' },
  { value: 'Séparation des biens', label: 'Séparation des biens' },
];

const CIVILITIES = [
  { value: 'M.', label: 'M.' },
  { value: 'Mme', label: 'Mme' },
  { value: 'Mlle', label: 'Mlle' },
  { value: 'Autre', label: 'Autre' },
];

const COUNTRIES = [
  { value: 'Afghanistan', label: 'Afghanistan' },
  { value: 'Afrique du Sud', label: 'Afrique du Sud' },
  { value: 'Algérie', label: 'Algérie' },
  { value: 'Allemagne', label: 'Allemagne' },
  { value: 'Arabie Saoudite', label: 'Arabie Saoudite' },
  { value: 'Belgique', label: 'Belgique' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Côte d\'Ivoire', label: 'Côte d\'Ivoire' },
  { value: 'Égypte', label: 'Égypte' },
  { value: 'Émirats Arabes Unis', label: 'Émirats Arabes Unis' },
  { value: 'Espagne', label: 'Espagne' },
  { value: 'France', label: 'France' },
  { value: 'Italie', label: 'Italie' },
  { value: 'Luxembourg', label: 'Luxembourg' },
  { value: 'Maroc', label: 'Maroc' },
  { value: 'Pays-Bas', label: 'Pays-Bas' },
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Royaume-Uni', label: 'Royaume-Uni' },
  { value: 'Sénégal', label: 'Sénégal' },
  { value: 'Suisse', label: 'Suisse' },
  { value: 'Tunisie', label: 'Tunisie' },
  { value: 'Turquie', label: 'Turquie' },
  { value: 'États-Unis', label: 'États-Unis' },
  { value: 'Autre', label: 'Autre' },
];

const CURRENCIES = [
  { value: 'MAD', label: 'MAD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CHF', label: 'CHF' },
  { value: 'CAD', label: 'CAD' },
  { value: 'Autre', label: 'Autre' },
];

const SITUATIONS_FAMILIALES = [
  { value: 'Célibataire', label: 'Célibataire' },
  { value: 'Marié', label: 'Marié' },
  { value: 'Divorcé', label: 'Divorcé' },
  { value: 'Veuf', label: 'Veuf' },
];

const COMPLETION_KEYS = [
  'type', 'civility', 'firstName', 'lastName', 'emailPrincipal', 'emailSecondaire',
  'mobile', 'telephoneFixe', 'profession', 'lieuNaissance', 'dateNaissance', 'nationalite',
  'numeroFiscal', 'adresse', 'adresse2', 'codePostal', 'pays', 'devisePreferee',
  'situationFamiliale', 'nombreEnfants', 'prescripteur', 'regimeMatrimonial', 'siteInternet',
] as const;

const parsePhone = (value: string) => {
  if (!value) return { code: '+212', number: '' };
  const sorted = COUNTRY_CODES.map((c) => c.value).sort((a, b) => b.length - a.length);
  for (const code of sorted) {
    if (value.startsWith(code)) return { code, number: value.slice(code.length).trim() };
  }
  return { code: '+212', number: value };
};

export const QualificationFormModal = ({ onClose, onSubmit, prospect }: QualificationFormModalProps) => {
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(0);
  const [ready, setReady] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState(0);
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
    { id: 1, label: 'Identité' },
    { id: 2, label: 'Contact' },
    { id: 3, label: 'Profil' },
    { id: 4, label: 'Adresse' },
    { id: 5, label: 'Compléments' },
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

  const [formData, setFormData] = useState({
    type: 'Particulier',
    civility: prospect.civility,
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    emailPrincipal: prospect.email,
    emailSecondaire: '',
    mobile: prospect.mobile || '',
    telephoneFixe: '',
    profession: '',
    lieuNaissance: '',
    dateNaissance: '',
    nationalite: '',
    numeroFiscal: '',
    adresse: '',
    adresse2: '',
    codePostal: '',
    pays: '',
    devisePreferee: '',
    situationFamiliale: '',
    nombreEnfants: '',
    prescripteur: '',
    regimeMatrimonial: '',
    siteInternet: '',
    langueParlee: prospect.spokenLanguage,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (field: 'mobile' | 'telephoneFixe', code: string, number: string) => {
    const value = `${code} ${number}`.trim();
    handleChange(field, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderRadioGroup = (
    title: string,
    field: string,
    options: { value: string; label: string }[],
  ) => (
    <div className="space-y-2">
      <p className={label}>{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = formData[field as keyof typeof formData] === opt.value;
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
  const parsedFixe = parsePhone(formData.telephoneFixe);

  const filledCount = COMPLETION_KEYS.filter(
    (k) => String(formData[k] ?? '').trim() !== '',
  ).length;
  const completion = Math.round((filledCount / COMPLETION_KEYS.length) * 100);
  const completionHue = completion >= 80
    ? { a: '#34D399', b: '#059669', glow: 'rgba(52,211,153,0.45)' }
    : completion >= 50
      ? { a: '#FBBF24', b: '#B45309', glow: 'rgba(251,191,36,0.40)' }
      : { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.40)' };

  return (
    <StageModal
      open
      onClose={onClose}
      eyebrow="Qualification"
      title="Qualifier le prospect"
      subtitle="Complétez le dossier pour préparer la conversion en contact."
      icon={Award}
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
          {step > 1 && (
            <button type="button" onClick={() => goTo(step - 1)} className={btns.ghost}>
              Précédent
            </button>
          )}
          <button type="button" onClick={onClose} className={btns.ghost}>
            Annuler
          </button>
          {step < steps.length ? (
            <button type="button" onClick={() => goTo(step + 1)} className={btns.primary}>
              Suivant
            </button>
          ) : (
            <button type="submit" form="qualification-form" className={btns.primary}>
              <Award size={14} /> Qualifier le prospect
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

      <form id="qualification-form" onSubmit={handleSubmit}>
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
                    {section('text-violet-400', 'Type de contact')}
                    {renderRadioGroup('Type', 'type', TYPES)}
                    {section('text-sky-400', 'Identité')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select label="Civilité" options={CIVILITIES} value={formData.civility} onValueChange={(v) => handleChange('civility', v)} />
                      <Input label="Prénom" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
                      <Input label="Nom" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    {section('text-sky-400', 'Coordonnées')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Email principal" type="email" value={formData.emailPrincipal} onChange={(e) => handleChange('emailPrincipal', e.target.value)} placeholder="exemple@email.com" />
                      <Input label="Email secondaire" type="email" value={formData.emailSecondaire} onChange={(e) => handleChange('emailSecondaire', e.target.value)} placeholder="exemple@email.com" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <div className="space-y-1.5">
                        <label className={label}>Télécopie</label>
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
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    {section('text-amber-400', 'Identité détaillée')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Profession" value={formData.profession} onChange={(e) => handleChange('profession', e.target.value)} placeholder="Métier..." />
                      <Input label="Lieu de naissance" value={formData.lieuNaissance} onChange={(e) => handleChange('lieuNaissance', e.target.value)} placeholder="Ville de naissance" />
                      <DatePicker label="Date de naissance" value={formData.dateNaissance} onChange={(e) => handleChange('dateNaissance', e.target.value)} />
                      <Input label="Nationalité" value={formData.nationalite} onChange={(e) => handleChange('nationalite', e.target.value)} placeholder="Nationalité" />
                      <Input label="N° fiscale" value={formData.numeroFiscal} onChange={(e) => handleChange('numeroFiscal', e.target.value)} placeholder="Numéro fiscal" />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    {section('text-emerald-400', 'Adresse')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Input label="Adresse" value={formData.adresse} onChange={(e) => handleChange('adresse', e.target.value)} placeholder="Numéro et rue" />
                      </div>
                      <Input label="Adresse (2)" value={formData.adresse2} onChange={(e) => handleChange('adresse2', e.target.value)} placeholder="Complément d'adresse" />
                      <Input label="Code postal" value={formData.codePostal} onChange={(e) => handleChange('codePostal', e.target.value)} placeholder="Code postal" />
                      <Select label="Pays" options={COUNTRIES} value={formData.pays} onValueChange={(v) => handleChange('pays', v)} style={{ paddingTop: '0.625rem', paddingBottom: '0.625rem' }} />
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4">
                    {section('text-fuchsia-400', 'Informations complémentaires')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select label="Devise préférée" options={CURRENCIES} value={formData.devisePreferee} onValueChange={(v) => handleChange('devisePreferee', v)} />
                      <Select label="Situation familiale" options={SITUATIONS_FAMILIALES} value={formData.situationFamiliale} onValueChange={(v) => handleChange('situationFamiliale', v)} />
                      <Input label="Nombre d'enfants" type="number" min="0" value={formData.nombreEnfants} onChange={(e) => handleChange('nombreEnfants', e.target.value)} placeholder="0" />
                      <Input label="Prescripteur" value={formData.prescripteur} onChange={(e) => handleChange('prescripteur', e.target.value)} placeholder="Nom du prescripteur" />
                      <Select label="Régime matrimonial" options={REGIMES_MATRIMONIAUX} value={formData.regimeMatrimonial} onValueChange={(v) => handleChange('regimeMatrimonial', v)} />
                      <Input label="Site Internet Personnel" type="url" value={formData.siteInternet} onChange={(e) => handleChange('siteInternet', e.target.value)} placeholder="https://" />
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
