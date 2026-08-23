export interface PropertyTabDef {
  id: string;
  label: string;
}

const BASE_PROPERTY_TABS: PropertyTabDef[] = [
  { id: 'general', label: 'Général' },
  { id: 'owner', label: 'Propriétaire' },
];

const TYPE_SPECIFIC_PROPERTY_TABS: Record<string, PropertyTabDef[]> = {
  residential: [
    { id: 'pricing', label: 'Prix et Honoraires' },
    { id: 'property', label: 'Caractéristiques' },
    { id: 'exterior', label: 'Extérieur' },
    { id: 'interior', label: 'Intérieur' },
    { id: 'equipment', label: 'Équipements' },
    { id: 'proximities', label: 'Proximités' },
    { id: 'mandate', label: 'Mandat' },
    { id: 'transfert', label: 'Transfert' },
    { id: 'documents', label: 'Documents' },
    { id: 'inventory', label: 'Inventaire' },
  ],
    vacation: [
      { id: 'general', label: 'Général' },
      { id: 'property', label: 'Le bien' },
      { id: 'interior', label: 'Intérieur' },
      { id: 'exterior', label: 'Extérieur' },
      { id: 'equipment', label: 'Équipements' },
      { id: 'seasonal', label: 'Grille & Options' },
      { id: 'mandat_saisonniere', label: 'Mandat saisonnier' },
      { id: 'proximities', label: 'Proximités' },
      { id: 'transfert', label: 'Transfert' },
      { id: 'calendar', label: 'Calendrier' },
      { id: 'reservations', label: 'Réservations' },
      { id: 'documents', label: 'Documents' },
    ],
  commercial: [
    { id: 'pricing', label: 'Prix et Honoraires' },
    { id: 'property', label: 'Caractéristiques' },
    { id: 'exterior', label: 'Extérieur' },
    { id: 'equipment', label: 'Équipements' },
    { id: 'interior', label: 'Intérieur' },
    { id: 'proximities', label: 'Proximités' },
    { id: 'mandate', label: 'Mandat' },
    { id: 'commercial', label: 'Juridique' },
    { id: 'transfert', label: 'Transfert' },
    { id: 'documents', label: 'Documents' },
  ],
  land: [
    { id: 'pricing', label: 'Prix' },
    { id: 'property', label: 'Caractéristiques' },
    { id: 'land', label: 'Constructibilité' },
    { id: 'proximities', label: 'Proximités' },
    { id: 'transfert', label: 'Transfert' },
    { id: 'documents', label: 'Documents' },
    { id: 'mandate', label: 'Mandat' },
  ],
  luxury: [
    { id: 'pricing', label: 'Prix' },
    { id: 'property', label: 'Caractéristiques' },
    { id: 'exterior', label: 'Extérieur' },
    { id: 'interior', label: 'Intérieur' },
    { id: 'proximities', label: 'Proximités' },
    { id: 'luxury', label: 'Confidentialité' },
    { id: 'mandate', label: 'Mandat' },
    { id: 'transfert', label: 'Transfert' },
    { id: 'documents', label: 'Documents' },
    { id: 'marketing', label: 'Marketing' },
  ],
};

export function getPropertyTabs(type?: string, furnishing?: string, constructionType?: string): PropertyTabDef[] {
  const specific = TYPE_SPECIFIC_PROPERTY_TABS[type || 'residential'] || TYPE_SPECIFIC_PROPERTY_TABS.residential;
  const filtered = specific.filter((tab) => {
    if (tab.id === 'inventory') {
      return furnishing === 'meuble' && constructionType === 'appartement';
    }
    return true;
  });
  return [...BASE_PROPERTY_TABS, ...filtered];
}
