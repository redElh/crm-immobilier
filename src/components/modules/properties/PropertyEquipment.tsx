import Card from '../../ui/Card'
import { InfoField } from '../../ui/InfoField'
import { Grid, Wind, Droplet, Layers, Lock, Shield, Sun, Thermometer } from 'react-feather'

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

export default function PropertyEquipment({ property }: { property: any }) {
  const p = property
  const sections: { title: string; icon: React.ReactNode; fields: React.ReactNode[] }[] = []

  const energyFields: React.ReactNode[] = []
  const energyVals = pickLabels(p.energy, ENERGY_LABELS)
  if (energyVals.length > 0) energyFields.push(<InfoField key="energy" label="Énergie" value={energyVals.join(', ')} icon={<ZapIcon />} />)
  const heatingModeVals = pickLabels(p.heating?.mode, HEATING_MODE_LABELS)
  if (heatingModeVals.length > 0) energyFields.push(<InfoField key="heatingMode" label="Chauffage (mode)" value={heatingModeVals.join(', ')} icon={<Wind size={14} />} />)
  const heatingNatureVals = pickLabels(p.heating?.nature, HEATING_NATURE_LABELS)
  if (heatingNatureVals.length > 0) energyFields.push(<InfoField key="heatingNature" label="Chauffage (nature)" value={heatingNatureVals.join(', ')} icon={<Thermometer size={14} />} />)
  const waterVals = pickLabels(p.water, WATER_LABELS)
  if (waterVals.length > 0) energyFields.push(<InfoField key="water" label="Eau" value={waterVals.join(', ')} icon={<Droplet size={14} />} />)
  if (energyFields.length > 0) sections.push({ title: 'Énergie & Chauffage', icon: <ZapIcon />, fields: energyFields })

  const fenetresFields: React.ReactNode[] = []
  if (p.windows) {
    const matVals = pickLabels(p.windows.material, WINDOW_MATERIAL_LABELS)
    const glassVals = pickLabels(p.windows.glass, WINDOW_GLASS_LABELS)
    const parts = [...matVals, ...glassVals]
    if (parts.length > 0) fenetresFields.push(<InfoField key="windows" label="Fenêtres" value={parts.join(' · ')} icon={<Layers size={14} />} />)
  }
  const shutterVals = pickLabels(p.shutters, SHUTTER_LABELS)
  if (shutterVals.length > 0) fenetresFields.push(<InfoField key="shutters" label="Volets" value={shutterVals.join(', ')} icon={<Layers size={14} />} />)
  if (p.gate) {
    const openingVals = pickLabels(p.gate.opening, GATE_OPENING_LABELS)
    const matVals = pickLabels(p.gate.material, GATE_MATERIAL_LABELS)
    const parts = [...openingVals, ...matVals]
    if (parts.length > 0) fenetresFields.push(<InfoField key="gate" label="Portail" value={parts.join(' · ')} icon={<Lock size={14} />} />)
  }
  if (fenetresFields.length > 0) sections.push({ title: 'Fenêtres & Portail', icon: <Layers size={15} />, fields: fenetresFields })

  const poolFields: React.ReactNode[] = []
  if (p.pool) {
    const poolParts = [
      p.pool.hasPool && 'Piscine présente',
      p.pool.measurement && `Mesure: ${p.pool.measurement}`,
      p.pool.coating && `Revêtement: ${p.pool.coating}`,
      p.pool.treatment && `Traitement: ${p.pool.treatment}`,
    ].filter(Boolean)
    const equipVals = pickLabels(p.pool.equipment, POOL_EQUIPMENT_LABELS)
    const all = [...poolParts, ...equipVals]
    if (all.length > 0) poolFields.push(<InfoField key="pool" label="Piscine" value={all.join(' · ')} icon={<Droplet size={14} />} />)
  }
  if (poolFields.length > 0) sections.push({ title: 'Piscine', icon: <Droplet size={15} />, fields: poolFields })

  const secFields: React.ReactNode[] = []
  if (p.security) {
    const parts = Object.entries(p.security)
      .filter(([, v]) => v && v !== 0)
      .map(([k, v]) => {
        const label = SECURITY_LABELS[k] || k
        return typeof v === 'boolean' ? label : `${label}: ${v}`
      })
    if (parts.length > 0) secFields.push(<InfoField key="security" label="Sécurité" value={parts.join(', ')} icon={<Shield size={14} />} />)
  }
  if (secFields.length > 0) sections.push({ title: 'Sécurité', icon: <Shield size={15} />, fields: secFields })

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

function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}
