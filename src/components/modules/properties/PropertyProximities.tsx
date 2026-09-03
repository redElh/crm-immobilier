import Card from '../../ui/Card'
import { InfoField } from '../../ui/InfoField'
import { MapPin, Navigation } from 'react-feather'
import { useStageChrome } from '../calendar/useStageChrome'
import { StagePanel, OrbIcon, STAGE_HUES, SLATE_HUE, useStageTheme } from '../../dashboard/Stage'
import type { StageHue } from '../../dashboard/Stage'

const PROXIMITY_LABELS: Record<string, string> = {
  aéroport: 'Aéroport', centre_ville: 'Centre ville', crèche: 'Crèche',
  garderie: 'Garderie', golf: 'Golf', médecin: 'Médecin',
  palais_des_congrès: 'Palais des congrès', piscine_publique: 'Piscine publique',
  port: 'Port', supermarché: 'Supermarché', tram: 'Tram',
  autoroute: 'Autoroute', cinéma: 'Cinéma', école_primaire: 'École primaire',
  gare: 'Gare', hôpital_clinique: 'Hôpital / Clinique', mer: 'Mer',
  parc: 'Parc', pistes_de_ski: 'Pistes de ski', route_principale: 'Route principale',
  taxi: 'Taxi', université: 'Université', bus: 'Bus', commerces: 'Commerces',
  école_secondaire: 'École secondaire', gare_routière: 'Gare routière',
  lac: 'Lac', métro: 'Métro', parking_public: 'Parking public',
  plage: 'Plage', salle_de_sport: 'Salle de sport', tennis: 'Tennis',
}

interface ProxItem {
  key: string
  label: string
  raw: string
  km: number | null
}

/* ---------------------------------------------------------------------
   Stage helpers
--------------------------------------------------------------------- */

function distanceHue(km: number | null): { hue: StageHue | typeof SLATE_HUE; tier: string } {
  if (km == null) return { hue: SLATE_HUE, tier: '—' }
  if (km <= 2) return { hue: STAGE_HUES.emerald, tier: 'À proximité' }
  if (km <= 10) return { hue: STAGE_HUES.amber, tier: 'Quelques minutes' }
  return { hue: STAGE_HUES.violet, tier: 'À proximité relative' }
}

function ProximityTile({ item }: { item: ProxItem }) {
  const dark = useStageTheme() === 'dark'
  const { hue, tier } = distanceHue(item.km)
  return (
    <div
      className="group rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        borderColor: `${hue.a}${dark ? '3c' : '22'}`,
        background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,${dark ? '0.07' : '0.35'})`,
      }}
    >
      <div className="mb-1 flex items-center justify-between gap-1">
        <span className={`truncate text-[10px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-slate-400' : 'text-teal-900/45'}`}>
          {item.label}
        </span>
        <Navigation
          size={12}
          className="shrink-0 transition-transform duration-300 group-hover:rotate-45"
          style={{ color: dark ? hue.line : hue.a }}
        />
      </div>
      <p className="text-[15px] font-extrabold leading-tight tabular-nums" style={{ color: dark ? hue.line : hue.a }}>
        {item.raw}
      </p>
      <p className={`mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${dark ? 'text-slate-500' : 'text-teal-900/35'}`}>
        {tier}
      </p>
    </div>
  )
}

function NearestHero({ item }: { item: ProxItem }) {
  const dark = useStageTheme() === 'dark'
  const hue = STAGE_HUES.emerald
  return (
    <div
      className="relative mb-4 flex items-center gap-3 overflow-hidden rounded-2xl border p-4"
      style={{
        borderColor: `${hue.a}45`,
        background: `linear-gradient(145deg, ${hue.a}${dark ? '14' : '0c'}, transparent)`,
        boxShadow: `0 4px 18px -6px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,${dark ? '0.08' : '0.4'})`,
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full"
        style={{ background: `radial-gradient(circle, ${hue.glow.replace(/[\d.]+\)$/, '0.16)')}, transparent 70%)` }}
      />
      <OrbIcon icon={Navigation} hue={hue} size={44} radius={14} />
      <div className="min-w-0">
        <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-slate-400' : 'text-teal-900/45'}`}>
          Point d'intérêt le plus proche
        </p>
        <p
          className="truncate bg-clip-text text-lg font-extrabold tracking-tight text-transparent"
          style={{ backgroundImage: `linear-gradient(100deg, ${hue.a}, ${hue.b})` }}
        >
          {item.label} · {item.raw}
        </p>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------
   Main
--------------------------------------------------------------------- */

export default function PropertyProximities({ property }: { property: any }) {
  const { staged, dark } = useStageChrome()
  const p = property
  const prox = p.proximites || {}

  /* ---- shared derived data ---- */

  const fields = Object.entries(prox)
    .map(([key, val]: any) => {
      if (!val || !val.distance) return null
      const label = PROXIMITY_LABELS[key] || key
      const raw = `${val.distance} ${val.unite || 'km'}`
      const num = parseFloat(String(val.distance))
      const km = !isNaN(num) && num > 0 ? (String(val.unite) === 'm' ? num / 1000 : num) : null
      return { key, label, raw, km }
    })
    .filter(Boolean) as ProxItem[]

  /* ===================================================================
     STAGE variant
  =================================================================== */
  if (staged) {
    if (fields.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <OrbIcon icon={MapPin} hue={SLATE_HUE} size={48} radius={15} />
          <p className={`text-sm ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
            Aucune proximité renseignée
          </p>
        </div>
      )
    }

    const sorted = [...fields].sort((a, b) => {
      if (a.km == null) return 1
      if (b.km == null) return -1
      return a.km - b.km
    })
    const nearest = sorted.find(f => f.km != null)
    const within2km = fields.filter(f => f.km != null && f.km <= 2).length

    return (
      <StagePanel
        title="Proximités"
        icon={MapPin}
        hue={STAGE_HUES.violet}
        badge={
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{
              color: STAGE_HUES.violet.line,
              borderColor: `${STAGE_HUES.violet.a}40`,
              backgroundColor: `${STAGE_HUES.violet.a}14`,
            }}
          >
            <MapPin size={10} />
            {fields.length} point{fields.length > 1 ? 's' : ''} d'intérêt
          </span>
        }
      >
        {nearest && <NearestHero item={nearest} />}

        {within2km > 0 && (
          <p className={`mb-3 flex items-center gap-1.5 text-xs font-medium ${dark ? 'text-slate-400' : 'text-teal-900/55'}`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STAGE_HUES.emerald.line, boxShadow: `0 0 6px ${STAGE_HUES.emerald.line}` }} />
            {within2km} à moins de 2 km
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {sorted.map(item => (
            <ProximityTile key={item.key} item={item} />
          ))}
        </div>
      </StagePanel>
    )
  }

  /* ===================================================================
     Legacy variant (admin shell) — unchanged
  =================================================================== */

  if (fields.length === 0) return <p className="text-center text-text-secondary py-8">Aucune proximité renseignée</p>

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><MapPin size={15} />Proximités</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fields.map(f => (
            <InfoField key={f.key} label={f.label} value={f.raw} icon={<Navigation size={14} />} />
          ))}
        </div>
      </Card>
    </div>
  )
}
