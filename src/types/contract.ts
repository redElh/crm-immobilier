export type ContractType = 'vente' | 'location_classique' | 'location_saisonniere'

export type ContractStatus = 'en_cours' | 'confirme_actif' | 'finalise_termine' | 'annule'

export type VenteEtape = 'offre' | 'reservation' | 'compromis' | 'acte_authentique'

export interface ContractParty {
  id: string
  name: string
  type: string
  phone: string
  email: string
  role: string
}

export interface ContractDocument {
  id: string
  name: string
  type: string
  date: string
  url?: string
  category?: string
  size?: string
  version?: number
}

export interface ContractHistoryEntry {
  id: string
  date: string
  action: string
  agent: string
  details?: string
}

export interface Contract {
  id: string
  reference: string
  type: ContractType
  status: ContractStatus
  etape?: VenteEtape

  // Parties
  partieA: ContractParty
  partieB: ContractParty
  agentPrincipal: string
  agentId: string

  // Property
  propertyId: string
  propertyTitle: string
  propertyRef: string
  propertyAddress: string
  propertyTypeLabel: string

  // Type-specific dates
  dateCreation: string
  dateOffre?: string
  dateReservation?: string
  dateCompromis?: string
  dateActe?: string
  dateDebutBail?: string
  dateFinBail?: string
  dateArrivee?: string
  dateDepart?: string

  // Financial — Vente
  prixVente?: number
  montantNetVendeur?: number
  honorairesTTC?: number
  sequestre?: number
  conditionPaiementHonoraires?: string

  // Financial — Location classique
  loyerMensuelHC?: number
  chargesMensuelles?: number
  depotGarantie?: number
  honorairesLocation?: number

  // Financial — Location saisonnière
  prixTotalSejour?: number
  acompteVerse?: number
  soldeRestant?: number
  caution?: number

  devise: string

  // Documents & history
  documents: ContractDocument[]
  history: ContractHistoryEntry[]

  notes?: string

  createdAt: string
  updatedAt: string
}

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  vente: 'Vente',
  location_classique: 'Location classique',
  location_saisonniere: 'Location saisonnière',
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  en_cours: 'En cours',
  confirme_actif: 'Confirmé / Actif',
  finalise_termine: 'Finalisé / Terminé',
  annule: 'Annulé',
}

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  en_cours: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  confirme_actif: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  finalise_termine: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  annule: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export const VENTE_ETAPE_LABELS: Record<VenteEtape, string> = {
  offre: 'Offre',
  reservation: 'Réservation',
  compromis: 'Compromis',
  acte_authentique: 'Acte authentique',
}

export const VENTE_ETAPE_COLORS: Record<VenteEtape, string> = {
  offre: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  reservation: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  compromis: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  acte_authentique: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
}

export const partyRoleColor = (role: string) => {
  switch (role) {
    case 'Vendeur': case 'Bailleur': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    case 'Acheteur': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'Locataire': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    case 'Voyageur': return 'bg-pink-500/10 text-pink-500 border-pink-500/20'
    default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
  }
}

export const mockContracts: Contract[] = [
  {
    id: 'c1',
    reference: 'VTE-2026-0001',
    type: 'vente',
    status: 'confirme_actif',
    etape: 'compromis',
    partieA: {
      id: '4',
      name: 'Hassan El Fassi',
      type: 'Vendeur',
      phone: '+212 6 98 76 54 32',
      email: 'hassan.elfassi@example.com',
      role: 'Vendeur',
    },
    partieB: {
      id: '1',
      name: 'Pierre Martin',
      type: 'Acheteur',
      phone: '+33 6 12 34 56 78',
      email: 'pierre.martin@example.com',
      role: 'Acheteur',
    },
    agentPrincipal: 'Karim Eloui',
    agentId: 'agent-1',
    propertyId: '1',
    propertyTitle: 'Villa luxe avec piscine',
    propertyRef: 'RES-2026-001',
    propertyAddress: '123 Rue de la Palmeraie, Marrakech',
    propertyTypeLabel: 'Villa',
    dateCreation: '2026-03-15',
    dateOffre: '2026-03-01',
    dateReservation: '2026-03-10',
    dateCompromis: '2026-04-01',
    prixVente: 4500000,
    montantNetVendeur: 4100000,
    honorairesTTC: 400000,
    sequestre: 150000,
    conditionPaiementHonoraires: 'À la signature du compromis',
    devise: 'MAD',
    documents: [
      { id: 'doc-c1-1', name: 'Compromis de vente signé', type: 'contract', date: '2026-04-01', url: '#1' },
      { id: 'doc-c1-2', name: 'Diagnostic DPE', type: 'dpe', date: '2026-03-20', url: '#2' },
    ],
    history: [
      { id: 'h-c1-1', date: '2026-03-15T10:00:00Z', action: 'Création du contrat', agent: 'Système', details: 'Contrat créé automatiquement suite au passage en "Sous compromis"' },
      { id: 'h-c1-2', date: '2026-04-01T14:00:00Z', action: 'Changement de statut', agent: 'Karim Eloui', details: 'Statut passé de "En cours" à "Confirmé / Actif"' },
      { id: 'h-c1-3', date: '2026-04-01T14:05:00Z', action: 'Ajout de document', agent: 'Karim Eloui', details: 'Compromis de vente signé ajouté' },
    ],
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-04-01T14:05:00Z',
  },
  {
    id: 'c2',
    reference: 'VTE-2026-0002',
    type: 'vente',
    status: 'finalise_termine',
    etape: 'acte_authentique',
    partieA: {
      id: '5',
      name: 'Fatima Zahra Bennani',
      type: 'Vendeur',
      phone: '+212 6 12 34 56 79',
      email: 'fatima.bennani@example.com',
      role: 'Vendeur',
    },
    partieB: {
      id: '3',
      name: 'Karim Benali',
      type: 'Acheteur',
      phone: '+212 6 12 34 56 78',
      email: 'karim.benali@example.com',
      role: 'Acheteur',
    },
    agentPrincipal: 'Myriam Ababou',
    agentId: 'agent-2',
    propertyId: '3',
    propertyTitle: 'Appartement front de mer',
    propertyRef: 'VAC-2026-003',
    propertyAddress: '8 Rue de la Corniche, Essaouira',
    propertyTypeLabel: 'Appartement',
    dateCreation: '2026-01-20',
    dateOffre: '2026-01-05',
    dateReservation: '2026-01-12',
    dateCompromis: '2026-02-01',
    dateActe: '2026-03-15',
    prixVente: 1800000,
    montantNetVendeur: 1650000,
    honorairesTTC: 150000,
    conditionPaiementHonoraires: "À l'acte authentique",
    devise: 'MAD',
    documents: [
      { id: 'doc-c2-1', name: 'Compromis de vente signé', type: 'contract', date: '2026-02-01', url: '#3' },
      { id: 'doc-c2-2', name: 'Acte authentique', type: 'contract', date: '2026-03-15', url: '#4' },
      { id: 'doc-c2-3', name: 'Attestation de prêt', type: 'loan', date: '2026-02-20', url: '#5' },
    ],
    history: [
      { id: 'h-c2-1', date: '2026-01-20T09:00:00Z', action: 'Création du contrat', agent: 'Système', details: 'Contrat créé suite au passage en "Sous compromis"' },
      { id: 'h-c2-2', date: '2026-02-01T11:00:00Z', action: 'Changement de statut', agent: 'Myriam Ababou', details: 'Statut passé à "Confirmé / Actif"' },
      { id: 'h-c2-3', date: '2026-03-15T16:00:00Z', action: 'Changement de statut', agent: 'Système', details: 'Statut passé à "Finalisé / Terminé" — acte authentique signé' },
    ],
    createdAt: '2026-01-20T09:00:00Z',
    updatedAt: '2026-03-15T16:00:00Z',
  },
  {
    id: 'c3',
    reference: 'LOC-2026-0001',
    type: 'location_classique',
    status: 'confirme_actif',
    partieA: {
      id: '8',
      name: 'Nadia El Fassi',
      type: 'Bailleur',
      phone: '+212 6 55 66 77 88',
      email: 'nadia.elfassi@example.com',
      role: 'Bailleur',
    },
    partieB: {
      id: '9',
      name: 'Sophie Laurent',
      type: 'Locataire',
      phone: '+33 6 23 45 67 89',
      email: 'sophie.laurent@example.com',
      role: 'Locataire',
    },
    agentPrincipal: 'Hayat Ouakrim',
    agentId: 'agent-3',
    propertyId: '5',
    propertyTitle: 'Appartement 2 pièces - Casablanca',
    propertyRef: 'RES-2026-008',
    propertyAddress: '45 Rue Mohammed V, Casablanca',
    propertyTypeLabel: 'Appartement',
    dateCreation: '2026-05-01',
    dateDebutBail: '2026-06-01',
    dateFinBail: '2027-05-31',
    loyerMensuelHC: 6000,
    chargesMensuelles: 400,
    depotGarantie: 6000,
    honorairesLocation: 3000,
    devise: 'MAD',
    documents: [
      { id: 'doc-c3-1', name: 'Bail signé', type: 'contract', date: '2026-05-15', url: '#6' },
      { id: 'doc-c3-2', name: "État des lieux entrant", type: 'inspection', date: '2026-05-30', url: '#7' },
    ],
    history: [
      { id: 'h-c3-1', date: '2026-05-01T08:00:00Z', action: 'Création du contrat', agent: 'Système', details: 'Contrat créé suite au passage en "Loué"' },
      { id: 'h-c3-2', date: '2026-05-15T10:00:00Z', action: 'Changement de statut', agent: 'Hayat Ouakrim', details: 'Statut passé à "Confirmé / Actif" — bail signé' },
      { id: 'h-c3-3', date: '2026-05-30T14:00:00Z', action: 'Ajout de document', agent: 'Hayat Ouakrim', details: "État des lieux entrant ajouté" },
    ],
    createdAt: '2026-05-01T08:00:00Z',
    updatedAt: '2026-05-30T14:00:00Z',
  },
  {
    id: 'c4',
    reference: 'SAI-2026-0001',
    type: 'location_saisonniere',
    status: 'confirme_actif',
    partieA: {
      id: '7',
      name: 'Ahmed Benali',
      type: 'Bailleur',
      phone: '+212 6 11 22 33 44',
      email: 'ahmed.benali@example.com',
      role: 'Bailleur',
    },
    partieB: {
      id: '11',
      name: 'Thomas & Emma Berger',
      type: 'Voyageur',
      phone: '+33 6 45 67 89 01',
      email: 'thomas.emma@example.com',
      role: 'Voyageur',
    },
    agentPrincipal: 'Myriam Ababou',
    agentId: 'agent-2',
    propertyId: '4',
    propertyTitle: 'Appartement front de mer avec piscine',
    propertyRef: 'VAC-2026-004',
    propertyAddress: '12 Boulevard du Front de Mer, Agadir',
    propertyTypeLabel: 'Appartement',
    dateCreation: '2026-06-05',
    dateReservation: '2026-06-01',
    dateArrivee: '2026-07-15',
    dateDepart: '2026-07-22',
    prixTotalSejour: 8400,
    acompteVerse: 2520,
    soldeRestant: 5880,
    caution: 1000,
    devise: 'EUR',
    documents: [
      { id: 'doc-c4-1', name: 'Contrat de location saisonnière signé', type: 'contract', date: '2026-06-05', url: '#8' },
      { id: 'doc-c4-2', name: 'Règlement intérieur accepté', type: 'policy', date: '2026-06-05', url: '#9' },
      { id: 'doc-c4-3', name: "Pièce d'identité du voyageur", type: 'id', date: '2026-06-03', url: '#10' },
    ],
    history: [
      { id: 'h-c4-1', date: '2026-06-05T09:00:00Z', action: 'Création du contrat', agent: 'Système', details: 'Contrat créé suite à la confirmation de la réservation' },
      { id: 'h-c4-2', date: '2026-06-05T09:30:00Z', action: 'Ajout de document', agent: 'Myriam Ababou', details: 'Contrat saisonnier signé ajouté' },
    ],
    createdAt: '2026-06-05T09:00:00Z',
    updatedAt: '2026-06-05T09:30:00Z',
  },
  {
    id: 'c5',
    reference: 'LOC-2026-0002',
    type: 'location_classique',
    status: 'en_cours',
    partieA: {
      id: '8',
      name: 'Nadia El Fassi',
      type: 'Bailleur',
      phone: '+212 6 55 66 77 88',
      email: 'nadia.elfassi@example.com',
      role: 'Bailleur',
    },
    partieB: {
      id: '10',
      name: 'Marc Dubois',
      type: 'Locataire',
      phone: '+33 6 34 56 78 90',
      email: 'marc.dubois@example.com',
      role: 'Locataire',
    },
    agentPrincipal: 'Hayat Ouakrim',
    agentId: 'agent-3',
    propertyId: '6',
    propertyTitle: 'Villa Ghazoua',
    propertyRef: 'RES-2026-006',
    propertyAddress: 'Route de Ghazoua, Essaouira',
    propertyTypeLabel: 'Villa',
    dateCreation: '2026-06-10',
    dateDebutBail: '2026-07-01',
    dateFinBail: '2027-06-30',
    loyerMensuelHC: 12000,
    chargesMensuelles: 600,
    depotGarantie: 12000,
    honorairesLocation: 5000,
    devise: 'MAD',
    documents: [],
    history: [
      { id: 'h-c5-1', date: '2026-06-10T11:00:00Z', action: 'Création du contrat', agent: 'Système', details: 'Contrat créé suite au passage en "Loué"' },
    ],
    createdAt: '2026-06-10T11:00:00Z',
    updatedAt: '2026-06-10T11:00:00Z',
  },
]

export const getClientContracts = (clientId: string): Contract[] => {
  return mockContracts.filter(c => c.partieA.id === clientId || c.partieB.id === clientId)
}

export const getPropertyContracts = (propertyId: string): Contract[] => {
  return mockContracts.filter(c => c.propertyId === propertyId)
}

export const contractFilters = {
  types: (Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map(key => ({ value: key, label: CONTRACT_TYPE_LABELS[key] })),
  statuses: (Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]).map(key => ({ value: key, label: CONTRACT_STATUS_LABELS[key] })),
  agents: Array.from(new Set(mockContracts.map(c => c.agentPrincipal))).sort(),
}
