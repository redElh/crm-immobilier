import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import type { ComponentType, FormEvent, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Save, CheckCircle, Target, Home, Briefcase, Key, Compass } from 'react-feather';
import { cn } from '../../../lib/utils';
import StageModal, { useStageModalButtons } from '../calendar/StageModal';
import { useStageChrome } from '../calendar/useStageChrome';
import { ShimmerProgress, StageTabSwap, type StageHue } from '../../dashboard/Stage';

export type ClientFormType = 'Acheteur' | 'Vendeur' | 'Bailleur' | 'Locataire' | 'Voyageur';

const VIOLET: StageHue = { a: '#8B7CFF', b: '#5B3FD6', glow: 'rgba(124,92,255,0.40)', line: '#7C5CFF' };
const SKY: StageHue = { a: '#60A5FA', b: '#2563EB', glow: 'rgba(59,130,246,0.40)', line: '#3B82F6' };
const EMERALD: StageHue = { a: '#34D399', b: '#059669', glow: 'rgba(52,211,153,0.45)', line: '#10B981' };
const AMBER: StageHue = { a: '#FBBF24', b: '#B45309', glow: 'rgba(251,191,36,0.40)', line: '#F59E0B' };
const FUCHSIA: StageHue = { a: '#E879F9', b: '#A21CAF', glow: 'rgba(217,70,239,0.40)', line: '#D946EF' };

/* Light-mode identity shared app-wide (sidebar, cards, modals): teal-emerald */
const SIDEBAR_EMERALD: StageHue = {
  a: '#2DD4BF',
  b: '#0D9488',
  glow: 'rgba(13,148,136,0.35)',
  line: '#14B8A6',
};

interface ClientTypeMeta {
  icon: ComponentType<{ size?: number | string; className?: string }>;
  hue: StageHue;
  accent: string;
  create: string;
  update: string;
  subtitle: string;
}

export const CLIENT_TYPE_META: Record<ClientFormType, ClientTypeMeta> = {
  Acheteur: {
    icon: Target,
    hue: VIOLET,
    accent: '#8B7CFF',
    create: 'Nouvel acheteur',
    update: "Modifier l'acheteur",
    subtitle: "Définissez le profil, la recherche et le financement de l'acheteur.",
  },
  Vendeur: {
    icon: Home,
    hue: SKY,
    accent: '#60A5FA',
    create: 'Nouveau vendeur',
    update: 'Modifier le vendeur',
    subtitle: 'Décrivez le bien à vendre et la motivation du vendeur.',
  },
  Bailleur: {
    icon: Briefcase,
    hue: EMERALD,
    accent: '#34D399',
    create: 'Nouveau bailleur',
    update: 'Modifier le bailleur',
    subtitle: 'Renseignez le bien à louer et les préférences de location.',
  },
  Locataire: {
    icon: Key,
    hue: AMBER,
    accent: '#FBBF24',
    create: 'Nouveau locataire',
    update: 'Modifier le locataire',
    subtitle: 'Décrivez la recherche et la situation du locataire.',
  },
  Voyageur: {
    icon: Compass,
    hue: FUCHSIA,
    accent: '#E879F9',
    create: 'Nouveau voyageur',
    update: 'Modifier le voyageur',
    subtitle: 'Précisez le voyage et les préférences du voyageur.',
  },
};

interface StageClientFormShellProps {
  clientType: ClientFormType;
  editing?: boolean;
  onClose: () => void;
  tabs: { id: number; label: string }[];
  step: number;
  onStepChange: (id: number) => void;
  completion: number;
  onNext?: () => boolean;
  onSubmit: () => void;
  isSubmitting?: boolean;
  savedDraftId?: string | null;
  onSaveDraft?: () => void;
  isGerant?: boolean;
  formId: string;
  children: ReactNode;
}

export const StageClientFormShell = ({
  clientType,
  editing = false,
  onClose,
  tabs,
  step,
  onStepChange,
  completion,
  onNext,
  onSubmit,
  isSubmitting = false,
  savedDraftId,
  onSaveDraft,
  isGerant = false,
  formId,
  children,
}: StageClientFormShellProps) => {
  const meta = CLIENT_TYPE_META[clientType];
  const { staged, dark } = useStageChrome();
  const btns = useStageModalButtons();

  const [ready, setReady] = useState(false);
  const [dir, setDir] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState(0);

  const lastStep = tabs[tabs.length - 1].id;

  const goTo = (id: number) => {
    if (id === step || id < 1 || id > lastStep) return;
    setDir(id > step ? 1 : -1);
    onStepChange(id);
  };

  /* Mount the fields only after the modal's entry spring has settled:
     anchoring floating pickers mid-animation left first-mount overlays
     broken until a tab switch remounted them. */
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 320);
    return () => window.clearTimeout(t);
  }, []);

  /* Measured content height → the modal body glides between tab sizes.
     `children` is a fresh element on every render, so this re-measures after
     each commit (state bails when the height is unchanged) and async content
     (selected contact, uploaded files, validation errors) also re-syncs. */
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (el) setContentH(el.offsetHeight);
  }, [ready, step, children]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const completionHue = completion >= 80
    ? { a: '#34D399', b: '#059669', glow: 'rgba(52,211,153,0.45)' }
    : completion >= 50
      ? { a: '#FBBF24', b: '#B45309', glow: 'rgba(251,191,36,0.40)' }
      : { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.40)' };

  const Icon = meta.icon;
  const showDraftButton = !editing && !savedDraftId && !!onSaveDraft;

  const tabClass = (active: boolean) =>
    cn(
      'flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200',
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

  const primaryClass = btns.primary;

  return (
    <StageModal
      open
      onClose={onClose}
      eyebrow={editing ? 'Modification' : 'Création'}
      title={editing ? meta.update : meta.create}
      subtitle={meta.subtitle}
      icon={Icon}
      hue={dark ? meta.hue : SIDEBAR_EMERALD}
      accent={dark ? meta.accent : '#14B8A6'}
      badge={
        <span
          className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums"
          style={{ color: dark ? completionHue.a : completionHue.b, borderColor: `${completionHue.a}55`, background: `${completionHue.a}1A` }}
        >
          {completion}%
        </span>
      }
      maxWidth="max-w-5xl"
      centered
      bodyClassName="max-h-[calc(100vh-280px)] min-h-[120px] overflow-y-auto scrollbar-thin space-y-4 pt-1"
      footer={
        <>
          <div className="mr-auto">
            {showDraftButton ? (
              <button type="button" onClick={onSaveDraft} className={btns.ghost} disabled={isSubmitting}>
                <Save size={14} /> Brouillon
              </button>
            ) : savedDraftId && !editing ? (
              <span className={cn('flex items-center gap-1.5 text-[11px] font-medium', staged && dark ? 'text-emerald-300' : 'text-emerald-600')}>
                <CheckCircle size={12} /> Auto-sauvegarde
              </span>
            ) : null}
          </div>
          {step > 1 && (
            <button type="button" onClick={() => goTo(step - 1)} className={btns.ghost} disabled={isSubmitting}>
              Précédent
            </button>
          )}
          <button type="button" onClick={onClose} className={btns.ghost} disabled={isSubmitting}>
            Annuler
          </button>
          {step < lastStep ? (
            <button type="button" onClick={() => { if (!onNext || onNext()) goTo(step + 1); }} className={primaryClass}>
              Suivant
            </button>
          ) : (
            <button type="submit" form={formId} className={cn(primaryClass, 'disabled:opacity-60')} disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : editing ? meta.update : meta.create}
            </button>
          )}
        </>
      }
    >
      <div className={cn('flex gap-1 overflow-x-auto scrollbar-thin rounded-xl border p-1', staged ? (dark ? 'border-white/10 bg-white/[0.03]' : 'border-teal-900/10 bg-white/60') : 'border-border bg-background')}>
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => goTo(t.id)} className={tabClass(step === t.id)}>
            {t.label}
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

      <form id={formId} onSubmit={handleSubmit}>
        <motion.div
          initial={false}
          animate={{ height: contentH }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div ref={contentRef} className="pt-1 stage-form">
            {ready ? (
              <StageTabSwap key={step} tabId={String(step)} duration={0.3} direction={dir}>
                {children}
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
