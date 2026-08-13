import Card from '../../ui/Card'
import { InfoField } from '../../ui/InfoField'
import { Home, MapPin, Sun, Layers, Lock, Shield, Truck, Maximize2 } from 'react-feather'

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

export default function PropertyExterior({ property }: { property: any }) {
  const p = property

  const ext = p.exterior || {}
  const extPos = p.exteriorPosition || {}
  const extFeat = p.exteriorFeatures || {}
  const viewsObj = p.views || {}
  const parkingObj = p.parking || {}
  const luxExt = p.luxuryExterior || {}
  const comExt = p.commercialExterior || {}
  const extSpaces = p.exteriorSpaces || {}

  const mainFields: React.ReactNode[] = []
  if (ext.type) mainFields.push(<InfoField key="type" label="Type" value={ext.type} icon={<Home size={14} />} />)
  if (ext.layout) mainFields.push(<InfoField key="layout" label="Aménagement" value={ext.layout} icon={<MapPin size={14} />} />)
  if (ext.guarantee) mainFields.push(<InfoField key="guarantee" label="Garantie" value={ext.guarantee} icon={<Shield size={14} />} />)

  const posParts = [
    extPos.lastFloor && 'Dernier étage',
    extPos.groundFloor && 'Rez-de-chaussée',
    extPos.floorNumber && `Étage: ${extPos.floorNumber}`,
    extPos.singleLevel && 'Plain-pied',
    extPos.pmrAccess && 'Accès PMR',
    extPos.elevator && 'Ascenseur',
  ].filter(Boolean) as string[]

  const amenagementItems: { label: string; value: string }[] = []
  const featureList = pickLabels(extFeat, FEATURE_LABELS)
  if (featureList.length > 0) amenagementItems.push({ label: 'Caractéristiques', value: featureList.join(', ') })
  const viewList = pickLabels(viewsObj, VIEW_LABELS)
  if (viewList.length > 0) amenagementItems.push({ label: 'Vues', value: viewList.join(', ') })
  const parkingList = pickLabels(parkingObj, PARKING_LABELS)
  if (parkingList.length > 0) amenagementItems.push({ label: 'Parking', value: parkingList.join(', ') })
  const luxuryList = pickLabels(luxExt, LUXURY_EXT_LABELS)
  if (luxuryList.length > 0) amenagementItems.push({ label: 'Extérieur prestige', value: luxuryList.join(', ') })
  const commercialList = pickLabels(comExt, COMMERCIAL_EXT_LABELS)
  if (commercialList.length > 0) amenagementItems.push({ label: 'Extérieur commercial', value: commercialList.join(', ') })

  const hasConstruction = mainFields.length > 0
  const hasPosition = posParts.length > 0
  const hasAmenagement = amenagementItems.length > 0
  const hasSpaces = Object.keys(extSpaces).length > 0 && Object.values(extSpaces).some((s: any) => s?.surface || s?.floorCovering || s?.state || s?.comments)

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
            {Object.entries(extSpaces).map(([key, sp]: any) => {
              const spaceLabels: Record<string, string> = { terrasse: 'Terrasse', cave: 'Cave', jardin: 'Jardin', garage: 'Garage', parking: 'Parking', pergola: 'Pergola', piscine: 'Piscine' }
              const label = spaceLabels[key] || key
              const parts = [
                sp.surface && `${sp.surface} m²`,
                sp.floorCovering && `Sol: ${sp.floorCovering}`,
                sp.state && `État: ${sp.state}`,
                sp.comments,
              ].filter(Boolean)
              if (parts.length === 0) return null
              return <InfoField key={key} label={label} value={parts.join(' · ')} icon={<MapPin size={14} />} />
            })}
          </div>
        </Card>
      )}
    </div>
  )
}