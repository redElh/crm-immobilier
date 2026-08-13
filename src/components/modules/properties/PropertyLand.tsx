import Card from '../../ui/Card'
import { InfoField } from '../../ui/InfoField'
import { MapPin, Maximize2, Sun, Droplet, FileText, Navigation } from 'react-feather'

export default function PropertyLand({ property }: { property: any }) {
  const p = property

  const fields: React.ReactNode[] = []
  if (p.landType) fields.push(<InfoField key="landType" label="Type de terrain" value={p.landType} icon={<MapPin size={14} />} />)
  if (p.landSize) fields.push(<InfoField key="landSize" label="Surface du terrain" value={`${p.landSize} m²`} icon={<Maximize2 size={14} />} />)
  if (p.buildable) fields.push(<InfoField key="buildable" label="Constructible" value={p.buildable} icon={<FileText size={14} />} />)
  if (p.buildableSurface) fields.push(<InfoField key="buildableSurface" label="Surface constructible" value={`${p.buildableSurface} m²`} icon={<Maximize2 size={14} />} />)
  if (p.avna) fields.push(<InfoField key="avna" label="AVNA" value={`${p.avna} MAD`} icon={<Droplet size={14} />} />)
  if (p.dt) fields.push(<InfoField key="dt" label="DT" value={p.dt} icon={<FileText size={14} />} />)
  if (p.landOrientation) fields.push(<InfoField key="landOrientation" label="Orientation" value={p.landOrientation} icon={<Sun size={14} />} />)
  if (p.coordinates?.latitude && p.coordinates?.longitude) fields.push(
    <InfoField key="coords" label="Coordonnées GPS" value={`${p.coordinates.latitude}, ${p.coordinates.longitude}`} icon={<Navigation size={14} />} />
  )

  if (fields.length === 0) return <p className="text-center text-text-secondary py-8">Aucune information foncière renseignée</p>

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Informations foncières</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{fields}</div>
      </Card>
    </div>
  )
}