import Card from '../../ui/Card'
import { InfoField } from '../../ui/InfoField'
import { Home, Grid, Layers, Star } from 'react-feather'

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

export default function PropertyInterior({ property }: { property: any }) {
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
  const lux = p.luxuryInterior || {}
  const vac = p.interiorVacation || {}

  const sections: { title: string; icon: React.ReactNode; fields: React.ReactNode[] }[] = []

  const styleItems: { label: string; value: string }[] = []
  const selectedStyles = pickLabels(interiorStyles, STYLE_LABELS)
  if (selectedStyles.length > 0) styleItems.push({ label: 'Styles', value: selectedStyles.join(', ') })
  if (interiorComment) styleItems.push({ label: 'Commentaires', value: interiorComment })
  const luxList = pickLabels(lux, LUXURY_INTERIOR_LABELS)
  if (luxList.length > 0) styleItems.push({ label: 'Prestations haut de gamme', value: luxList.join(', ') })
  const vacList = pickLabels(vac, VACATION_LABELS)
  if (vacList.length > 0) styleItems.push({ label: 'Équipements vacance', value: vacList.join(', ') })
  if (styleItems.length > 0) sections.push({ title: 'Styles & Prestations', icon: <Home size={15} />, fields: styleItems.map((item, i) => (
    <InfoField key={i} label={item.label} value={item.value} icon={<Star size={14} />} />
  )) })

  const roomItems: { label: string; value: string }[] = []
  const bathParts = [
    bath.count && `${bath.count} salle(s)`,
    bath.parentalSuiteCount && `dont ${bath.parentalSuiteCount} suite parentale`,
    bath.shower && 'Douche',
    bath.bathtub && 'Baignoire',
    bath.toiletType && `WC: ${bath.toiletType === 'separate' ? 'Indépendante' : "Dans salle d'eau"}`,
  ].filter(Boolean)
  if (bathParts.length > 0) roomItems.push({ label: 'Salle de bain', value: bathParts.join(' · ') })

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
  ].filter(Boolean)
  if (kitchenParts.length > 0) roomItems.push({ label: 'Cuisine', value: kitchenParts.join(' · ') })

  const lrParts = [
    lr.count && `${lr.count} salon(s)`,
    lr.terraceAccess && 'Accès terrasse',
    lr.poolAccess && 'Accès piscine',
    lr.airConditioned && 'Climatisé',
    lr.bright && 'Lumineux',
    lr.fiber && 'Fibre',
    lr.details,
  ].filter(Boolean)
  if (lrParts.length > 0) roomItems.push({ label: 'Salon', value: lrParts.join(' · ') })

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
  ].filter(Boolean)
  if (bdParts.length > 0) roomItems.push({ label: 'Détails chambres', value: bdParts.join(' · ') })

  if (roomItems.length > 0) sections.push({ title: 'Pièces', icon: <Grid size={15} />, fields: roomItems.map((item, i) => (
    <InfoField key={i} label={item.label} value={item.value} icon={<Home size={14} />} />
  )) })

  if (Object.keys(spaces).length > 0) {
    const spaceLabels: Record<string, string> = { entree: 'Entrée', salon: 'Salon', cuisine: 'Cuisine', chambre: 'Chambre', salle_de_bain: 'Salle de bain', bureau: 'Bureau', buanderie: 'Buanderie', dressing: 'Dressing' }
    const spaceFields = Object.entries(spaces).map(([key, sp]: any) => {
      const label = spaceLabels[key] || key
      const parts = [
        sp.surface && `${sp.surface} m²`,
        sp.floorCovering && `Sol: ${sp.floorCovering}`,
        sp.state && `État: ${STATE_LABELS[sp.state] || sp.state}`,
        sp.exteriorAccess && 'Accès ext.',
        sp.closet && 'Placard',
        sp.heating && `Chauffage: ${sp.heating}`,
        sp.comments,
      ].filter(Boolean)
      if (parts.length === 0) return null
      return <InfoField key={key} label={label} value={parts.join(' · ')} icon={<Layers size={14} />} />
    }).filter(Boolean)
    if (spaceFields.length > 0) sections.push({ title: 'Espaces intérieurs', icon: <Layers size={15} />, fields: spaceFields })
  }

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