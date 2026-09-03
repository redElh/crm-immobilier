import Card from '../../ui/Card'
import { InfoField } from '../../ui/InfoField'
import { Home, Grid, Layers, Star, Check, Droplet, Coffee, Moon, MessageSquare } from 'react-feather'
import { useStageChrome } from '../calendar/useStageChrome'
import { StagePanel, OrbIcon, STAGE_HUES, SLATE_HUE, useStageTheme } from '../../dashboard/Stage'
import type { StageHue } from '../../dashboard/Stage'

const STYLE_LABELS: Record<string, string> = {
  moderne: 'Moderne', traditionnel: 'Traditionnel', minimaliste: 'Minimaliste',
  beldi: 'Beldi', contemporain: 'Contemporain',
}

const VACATION_LABELS: Record<string, string> = {
  wifi: 'Wifi', washingMachine: 'Lave-linge', dishwasher: 'Lave-vaisselle',
  tv: 'Télévision', climatisation: 'Climatisation', heating: 'Chauffage',
  microwave: 'Micro-ondes', coffeeMaker: 'Machine à café', parking: 'Parking',
}

const STATE_LABELS: Record<string, string> = {
  very_good: 'Très bon état', good: 'Bon état', average: 'Moyen état', bad: 'Mauvais état',
}

const LUXURY_INTERIOR_LABELS: Record<string, string> = {
  domotique: 'Domotique', cheminee: 'Cheminée', hammam: 'Hammam / Spa',
  sauna: 'Sauna', cinema: 'Cinéma', caveVin: 'Cave à vin', ascenseur: 'Ascenseur',
}

function pickLabels(obj: unknown, labels: Record<string, string>): string[] {
  if (Array.isArray(obj)) return obj
  if (obj && typeof obj === 'object') {
    return Object.entries(obj)
      .filter(([, v]) => v)
      .map(([k]) => labels[k] || k)
  }
  return []
}

/* ---------------------------------------------------------------------
   Stage primitives
--------------------------------------------------------------------- */

function GlassField({
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

/* ---------------------------------------------------------------------
   Main
--------------------------------------------------------------------- */

export default function PropertyInterior({ property }: { property: any }) {
  const { staged, dark } = useStageChrome()
  const p = property

  const interiorStyles = p.interiorStyles || {}
  const interiorComment = p.interior?.styleComments || ''
  const bath = {
    count: p.bathroom_count,
    parentalSuiteCount: p.bathroom_parentalSuiteCount,
    shower: p.bathroom_shower,
    bathtub: p.bathroom_bathtub,
    toiletType: p.bathroom_toiletType,
  }
  const kitchen = p.kitchen || {}
  const kType = kitchen.type || {}
  const guarantees = p.guarantees || {}
  const lr = {
    count: p.livingRoom_count,
    terraceAccess: p.livingRoom_terraceAccess,
    poolAccess: p.livingRoom_poolAccess,
    airConditioned: p.livingRoom_airConditioned,
    bright: p.livingRoom_bright,
    fiber: p.livingRoom_fiber,
    details: p.livingRoom_details,
  }
  const bd = {
    total: p.bedrooms_total,
    groundFloor: p.bedrooms_groundFloor,
    parentalSuite: p.bedrooms_parentalSuite,
    airConditioned: p.bedrooms_airConditioned,
    bright: p.bedrooms_bright,
    tv: p.bedrooms_tv,
    exteriorAccess: p.bedrooms_exteriorAccess,
    poolAccess: p.bedrooms_poolAccess,
    details: p.bedrooms_details,
  }
  const spaces = p.interiorSpaces || {}

  /* ---- shared derived data ---- */

  const selectedStyles = pickLabels(interiorStyles, STYLE_LABELS)
  const luxList = pickLabels(p.luxuryInterior || {}, LUXURY_INTERIOR_LABELS)
  const vacList = pickLabels(p.interiorVacation || {}, VACATION_LABELS)

  const styleItems: { label: string; value: string }[] = []
  if (selectedStyles.length > 0) styleItems.push({ label: 'Styles', value: selectedStyles.join(', ') })
  if (interiorComment) styleItems.push({ label: 'Commentaires', value: interiorComment })
  if (luxList.length > 0) styleItems.push({ label: 'Prestations haut de gamme', value: luxList.join(', ') })
  if (vacList.length > 0) styleItems.push({ label: 'Équipements vacance', value: vacList.join(', ') })

  const bathParts = [
    bath.count && `${bath.count} salle(s)`,
    bath.parentalSuiteCount && `dont ${bath.parentalSuiteCount} suite parentale`,
    bath.shower && 'Douche',
    bath.bathtub && 'Baignoire',
    bath.toiletType && `WC: ${bath.toiletType === 'separate' ? 'Indépendante' : "Dans salle d'eau"}`,
  ].filter(Boolean) as string[]

  const kitchenParts = [
    kitchen.count && `${kitchen.count} cuisine(s)`,
    kType.american && 'Américaine',
    kType.separate && 'Séparée',
    kType.equipped && 'Équipée',
    kType.empty && 'Vide',
    kType.fitted && 'Aménagée',
    kitchen.details,
    guarantees.furniture && 'Garantie meubles',
    guarantees.appliances && 'Garantie électroménager',
  ].filter(Boolean) as string[]

  const lrParts = [
    lr.count && `${lr.count} salon(s)`,
    lr.terraceAccess && 'Accès terrasse',
    lr.poolAccess && 'Accès piscine',
    lr.airConditioned && 'Climatisé',
    lr.bright && 'Lumineux',
    lr.fiber && 'Fibre',
    lr.details,
  ].filter(Boolean) as string[]

  const bdParts = [
    bd.total && `Total: ${bd.total}`,
    bd.groundFloor && `${bd.groundFloor} en RDC`,
    bd.parentalSuite && `${bd.parentalSuite} suite parentale`,
    bd.airConditioned && 'Climatisé',
    bd.bright && 'Lumineux',
    bd.tv && 'TV',
    bd.exteriorAccess && 'Accès extérieur',
    bd.poolAccess && 'Accès piscine',
    bd.details,
  ].filter(Boolean) as string[]

  const roomItems: { label: string; value: string }[] = []
  if (bathParts.length > 0) roomItems.push({ label: 'Salle de bain', value: bathParts.join(' · ') })
  if (kitchenParts.length > 0) roomItems.push({ label: 'Cuisine', value: kitchenParts.join(' · ') })
  if (lrParts.length > 0) roomItems.push({ label: 'Salon', value: lrParts.join(' · ') })
  if (bdParts.length > 0) roomItems.push({ label: 'Détails chambres', value: bdParts.join(' · ') })

  const spaceLabels: Record<string, string> = { entree: 'Entrée', salon: 'Salon', cuisine: 'Cuisine', chambre: 'Chambre', salle_de_bain: 'Salle de bain', bureau: 'Bureau', buanderie: 'Buanderie', dressing: 'Dressing' }
  const spaceEntries = Object.entries(spaces).map(([key, sp]: any) => {
    const parts = [
      sp.surface && `${sp.surface} m²`,
      sp.floorCovering && `Sol: ${sp.floorCovering}`,
      sp.state && `État: ${STATE_LABELS[sp.state] || sp.state}`,
      sp.exteriorAccess && 'Accès ext.',
      sp.closet && 'Placard',
      sp.heating && `Chauffage: ${sp.heating}`,
      sp.comments,
    ].filter(Boolean) as string[]
    return { key, label: spaceLabels[key] || key, parts }
  }).filter(e => e.parts.length > 0)

  const sections: { title: string; icon: React.ReactNode; fields: React.ReactNode[] }[] = []
  if (styleItems.length > 0) sections.push({ title: 'Styles & Prestations', icon: <Home size={15} />, fields: styleItems.map((item, i) => (
    <InfoField key={i} label={item.label} value={item.value} icon={<Star size={14} />} />
  )) })
  if (roomItems.length > 0) sections.push({ title: 'Pièces', icon: <Grid size={15} />, fields: roomItems.map((item, i) => (
    <InfoField key={i} label={item.label} value={item.value} icon={<Home size={14} />} />
  )) })
  if (spaceEntries.length > 0) sections.push({ title: 'Espaces intérieurs', icon: <Layers size={15} />, fields: spaceEntries.map(e => (
    <InfoField key={e.key} label={e.label} value={e.parts.join(' · ')} icon={<Layers size={14} />} />
  )) })

  /* ===================================================================
     STAGE variant
  =================================================================== */
  if (staged) {
    if (sections.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <OrbIcon icon={Home} hue={SLATE_HUE} size={48} radius={15} />
          <p className={`text-sm ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
            Aucune information intérieure renseignée
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        {(selectedStyles.length > 0 || luxList.length > 0 || vacList.length > 0 || !!interiorComment) && (
          <StagePanel title="Styles & Prestations" icon={Star} hue={STAGE_HUES.fuchsia}>
            <div className="space-y-4">
              {selectedStyles.length > 0 && (
                <div>
                  <SubLabel>Styles</SubLabel>
                  <ChipRow items={selectedStyles} hue={STAGE_HUES.violet} />
                </div>
              )}
              {luxList.length > 0 && (
                <div>
                  <SubLabel>Prestations haut de gamme</SubLabel>
                  <ChipRow items={luxList} hue={STAGE_HUES.amber} />
                </div>
              )}
              {vacList.length > 0 && (
                <div>
                  <SubLabel>Équipements vacance</SubLabel>
                  <ChipRow items={vacList} hue={STAGE_HUES.sky} />
                </div>
              )}
              {interiorComment && (
                <GlassField icon={MessageSquare} hue={STAGE_HUES.fuchsia} label="Commentaires" value={
                  <span className={`font-normal leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {interiorComment}
                  </span>
                } />
              )}
            </div>
          </StagePanel>
        )}

        {roomItems.length > 0 && (
          <StagePanel title="Pièces" icon={Grid} hue={STAGE_HUES.sky}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bathParts.length > 0 && <GlassField icon={Droplet} hue={STAGE_HUES.fuchsia} label="Salle de bain" value={bathParts.join(' · ')} />}
              {kitchenParts.length > 0 && <GlassField icon={Coffee} hue={STAGE_HUES.amber} label="Cuisine" value={kitchenParts.join(' · ')} />}
              {lrParts.length > 0 && <GlassField icon={Home} hue={STAGE_HUES.violet} label="Salon" value={lrParts.join(' · ')} />}
              {bdParts.length > 0 && <GlassField icon={Moon} hue={STAGE_HUES.emerald} label="Chambres" value={bdParts.join(' · ')} />}
            </div>
          </StagePanel>
        )}

        {spaceEntries.length > 0 && (
          <StagePanel title="Espaces intérieurs" icon={Layers} hue={STAGE_HUES.emerald}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {spaceEntries.map(e => (
                <GlassField key={e.key} icon={Layers} hue={STAGE_HUES.emerald} label={e.label} value={e.parts.join(' · ')} />
              ))}
            </div>
          </StagePanel>
        )}
      </div>
    )
  }

  /* ===================================================================
     Legacy variant (admin shell) — unchanged
  =================================================================== */

  if (sections.length === 0) return <p className="text-center text-text-secondary py-8">Aucune information intérieure renseignée</p>

  return (
    <div className="space-y-5">
      {sections.map(s => (
        <Card key={s.title} className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">{s.icon}{s.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{s.fields}</div>
        </Card>
      ))}
    </div>
  )
}
