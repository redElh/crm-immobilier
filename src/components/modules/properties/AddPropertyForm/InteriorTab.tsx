import { Controller, useWatch } from 'react-hook-form';
import { Input } from '../../../../components/ui/Input';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { Select } from '../../../../components/ui/Select';
import { Textarea } from '../../../../components/ui/Textarea';
import { Grid, Droplet, Coffee, Tv, Home, Box, Layers, Wind, Briefcase, Sun, Info, MapPin } from 'react-feather';
import { SectionCard, SubPanel, SubLabel, Field, FieldGrid } from './stage';
import { useStageChrome } from '../../calendar/useStageChrome';
import { useStageTheme } from '../../../dashboard/Stage';

interface InteriorTabProps {
  control: any;
  register: any;
  watch: any;
  propertyType: string;
  isGerant?: boolean;
}

type StyleDef = { value: string; label: string; image: string };
const STYLES: StyleDef[] = [
  { value: 'moderne', label: 'Moderne', image: '/images/styles/modern1.jpg' },
  { value: 'traditionnel', label: 'Traditionnel', image: '/images/styles/traditional.jpg' },
  { value: 'minimaliste', label: 'Minimaliste', image: '/images/styles/minimalist.jpg' },
  { value: 'beldi', label: 'Beldi', image: '/images/styles/beldi.jpg' },
  { value: 'contemporain', label: 'Contemporain', image: '/images/styles/contemporary.jpg' },
];

type RoomDef = { label: string; key: string; Icon: React.ComponentType<{ size?: number | string; className?: string }> };
const ROOMS: RoomDef[] = [
  { label: 'Entrée', key: 'entree', Icon: Home },
  { label: 'Salon', key: 'salon', Icon: Tv },
  { label: 'Cuisine', key: 'cuisine', Icon: Coffee },
  { label: 'Chambre', key: 'chambre', Icon: Grid },
  { label: 'Salle de bain', key: 'salle_de_bain', Icon: Droplet },
  { label: 'Bureau', key: 'bureau', Icon: Briefcase },
  { label: 'Buanderie', key: 'buanderie', Icon: Layers },
  { label: 'Dressing', key: 'dressing', Icon: Box },
];
// fallback for legacy keys like "salle_de bain" (with space) – Controller will read both
const roomKey = (label: string) => label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');

function InteriorSpacesStats({ control, isDark }: { control: any; isDark: boolean }) {
  const spacesWatch = useWatch({ control, name: 'interiorSpaces' }) as any;
  const filledCount = ROOMS.reduce((acc, r) => {
    const v = spacesWatch?.[r.key] ?? spacesWatch?.[r.label.toLowerCase().replace(' ', '_')];
    if (v && (v.surface || v.floorCovering || v.state || v.heating || v.comments || v.exteriorAccess || v.closet)) return acc + 1;
    return acc;
  }, 0);
  const totalSurface = ROOMS.reduce((acc, r) => {
    const v = spacesWatch?.[r.key] ?? spacesWatch?.[r.label.toLowerCase().replace(' ', '_')];
    const n = parseFloat(v?.surface);
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
        {filledCount} renseignée{filledCount !== 1 ? 's' : ''}
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

function InteriorSpacesTable({ control }: { control: any }) {
  const { staged, dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = staged ? dark : theme === 'dark';

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
              <Tv size={11} />
              {ROOMS.length} pièces
            </span>
            <InteriorSpacesStats control={control} isDark={isDark} />
          </div>
          <span className={`hidden items-center gap-1.5 text-[11px] sm:flex ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>
            <Info size={12} />
            Inventaire détaillé par pièce
          </span>
        </div>

        <div className="hidden overflow-x-auto scrollbar-thin lg:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr
                style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.02)',
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)'}`,
                }}
              >
                {[
                  { label: 'Pièce', w: '130px' },
                  { label: 'Surface', w: '110px' },
                  { label: 'Revêtement sol', w: '140px' },
                  { label: 'État', w: '150px' },
                  { label: 'Accès ext.', w: '85px' },
                  { label: 'Placard', w: '85px' },
                  { label: 'Chauffage', w: '130px' },
                  { label: 'Commentaires', w: 'auto' },
                ].map((h) => (
                  <th key={h.label} className="px-2.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: isDark ? 'rgba(148,163,184,0.85)' : 'rgba(15,23,42,0.45)', width: h.w as any, textAlign: h.label.includes('Accès') || h.label.includes('Placard') ? 'center' as any : 'left' }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROOMS.map((room) => {
                const k = room.key;
                return (
                  <tr key={k} className="group" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)'}` }}>
                    <td className="px-2.5 py-2.5 align-middle">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px]"
                          style={{
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
                            color: isDark ? 'rgba(148,163,184,0.7)' : 'rgba(15,23,42,0.45)',
                          }}
                        >
                          <room.Icon size={13} />
                        </span>
                        <span className={`text-[12.5px] font-semibold tracking-[-0.1px] whitespace-nowrap ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{room.label}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      <Controller name={`interiorSpaces.${k}.surface`} control={control} render={({ field }) => (
                        <Input type="number" placeholder="—" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8 text-sm" />
                      )} />
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      <Controller name={`interiorSpaces.${k}.floorCovering`} control={control} render={({ field }) => (
                        <Input placeholder="—" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8 text-sm" />
                      )} />
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      <Controller name={`interiorSpaces.${k}.state`} control={control} render={({ field }) => (
                        <Select
                          placeholder="État"
                          options={[
                            { value: 'very_good', label: 'Très bon état' },
                            { value: 'good', label: 'Bon état' },
                            { value: 'average', label: 'Moyen état' },
                            { value: 'bad', label: 'Mauvais état' },
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                          className="h-8 text-sm"
                        />
                      )} />
                    </td>
                    <td className="px-2 py-2.5 align-middle text-center">
                      <Controller name={`interiorSpaces.${k}.exteriorAccess`} control={control} render={({ field }) => (
                        <Checkbox checked={!!field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                    </td>
                    <td className="px-2 py-2.5 align-middle text-center">
                      <Controller name={`interiorSpaces.${k}.closet`} control={control} render={({ field }) => (
                        <Checkbox checked={!!field.value} onChange={(c) => field.onChange(c)} />
                      )} />
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      <Controller name={`interiorSpaces.${k}.heating`} control={control} render={({ field }) => (
                        <Input placeholder="—" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8 text-sm" />
                      )} />
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      <Controller name={`interiorSpaces.${k}.comments`} control={control} render={({ field }) => (
                        <Input placeholder="—" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8 text-sm" />
                      )} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-3 lg:hidden">
          {ROOMS.map((room) => (
            <div
              key={room.key}
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
                  <room.Icon size={14} />
                </span>
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{room.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Controller name={`interiorSpaces.${room.key}.surface`} control={control} render={({ field }) => (
                  <Input type="number" placeholder="Surface m²" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                )} />
                <Controller name={`interiorSpaces.${room.key}.state`} control={control} render={({ field }) => (
                  <Select placeholder="État" options={[
                    { value: 'very_good', label: 'Très bon état' },
                    { value: 'good', label: 'Bon état' },
                    { value: 'average', label: 'Moyen état' },
                    { value: 'bad', label: 'Mauvais état' },
                  ]} value={field.value} onChange={field.onChange} className="h-8 text-sm" />
                )} />
                <div className="col-span-2">
                  <Controller name={`interiorSpaces.${room.key}.floorCovering`} control={control} render={({ field }) => (
                    <Input placeholder="Revêtement sol" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
                </div>
                <Controller name={`interiorSpaces.${room.key}.heating`} control={control} render={({ field }) => (
                  <Input placeholder="Chauffage" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                )} />
                <div className="flex items-center justify-center gap-4 rounded-xl border px-3 py-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)' }}>
                  <Controller name={`interiorSpaces.${room.key}.exteriorAccess`} control={control} render={({ field }) => (
                    <label className="flex items-center gap-1.5 text-xs font-medium" style={{ color: isDark ? 'rgba(148,163,184,0.9)' : 'rgba(15,23,42,0.6)' }}>
                      <Checkbox checked={!!field.value} onChange={(c) => field.onChange(c)} />
                      Ext.
                    </label>
                  )} />
                  <span className="h-4 w-px" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)' }} />
                  <Controller name={`interiorSpaces.${room.key}.closet`} control={control} render={({ field }) => (
                    <label className="flex items-center gap-1.5 text-xs font-medium" style={{ color: isDark ? 'rgba(148,163,184,0.9)' : 'rgba(15,23,42,0.6)' }}>
                      <Checkbox checked={!!field.value} onChange={(c) => field.onChange(c)} />
                      Placard
                    </label>
                  )} />
                </div>
                <div className="col-span-2">
                  <Controller name={`interiorSpaces.${room.key}.comments`} control={control} render={({ field }) => (
                    <Input placeholder="Commentaires" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
                </div>
              </div>
            </div>
          ))}
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
          Accès ext. = accès extérieur · Placard = rangement intégré
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/30 bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 bg-background/40 px-4 py-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 font-semibold text-accent">
            <Tv size={12} /> {ROOMS.length} pièces
          </span>
        </div>
        <span className="hidden items-center gap-1 text-xs text-text-secondary/60 sm:flex">
          <Info size={12} /> Inventaire par pièce
        </span>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-background/50">
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Pièce</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Surface (m²)</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Revêtement sol</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">État</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">Accès ext.</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">Placard</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Chauffage</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Commentaires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {ROOMS.map((room) => (
              <tr key={room.key} className="transition-colors hover:bg-background/40">
                <td className="px-3 py-2.5 align-middle">
                  <span className="inline-flex items-center gap-2 font-medium text-text">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-text-secondary">
                      <room.Icon size={13} />
                    </span>
                    {room.label}
                  </span>
                </td>
                <td className="px-2.5 py-2.5 align-middle">
                  <Controller name={`interiorSpaces.${room.key}.surface`} control={control} render={({ field }) => (
                    <Input type="number" placeholder="—" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
                </td>
                <td className="px-2.5 py-2.5 align-middle">
                  <Controller name={`interiorSpaces.${room.key}.floorCovering`} control={control} render={({ field }) => (
                    <Input placeholder="—" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
                </td>
                <td className="px-2.5 py-2.5 align-middle">
                  <Controller name={`interiorSpaces.${room.key}.state`} control={control} render={({ field }) => (
                    <Select placeholder="État" options={[
                      { value: 'very_good', label: 'Très bon état' },
                      { value: 'good', label: 'Bon état' },
                      { value: 'average', label: 'Moyen état' },
                      { value: 'bad', label: 'Mauvais état' },
                    ]} value={field.value} onChange={field.onChange} className="h-8" />
                  )} />
                </td>
                <td className="px-2.5 py-2.5 align-middle text-center">
                  <Controller name={`interiorSpaces.${room.key}.exteriorAccess`} control={control} render={({ field }) => (
                    <Checkbox checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                </td>
                <td className="px-2.5 py-2.5 align-middle text-center">
                  <Controller name={`interiorSpaces.${room.key}.closet`} control={control} render={({ field }) => (
                    <Checkbox checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                </td>
                <td className="px-2.5 py-2.5 align-middle">
                  <Controller name={`interiorSpaces.${room.key}.heating`} control={control} render={({ field }) => (
                    <Input placeholder="—" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
                </td>
                <td className="px-2.5 py-2.5 align-middle">
                  <Controller name={`interiorSpaces.${room.key}.comments`} control={control} render={({ field }) => (
                    <Input placeholder="—" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                  )} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 lg:hidden">
        {ROOMS.map((room) => (
          <div key={room.key} className="rounded-xl border border-border/30 bg-background/40 p-3">
            <div className="mb-2 flex items-center gap-2 font-semibold text-text">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-text-secondary">
                <room.Icon size={13} />
              </span>
              {room.label}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Controller name={`interiorSpaces.${room.key}.surface`} control={control} render={({ field }) => (
                <Input type="number" placeholder="Surface m²" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
              )} />
              <Controller name={`interiorSpaces.${room.key}.state`} control={control} render={({ field }) => (
                <Select placeholder="État" options={[
                  { value: 'very_good', label: 'Très bon état' },
                  { value: 'good', label: 'Bon état' },
                  { value: 'average', label: 'Moyen état' },
                  { value: 'bad', label: 'Mauvais état' },
                ]} value={field.value} onChange={field.onChange} className="h-8" />
              )} />
              <div className="col-span-2">
                <Controller name={`interiorSpaces.${room.key}.floorCovering`} control={control} render={({ field }) => (
                  <Input placeholder="Revêtement sol" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
                )} />
              </div>
              <Controller name={`interiorSpaces.${room.key}.heating`} control={control} render={({ field }) => (
                <Input placeholder="Chauffage" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="h-8" />
              )} />
              <div className="flex items-center justify-center gap-3 rounded-xl border border-border/30 bg-background/40 px-3 py-2">
                <Controller name={`interiorSpaces.${room.key}.exteriorAccess`} control={control} render={({ field }) => (
                  <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                    <Checkbox checked={!!field.value} onChange={(c) => field.onChange(c)} />
                    Ext.
                  </label>
                )} />
                <span className="h-4 w-px bg-border/50" />
                <Controller name={`interiorSpaces.${room.key}.closet`} control={control} render={({ field }) => (
                  <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                    <Checkbox checked={!!field.value} onChange={(c) => field.onChange(c)} />
                    Placard
                  </label>
                )} />
              </div>
              <div className="col-span-2">
                <Controller name={`interiorSpaces.${room.key}.comments`} control={control} render={({ field }) => (
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

export function InteriorTab({ control, register, watch, propertyType, isGerant = false }: InteriorTabProps) {
  const isLuxury = propertyType === 'luxury';
  const isVacation = propertyType === 'vacation';
  const isResidential = propertyType === 'residential';
  const isCommercial = propertyType === 'commercial';
  const showFull = isResidential || isLuxury || isVacation || isCommercial;
  const { staged, dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = staged ? dark : theme === 'dark';

  return (
    <div className="space-y-5">
      <SectionCard value="interior-details" title="Détails intérieurs" icon={Grid} subtitle="Style, pièces et équipements">
        <div className="space-y-5">
          <Field>
            <SubPanel title="Style">
              {/* Stage glass style picker — holographic, not flat */}
              <div className={staged ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'}>
                {STYLES.map((style) => (
                  <Controller
                    key={style.value}
                    name={`interiorStyles.${style.value}`}
                    control={control}
                    render={({ field }) => {
                      const active = !!field.value;
                      if (staged) {
                        return (
                          <button
                            type="button"
                            onClick={() => field.onChange(!field.value)}
                            className="group relative overflow-hidden rounded-2xl border text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
                            style={{
                              borderColor: active ? (isDark ? 'rgba(167,139,250,0.55)' : 'rgba(20,184,166,0.45)') : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.65)',
                              boxShadow: active
                                ? isDark ? '0 0 28px -12px rgba(167,139,250,0.65), inset 0 1px 0 rgba(255,255,255,0.10)' : '0 12px 28px -14px rgba(13,148,136,0.35), inset 0 1px 0 rgba(255,255,255,0.9)'
                                : isDark ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
                              transform: active ? 'translateY(-1px)' : undefined,
                            }}
                          >
                            <div className="relative aspect-[4/3] overflow-hidden">
                              <img src={style.image} alt={style.label} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                              {active && (
                                <span
                                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border text-white shadow-lg"
                                  style={{
                                    background: isDark ? 'linear-gradient(145deg, #8B7CFF, #5B4BD4)' : 'linear-gradient(145deg, #2DD4BF, #0D9488)',
                                    borderColor: 'rgba(255,255,255,0.55)',
                                    boxShadow: isDark ? '0 6px 16px -6px rgba(124,92,255,0.7)' : '0 6px 16px -6px rgba(13,148,136,0.6)',
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 10l3 3 7-7" />
                                  </svg>
                                </span>
                              )}
                              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                                <span
                                  className="rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] backdrop-blur-md"
                                  style={{
                                    color: 'white',
                                    borderColor: 'rgba(255,255,255,0.22)',
                                    background: 'rgba(10,15,36,0.42)',
                                  }}
                                >
                                  {style.label}
                                </span>
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{
                                    background: active ? (isDark ? '#A78BFA' : '#14B8A6') : 'rgba(255,255,255,0.55)',
                                    boxShadow: active ? (isDark ? '0 0 10px rgba(167,139,250,0.7)' : '0 0 10px rgba(20,184,166,0.6)') : 'none',
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between px-3 py-2.5">
                              <span className={`text-[13px] font-semibold tracking-[-0.1px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{style.label}</span>
                              <span className={`text-[11px] font-bold ${active ? (isDark ? 'text-violet-300' : 'text-teal-700') : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
                                {active ? 'Sélectionné' : 'Choisir'}
                              </span>
                            </div>
                          </button>
                        );
                      }
                      // admin fallback — keep original but polished
                      return (
                        <div
                          className={`cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 ${active ? (isGerant ? 'border-[#905D5D] shadow-[0_8px_20px_-10px_rgba(0,0,0,0.25)]' : 'border-accent shadow-[0_8px_20px_-10px_rgba(0,0,0,0.25)]') : 'border-border/40 hover:border-border'}`}
                          onClick={() => field.onChange(!field.value)}
                        >
                          <div className="aspect-square bg-background relative overflow-hidden">
                            <img src={style.image} alt={style.label} className="w-full h-full object-cover" />
                            {active && (
                              <div className={`absolute top-2 right-2 rounded-full p-1 shadow-sm ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="p-2.5 text-center bg-card">
                            <span className="text-sm font-medium text-text">{style.label}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                ))}
              </div>
              <Controller
                name="interior.styleComments"
                control={control}
                render={({ field }) => (
                  <Textarea label="Commentaires" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} rows={2} className="mt-3" />
                )}
              />
            </SubPanel>
          </Field>

          {showFull && (
            <>
              <Field>
                <SubPanel title="Salle de bain">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller name="bathroom.count" control={control} render={({ field }) => (
                      <Input label="Nombre" type="number" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                    )} />
                    <Controller name="bathroom.parentalSuiteCount" control={control} render={({ field }) => (
                      <Input label="dont Suite Parentale" type="number" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                    )} />
                    <div>
                      <SubLabel>Type</SubLabel>
                      <div className="space-y-2">
                        <Controller name="bathroom.shower" control={control} render={({ field }) => (
                          <Checkbox label="Douche" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                        <Controller name="bathroom.bathtub" control={control} render={({ field }) => (
                          <Checkbox label="Baignoire" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                      </div>
                    </div>
                    <Controller name="bathroom.toiletType" control={control} render={({ field }) => (
                      <Select label="WC" options={[
                        { value: 'in_bathroom', label: "Dans salle d'eau" },
                        { value: 'separate', label: 'Indépendante' }
                      ]} value={field.value} onChange={field.onChange} />
                    )} />
                  </div>
                </SubPanel>
              </Field>

              <Field>
                <SubPanel title="Cuisine">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller name="kitchen.count" control={control} render={({ field }) => (
                      <Input label="Nombre" type="number" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                    )} />
                    <div>
                      <SubLabel>Type</SubLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'american', label: 'Américaine' },
                          { value: 'separate', label: 'Séparée' },
                          { value: 'equipped', label: 'Équipée' },
                          { value: 'empty', label: 'Vide' },
                          { value: 'fitted', label: 'Aménagée' }
                        ].map((type) => (
                          <Controller key={type.value} name={`kitchen.type.${type.value}`} control={control} render={({ field }) => (
                            <Checkbox label={type.label} checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                          )} />
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <SubLabel>Garanties</SubLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Controller name="guarantees.furniture" control={control} render={({ field }) => (
                            <Checkbox label="Garantie meubles" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                          )} />
                        </div>
                        <div>
                          <Controller name="guarantees.appliances" control={control} render={({ field }) => (
                            <Checkbox label="Garantie électroménager" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                          )} />
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Controller name="kitchen.details" control={control} render={({ field }) => (
                        <Textarea label="Détails" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} rows={2} />
                      )} />
                    </div>
                  </div>
                </SubPanel>
              </Field>

              <Field>
                <SubPanel title="Salon / Pièces de vie">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller name="livingRoom.count" control={control} render={({ field }) => (
                      <Input label="Nombre" type="number" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                    )} />
                    <div>
                      <SubLabel>Accès</SubLabel>
                      <div className="space-y-2">
                        <Controller name="livingRoom.terraceAccess" control={control} render={({ field }) => (
                          <Checkbox label="Terrasse" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                        <Controller name="livingRoom.poolAccess" control={control} render={({ field }) => (
                          <Checkbox label="Piscine" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                      </div>
                    </div>
                    <div>
                      <SubLabel>Caractéristiques</SubLabel>
                      <div className="space-y-2">
                        <Controller name="livingRoom.airConditioned" control={control} render={({ field }) => (
                          <Checkbox label="Climatisé" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                        <Controller name="livingRoom.bright" control={control} render={({ field }) => (
                          <Checkbox label="Lumineux" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                        <Controller name="livingRoom.fiber" control={control} render={({ field }) => (
                          <Checkbox label="Fibre" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Controller name="livingRoom.details" control={control} render={({ field }) => (
                        <Textarea label="Détails" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} rows={2} />
                      )} />
                    </div>
                  </div>
                </SubPanel>
              </Field>

              <Field>
                <SubPanel title="Chambres">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Controller name="bedrooms.total" control={control} render={({ field }) => (
                      <Input label="Nombre total" type="number" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                    )} />
                    <Controller name="bedrooms.groundFloor" control={control} render={({ field }) => (
                      <Input label="Nombre en RDC" type="number" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                    )} />
                    <Controller name="bedrooms.parentalSuite" control={control} render={({ field }) => (
                      <Input label="dont Suite Parentale" type="number" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                    )} />
                    <div className="md:col-span-2">
                      <SubLabel>Caractéristiques</SubLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <Controller name="bedrooms.airConditioned" control={control} render={({ field }) => (
                          <Checkbox label="Climatisé" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                        <Controller name="bedrooms.bright" control={control} render={({ field }) => (
                          <Checkbox label="Lumineux" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                        <Controller name="bedrooms.tv" control={control} render={({ field }) => (
                          <Checkbox label="TV" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                      </div>
                    </div>
                    <div>
                      <SubLabel>Accès</SubLabel>
                      <div className="space-y-2">
                        <Controller name="bedrooms.exteriorAccess" control={control} render={({ field }) => (
                          <Checkbox label="Extérieur" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                        <Controller name="bedrooms.poolAccess" control={control} render={({ field }) => (
                          <Checkbox label="Piscine" checked={!!field.value} onChange={(checked) => field.onChange(checked)} />
                        )} />
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <Controller name="bedrooms.details" control={control} render={({ field }) => (
                        <Textarea label="Détails" value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} rows={2} />
                      )} />
                    </div>
                  </div>
                </SubPanel>
              </Field>
            </>
          )}

          {isLuxury && (
            <Field>
              <SubPanel title="Équipements prestige intérieurs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Controller name="luxuryInterior.domotique" control={control} render={({ field }) => (
                    <Checkbox label="Domotique" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="luxuryInterior.cheminee" control={control} render={({ field }) => (
                    <Checkbox label="Cheminée" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="luxuryInterior.hammam" control={control} render={({ field }) => (
                    <Checkbox label="Hammam / Spa" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="luxuryInterior.sauna" control={control} render={({ field }) => (
                    <Checkbox label="Sauna" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="luxuryInterior.cinema" control={control} render={({ field }) => (
                    <Checkbox label="Cinéma" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="luxuryInterior.caveVin" control={control} render={({ field }) => (
                    <Checkbox label="Cave à vin" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="luxuryInterior.ascenseur" control={control} render={({ field }) => (
                    <Checkbox label="Ascenseur" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                </div>
              </SubPanel>
            </Field>
          )}

          {isVacation && (
            <Field>
              <SubPanel title="Équipements et services">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Controller name="interiorVacation.wifi" control={control} render={({ field }) => (
                    <Checkbox label="Wifi" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="interiorVacation.washingMachine" control={control} render={({ field }) => (
                    <Checkbox label="Lave-linge" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="interiorVacation.dishwasher" control={control} render={({ field }) => (
                    <Checkbox label="Lave-vaisselle" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="interiorVacation.tv" control={control} render={({ field }) => (
                    <Checkbox label="Télévision" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="interiorVacation.climatisation" control={control} render={({ field }) => (
                    <Checkbox label="Climatisation" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="interiorVacation.heating" control={control} render={({ field }) => (
                    <Checkbox label="Chauffage" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="interiorVacation.microwave" control={control} render={({ field }) => (
                    <Checkbox label="Micro-ondes" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="interiorVacation.coffeeMaker" control={control} render={({ field }) => (
                    <Checkbox label="Machine à café" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                  <Controller name="interiorVacation.parking" control={control} render={({ field }) => (
                    <Checkbox label="Parking" checked={!!field.value} onChange={(c) => field.onChange(c)} />
                  )} />
                </div>
              </SubPanel>
            </Field>
          )}
        </div>
      </SectionCard>

      {showFull && (
        <SectionCard value="interior-spaces" title="Les intérieurs" icon={Tv} subtitle="Inventaire détaillé des pièces" defaultOpen={false}>
          <InteriorSpacesTable control={control} />
        </SectionCard>
      )}
    </div>
  );
}
