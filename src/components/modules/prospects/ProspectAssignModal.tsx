import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search, Shield, User, UserCheck, UserPlus, Users, X } from 'react-feather';
import StageModal, { useStageModalButtons } from '../calendar/StageModal';
import { useStageChrome } from '../calendar/useStageChrome';
import { OrbIcon, STAGE_HUES, useStageAccent, type StageHue } from '../../dashboard/Stage';
import { stagePillStyle } from './ProspectDetailStage';
import { cn } from '../../../lib/utils';

type AssignStep = 'choose' | 'agent' | 'admin';

interface TeamMember {
  id: string | number;
  first_name?: string;
  last_name?: string;
  email?: string;
  position?: string;
  role?: string;
  status?: string;
}

interface ProspectAssignModalProps {
  open: boolean;
  onClose: () => void;
  users: TeamMember[];
  currentUser?: TeamMember | null;
  onAssign: (userId: string) => void;
}

const HUES: StageHue[] = [
  STAGE_HUES.violet,
  STAGE_HUES.sky,
  STAGE_HUES.emerald,
  STAGE_HUES.amber,
  STAGE_HUES.fuchsia,
];

const hueFor = (id: string | number): StageHue => {
  const str = String(id || '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return HUES[hash % HUES.length];
};

const normalize = (value: unknown) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const displayName = (person?: TeamMember | null) => {
  if (!person) return '';
  return `${person.first_name || ''} ${person.last_name || ''}`.trim() || person.email || '';
};

const initialsOf = (person?: TeamMember | null) => {
  if (!person) return '?';
  const first = person.first_name || '';
  const last = person.last_name || '';
  const initials = `${first[0] || ''}${last[0] || ''}`.toUpperCase();
  return initials || displayName(person).slice(0, 2).toUpperCase() || '?';
};

const roleLabel = (role?: string) => {
  if (role === 'agent') return 'Agent';
  if (role === 'gerant') return 'Gérant';
  return 'Admin';
};

export function ProspectAssignModal({
  open,
  onClose,
  users,
  currentUser,
  onAssign,
}: ProspectAssignModalProps) {
  const [step, setStep] = useState<AssignStep>('choose');
  const [search, setSearch] = useState('');
  const { dark } = useStageChrome();
  const accent = useStageAccent();
  const btns = useStageModalButtons();

  useEffect(() => {
    if (open) {
      setStep('choose');
      setSearch('');
    }
  }, [open]);

  const people = useMemo(() => {
    const query = normalize(search).trim();
    const base = (users || []).filter((person) => {
      if (!person || person.status === 'supprimé') return false;
      if (step === 'agent') return person.role === 'agent';
      if (step === 'admin') {
        return (person.role === 'admin' || person.role === 'gerant')
          && String(person.id) !== String(currentUser?.id);
      }
      return false;
    });

    return base
      .map((person) => {
        const name = displayName(person) || 'Sans nom';
        return {
          id: String(person.id),
          name,
          initials: initialsOf(person),
          email: person.email || '',
          position: person.position || '',
          role: person.role,
          hue: hueFor(person.id),
        };
      })
      .filter((person) => !query || normalize(`${person.name} ${person.email} ${person.position}`).includes(query));
  }, [users, step, currentUser, search]);

  const chooseStep = step === 'choose';
  const selfName = displayName(currentUser);
  const icon = chooseStep ? UserPlus : step === 'agent' ? Users : Shield;
  const hue = chooseStep ? accent : step === 'agent' ? STAGE_HUES.emerald : STAGE_HUES.violet;
  const title = chooseStep ? 'Attribution du prospect' : step === 'agent' ? 'Choisir un agent' : 'Choisir un administrateur';
  const subtitle = chooseStep
    ? 'Choisissez à qui confier ce prospect avant de renseigner sa fiche.'
    : step === 'agent'
      ? 'Sélectionnez l’agent qui suivra ce prospect.'
      : 'Sélectionnez l’administrateur ou le gérant qui suivra ce prospect.';

  const optionCardClass = cn(
    'group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 active:scale-[0.99]',
    dark
      ? 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
      : 'border-slate-200/70 bg-white/75 hover:border-slate-300 hover:bg-white hover:shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]',
  );

  const personRowClass = cn(
    'group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 active:scale-[0.995]',
    dark
      ? 'border-white/[0.06] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.06]'
      : 'border-slate-200/60 bg-white/60 hover:border-slate-300 hover:bg-white',
  );

  return (
    <StageModal
      open={open}
      onClose={onClose}
      eyebrow="Nouveau prospect"
      title={title}
      subtitle={subtitle}
      icon={icon}
      hue={hue}
      accent={chooseStep ? accent.a : undefined}
      badge={(
        <span
          className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums"
          style={stagePillStyle(accent, dark)}
        >
          Étape {chooseStep ? '1' : '2'} / 2
        </span>
      )}
      maxWidth="max-w-lg"
      centered
      bodyClassName="pt-1"
      footer={chooseStep ? (
        <>
          <p className={cn('mr-auto text-[11px] font-medium', dark ? 'text-slate-400' : 'text-slate-500')}>
            La fiche prospect s’ouvrira après le choix de l’intervenant.
          </p>
          <button type="button" onClick={onClose} className={btns.ghost}>Annuler</button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => { setStep('choose'); setSearch(''); }}
            className={cn(btns.ghost, 'mr-auto')}
          >
            <ChevronLeft size={14} /> Retour
          </button>
          <button type="button" onClick={onClose} className={btns.ghost}>Annuler</button>
        </>
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-2.5"
        >
          {chooseStep ? (
            <>
              <p className={cn('px-0.5 pb-1 text-xs leading-relaxed', dark ? 'text-slate-400' : 'text-slate-500')}>
                Confiez ce prospect à un agent, à un autre administrateur, ou gardez-en la gestion.
              </p>

              <button
                type="button"
                className={optionCardClass}
                onClick={() => { setSearch(''); setStep('agent'); }}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(120% 160% at 0% 0%, ${STAGE_HUES.emerald.glow}, transparent 62%)` }}
                />
                <span className="relative">
                  <OrbIcon icon={Users} hue={STAGE_HUES.emerald} size={40} radius={12} />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className={cn('block text-sm font-semibold', dark ? 'text-white' : 'text-slate-900')}>
                    Confier à un agent
                  </span>
                  <span className={cn('mt-0.5 block text-[11px]', dark ? 'text-slate-400' : 'text-slate-500')}>
                    Rattacher le prospect à un agent immobilier
                  </span>
                </span>
                <span className={cn(
                  'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200 group-hover:translate-x-0.5',
                  dark ? 'border-white/10 bg-white/5 text-slate-400 group-hover:text-emerald-300' : 'border-slate-200 bg-white text-slate-400 group-hover:text-emerald-600',
                )}>
                  <ChevronRight size={14} />
                </span>
              </button>

              <button
                type="button"
                className={optionCardClass}
                onClick={() => { setSearch(''); setStep('admin'); }}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(120% 160% at 0% 0%, ${STAGE_HUES.violet.glow}, transparent 62%)` }}
                />
                <span className="relative">
                  <OrbIcon icon={Shield} hue={STAGE_HUES.violet} size={40} radius={12} />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className={cn('block text-sm font-semibold', dark ? 'text-white' : 'text-slate-900')}>
                    Confier à un administrateur
                  </span>
                  <span className={cn('mt-0.5 block text-[11px]', dark ? 'text-slate-400' : 'text-slate-500')}>
                    Faire suivre le prospect à un autre admin ou gérant
                  </span>
                </span>
                <span className={cn(
                  'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200 group-hover:translate-x-0.5',
                  dark ? 'border-white/10 bg-white/5 text-slate-400 group-hover:text-violet-300' : 'border-slate-200 bg-white text-slate-400 group-hover:text-violet-600',
                )}>
                  <ChevronRight size={14} />
                </span>
              </button>

              <div className="relative py-1.5">
                <div className={cn('absolute inset-0 flex items-center', dark ? 'text-white/10' : 'text-slate-200')}>
                  <div className="w-full border-t border-current" />
                </div>
                <div className="relative flex justify-center">
                  <span className={cn(
                    'px-3 text-[10px] font-semibold uppercase tracking-[0.18em]',
                    dark ? 'bg-[#101528] text-slate-500' : 'bg-white/80 text-slate-400',
                  )}>
                    ou
                  </span>
                </div>
              </div>

              <button
                type="button"
                className={optionCardClass}
                onClick={() => onAssign(currentUser ? String(currentUser.id) : '')}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-60"
                  style={{ background: `radial-gradient(120% 160% at 0% 0%, ${accent.glow}, transparent 62%)` }}
                />
                <span className="relative">
                  <OrbIcon icon={User} hue={accent} size={40} radius={12} />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={cn('text-sm font-semibold', dark ? 'text-white' : 'text-slate-900')}>
                      Je gère moi-même
                    </span>
                    <span
                      className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
                      style={stagePillStyle(accent, dark)}
                    >
                      Vous
                    </span>
                  </span>
                  <span className={cn('mt-0.5 block text-[11px]', dark ? 'text-slate-400' : 'text-slate-500')}>
                    {selfName ? `Ajouter le prospect sous la responsabilité de ${selfName}` : 'Ajouter le prospect sous votre responsabilité'}
                  </span>
                </span>
                <span className={cn(
                  'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200 group-hover:translate-x-0.5',
                  dark ? 'border-white/10 bg-white/5 text-slate-400' : 'border-slate-200 bg-white text-slate-400',
                )}>
                  <ChevronRight size={14} />
                </span>
              </button>
            </>
          ) : (
            <>
              <div className="relative">
                <Search
                  size={15}
                  className={cn(
                    'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2',
                    dark ? 'text-slate-500' : 'text-slate-400',
                  )}
                />
                <input
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={step === 'agent' ? 'Rechercher un agent…' : 'Rechercher un administrateur…'}
                  className={cn(
                    'h-10 w-full rounded-xl border pl-9 pr-9 text-sm outline-none transition-all duration-200',
                    dark
                      ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus:border-violet-400/60 focus:bg-white/[0.07]'
                      : 'border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400 focus:border-teal-500/60 focus:bg-white',
                  )}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Effacer la recherche"
                    className={cn(
                      'absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition-colors',
                      dark ? 'text-slate-500 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
                    )}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between px-1 pt-0.5">
                <p className={cn('text-[10px] font-bold uppercase tracking-[0.16em]', dark ? 'text-slate-500' : 'text-slate-400')}>
                  {step === 'agent' ? 'Agents disponibles' : 'Administrateurs disponibles'}
                </p>
                <span
                  className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums"
                  style={stagePillStyle(accent, dark)}
                >
                  {people.length}
                </span>
              </div>

              <div className="max-h-[264px] space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
                {people.length === 0 ? (
                  <div className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-8 text-center',
                    dark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white/50',
                  )}>
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-2xl border',
                      dark ? 'border-white/10 bg-white/[0.04] text-slate-400' : 'border-slate-200 bg-white text-slate-400',
                    )}>
                      <Users size={17} />
                    </div>
                    <p className={cn('text-sm font-semibold', dark ? 'text-white' : 'text-slate-800')}>
                      Aucun résultat
                    </p>
                    <p className={cn('max-w-[240px] text-[11px] leading-relaxed', dark ? 'text-slate-400' : 'text-slate-500')}>
                      {search
                        ? `Aucun intervenant ne correspond à « ${search} ».`
                        : step === 'agent'
                          ? 'Aucun agent disponible pour le moment.'
                          : 'Aucun autre administrateur disponible.'}
                    </p>
                  </div>
                ) : people.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    className={personRowClass}
                    onClick={() => onAssign(person.id)}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${person.hue.a}, ${person.hue.b})`,
                        boxShadow: `0 0 0 1px ${person.hue.a}33, 0 4px 12px -6px ${person.hue.glow}`,
                      }}
                    >
                      {person.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={cn('truncate text-sm font-semibold', dark ? 'text-white' : 'text-slate-800')}>
                          {person.name}
                        </span>
                        <span
                          className="shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                          style={stagePillStyle(person.hue, dark)}
                        >
                          {roleLabel(person.role)}
                        </span>
                      </span>
                      <span className={cn('mt-0.5 block truncate text-[11px]', dark ? 'text-slate-400' : 'text-slate-500')}>
                        {person.position || person.email || 'Intervenant'}
                      </span>
                    </span>
                    <span className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100',
                      dark ? 'border-white/10 bg-white/5 text-emerald-300' : 'border-slate-200 bg-white text-emerald-600',
                    )}>
                      <UserCheck size={13} />
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </StageModal>
  );
}
