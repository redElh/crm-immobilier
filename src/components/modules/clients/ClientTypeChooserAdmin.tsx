import { Search, Home, Briefcase, Users, Sun } from 'react-feather'
import { STAGE_HUES } from '../../dashboard/Stage'
import { PianoTypeChooser, type PianoChooserKey, type PianoChooserStat } from '../shared/PianoTypeChooser'

/* =====================================================================
   ClientTypeChooserAdmin — premium "piano keys" type picker for Nouveau client (admin/gérant).

   Thin wrapper over the shared PianoTypeChooser: admin (orange/rose) skin.
   ===================================================================== */

const CLIENT_TYPE_KEYS: PianoChooserKey[] = [
  { type: 'acheteur', title: 'Acheteur', description: 'Recherche et acquisition de biens, du premier contact à la signature.', icon: Search, hue: STAGE_HUES.emerald },
  { type: 'vendeur', title: 'Vendeur', description: 'Mandats et biens proposés à la vente, suivi des estimations.', icon: Home, hue: STAGE_HUES.amber },
  { type: 'bailleur', title: 'Bailleur', description: 'Propriétaires et locations longue durée, gestion des baux.', icon: Briefcase, hue: STAGE_HUES.violet },
  { type: 'locataire', title: 'Locataire', description: 'Dossiers et baux en cours, suivi des échéances.', icon: Users, hue: STAGE_HUES.fuchsia },
  { type: 'voyageur', title: 'Voyageur', description: 'Séjours et réservations saisonnières, planning des arrivées.', icon: Sun, hue: STAGE_HUES.sky },
]

export type ClientTypeStat = PianoChooserStat

interface ClientTypeChooserAdminProps {
  stats?: Record<string, ClientTypeStat>
  onClose: () => void
  onSelect: (type: string) => void
}

export function ClientTypeChooserAdmin({ stats, onClose, onSelect }: ClientTypeChooserAdminProps) {
  return (
    <PianoTypeChooser
      variant="admin"
      eyebrow="Nouveau client"
      title="Quel type de client souhaitez-vous créer ?"
      subtitle="Choisissez un profil — la fiche s'adaptera automatiquement aux besoins du dossier."
      ariaLabel="Nouveau client — choisir un type"
      keys={CLIENT_TYPE_KEYS}
      stats={stats}
      statLabels={['clients', 'actifs', 'négo']}
      onClose={onClose}
      onSelect={onSelect}
    />
  )
}
