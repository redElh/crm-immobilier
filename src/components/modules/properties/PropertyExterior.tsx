import Card from '../../ui/Card'
import { InfoField } from '../../ui/InfoField'
import { Home, MapPin, Sun, Layers, Check } from 'react-feather'
import { useStageChrome } from '../calendar/useStageChrome'
import { StagePanel, OrbIcon, STAGE_HUES, SLATE_HUE, useStageTheme } from '../../dashboard/Stage'
import type { StageHue } from '../../dashboard/Stage'

const VIEW_LABELS: Record<string, string> = {
  ocean: 'Océan', panoramic: 'Panoramique', urban: 'Urbain', quiet: 'Calme',
}

const PARKING_LABELS: Record<string, string> = {
  privateExterior: 'Extérieur privé', privateInterior: 'Intérieur privé', garage: 'Garage',
}

const FEATURE_LABELS: Record<string, string> = {
  enclosed: 'Clos', treed: 'Arboré', new: 'A étrenner', poolPossible: 'Piscinable',
  well: 'Puits', poolhouse: 'Pool house', barbecue: 'Barbecue', automaticWatering: 'Arrosage auto',
  caretaker: 'Gardien', gardener: 'Jardinier', noOverlook: 'Sans vis-à-vis',
}

const LUXURY_EXT_LABELS: Record<string, string> = {
  heatedPool: 'Piscine chauffée', tennis: 'Tennis', heliport: 'Héliport',
  guardHouse: 'Maison de gardien', landscapedGarden: 'Jardin paysager',
  seaView: 'Vue mer', mountainView: 'Vue montagne',
}

const COMMERCIAL_EXT_LABELS: Record<string, string> = {
  deliveries: 'Livraisons', truckParking: 'Parking poids lourds', dock: 'Quai de déchargement',
}

const STATE_LABELS: Record<string, string> = {
  very_good: 'Très bon état', good: 'Bon état', average: 'Moyen état', bad: 'Mauvais état',
}

/** Extract truthy keys from a boolean-object or return an array as-is. */
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

export default function PropertyExterior({ property }: { property: any }) {
  const { staged, dark } = useStageChrome()
  const p = property

  const ext = p.exterior || {}
  const extPos = p.exteriorPosition || {}
  const extFeat = p.exteriorFeatures || {}
  const viewsObj = p.views || {}
  const parkingObj = p.parking || {}
  const luxExt = p.luxuryExterior || {}
  const comExt = p.commercialExterior || {}
  const extSpaces = p.exteriorSpaces || {}

  /* ---- shared derived data ---- */

  const mainFields: React.ReactNode[] = []
  if (ext.type) mainFields.push(<InfoField key="type" label="Type" value={ext.type} icon={<Home size={14} />} />)
  if (ext.layout) mainFields.push(<InfoField key="layout" label="Aménagement" value={ext.layout} icon={<MapPin size={14} />} />)
  if (ext.guarantee) mainFields.push(<InfoField key="guarantee" label="Garantie" value={ext.guarantee} icon={<Layers size={14} />} />)

  const posParts = [
    extPos.lastFloor && 'Dernier étage',
    extPos.groundFloor && 'Rez-de-chaussée',
    extPos.floorNumber && `Étage: ${extPos.floorNumber}`,
    extPos.singleLevel && 'Plain-pied',
    extPos.pmrAccess && 'Accès PMR',
    extPos.elevator && 'Ascenseur',
  ].filter(Boolean) as string[]

  const featureList = pickLabels(extFeat, FEATURE_LABELS)
  const viewList = pickLabels(viewsObj, VIEW_LABELS)
  const parkingList = pickLabels(parkingObj, PARKING_LABELS)
  const luxuryList = pickLabels(luxExt, LUXURY_EXT_LABELS)
  const commercialList = pickLabels(comExt, COMMERCIAL_EXT_LABELS)

  const amenagementItems: { label: string; value: string }[] = []
  if (featureList.length > 0) amenagementItems.push({ label: 'Caractéristiques', value: featureList.join(', ') })
  if (viewList.length > 0) amenagementItems.push({ label: 'Vues', value: viewList.join(', ') })
  if (parkingList.length > 0) amenagementItems.push({ label: 'Parking', value: parkingList.join(', ') })
  if (luxuryList.length > 0) amenagementItems.push({ label: 'Extérieur prestige', value: luxuryList.join(', ') })
  if (commercialList.length > 0) amenagementItems.push({ label: 'Extérieur commercial', value: commercialList.join(', ') })

  const spaceLabels: Record<string, string> = { terrasse: 'Terrasse', cave: 'Cave', jardin: 'Jardin', garage: 'Garage', parking: 'Parking', pergola: 'Pergola', piscine: 'Piscine' }
  const spaceEntries = Object.entries(extSpaces).map(([key, sp]: any) => {
    const parts = [
      sp.surface && `${sp.surface} m²`,
      sp.floorCovering && `Sol: ${sp.floorCovering}`,
      sp.state && `État: ${STATE_LABELS[sp.state] || sp.state}`,
      sp.comments,
    ].filter(Boolean) as string[]
    return { key, label: spaceLabels[key] || key, parts }
  }).filter(e => e.parts.length > 0)

  const hasConstruction = mainFields.length > 0
  const hasPosition = posParts.length > 0
  const hasAmenagement = amenagementItems.length > 0
  const hasSpaces = spaceEntries.length > 0

  /* ===================================================================
     STAGE variant
  =================================================================== */
  if (staged) {
    if (!hasConstruction && !hasPosition && !hasAmenagement && !hasSpaces) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <OrbIcon icon={Sun} hue={SLATE_HUE} size={48} radius={15} />
          <p className={`text-sm ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
            Aucune information extérieure renseignée
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        {(hasConstruction || hasPosition) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {hasConstruction && (
              <StagePanel title="Construction" icon={Home} hue={STAGE_HUES.sky}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ext.type && <GlassField icon={Home} hue={STAGE_HUES.sky} label="Type" value={ext.type} />}
                  {ext.layout && <GlassField icon={MapPin} hue={STAGE_HUES.violet} label="Aménagement" value={ext.layout} />}
                  {ext.guarantee && <GlassField icon={Layers} hue={STAGE_HUES.emerald} label="Garantie" value={ext.guarantee} />}
                </div>
              </StagePanel>
            )}
            {hasPosition && (
              <StagePanel title="Position" icon={Layers} hue={STAGE_HUES.violet}>
                <div className="flex flex-wrap gap-2">
                  {posParts.map((part, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-transform duration-200 hover:-translate-y-px"
                      style={{
                        color: dark ? STAGE_HUES.violet.line : STAGE_HUES.violet.a,
                        borderColor: `${STAGE_HUES.violet.a}${dark ? '40' : '30'}`,
                        backgroundColor: `${STAGE_HUES.violet.a}${dark ? '14' : '0a'}`,
                      }}
                    >
                      {part}
                    </span>
                  ))}
                </div>
              </StagePanel>
            )}
          </div>
        )}

        {hasAmenagement && (
          <StagePanel title="Aménagements extérieurs" icon={Sun} hue={STAGE_HUES.emerald}>
            <div className="space-y-4">
              {featureList.length > 0 && (
                <div>
                  <SubLabel>Caractéristiques</SubLabel>
                  <ChipRow items={featureList} hue={STAGE_HUES.emerald} />
                </div>
              )}
              {viewList.length > 0 && (
                <div>
                  <SubLabel>Vues</SubLabel>
                  <ChipRow items={viewList} hue={STAGE_HUES.sky} />
                </div>
              )}
              {parkingList.length > 0 && (
                <div>
                  <SubLabel>Parking</SubLabel>
                  <ChipRow items={parkingList} hue={STAGE_HUES.violet} />
                </div>
              )}
              {luxuryList.length > 0 && (
                <div>
                  <SubLabel>Extérieur prestige</SubLabel>
                  <ChipRow items={luxuryList} hue={STAGE_HUES.amber} />
                </div>
              )}
              {commercialList.length > 0 && (
                <div>
                  <SubLabel>Extérieur commercial</SubLabel>
                  <ChipRow items={commercialList} hue={SLATE_HUE} />
                </div>
              )}
            </div>
          </StagePanel>
        )}

        {hasSpaces && (
          <StagePanel title="Espaces extérieurs" icon={MapPin} hue={STAGE_HUES.amber}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {spaceEntries.map(e => (
                <GlassField key={e.key} icon={MapPin} hue={STAGE_HUES.amber} label={e.label} value={e.parts.join(' · ')} />
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

  function AmenagementGrid({ items }: { items: { label: string; value: string }[] }) {
    if (items.length === 0) return null
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item, i) => (
          <div key={i} className="p-3 rounded-lg bg-background/50 border border-border/30">
            <p className="text-[11px] text-text-secondary/60 mb-1">{item.label}</p>
            <p className="text-sm font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
    )
  }

  if (!hasConstruction && !hasPosition && !hasAmenagement && !hasSpaces) {
    return <p className="text-center text-text-secondary py-8">Aucune information extérieure renseignée</p>
  }

  return (
    <div className="space-y-5">
      {(hasConstruction || hasPosition) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {hasConstruction && (
            <Card className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Home size={15} />Construction</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{mainFields}</div>
            </Card>
          )}
          {hasPosition && (
            <Card className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Layers size={15} />Position</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{posParts.join(' · ')}</p>
            </Card>
          )}
        </div>
      )}

      {hasAmenagement && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Sun size={15} />Aménagements extérieurs</h3>
          <AmenagementGrid items={amenagementItems} />
        </Card>
      )}

      {hasSpaces && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><MapPin size={15} />Espaces extérieurs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {spaceEntries.map(e => (
              <InfoField key={e.key} label={e.label} value={e.parts.join(' · ')} icon={<MapPin size={14} />} />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
