import { Controller, useWatch } from 'react-hook-form';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../ui/Select';
import { proximiteItems } from './constants';
import { MapPin, Layers, Info, Navigation, Compass } from 'react-feather';
import { SectionCard } from './stage';
import { useStageChrome } from '../../calendar/useStageChrome';
import { useStageTheme } from '../../../dashboard/Stage';

interface ProximitiesTabProps {
  register: any;
  control: any;
  isGerant?: boolean;
}

function ProximitiesStats({ control, isDark }: { control: any; isDark: boolean }) {
  const watch = useWatch({ control, name: 'proximites' }) as any;
  const filled = proximiteItems.reduce((acc: number, prox: string) => {
    const key = prox.toLowerCase().replace(/[/\s]+/g, '_');
    const v = watch?.[key];
    if (v && (v.distance !== undefined && String(v.distance).trim() !== '')) return acc + 1;
    return acc;
  }, 0);
  const hasAny = filled > 0;
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
        {filled} renseignée{filled !== 1 ? 's' : ''}
      </span>
    </>
  );
}

export function ProximitiesTab({ register, control, isGerant = false }: ProximitiesTabProps) {
  const { staged, dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = staged ? dark : theme === 'dark';

  if (staged) {
    return (
      <div className="space-y-5">
        <SectionCard value="proximities" title="Proximités" icon={MapPin} subtitle="Distances et unités de mesure">
          <div
            className="overflow-hidden rounded-2xl border"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
              background: isDark
                ? 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))'
                : 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.58))',
              boxShadow: isDark
                ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 50px -28px rgba(2,4,18,0.9), 0 0 40px -18px rgba(139,124,255,0.28)'
                : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 18px 50px -26px rgba(13,148,136,0.28), 0 0 36px -16px rgba(52,211,153,0.22)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              style={{
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)'}`,
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.45)',
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
                  <Navigation size={11} />
                  {proximiteItems.length} proximités
                </span>
                <ProximitiesStats control={control} isDark={isDark} />
              </div>
              <span className={`hidden items-center gap-1.5 text-[11px] sm:flex ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>
                <Info size={12} />
                Renseignez la distance et l’unité
              </span>
            </div>

            <div className="hidden overflow-x-auto scrollbar-thin md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.02)',
                      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)'}`,
                    }}
                  >
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: isDark ? 'rgba(148,163,184,0.85)' : 'rgba(15,23,42,0.45)', width: '42%' }}>
                      Élément
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: isDark ? 'rgba(148,163,184,0.85)' : 'rgba(15,23,42,0.45)', width: '29%' }}>
                      Distance
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: isDark ? 'rgba(148,163,184,0.85)' : 'rgba(15,23,42,0.45)', width: '29%' }}>
                      Unité
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {proximiteItems.map((prox) => {
                    const key = prox.toLowerCase().replace(/[/\s]+/g, '_');
                    return (
                      <tr key={key} className="group" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)'}` }}>
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px]"
                              style={{
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
                                color: isDark ? 'rgba(148,163,184,0.7)' : 'rgba(15,23,42,0.45)',
                              }}
                            >
                              <Compass size={13} />
                            </span>
                            <span className={`text-[13px] font-semibold tracking-[-0.1px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{prox}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          <Controller
                            name={`proximites.${key}.distance`}
                            control={control}
                            render={({ field }) => (
                              <Input type="number" placeholder="—" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8 text-sm" />
                            )}
                          />
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          <Controller
                            name={`proximites.${key}.unite`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                options={[
                                  { value: 'm', label: 'm' },
                                  { value: 'km', label: 'km' },
                                  { value: 'min', label: 'min' },
                                ]}
                                value={field.value || 'km'}
                                onValueChange={(v) => field.onChange(v)}
                                className="h-8 text-sm"
                              />
                            )}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {proximiteItems.map((prox) => {
                const key = prox.toLowerCase().replace(/[/\s]+/g, '_');
                return (
                  <div
                    key={key}
                    className="rounded-xl border p-3"
                    style={{
                      borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
                      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    <div className="mb-3 flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg border"
                        style={{
                          borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
                          background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                          color: isDark ? 'rgba(148,163,184,0.7)' : 'rgba(15,23,42,0.45)',
                        }}
                      >
                        <MapPin size={14} />
                      </span>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{prox}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Controller
                        name={`proximites.${key}.distance`}
                        control={control}
                        render={({ field }) => (
                          <Input type="number" placeholder="Distance" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                        )}
                      />
                      <Controller
                        name={`proximites.${key}.unite`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            options={[
                              { value: 'm', label: 'm' },
                              { value: 'km', label: 'km' },
                              { value: 'min', label: 'min' },
                            ]}
                            value={field.value || 'km'}
                            onValueChange={(v) => field.onChange(v)}
                            className="h-8 text-sm"
                          />
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-[11px]"
              style={{
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`,
                background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.35)',
                color: isDark ? 'rgba(148,163,184,0.75)' : 'rgba(15,23,42,0.45)',
              }}
            >
              <Layers size={11} className={isDark ? 'text-violet-300/60' : 'text-teal-700/50'} />
              Astuce : laissez vide ce qui n’est pas pertinent
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard value="proximities" title="Proximités" icon={MapPin} subtitle="Distances et unités de mesure">
        <div className="overflow-hidden rounded-xl border border-border/30 bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 bg-background/40 px-4 py-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 font-semibold text-accent">
                <MapPin size={12} /> {proximiteItems.length} éléments
              </span>
            </div>
            <span className="hidden items-center gap-1 text-xs text-text-secondary/60 sm:flex">
              <Info size={12} /> Distances et unités
            </span>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-background/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Élément</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Distance</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Unité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {proximiteItems.map((prox) => {
                  const key = prox.toLowerCase().replace(/[/\s]+/g, '_');
                  return (
                    <tr key={key} className="transition-colors hover:bg-background/40">
                      <td className="px-4 py-2.5 align-middle">
                        <span className="inline-flex items-center gap-2 font-medium text-text">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-text-secondary">
                            <MapPin size={13} />
                          </span>
                          {prox}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <Controller
                          name={`proximites.${key}.distance`}
                          control={control}
                          render={({ field }) => (
                            <Input type="number" placeholder="—" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                          )}
                        />
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <Controller
                          name={`proximites.${key}.unite`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              options={[
                                { value: 'm', label: 'm' },
                                { value: 'km', label: 'km' },
                                { value: 'min', label: 'min' },
                              ]}
                              value={field.value || 'km'}
                              onValueChange={(v) => field.onChange(v)}
                              className="h-8"
                            />
                          )}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-3 md:hidden">
            {proximiteItems.map((prox) => {
              const key = prox.toLowerCase().replace(/[/\s]+/g, '_');
              return (
                <div key={key} className="rounded-xl border border-border/30 bg-background/40 p-3">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-text">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-text-secondary">
                      <MapPin size={13} />
                    </span>
                    {prox}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      name={`proximites.${key}.distance`}
                      control={control}
                      render={({ field }) => (
                        <Input type="number" placeholder="Distance" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                      )}
                    />
                    <Controller
                      name={`proximites.${key}.unite`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={[
                            { value: 'm', label: 'm' },
                            { value: 'km', label: 'km' },
                            { value: 'min', label: 'min' },
                          ]}
                          value={field.value || 'km'}
                          onValueChange={(v) => field.onChange(v)}
                          className="h-8"
                        />
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
