import { Controller, useWatch } from 'react-hook-form';
import { Check, Share2, Globe, Layers, Info, Award } from 'react-feather';
import { SectionCard } from './stage';
import { PORTAL_PARTNER_GROUPS } from '../../../../data/portalPartners';
import { useStageChrome } from '../../calendar/useStageChrome';
import { useStageTheme } from '../../../dashboard/Stage';

interface TransfertTabProps {
  control: any;
  setValue: any;
  isGerant?: boolean;
}

function TransfertStats({ control, isDark }: { control: any; isDark: boolean }) {
  const portals = useWatch({ control, name: 'transfert.portals' }) as any;
  const total = PORTAL_PARTNER_GROUPS.reduce((a, g) => a + g.partners.length, 0);
  const selected = PORTAL_PARTNER_GROUPS.reduce((a, g) => a + g.partners.filter((p) => portals?.[p.key]).length, 0);
  const hasAny = selected > 0;
  return (
    <>
      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
        style={{
          color: hasAny ? (isDark ? '#6EE7B7' : '#047857') : isDark ? 'rgba(226,232,240,0.55)' : 'rgba(15,23,42,0.45)',
          borderColor: hasAny ? (isDark ? 'rgba(52,211,153,0.28)' : 'rgba(52,211,153,0.22)') : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
          background: hasAny ? (isDark ? 'rgba(52,211,153,0.10)' : 'rgba(52,211,153,0.08)') : 'transparent',
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: hasAny ? (isDark ? '#6EE7B7' : '#10B981') : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.18)'), boxShadow: hasAny ? `0 0 8px ${isDark ? 'rgba(110,231,183,0.6)' : 'rgba(16,185,129,0.35)'}` : 'none' }} />
        {selected}/{total} sélectionné{selected !== 1 ? 's' : ''}
      </span>
    </>
  );
}

export function TransfertTab({ control, setValue, isGerant = false }: TransfertTabProps) {
  const portalImageSrc = (image: string) => encodeURI(`/portail/${image}`);
  const { staged, dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = staged ? dark : theme === 'dark';

  const updateGroup = (groupId: string, checked: boolean) => {
    const group = PORTAL_PARTNER_GROUPS.find((item) => item.id === groupId);
    if (!group) return;
    group.partners.forEach((portal) => {
      setValue(`transfert.portals.${portal.key}`, checked, { shouldDirty: true, shouldTouch: true });
    });
  };

  if (staged) {
    return (
      <div className="space-y-5">
        <SectionCard value="transfert" title="Transfert / Diffusion" icon={Share2} subtitle="Diffusion sur les portails partenaires" defaultOpen>
          {/* toolbar */}
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.62)',
              boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.85), 0 8px 22px -14px rgba(13,148,136,0.18)',
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide"
                style={{
                  color: isDark ? '#A78BFA' : '#0D9488',
                  borderColor: isDark ? 'rgba(167,139,250,0.30)' : 'rgba(13,148,136,0.20)',
                  background: isDark ? 'rgba(167,139,250,0.12)' : 'rgba(20,184,166,0.10)',
                }}
              >
                <Globe size={11} />
                {PORTAL_PARTNER_GROUPS.reduce((a, g) => a + g.partners.length, 0)} portails
              </span>
              <TransfertStats control={control} isDark={isDark} />
              <span
                className="hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  color: isDark ? 'rgba(148,163,184,0.75)' : 'rgba(15,23,42,0.55)',
                  borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
                }}
              >
                {PORTAL_PARTNER_GROUPS.length} groupes
              </span>
            </div>
            <span className={`hidden items-center gap-1.5 text-[11px] sm:flex ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>
              <Info size={12} />
              Cochez les portails où diffuser
            </span>
          </div>

          <div className="space-y-4">
            {PORTAL_PARTNER_GROUPS.map((group) => (
              <div
                key={group.id}
                className="overflow-hidden rounded-2xl border"
                style={{
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
                  boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 12px 28px -18px rgba(13,148,136,0.18)',
                }}
              >
                <div
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.45)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-xl border"
                      style={{
                        borderColor: isDark ? 'rgba(167,139,250,0.22)' : 'rgba(20,184,166,0.18)',
                        background: isDark ? 'rgba(167,139,250,0.12)' : 'rgba(20,184,166,0.10)',
                        color: isDark ? '#A78BFA' : '#0D9488',
                      }}
                    >
                      <Globe size={14} />
                    </span>
                    <div>
                      <h4 className={`text-sm font-bold tracking-[-0.1px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{group.label}</h4>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>{group.partners.length} portails · {group.id === 'maroc' ? 'Priorité nationale' : 'International & niche'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)' }}>
                    <button
                      type="button"
                      onClick={() => updateGroup(group.id, false)}
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors"
                      style={{ color: isDark ? 'rgba(148,163,184,0.9)' : 'rgba(15,23,42,0.6)' }}
                    >
                      Décocher tous
                    </button>
                    <span className="h-4 w-px" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)' }} />
                    <button
                      type="button"
                      onClick={() => updateGroup(group.id, true)}
                      className="rounded-lg px-2.5 py-1 text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
                      style={{
                        background: isDark ? 'linear-gradient(145deg, #8B7CFF, #5B4BD4)' : 'linear-gradient(145deg, #2DD4BF, #0D9488)',
                        boxShadow: isDark ? '0 4px 14px -8px rgba(124,92,255,0.6)' : '0 4px 14px -8px rgba(13,148,136,0.5)',
                      }}
                    >
                      Cocher tous
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {group.partners.map((portal) => (
                    <Controller
                      key={portal.key}
                      name={`transfert.portals.${portal.key}`}
                      control={control}
                      render={({ field }) => {
                        const isSelected = Boolean(field.value);
                        return (
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => field.onChange(!isSelected)}
                            className="group relative flex min-h-[152px] flex-col justify-between overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 hover:-translate-y-[1px] hover:shadow-lg"
                            style={{
                              borderColor: isSelected ? (isDark ? 'rgba(167,139,250,0.55)' : 'rgba(20,184,166,0.45)') : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
                              background: isSelected ? (isDark ? 'rgba(167,139,250,0.10)' : 'rgba(255,255,255,0.92)') : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.62)',
                              boxShadow: isSelected
                                ? isDark ? '0 0 28px -12px rgba(167,139,250,0.55), inset 0 1px 0 rgba(255,255,255,0.08)' : '0 12px 28px -14px rgba(13,148,136,0.30), inset 0 1px 0 rgba(255,255,255,0.9)'
                                : isDark ? 'inset 0 1px 0 rgba(255,255,255,0.03)' : 'inset 0 1px 0 rgba(255,255,255,0.8)',
                            }}
                          >
                            <span
                              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border text-white shadow-md transition-all duration-300"
                              style={{
                                borderColor: isSelected ? 'rgba(255,255,255,0.70)' : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)',
                                background: isSelected ? (isDark ? 'linear-gradient(145deg, #8B7CFF, #5B4BD4)' : 'linear-gradient(145deg, #2DD4BF, #0D9488)') : isDark ? 'rgba(255,255,255,0.06)' : '#fff',
                                color: isSelected ? 'white' : 'transparent',
                                boxShadow: isSelected ? (isDark ? '0 6px 18px -6px rgba(124,92,255,0.75), 0 0 0 3px rgba(139,124,255,0.22)' : '0 6px 18px -6px rgba(13,148,136,0.65), 0 0 0 3px rgba(45,212,191,0.22)') : 'none',
                              }}
                            >
                              <Check size={14} strokeWidth={3} />
                            </span>

                            <div className="relative z-0 flex min-h-[84px] items-center justify-center px-2 pt-2">
                              <img src={portalImageSrc(portal.image)} alt={portal.label} className="max-h-16 max-w-full object-contain drop-shadow-sm" loading="lazy" />
                            </div>

                            <div className="space-y-1 text-center">
                              <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{portal.label}</p>
                              <p className={`text-[10px] font-medium uppercase tracking-[0.16em] ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>{group.label.replace('Partenaires • ', '')}</p>
                            </div>

                            {isSelected && (
                              <span
                                className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
                                style={{ background: isDark ? 'linear-gradient(90deg, #8B7CFF, #5B4BD4)' : 'linear-gradient(90deg, #2DD4BF, #0D9488)' }}
                              />
                            )}
                          </button>
                        );
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            className="flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-[11px]"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
              color: isDark ? 'rgba(148,163,184,0.7)' : 'rgba(15,23,42,0.5)',
            }}
          >
            <Layers size={11} className={isDark ? 'text-violet-300/60' : 'text-teal-700/50'} />
            La diffusion est instantanée après enregistrement · Décocher pour exclure un portail
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard value="transfert" title="Transfert / Diffusion" icon={Share2} subtitle="Diffusion sur les portails partenaires" defaultOpen>
        <div className="space-y-6">
          {PORTAL_PARTNER_GROUPS.map((group) => (
            <div key={group.id} className="rounded-2xl border border-border/40 bg-background/40 p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-text">{group.label}</h4>
                  <p className="mt-1 text-xs text-text-secondary">Choisissez les portails de diffusion pour ce groupe.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                  <button type="button" className={`transition-colors ${isGerant ? 'text-[#905D5D] hover:text-[#7D5050]' : 'text-accent hover:text-accent/80'}`} onClick={() => updateGroup(group.id, false)}>
                    Décocher tous
                  </button>
                  <span className="text-text-secondary/40">|</span>
                  <button type="button" className={`transition-colors ${isGerant ? 'text-[#905D5D] hover:text-[#7D5050]' : 'text-accent hover:text-accent/80'}`} onClick={() => updateGroup(group.id, true)}>
                    Cocher tous
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {group.partners.map((portal) => (
                  <Controller
                    key={portal.key}
                    name={`transfert.portals.${portal.key}`}
                    control={control}
                    render={({ field }) => {
                      const isSelected = Boolean(field.value);
                      return (
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => field.onChange(!isSelected)}
                          className={`group relative min-h-[150px] rounded-2xl border bg-white p-3 text-left shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(15,23,42,0.08)] ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/15' : 'border-border/40 hover:border-emerald-300'}`}
                        >
                          <span className={`absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border shadow-md transition-all ${isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border/40 bg-white text-transparent group-hover:border-emerald-300'}`}>
                            <Check size={14} strokeWidth={3} />
                          </span>
                          <div className="relative z-0 flex h-full flex-col justify-between gap-3">
                            <div className="flex min-h-[84px] items-center justify-center px-2 pt-2">
                              <img src={portalImageSrc(portal.image)} alt={portal.label} className="max-h-16 max-w-full object-contain" loading="lazy" />
                            </div>
                            <div className="space-y-1.5 text-center">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text">{portal.label}</p>
                              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-text-secondary/70">{group.label}</p>
                            </div>
                          </div>
                        </button>
                      );
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
