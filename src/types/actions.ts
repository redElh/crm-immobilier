export type ActionCategory =
  | 'creation' | 'modification' | 'statut' | 'mandat'
  | 'visite' | 'offre' | 'document' | 'commentaire'
  | 'agent' | 'client' | 'transfert' | 'systeme'
  | 'location' | 'bail' | 'reservation' | 'sejour'
  | 'paiement' | 'diligence'

export type ActionType =
  | 'creation'
  | 'prix_modifie' | 'prix_negocie'
  | 'surface_modifiee' | 'description_modifiee' | 'caracteristiques_modifiees'
  | 'photos_ajoutees' | 'photos_supprimees'
  | 'video_ajoutee' | 'video_supprimee'
  | 'brochure_generer'
  | 'visite_virtuelle_ajoutee'
  | 'statut_change'
  | 'document_ajoute' | 'document_supprime' | 'document_modifie'
  | 'fichier_ajoute' | 'fichier_deplace' | 'fichier_supprime'
  | 'note_ajoutee' | 'note_modifiee' | 'note_supprimee'
  | 'agent_assigne' | 'agent_reaffecte' | 'agent_retire'
  | 'prospect_associe' | 'client_associe'
  | 'bien_modifie' | 'bien_publie' | 'bien_retire' | 'bien_supprime' | 'bien_restaure'
  | 'bien_importe' | 'bien_exporte' | 'bien_archivé'
  | 'mandat_cree' | 'mandat_signe' | 'mandat_renouvele' | 'mandat_expire' | 'mandat_confidentiel_signe'
  | 'offre_recue' | 'offre_acceptee' | 'offre_refusee' | 'offre_confidentielle_recue' | 'contre_offre'
  | 'compromis_signe' | 'acte_authentique_signe' | 'promesse_vente_signe' | 'vente_finalisee'
  | 'visite_programmee' | 'visite_effectuee' | 'visite_annulee'
  | 'visite_privee_programmee' | 'visite_privee_effectuee'
  | 'demande_location_recue'
  | 'bail_signe' | 'bail_renouvele' | 'bail_expire' | 'bail_commercial_signe' | 'promesse_bail_signe'
  | 'loyer_impaye' | 'loyer_paye' | 'locataire_sortant' | 'locataire_entrant'
  | 'etat_des_lieux_entrant' | 'etat_des_lieux_sortant'
  | 'certificat_urbanisme_obtenu' | 'permis_construire_obtenu' | 'etude_sol_realisee'
  | 'reservation_creer_option' | 'reservation_confirmee' | 'reservation_annulee'
  | 'sejour_en_cours' | 'sejour_termine'
  | 'avis_recu' | 'avis_modifie'
  | 'paiement_recu' | 'caution_restituée'
  | 'due_diligence_lancee' | 'due_diligence_terminee'

export const ACTION_CATEGORIES: ActionCategory[] = [
  'creation', 'modification', 'statut', 'mandat', 'visite', 'offre',
  'document', 'commentaire', 'agent', 'client', 'transfert', 'systeme',
  'location', 'bail', 'reservation', 'sejour', 'paiement', 'diligence',
]

export interface ActionMeta {
  category: ActionCategory
  label: string
  icon: string
  color: string
  bgColor: string
}

export const ACTION_META: Record<string, ActionMeta> = {
  creation:                      { category: 'creation',       label: 'Création du bien',             icon: 'Plus',         color: '#6b7280', bgColor: '#f3f4f6' },
   prix_modifie:                  { category: 'modification',   label: 'Prix modifié',                 icon: 'DollarSign',   color: '#dc2626', bgColor: '#fef2f2' },
   prix_negocie:                  { category: 'modification',   label: 'Prix négocié',                 icon: 'DollarSign',   color: '#dc2626', bgColor: '#fef2f2' },
  surface_modifiee:              { category: 'modification',   label: 'Surface modifiée',             icon: 'Edit3',        color: '#dc2626', bgColor: '#fef2f2' },
  description_modifiee:          { category: 'modification',   label: 'Description modifiée',         icon: 'Edit3',        color: '#dc2626', bgColor: '#fef2f2' },
  caracteristiques_modifiees:    { category: 'modification',   label: 'Caractéristiques modifiées',   icon: 'Edit3',        color: '#dc2626', bgColor: '#fef2f2' },
  photos_ajoutees:               { category: 'modification',   label: 'Photos ajoutées',              icon: 'Camera',       color: '#dc2626', bgColor: '#fef2f2' },
   photos_supprimees:             { category: 'modification',   label: 'Photos supprimées',            icon: 'Trash2',       color: '#dc2626', bgColor: '#fef2f2' },
   video_ajoutee:                 { category: 'modification',   label: 'Vidéo ajoutée',                icon: 'Camera',       color: '#dc2626', bgColor: '#fef2f2' },
   video_supprimee:               { category: 'modification',   label: 'Vidéo supprimée',              icon: 'Trash2',       color: '#dc2626', bgColor: '#fef2f2' },
   brochure_generer:              { category: 'modification',   label: 'Brochure générée',             icon: 'FileText',     color: '#dc2626', bgColor: '#fef2f2' },
   visite_virtuelle_ajoutee:      { category: 'modification',   label: 'Visite virtuelle ajoutée',     icon: 'Eye',          color: '#dc2626', bgColor: '#fef2f2' },
  statut_change:                 { category: 'statut',         label: 'Changement de statut',         icon: 'Tag',          color: '#2563eb', bgColor: '#eff6ff' },
  document_ajoute:               { category: 'document',       label: 'Document ajouté',              icon: 'FileText',     color: '#ea580c', bgColor: '#fff7ed' },
  document_supprime:             { category: 'document',       label: 'Document supprimé',            icon: 'Trash2',       color: '#ea580c', bgColor: '#fff7ed' },
   document_modifie:              { category: 'document',       label: 'Document modifié',             icon: 'Edit3',        color: '#ea580c', bgColor: '#fff7ed' },
   fichier_ajoute:                { category: 'document',       label: 'Fichier ajouté',               icon: 'Plus',         color: '#ea580c', bgColor: '#fff7ed' },
   fichier_deplace:               { category: 'document',       label: 'Fichier déplacé',              icon: 'Share2',       color: '#ea580c', bgColor: '#fff7ed' },
   fichier_supprime:              { category: 'document',       label: 'Fichier supprimé',             icon: 'Trash2',       color: '#ea580c', bgColor: '#fff7ed' },
  note_ajoutee:                  { category: 'commentaire',    label: 'Commentaire ajouté',           icon: 'MessageSquare',color: '#0891b2', bgColor: '#ecfeff' },
  note_modifiee:                 { category: 'commentaire',    label: 'Commentaire modifié',          icon: 'Edit3',        color: '#0891b2', bgColor: '#ecfeff' },
  note_supprimee:                { category: 'commentaire',    label: 'Commentaire supprimé',         icon: 'Trash2',       color: '#0891b2', bgColor: '#ecfeff' },
  agent_assigne:                 { category: 'agent',          label: 'Agent assigné',                icon: 'User',         color: '#6366f1', bgColor: '#eef2ff' },
   agent_reaffecte:               { category: 'agent',          label: 'Agent réaffecté',              icon: 'Users',        color: '#6366f1', bgColor: '#eef2ff' },
   agent_retire:                  { category: 'agent',          label: 'Agent retiré',                 icon: 'User',         color: '#6366f1', bgColor: '#eef2ff' },
  prospect_associe:              { category: 'client',         label: 'Prospect associé',             icon: 'User',         color: '#84cc16', bgColor: '#f7fee7' },
  client_associe:                { category: 'client',         label: 'Client associé',               icon: 'Users',        color: '#84cc16', bgColor: '#f7fee7' },
   bien_modifie:                  { category: 'modification',   label: 'Bien modifié',                 icon: 'Edit3',        color: '#dc2626', bgColor: '#fef2f2' },
   bien_publie:                   { category: 'transfert',      label: 'Bien publié',                  icon: 'Globe',        color: '#a16207', bgColor: '#fefce8' },
   bien_retire:                   { category: 'transfert',      label: 'Bien retiré',                  icon: 'X',            color: '#a16207', bgColor: '#fefce8' },
   bien_supprime:                 { category: 'systeme',        label: 'Bien supprimé',                icon: 'Trash2',       color: '#78716c', bgColor: '#f5f5f4' },
   bien_restaure:                 { category: 'systeme',        label: 'Bien restauré',                icon: 'RefreshCw',    color: '#78716c', bgColor: '#f5f5f4' },
  bien_importe:                  { category: 'systeme',        label: 'Bien importé',                 icon: 'Download',     color: '#78716c', bgColor: '#f5f5f4' },
  bien_exporte:                  { category: 'systeme',        label: 'Bien exporté',                 icon: 'Share2',       color: '#78716c', bgColor: '#f5f5f4' },
  bien_archivé:                  { category: 'systeme',        label: 'Bien archivé',                 icon: 'Archive',      color: '#78716c', bgColor: '#f5f5f4' },
  mandat_cree:                   { category: 'mandat',         label: 'Mandat créé',                  icon: 'FileText',     color: '#7c3aed', bgColor: '#f5f3ff' },
  mandat_signe:                  { category: 'mandat',         label: 'Mandat signé',                 icon: 'FileText',     color: '#7c3aed', bgColor: '#f5f3ff' },
  mandat_renouvele:              { category: 'mandat',         label: 'Mandat renouvelé',             icon: 'RefreshCw',    color: '#7c3aed', bgColor: '#f5f3ff' },
  mandat_expire:                 { category: 'mandat',         label: 'Mandat expiré',                icon: 'AlertCircle',  color: '#7c3aed', bgColor: '#f5f3ff' },
  mandat_confidentiel_signe:     { category: 'mandat',         label: 'Mandat confidentiel signé',    icon: 'FileText',     color: '#7c3aed', bgColor: '#f5f3ff' },
  offre_recue:                   { category: 'offre',          label: 'Offre reçue',                  icon: 'ArrowDownRight',color: '#eab308', bgColor: '#fefce8' },
  offre_acceptee:                { category: 'offre',          label: 'Offre acceptée',               icon: 'CheckCircle',  color: '#eab308', bgColor: '#fefce8' },
  offre_refusee:                 { category: 'offre',          label: 'Offre refusée',                icon: 'XCircle',      color: '#eab308', bgColor: '#fefce8' },
  offre_confidentielle_recue:    { category: 'offre',          label: 'Offre confidentielle reçue',   icon: 'ArrowDownRight',color: '#eab308', bgColor: '#fefce8' },
  compromis_signe:               { category: 'offre',          label: 'Compromis signé',              icon: 'CheckCircle',  color: '#eab308', bgColor: '#fefce8' },
   acte_authentique_signe:        { category: 'offre',          label: 'Acte authentique signé',       icon: 'CheckCircle',  color: '#eab308', bgColor: '#fefce8' },
   contre_offre:                  { category: 'offre',          label: 'Contre-offre',                 icon: 'ArrowDownRight',color: '#eab308', bgColor: '#fefce8' },
   vente_finalisee:               { category: 'offre',          label: 'Vente finalisée',              icon: 'CheckCircle',  color: '#eab308', bgColor: '#fefce8' },
  promesse_vente_signe:          { category: 'offre',          label: 'Promesse de vente signée',     icon: 'CheckCircle',  color: '#eab308', bgColor: '#fefce8' },
  visite_programmee:             { category: 'visite',         label: 'Visite programmée',            icon: 'Calendar',     color: '#16a34a', bgColor: '#f0fdf4' },
  visite_effectuee:              { category: 'visite',         label: 'Visite effectuée',             icon: 'Eye',          color: '#16a34a', bgColor: '#f0fdf4' },
  visite_annulee:                { category: 'visite',         label: 'Visite annulée',               icon: 'XCircle',      color: '#16a34a', bgColor: '#f0fdf4' },
  visite_privee_programmee:      { category: 'visite',         label: 'Visite privée programmée',     icon: 'Calendar',     color: '#16a34a', bgColor: '#f0fdf4' },
  visite_privee_effectuee:       { category: 'visite',         label: 'Visite privée effectuée',      icon: 'Eye',          color: '#16a34a', bgColor: '#f0fdf4' },
  demande_location_recue:        { category: 'location',       label: 'Demande de location reçue',    icon: 'ArrowDownRight',color: '#0d9488', bgColor: '#f0fdfa' },
  bail_signe:                    { category: 'bail',           label: 'Bail signé',                   icon: 'FileText',     color: '#0d9488', bgColor: '#f0fdfa' },
  bail_renouvele:                { category: 'bail',           label: 'Bail renouvelé',               icon: 'RefreshCw',    color: '#0d9488', bgColor: '#f0fdfa' },
  bail_expire:                   { category: 'bail',           label: 'Bail expiré',                  icon: 'AlertCircle',  color: '#0d9488', bgColor: '#f0fdfa' },
  bail_commercial_signe:         { category: 'bail',           label: 'Bail commercial signé',        icon: 'FileText',     color: '#0d9488', bgColor: '#f0fdfa' },
  promesse_bail_signe:           { category: 'bail',           label: 'Promesse de bail signée',      icon: 'FileText',     color: '#0d9488', bgColor: '#f0fdfa' },
   loyer_impaye:                  { category: 'paiement',       label: 'Loyer impayé',                 icon: 'AlertCircle',  color: '#dc2626', bgColor: '#fef2f2' },
   loyer_paye:                    { category: 'paiement',       label: 'Loyer payé',                   icon: 'CheckCircle',  color: '#059669', bgColor: '#ecfdf5' },
   locataire_sortant:             { category: 'location',       label: 'Locataire sortant',            icon: 'User',         color: '#0d9488', bgColor: '#f0fdfa' },
   locataire_entrant:             { category: 'location',       label: 'Locataire entrant',            icon: 'UserPlus',     color: '#0d9488', bgColor: '#f0fdfa' },
   etat_des_lieux_entrant:        { category: 'location',       label: 'État des lieux entrant',       icon: 'FileText',     color: '#0d9488', bgColor: '#f0fdfa' },
   etat_des_lieux_sortant:        { category: 'location',       label: 'État des lieux sortant',       icon: 'FileText',     color: '#0d9488', bgColor: '#f0fdfa' },
  certificat_urbanisme_obtenu:   { category: 'document',       label: "Certificat d'urbanisme obtenu",icon: 'FileText',     color: '#ea580c', bgColor: '#fff7ed' },
  permis_construire_obtenu:      { category: 'document',       label: 'Permis de construire obtenu',  icon: 'FileText',     color: '#ea580c', bgColor: '#fff7ed' },
  etude_sol_realisee:            { category: 'document',       label: 'Étude de sol réalisée',        icon: 'FileText',     color: '#ea580c', bgColor: '#fff7ed' },
  reservation_creer_option:      { category: 'reservation',    label: 'Réservation créée (option)',   icon: 'Calendar',     color: '#0891b2', bgColor: '#ecfeff' },
  reservation_confirmee:         { category: 'reservation',    label: 'Réservation confirmée',        icon: 'CheckCircle',  color: '#0891b2', bgColor: '#ecfeff' },
  reservation_annulee:           { category: 'reservation',    label: 'Réservation annulée',          icon: 'XCircle',      color: '#0891b2', bgColor: '#ecfeff' },
  sejour_en_cours:               { category: 'sejour',         label: 'Séjour en cours',              icon: 'Calendar',     color: '#16a34a', bgColor: '#f0fdf4' },
  sejour_termine:                { category: 'sejour',         label: 'Séjour terminé',               icon: 'CheckCircle',  color: '#16a34a', bgColor: '#f0fdf4' },
  avis_recu:                     { category: 'commentaire',    label: 'Avis reçu',                    icon: 'MessageSquare',color: '#0891b2', bgColor: '#ecfeff' },
  avis_modifie:                  { category: 'commentaire',    label: 'Avis modifié',                 icon: 'Edit3',        color: '#0891b2', bgColor: '#ecfeff' },
  paiement_recu:                 { category: 'paiement',       label: 'Paiement reçu',                icon: 'DollarSign',   color: '#059669', bgColor: '#ecfdf5' },
  caution_restituée:             { category: 'paiement',       label: 'Caution restituée',            icon: 'DollarSign',   color: '#059669', bgColor: '#ecfdf5' },
  due_diligence_lancee:          { category: 'diligence',      label: 'Due diligence lancée',         icon: 'Search',       color: '#7c3aed', bgColor: '#f5f3ff' },
  due_diligence_terminee:        { category: 'diligence',      label: 'Due diligence terminée',       icon: 'CheckCircle',  color: '#7c3aed', bgColor: '#f5f3ff' },
}

export const COMMON_ACTIONS: ActionType[] = [
  'creation',
  'prix_modifie', 'prix_negocie',
  'surface_modifiee', 'description_modifiee', 'caracteristiques_modifiees',
  'photos_ajoutees', 'photos_supprimees',
  'video_ajoutee', 'video_supprimee',
  'brochure_generer',
  'visite_virtuelle_ajoutee',
  'statut_change',
  'fichier_ajoute', 'fichier_deplace', 'fichier_supprime',
  'note_ajoutee', 'note_modifiee',
  'agent_assigne', 'agent_reaffecte', 'agent_retire',
  'bien_modifie', 'bien_publie', 'bien_retire', 'bien_supprime', 'bien_restaure',
]

export const RESIDENTIAL_VENTE_ACTIONS: ActionType[] = [
  'offre_recue', 'offre_acceptee', 'offre_refusee', 'contre_offre',
  'compromis_signe', 'acte_authentique_signe', 'vente_finalisee',
  'mandat_signe', 'mandat_expire',
  'visite_programmee', 'visite_effectuee', 'visite_annulee',
]

export const RESIDENTIAL_LOCATION_ACTIONS: ActionType[] = [
  'demande_location_recue',
  'visite_programmee', 'visite_effectuee',
  'bail_signe', 'bail_renouvele', 'bail_expire',
  'loyer_impaye', 'loyer_paye', 'locataire_sortant', 'locataire_entrant',
  'etat_des_lieux_entrant', 'etat_des_lieux_sortant',
]

export const COMMERCIAL_ACTIONS: ActionType[] = [
  'offre_recue', 'offre_acceptee', 'offre_refusee',
  'promesse_bail_signe', 'bail_commercial_signe', 'bail_renouvele', 'bail_expire',
  'loyer_impaye',
  'visite_programmee', 'visite_effectuee',
]

export const LAND_ACTIONS: ActionType[] = [
  'offre_recue', 'offre_acceptee',
  'promesse_vente_signe', 'acte_authentique_signe',
  'certificat_urbanisme_obtenu', 'permis_construire_obtenu', 'etude_sol_realisee',
  'visite_programmee', 'visite_effectuee',
]

export const VACATION_ACTIONS: ActionType[] = [
  'reservation_creer_option', 'reservation_confirmee', 'reservation_annulee',
  'sejour_en_cours', 'sejour_termine',
  'avis_recu', 'avis_modifie',
  'paiement_recu', 'caution_restituée',
]

export const LUXURY_ACTIONS: ActionType[] = [
  'visite_privee_programmee', 'visite_privee_effectuee',
  'offre_confidentielle_recue',
  'due_diligence_lancee', 'due_diligence_terminee',
  'compromis_signe', 'acte_authentique_signe',
  'mandat_confidentiel_signe',
]

export interface PropertyTypeActions {
  propertyType: string
  transactionType?: string
  actions: ActionType[]
}

export function getActionsForPropertyType(propertyType: string, transactionType?: string): ActionType[] {
  const common = [...COMMON_ACTIONS]

  if (propertyType === 'residential') {
    if (transactionType === 'vente') {
      return [...common, ...RESIDENTIAL_VENTE_ACTIONS]
    }
    if (transactionType === 'location_ld') {
      return [...common, ...RESIDENTIAL_LOCATION_ACTIONS]
    }
    return [...common, ...RESIDENTIAL_VENTE_ACTIONS, ...RESIDENTIAL_LOCATION_ACTIONS]
  }

  if (propertyType === 'commercial') return [...common, ...COMMERCIAL_ACTIONS]
  if (propertyType === 'land') return [...common, ...LAND_ACTIONS]
  if (propertyType === 'vacation') return [...common, ...VACATION_ACTIONS]
  if (propertyType === 'luxury') return [...common, ...LUXURY_ACTIONS]

  return common
}

export function getActionCategoryLabel(category: ActionCategory): string {
  const labels: Record<ActionCategory, string> = {
    creation: 'Création',
    modification: 'Modification',
    statut: 'Statut',
    mandat: 'Mandat',
    visite: 'Visite',
    offre: 'Offre',
    document: 'Document',
    commentaire: 'Commentaire',
    agent: 'Agent',
    client: 'Client',
    transfert: 'Transfert',
    systeme: 'Système',
    location: 'Location',
    bail: 'Bail',
    reservation: 'Réservation',
    sejour: 'Séjour',
    paiement: 'Paiement',
    diligence: 'Due Diligence',
  }
  return labels[category] || category
}

export function getCategoryColor(category: ActionCategory): string {
  const colors: Record<ActionCategory, string> = {
    creation: '#6b7280', modification: '#dc2626', statut: '#2563eb',
    mandat: '#7c3aed', visite: '#16a34a', offre: '#eab308',
    document: '#ea580c', commentaire: '#0891b2', agent: '#6366f1',
    client: '#84cc16', transfert: '#a16207', systeme: '#78716c',
    location: '#0d9488', bail: '#0d9488', reservation: '#0891b2',
    sejour: '#16a34a', paiement: '#059669', diligence: '#7c3aed',
  }
  return colors[category] || '#78716c'
}

export function getCategoryBgColor(category: ActionCategory): string {
  const colors: Record<ActionCategory, string> = {
    creation: '#f3f4f6', modification: '#fef2f2', statut: '#eff6ff',
    mandat: '#f5f3ff', visite: '#f0fdf4', offre: '#fefce8',
    document: '#fff7ed', commentaire: '#ecfeff', agent: '#eef2ff',
    client: '#f7fee7', transfert: '#fefce8', systeme: '#f5f5f4',
    location: '#f0fdfa', bail: '#f0fdfa', reservation: '#ecfeff',
    sejour: '#f0fdf4', paiement: '#ecfdf5', diligence: '#f5f3ff',
  }
  return colors[category] || '#f5f5f4'
}
