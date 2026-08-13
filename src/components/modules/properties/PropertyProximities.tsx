import Card from '../../ui/Card'
import { InfoField } from '../../ui/InfoField'
import { MapPin, Navigation } from 'react-feather'

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

export default function PropertyProximities({ property }: { property: any }) {
  const p = property
  const prox = p.proximites || {}

  const fields = Object.entries(prox)
    .map(([key, val]: any) => {
      if (!val || !val.distance) return null
      const label = PROXIMITY_LABELS[key] || key
      return { key, label, value: `${val.distance} ${val.unite || 'km'}` }
    })
    .filter(Boolean) as { key: string; label: string; value: string }[]

  if (fields.length === 0) return <p className="text-center text-text-secondary py-8">Aucune proximité renseignée</p>

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><MapPin size={15} />Proximités</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fields.map(f => (
            <InfoField key={f.key} label={f.label} value={f.value} icon={<Navigation size={14} />} />
          ))}
        </div>
      </Card>
    </div>
  )
}