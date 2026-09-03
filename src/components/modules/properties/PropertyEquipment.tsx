import Card from '../../ui/Card'
import { InfoField } from '../../ui/InfoField'
import { Zap, Wind, Droplet, Layers, Lock, Shield, Thermometer, Check } from 'react-feather'
import { useStageChrome } from '../calendar/useStageChrome'
import { StagePanel, OrbIcon, STAGE_HUES, SLATE_HUE, useStageTheme } from '../../dashboard/Stage'
import type { StageHue } from '../../dashboard/Stage'

const ENERGY_LABELS: Record<string, string> = {
  gaz: 'Gaz', bois: 'Bois', solaire: 'Solaire', électrique: 'Électrique',
}

const HEATING_MODE_LABELS: Record<string, string> = {
  clim: 'Clim', cheminée: 'Cheminée', radiateur: 'Radiateur', sol: 'Sol',
}

const HEATING_NATURE_LABELS: Record<string, string> = {
  individuel: 'Individuel', collectif: 'Collectif', centrale: 'Centrale', aucun: 'Aucun',
}

const WATER_LABELS: Record<string, string> = {
  onep: 'ONEP', cuve: 'Cuve', puits: 'Puits', pompe: 'Pompe',
}

const WINDOW_MATERIAL_LABELS: Record<string, string> = {
  alu: 'Alu', bois: 'Bois', pvc: 'PVC',
}

const WINDOW_GLASS_LABELS: Record<string, string> = {
  double: 'Double', simple: 'Simple', survitrage: 'Survitrage',
}

const SHUTTER_LABELS: Record<string, string> = {
  électrique: 'Électrique', bois: 'Bois', 'roulant manuel': 'Roulant manuel', aucun: 'Aucun',
}

const GATE_OPENING_LABELS: Record<string, string> = {
  automatique: 'Automatique', manuel: 'Manuel',
}

const GATE_MATERIAL_LABELS: Record<string, string> = {
  fer: 'Fer', alu: 'Alu', bois: 'Bois', aucun: 'Aucun',
}

const POOL_EQUIPMENT_LABELS: Record<string, string> = {
  couverture: 'Couverture', douche: 'Douche', aspirateur: 'Aspirateur',
  pompe: 'Pompe', lumière: 'Lumière',
}

const SECURITY_LABELS: Record<string, string> = {
  alarme: 'Alarme', vidéophone: 'Vidéophone', interphone: 'Interphone',
  blindDoor: 'Porte blindée', blindDoorCount: 'Nb portes blindées',
  camera: 'Caméra', cameraCount: 'Nb caméras',
  poolSecurity: 'Sécurisation piscine',
}

function pickLabels(obj: unknown, labels: Record<string, string>): string[] {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj)
    .filter(([, v]) => v)
    .map(([k]) => labels[k] || k)
}

/* ---------------------------------------------------------------------
   Stage primitives
--------------------------------------------------------------------- */

function ChipRow({ items, hue }: { items: string[]; hue: StageHue }) {
  const dark = useStageTheme() === 'dark'
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-transform duration-200 hover:-translate-y-px"
          style={{
            color: dark ? hue.line : hue.a,
            borderColor: `${hue.a}${dark ? '40' : '30'}`,
            backgroundColor: `${hue.a}${dark ? '14' : '0a'}`,
          }}
        >
          <Check size={11} strokeWidth={3} />
          {item}
        </span>
      ))}
    </div>
  )
}

function SubLabel({ children }: { children: React.ReactNode }) {
  const dark = useStageTheme() === 'dark'
  return (
    <p className={`mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
      {children}
    </p>
  )
}

function SpecField({
  icon: Icon, hue, label, value,
}: {
  icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>
  hue: StageHue
  label: string
  value: React.ReactNode
}) {
  const dark = useStageTheme() === 'dark'
  return (
    <div
      className="rounded-xl border p-3 transition-all duration-200 hover:-translate-y-px"
      style={{
        borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)',
        background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Icon size={12} style={{ color: hue.a }} />
        <span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
          {label}
        </span>
      </div>
      <p className={`text-sm font-semibold leading-relaxed break-words ${dark ? 'text-slate-100' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  )
}

function StatCell({
  icon: Icon, hue, label, value,
}: {
  icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>
  hue: StageHue
  label: string
  value: number | string
}) {
  const dark = useStageTheme() === 'dark'
  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-3 transition-transform duration-200 hover:-translate-y-px"
      style={{
        borderColor: `${hue.a}${dark ? '30' : '22'}`,
        background: `linear-gradient(145deg, ${hue.a}${dark ? '12' : '0a'}, transparent)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,${dark ? '0.06' : '0.35'})`,
      }}
    >
      <OrbIcon icon={Icon} hue={hue} size={36} radius={11} />
      <div className="min-w-0">
        <p className={`truncate text-[10px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
          {label}
        </p>
        <p className={`text-lg font-extrabold leading-tight tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

function StatusPill({ ok, trueLabel, falseLabel }: { ok: boolean; trueLabel: string; falseLabel: string }) {
  const c = ok ? STAGE_HUES.emerald : SLATE_HUE
  const dark = useStageTheme() === 'dark'
  void dark
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
      style={{
        color: c.line,
        borderColor: `${c.a}40`,
        backgroundColor: `${c.a}14`,
        boxShadow: ok ? `0 0 14px ${c.glow}` : undefined,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.line, boxShadow: ok ? `0 0 6px ${c.line}` : 'none' }} />
      {ok ? trueLabel : falseLabel}
    </span>
  )
}

/* ---------------------------------------------------------------------
   Main
--------------------------------------------------------------------- */

export default function PropertyEquipment({ property }: { property: any }) {
  const { staged, dark } = useStageChrome()
  const p = property

  /* ---- shared derived data ---- */

  const energyVals = pickLabels(p.energy, ENERGY_LABELS)
  const heatModeVals = pickLabels(p.heating?.mode, HEATING_MODE_LABELS)
  const heatNatureVals = pickLabels(p.heating?.nature, HEATING_NATURE_LABELS)
  const waterVals = pickLabels(p.water, WATER_LABELS)

  const windowParts = p.windows
    ? [...pickLabels(p.windows.material, WINDOW_MATERIAL_LABELS), ...pickLabels(p.windows.glass, WINDOW_GLASS_LABELS)]
    : []
  const shutterVals = pickLabels(p.shutters, SHUTTER_LABELS)
  const gateParts = p.gate
    ? [...pickLabels(p.gate.opening, GATE_OPENING_LABELS), ...pickLabels(p.gate.material, GATE_MATERIAL_LABELS)]
    : []

  const poolParts = p.pool
    ? [
        p.pool.measurement && `Mesure : ${p.pool.measurement}`,
        p.pool.coating && `Revêtement : ${p.pool.coating}`,
        p.pool.treatment && `Traitement : ${p.pool.treatment}`,
      ].filter(Boolean) as string[]
    : []
  const poolEquipVals = p.pool ? pickLabels(p.pool.equipment, POOL_EQUIPMENT_LABELS) : []
  const hasPool = !!(p.pool?.hasPool)

  const secBool: string[] = []
  const secStats: { label: string; value: number }[] = []
  if (p.security) {
    Object.entries(p.security).forEach(([k, v]) => {
      if (!v || v === 0) return
      const label = SECURITY_LABELS[k] || k
      const n = typeof v === 'number' ? v : NaN
      if (Number.isFinite(n)) secStats.push({ label, value: n })
      else secBool.push(label)
    })
  }

  /* ---- legacy section model ---- */

  const sections: { title: string; icon: React.ReactNode; fields: React.ReactNode[] }[] = []

  const energyFields: React.ReactNode[] = []
  if (energyVals.length > 0) energyFields.push(<InfoField key="energy" label="Énergie" value={energyVals.join(', ')} icon={<Zap size={14} />} />)
  if (heatModeVals.length > 0) energyFields.push(<InfoField key="heatingMode" label="Chauffage (mode)" value={heatModeVals.join(', ')} icon={<Wind size={14} />} />)
  if (heatNatureVals.length > 0) energyFields.push(<InfoField key="heatingNature" label="Chauffage (nature)" value={heatNatureVals.join(', ')} icon={<Thermometer size={14} />} />)
  if (waterVals.length > 0) energyFields.push(<InfoField key="water" label="Eau" value={waterVals.join(', ')} icon={<Droplet size={14} />} />)
  if (energyFields.length > 0) sections.push({ title: 'Énergie & Chauffage', icon: <Zap size={15} />, fields: energyFields })

  const fenetresFields: React.ReactNode[] = []
  if (windowParts.length > 0) fenetresFields.push(<InfoField key="windows" label="Fenêtres" value={windowParts.join(' · ')} icon={<Layers size={14} />} />)
  if (shutterVals.length > 0) fenetresFields.push(<InfoField key="shutters" label="Volets" value={shutterVals.join(', ')} icon={<Layers size={14} />} />)
  if (gateParts.length > 0) fenetresFields.push(<InfoField key="gate" label="Portail" value={gateParts.join(' · ')} icon={<Lock size={14} />} />)
  if (fenetresFields.length > 0) sections.push({ title: 'Fenêtres & Portail', icon: <Layers size={15} />, fields: fenetresFields })

  const poolAll = [...poolParts, ...poolEquipVals]
  if (poolAll.length > 0) sections.push({ title: 'Piscine', icon: <Droplet size={15} />, fields: [
    <InfoField key="pool" label="Piscine" value={poolAll.join(' · ')} icon={<Droplet size={14} />} />,
  ] })

  const secAll = [...secBool, ...secStats.map(s => `${s.label}: ${s.value}`)]
  if (secAll.length > 0) sections.push({ title: 'Sécurité', icon: <Shield size={15} />, fields: [
    <InfoField key="security" label="Sécurité" value={secAll.join(', ')} icon={<Shield size={14} />} />,
  ] })

  /* ===================================================================
     STAGE variant
  =================================================================== */
  if (staged) {
    if (sections.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <OrbIcon icon={Zap} hue={SLATE_HUE} size={48} radius={15} />
          <p className={`text-sm ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
            Aucun équipement renseigné
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        {(energyVals.length > 0 || heatModeVals.length > 0 || heatNatureVals.length > 0 || waterVals.length > 0) && (
          <StagePanel title="Énergie & Chauffage" icon={Zap} hue={STAGE_HUES.amber}>
            <div className="space-y-4">
              {energyVals.length > 0 && (
                <div>
                  <SubLabel>Énergie</SubLabel>
                  <ChipRow items={energyVals} hue={STAGE_HUES.amber} />
                </div>
              )}
              {heatModeVals.length > 0 && (
                <div>
                  <SubLabel>Chauffage · Mode</SubLabel>
                  <ChipRow items={heatModeVals} hue={STAGE_HUES.fuchsia} />
                </div>
              )}
              {heatNatureVals.length > 0 && (
                <div>
                  <SubLabel>Chauffage · Nature</SubLabel>
                  <ChipRow items={heatNatureVals} hue={STAGE_HUES.violet} />
                </div>
              )}
              {waterVals.length > 0 && (
                <div>
                  <SubLabel>Eau</SubLabel>
                  <ChipRow items={waterVals} hue={STAGE_HUES.sky} />
                </div>
              )}
            </div>
          </StagePanel>
        )}

        {(windowParts.length > 0 || shutterVals.length > 0 || gateParts.length > 0) && (
          <StagePanel title="Fenêtres & Portail" icon={Layers} hue={STAGE_HUES.violet}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {windowParts.length > 0 && <SpecField icon={Layers} hue={STAGE_HUES.violet} label="Fenêtres" value={windowParts.join(' · ')} />}
              {shutterVals.length > 0 && <SpecField icon={Layers} hue={STAGE_HUES.fuchsia} label="Volets" value={shutterVals.join(' · ')} />}
              {gateParts.length > 0 && <SpecField icon={Lock} hue={STAGE_HUES.emerald} label="Portail" value={gateParts.join(' · ')} />}
            </div>
          </StagePanel>
        )}

        {(hasPool || poolParts.length > 0 || poolEquipVals.length > 0) && (
          <StagePanel
            title="Piscine"
            icon={Droplet}
            hue={STAGE_HUES.sky}
            badge={hasPool ? <StatusPill ok trueLabel="Présente" falseLabel="" /> : undefined}
          >
            {/* Featured pool card */}
            <div
              className="relative mb-4 overflow-hidden rounded-2xl border p-4"
              style={{
                borderColor: `${STAGE_HUES.sky.a}45`,
                background: `linear-gradient(145deg, ${STAGE_HUES.sky.a}${dark ? '14' : '0c'}, transparent)`,
                boxShadow: `0 4px 18px -6px ${STAGE_HUES.sky.glow}, inset 0 1px 0 rgba(255,255,255,${dark ? '0.08' : '0.4'})`,
              }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full"
                style={{ background: `radial-gradient(circle, ${STAGE_HUES.sky.glow.replace(/[\d.]+\)$/, '0.16)')}, transparent 70%)` }}
              />
              <div className="relative flex items-center gap-3">
                <OrbIcon icon={Droplet} hue={STAGE_HUES.sky} size={44} radius={14} />
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                    Bassin
                  </p>
                  <p
                    className="bg-clip-text text-lg font-extrabold tracking-tight text-transparent"
                    style={{ backgroundImage: `linear-gradient(100deg, ${STAGE_HUES.sky.a}, ${STAGE_HUES.sky.b})` }}
                  >
                    {poolParts.length > 0 ? poolParts.join(' · ') : 'Piscine'}
                  </p>
                </div>
              </div>
            </div>

            {poolEquipVals.length > 0 && (
              <div>
                <SubLabel>Équipements</SubLabel>
                <ChipRow items={poolEquipVals} hue={STAGE_HUES.sky} />
              </div>
            )}
          </StagePanel>
        )}

        {(secBool.length > 0 || secStats.length > 0) && (
          <StagePanel title="Sécurité" icon={Shield} hue={STAGE_HUES.fuchsia}>
            <div className="space-y-4">
              {secStats.length > 0 && (
                <div className={`grid grid-cols-1 gap-3 ${secStats.length >= 2 ? 'sm:grid-cols-2' : ''}`}>
                  {secStats.map(s => (
                    <StatCell key={s.label} icon={Shield} hue={STAGE_HUES.fuchsia} label={s.label} value={s.value} />
                  ))}
                </div>
              )}
              {secBool.length > 0 && (
                <div>
                  <SubLabel>Dispositifs actifs</SubLabel>
                  <ChipRow items={secBool} hue={STAGE_HUES.emerald} />
                </div>
              )}
            </div>
          </StagePanel>
        )}
      </div>
    )
  }

  /* ===================================================================
     Legacy variant (admin shell) — unchanged
  =================================================================== */

  if (sections.length === 0) return <p className="text-center text-text-secondary py-8">Aucun équipement renseigné</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {sections.map(s => (
        <Card key={s.title} className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">{s.icon}{s.title}</h3>
          <div className="grid grid-cols-1 gap-3">{s.fields}</div>
        </Card>
      ))}
    </div>
  )
}
