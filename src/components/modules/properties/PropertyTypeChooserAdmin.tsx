import { Home, Briefcase, MapPin, Sun, Star } from 'react-feather'
import { STAGE_HUES } from '../../dashboard/Stage'
import { PianoTypeChooser, type PianoChooserKey, type PianoChooserStat } from '../shared/PianoTypeChooser'

/* =====================================================================
   PropertyTypeChooserAdmin — premium "piano keys" type picker for
   "Ajouter un bien" (admin/gérant).

   Same structure as the client piano picker (shared PianoTypeChooser),
   dressed in the admin (orange/rose) skin.
   ===================================================================== */

const PROPERTY_TYPE_KEYS: PianoChooserKey[] = [
  { type: 'residential', title: 'Résidentiel', description: 'Appartements, maisons et villas, du studio au duplex familial.', icon: Home, hue: STAGE_HUES.sky },
  { type: 'commercial', title: 'Commercial', description: 'Bureaux, locaux et boutiques, adresses professionnelles.', icon: Briefcase, hue: STAGE_HUES.violet },
  { type: 'land', title: 'Terrains', description: 'Parcelles constructibles et agricoles, projets fonciers.', icon: MapPin, hue: STAGE_HUES.emerald },
  { type: 'vacation', title: 'Vacances', description: 'Locations saisonnières et résidences, planning des séjours.', icon: Sun, hue: STAGE_HUES.amber },
  { type: 'luxury', title: 'Luxe', description: 'Biens haut de gamme et adresses confidentielles.', icon: Star, hue: STAGE_HUES.fuchsia },
]

export type PropertyTypeStat = PianoChooserStat

interface PropertyTypeChooserAdminProps {
  stats?: Record<string, PropertyTypeStat>
  onClose: () => void
  onSelect: (type: string) => void
}

export function PropertyTypeChooserAdmin({ stats, onClose, onSelect }: PropertyTypeChooserAdminProps) {
  return (
    <PianoTypeChooser
      variant="admin"
      eyebrow="Nouveau bien"
      title="Quel type de bien souhaitez-vous créer ?"
      subtitle="Choisissez une famille — le formulaire s'adaptera automatiquement au type de bien."
      ariaLabel="Nouveau bien — choisir un type"
      keys={PROPERTY_TYPE_KEYS}
      stats={stats}
      statLabels={['biens', 'actifs', 'négo']}
      onClose={onClose}
      onSelect={onSelect}
    />
  )
}
