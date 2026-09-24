import { Controller, useWatch } from 'react-hook-form';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { exteriorTypes, propertyStates } from './constants';
import { Wind, MapPin, Sun, Layers, Home, Box, Droplet, Grid, Layers as LayersIcon, Info } from 'react-feather';
import { SectionCard, SubPanel, SubLabel, Field, FieldGrid } from './stage';
import { useStageChrome } from '../../calendar/useStageChrome';
import { useStageTheme } from '../../../dashboard/Stage';

interface ExteriorTabProps {
  control: any;
  register: any;
  propertyType: string;
  isGerant?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Stage Exterior Spaces — holographic inventory table               */
/* ------------------------------------------------------------------ */

type SpaceDef = { key: string; label: string; Icon: React.ComponentType<{ size?: number | string; className?: string }> };

const SPACES: SpaceDef[] = [
  { key: 'terrasse', label: 'Terrasse', Icon: Layers },
  { key: 'cave', label: 'Cave', Icon: Box },
  { key: 'jardin', label: 'Jardin', Icon: Sun },
  { key: 'garage', label: 'Garage', Icon: Home },
  { key: 'parking', label: 'Parking', Icon: Grid },
  { key: 'pergola', label: 'Pergola', Icon: Wind },
  { key: 'piscine', label: 'Piscine', Icon: Droplet },
];

function ExteriorSpacesStats({ control, isDark }: { control: any; isDark: boolean }) {
  const spacesWatch = useWatch({ control, name: 'exteriorSpaces' }) as Record<string, any> | undefined;
  const filledCount = SPACES.reduce((acc, s) => {
    const v = (spacesWatch as any)?.[s.key];
    if (v && (v.surface || v.floorCovering || v.state || v.comments)) return acc + 1;
    return acc;
  }, 0);
  const totalSurface = SPACES.reduce((acc, s) => {
    const raw = (spacesWatch as any)?.[s.key]?.surface;
    const n = parseFloat(raw);
    return acc + (isFinite(n) ? n : 0);
  }, 0);
  const hasAny = filledCount > 0;
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
        {filledCount} renseigné{filledCount !== 1 ? 's' : ''}
      </span>
      {totalSurface > 0 && (
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums"
          style={{
            color: isDark ? 'rgba(226,232,240,0.75)' : 'rgba(15,23,42,0.65)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
          }}
        >
          Σ {totalSurface.toLocaleString('fr-FR')} m²
        </span>
      )}
    </>
  );
}

function ExteriorSpacesTable({ control, register }: { control: any; register: any }) {
  const { staged, dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = staged ? dark : theme === 'dark';

  // --- staged shell ---
  if (staged) {
    return (
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
        {/* toolbar — metrics */}
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
              <MapPin size={11} />
              {SPACES.length} espaces
            </span>
            <ExteriorSpacesStats control={control} isDark={isDark} />
          </div>
          <span className={`hidden items-center gap-1.5 text-[11px] sm:flex ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>
            <Info size={12} />
            Renseignez chaque espace présent sur le bien
          </span>
        </div>

        {/* desktop table */}
        <div className="hidden overflow-x-auto scrollbar-thin md:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr
                style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.02)',
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)'}`,
                }}
              >
                {[
                  { label: 'Espace', w: '170px', align: 'left' },
                  { label: 'Surface', w: '130px', align: 'left' },
                  { label: 'Revêtement sol', w: '170px', align: 'left' },
                  { label: 'État', w: '160px', align: 'left' },
                  { label: 'Commentaires', w: 'auto', align: 'left' },
                ].map((h) => (
                  <th
                    key={h.label}
                    className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: isDark ? 'rgba(148,163,184,0.85)' : 'rgba(15,23,42,0.45)', width: h.w as any, textAlign: h.align as any }}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPACES.map((space) => (
                  <tr
                    key={space.key}
                    className="group"
                    style={{
                      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)'}`,
                    }}
                  >
                    <td className="px-3 py-2.5 align-middle">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px] transition-colors duration-200 group-hover:scale-[1.03]"
                          style={{
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
                            color: isDark ? 'rgba(148,163,184,0.7)' : 'rgba(15,23,42,0.45)',
                          }}
                        >
                          <space.Icon size={13} />
                        </span>
                        <span className={`text-[13px] font-semibold tracking-[-0.1px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{space.label}</span>
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5 align-middle">
                      <Controller name={`exteriorSpaces.${space.key}.surface`} control={control} render={({ field }) => (
                        <Input type="number" placeholder="—" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8 text-sm" />
                      )} />
                    </td>
                    <td className="px-2.5 py-2.5 align-middle">
                      <Controller name={`exteriorSpaces.${space.key}.floorCovering`} control={control} render={({ field }) => (
                        <Input placeholder="Ex: Carrelage" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8 text-sm" />
                      )} />
                    </td>
                    <td className="px-2.5 py-2.5 align-middle">
                      <Controller
                        name={`exteriorSpaces.${space.key}.state`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            placeholder="État"
                            options={propertyStates}
                            value={field.value}
                            onChange={field.onChange}
                            className="h-8 text-sm"
                          />
                        )}
                      />
                    </td>
                    <td className="px-2.5 py-2.5 align-middle">
                      <Controller name={`exteriorSpaces.${space.key}.comments`} control={control} render={({ field }) => (
                        <Input placeholder="Notes…" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8 text-sm" />
                      )} />
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* mobile cards */}
        <div className="grid gap-3 p-3 md:hidden">
          {SPACES.map((space) => (
              <div
                key={space.key}
                className="rounded-xl border p-3 transition-all duration-200"
                style={{
                  borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg border"
                      style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
                        background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                        color: isDark ? 'rgba(148,163,184,0.7)' : 'rgba(15,23,42,0.45)',
                      }}
                    >
                      <space.Icon size={14} />
                    </span>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{space.label}</span>
                  </div>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.12)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Controller name={`exteriorSpaces.${space.key}.surface`} control={control} render={({ field }) => (
                    <Input type="number" placeholder="Surface m²" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
                  <Controller
                    name={`exteriorSpaces.${space.key}.state`}
                    control={control}
                    render={({ field }) => (
                      <Select placeholder="État" options={propertyStates} value={field.value} onChange={field.onChange} className="h-8 text-sm" />
                    )}
                  />
                  <div className="col-span-2">
                    <Controller name={`exteriorSpaces.${space.key}.floorCovering`} control={control} render={({ field }) => (
                    <Input placeholder="Revêtement sol" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
                  </div>
                  <div className="col-span-2">
                    <Controller name={`exteriorSpaces.${space.key}.comments`} control={control} render={({ field }) => (
                    <Input placeholder="Commentaires" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
                  </div>
                </div>
              </div>
          ))}
        </div>

        {/* footer hint */}
        <div
          className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-[11px]"
          style={{
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`,
            background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.35)',
            color: isDark ? 'rgba(148,163,184,0.75)' : 'rgba(15,23,42,0.45)',
          }}
        >
          <LayersIcon size={11} className={isDark ? 'text-violet-300/60' : 'text-teal-700/50'} />
          Astuce : seules les lignes renseignées seront affichées sur la fiche bien
          <span className="ml-auto hidden items-center gap-1 sm:inline-flex" style={{ color: isDark ? 'rgba(148,163,184,0.55)' : 'rgba(15,23,42,0.35)' }}>
            <span className="h-1 w-1 rounded-full" style={{ background: isDark ? '#A78BFA' : '#14B8A6' }} /> ligne active
            <span className="mx-1 h-3 w-px" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)' }} />
            <span className="h-1 w-1 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.12)' }} /> vide
          </span>
        </div>
      </div>
    );
  }

  // ---- admin fallback (non-stage) — still modern ----
  return (
    <div className="overflow-hidden rounded-xl border border-border/30 bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 bg-background/40 px-4 py-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 font-semibold text-accent">
            <MapPin size={12} /> {SPACES.length} espaces
          </span>
        </div>
        <span className="hidden items-center gap-1 text-xs text-text-secondary/60 sm:flex">
          <Info size={12} /> Renseignez chaque espace présent
        </span>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-background/50">
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Espace</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Surface (m²)</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Revêtement sol</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">État</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Commentaires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {SPACES.map((space) => (
                <tr key={space.key} className="transition-colors hover:bg-background/40">
                  <td className="px-3 py-2.5 align-middle">
                    <span className="inline-flex items-center gap-2 font-medium text-text">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-text-secondary">
                        <space.Icon size={13} />
                      </span>
                      {space.label}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5 align-middle">
                    <Controller name={`exteriorSpaces.${space.key}.surface`} control={control} render={({ field }) => (
                    <Input type="number" placeholder="—" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
                  </td>
                  <td className="px-2.5 py-2.5 align-middle">
                    <Controller name={`exteriorSpaces.${space.key}.floorCovering`} control={control} render={({ field }) => (
                    <Input placeholder="—" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
                  </td>
                  <td className="px-2.5 py-2.5 align-middle">
                    <Controller name={`exteriorSpaces.${space.key}.state`} control={control} render={({ field }) => <Select placeholder="État" options={propertyStates} value={field.value} onChange={field.onChange} className="h-8" />} />
                  </td>
                  <td className="px-2.5 py-2.5 align-middle">
                    <Controller name={`exteriorSpaces.${space.key}.comments`} control={control} render={({ field }) => (
                    <Input placeholder="—" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {SPACES.map((space) => (
          <div key={space.key} className="rounded-xl border border-border/30 bg-background/40 p-3">
            <div className="mb-2 flex items-center gap-2 font-semibold text-text">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-text-secondary">
                <space.Icon size={13} />
              </span>
              {space.label}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Controller name={`exteriorSpaces.${space.key}.surface`} control={control} render={({ field }) => (
                    <Input type="number" placeholder="Surface m²" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
              <Controller name={`exteriorSpaces.${space.key}.state`} control={control} render={({ field }) => <Select placeholder="État" options={propertyStates} value={field.value} onChange={field.onChange} className="h-8" />} />
              <div className="col-span-2">
                <Controller name={`exteriorSpaces.${space.key}.floorCovering`} control={control} render={({ field }) => (
                    <Input placeholder="Revêtement sol" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
              </div>
              <div className="col-span-2">
                <Controller name={`exteriorSpaces.${space.key}.comments`} control={control} render={({ field }) => (
                    <Input placeholder="Commentaires" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExteriorTab({ control, register, propertyType, isGerant = false }: ExteriorTabProps) {
  const isCommercial = propertyType === 'commercial';
  const isLuxury = propertyType === 'luxury';
  const isLand = propertyType === 'land';

  if (isLand) {
    return (
      <div className="space-y-5">
        <SectionCard value="exterior-features" title="Terrain" icon={Wind} subtitle="Type et vue du terrain">
          <FieldGrid>
            <Field>
              <Controller
                name="exterior.type"
                control={control}
                render={({ field }) => (
                  <Select label="Type de terrain" options={[
                    { value: 'plat', label: 'Plat' },
                    { value: 'pente', label: 'En pente' },
                    { value: 'accidente', label: 'Accidenté' },
                  ]} value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
            <Field>
              <Controller
                name="exterior.view"
                control={control}
                render={({ field }) => (
                  <Select label="Vue" options={[
                    { value: 'degagee', label: 'Dégagée' },
                    { value: 'montagne', label: 'Montagne' },
                    { value: 'mer', label: 'Mer' },
                  ]} value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
          </FieldGrid>
        </SectionCard>
      </div>
    );
  }

  if (isCommercial) {
    return (
      <div className="space-y-5">
        <SectionCard value="exterior-features" title="Caractéristiques extérieures" icon={Wind} subtitle="Construction, aménagement et position">
          <FieldGrid>
            <Field>
              <Controller
                name="exterior.type"
                control={control}
                render={({ field }) => (
                  <Select label="Type de construction" options={exteriorTypes} value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
            <Field>
              <Controller
                name="exterior.layout"
                control={control}
                render={({ field }) => (
                  <Select label="Aménagement" options={[
                    { value: 'tout_egout', label: "Tout à l'égout" },
                    { value: 'fosse_septique', label: 'Fosse septique' },
                    { value: 'forage', label: 'Forage' }
                  ]} value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
            <Field>
              <Controller
                name="exterior.guarantee"
                control={control}
                render={({ field }) => (
                  <Select label="Garantie" options={[
                    { value: 'decennale', label: 'Décennale' },
                    { value: 'ouvrage', label: 'Ouvrage' }
                  ]} value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>

            <Field className="md:col-span-2">
              <SubPanel title="Commercial">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Controller name="commercialExterior.deliveries" control={control} render={({ field }) => (
                    <Checkbox label="Livraisons" checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="commercialExterior.truckParking" control={control} render={({ field }) => (
                    <Checkbox label="Parking poids lourds" checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="commercialExterior.dock" control={control} render={({ field }) => (
                    <Checkbox label="Quai de déchargement" checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                </div>
              </SubPanel>
            </Field>

            <Field className="md:col-span-2">
              <SubPanel title="Position">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <Controller name="exteriorPosition.lastFloor" control={control} render={({ field }) => (
                      <Checkbox label="Dernier étage" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                    <Controller name="exteriorPosition.groundFloor" control={control} render={({ field }) => (
                      <Checkbox label="Rez-de-chaussée" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                    <div className="flex items-center gap-2">
                      <Controller name="exteriorPosition.floor" control={control} render={({ field }) => (
                        <Checkbox checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                      <Input placeholder="Étage (ex: 2/5)" {...register('exteriorPosition.floorNumber')} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Controller name="exteriorPosition.singleLevel" control={control} render={({ field }) => (
                      <Checkbox label="Plain-pied" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                    <Controller name="exteriorPosition.pmrAccess" control={control} render={({ field }) => (
                      <Checkbox label="Accès PMR" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                  </div>
                  <div className="space-y-3">
                    <Controller name="exteriorPosition.elevator" control={control} render={({ field }) => (
                      <Checkbox label="Ascenseur" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                  </div>
                </div>
              </SubPanel>
            </Field>

            <Field className="md:col-span-2">
              <SubPanel title="Extérieur">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <SubLabel>Jardin</SubLabel>
                    {['exteriorFeatures.enclosed', 'exteriorFeatures.treed', 'exteriorFeatures.new', 'exteriorFeatures.poolPossible'].map((name) => (
                      <Controller key={name} name={name} control={control} render={({ field }) => (
                        <Checkbox label={
                          name === 'exteriorFeatures.enclosed' ? 'Clos' :
                          name === 'exteriorFeatures.treed' ? 'Arboré' :
                          name === 'exteriorFeatures.new' ? 'A étrenner' : 'Piscinable'
                        } checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <SubLabel>Terrasse/Balcon</SubLabel>
                    {['exteriorFeatures.well', 'exteriorFeatures.poolhouse', 'exteriorFeatures.barbecue', 'exteriorFeatures.automaticWatering'].map((name) => (
                      <Controller key={name} name={name} control={control} render={({ field }) => (
                        <Checkbox label={
                          name === 'exteriorFeatures.well' ? 'Puits' :
                          name === 'exteriorFeatures.poolhouse' ? 'Pool house' :
                          name === 'exteriorFeatures.barbecue' ? 'Barbecue' : 'Arrosage auto'
                        } checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <SubLabel>Services</SubLabel>
                    <Controller name="exteriorFeatures.caretaker" control={control} render={({ field }) => (
                      <Checkbox label="Gardien" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                    <Controller name="exteriorFeatures.gardener" control={control} render={({ field }) => (
                      <Checkbox label="Jardinier" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                    <Controller name="exteriorFeatures.noOverlook" control={control} render={({ field }) => (
                      <Checkbox label="Sans vis-à-vis" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                  </div>
                  <div className="space-y-2">
                    <SubLabel>Vues</SubLabel>
                    {[
                      { name: 'views.ocean', label: 'Océan' },
                      { name: 'views.panoramic', label: 'Panoramique' },
                      { name: 'views.urban', label: 'Urbain' },
                      { name: 'views.quiet', label: 'Calme' }
                    ].map(({ name, label }) => (
                      <Controller key={name} name={name} control={control} render={({ field }) => (
                        <Checkbox label={label} checked={field.value} onChange={(checked) => field.onChange(checked)} />
                      )} />
                    ))}
                  </div>
                </div>
              </SubPanel>
            </Field>

            <Field className="md:col-span-2">
              <SubPanel title="Parking / Garage">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Controller name="parking.privateExterior" control={control} render={({ field }) => (
                      <Checkbox label="Extérieur privé" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Controller name="parking.privateInterior" control={control} render={({ field }) => (
                      <Checkbox label="Intérieur privé" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Controller name="parking.garage" control={control} render={({ field }) => (
                      <Checkbox label="Garage" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                  </div>
                </div>
              </SubPanel>
            </Field>
          </FieldGrid>
        </SectionCard>

        <SectionCard value="exterior-spaces" title="Les extérieurs" icon={MapPin} subtitle="Inventaire des espaces extérieurs" defaultOpen={false}>
          <ExteriorSpacesTable control={control} register={register} />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard value="exterior-features" title="Caractéristiques extérieures" icon={Wind} subtitle="Construction, aménagement et position">
        <FieldGrid>
          <Field>
            <Controller
              name="exterior.type"
              control={control}
              render={({ field }) => (
                <Select label="Type de construction" options={exteriorTypes} value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>
          <Field>
            <Controller
              name="exterior.layout"
              control={control}
              render={({ field }) => (
                <Select label="Aménagement" options={[
                  { value: 'tout_egout', label: "Tout à l'égout" },
                  { value: 'fosse_septique', label: 'Fosse septique' },
                  { value: 'forage', label: 'Forage' }
                ]} value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>
          <Field>
            <Controller
              name="exterior.guarantee"
              control={control}
              render={({ field }) => (
                <Select label="Garantie" options={[
                  { value: 'decennale', label: 'Décennale' },
                  { value: 'ouvrage', label: 'Ouvrage' }
                ]} value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>

          <Field className="md:col-span-2">
            <SubPanel title="Position">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <Controller name="exteriorPosition.lastFloor" control={control} render={({ field }) => (
                    <Checkbox label="Dernier étage" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                  )} />
                  <Controller name="exteriorPosition.groundFloor" control={control} render={({ field }) => (
                    <Checkbox label="Rez-de-chaussée" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                  )} />
                  <div className="flex items-center gap-2">
                    <Controller name="exteriorPosition.floor" control={control} render={({ field }) => (
                      <Checkbox checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                    <Input placeholder="Étage (ex: 2/5)" {...register('exteriorPosition.floorNumber')} />
                  </div>
                </div>
                <div className="space-y-3">
                  <Controller name="exteriorPosition.singleLevel" control={control} render={({ field }) => (
                    <Checkbox label="Plain-pied" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                  )} />
                  <Controller name="exteriorPosition.pmrAccess" control={control} render={({ field }) => (
                    <Checkbox label="Accès PMR" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                  )} />
                </div>
                <div className="space-y-3">
                  <Controller name="exteriorPosition.elevator" control={control} render={({ field }) => (
                    <Checkbox label="Ascenseur" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                  )} />
                </div>
              </div>
            </SubPanel>
          </Field>

          <Field className="md:col-span-2">
            <SubPanel title="Extérieur">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <SubLabel>Jardin</SubLabel>
                  {['exteriorFeatures.enclosed', 'exteriorFeatures.treed', 'exteriorFeatures.new', 'exteriorFeatures.poolPossible'].map((name) => (
                    <Controller key={name} name={name} control={control} render={({ field }) => (
                      <Checkbox label={
                        name === 'exteriorFeatures.enclosed' ? 'Clos' :
                        name === 'exteriorFeatures.treed' ? 'Arboré' :
                        name === 'exteriorFeatures.new' ? 'A étrenner' : 'Piscinable'
                      } checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                  ))}
                </div>
                <div className="space-y-2">
                  <SubLabel>Terrasse/Balcon</SubLabel>
                  {['exteriorFeatures.well', 'exteriorFeatures.poolhouse', 'exteriorFeatures.barbecue', 'exteriorFeatures.automaticWatering'].map((name) => (
                    <Controller key={name} name={name} control={control} render={({ field }) => (
                      <Checkbox label={
                        name === 'exteriorFeatures.well' ? 'Puits' :
                        name === 'exteriorFeatures.poolhouse' ? 'Pool house' :
                        name === 'exteriorFeatures.barbecue' ? 'Barbecue' : 'Arrosage auto'
                      } checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                  ))}
                </div>
                <div className="space-y-2">
                  <SubLabel>Services</SubLabel>
                  <Controller name="exteriorFeatures.caretaker" control={control} render={({ field }) => (
                    <Checkbox label="Gardien" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                  )} />
                  <Controller name="exteriorFeatures.gardener" control={control} render={({ field }) => (
                    <Checkbox label="Jardinier" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                  )} />
                  <Controller name="exteriorFeatures.noOverlook" control={control} render={({ field }) => (
                    <Checkbox label="Sans vis-à-vis" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                  )} />
                </div>
                <div className="space-y-2">
                  <SubLabel>Vues</SubLabel>
                  {[
                    { name: 'views.ocean', label: 'Océan' },
                    { name: 'views.panoramic', label: 'Panoramique' },
                    { name: 'views.urban', label: 'Urbain' },
                    { name: 'views.quiet', label: 'Calme' }
                  ].map(({ name, label }) => (
                    <Controller key={name} name={name} control={control} render={({ field }) => (
                      <Checkbox label={label} checked={field.value} onChange={(checked) => field.onChange(checked)} />
                    )} />
                  ))}
                </div>
              </div>
            </SubPanel>
          </Field>

          {isLuxury && (
            <Field className="md:col-span-2">
              <SubPanel title="Équipements prestige">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Controller name="luxuryExterior.heatedPool" control={control} render={({ field }) => (
                    <Checkbox label="Piscine chauffée" checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="luxuryExterior.tennis" control={control} render={({ field }) => (
                    <Checkbox label="Tennis" checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="luxuryExterior.heliport" control={control} render={({ field }) => (
                    <Checkbox label="Héliport" checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="luxuryExterior.guardHouse" control={control} render={({ field }) => (
                    <Checkbox label="Maison de gardien" checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="luxuryExterior.landscapedGarden" control={control} render={({ field }) => (
                    <Checkbox label="Jardin paysager" checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="luxuryExterior.seaView" control={control} render={({ field }) => (
                    <Checkbox label="Vue mer" checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="luxuryExterior.mountainView" control={control} render={({ field }) => (
                    <Checkbox label="Vue montagne" checked={field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                </div>
              </SubPanel>
            </Field>
          )}

          <Field className="md:col-span-2">
            <SubPanel title="Parking / Garage">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Controller name="parking.privateExterior" control={control} render={({ field }) => (
                    <Checkbox label="Extérieur privé" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                  )} />
                </div>
                <div className="flex items-center gap-3">
                  <Controller name="parking.privateInterior" control={control} render={({ field }) => (
                    <Checkbox label="Intérieur privé" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                  )} />
                </div>
                <div className="flex items-center gap-3">
                  <Controller name="parking.garage" control={control} render={({ field }) => (
                    <Checkbox label="Garage" checked={field.value} onChange={(checked) => field.onChange(checked)} />
                  )} />
                </div>
              </div>
            </SubPanel>
          </Field>
        </FieldGrid>
      </SectionCard>

      <SectionCard value="exterior-spaces" title="Les extérieurs" icon={MapPin} subtitle="Inventaire des espaces extérieurs" defaultOpen={false}>
        <ExteriorSpacesTable control={control} register={register} />
      </SectionCard>
    </div>
  );
}
