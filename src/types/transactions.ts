export type MandatType =
  | 'vente_exclusif'
  | 'vente_simple'
  | 'recherche_achat'
  | 'recherche_location'
  | 'location_gestion'
  | 'location_saisonniere'

export type TransactionEtape =
  | 'reservation'
  | 'signe'
  | 'annule'
  | 'cloture'
  | 'actif'
  | 'expire'

export type TransactionRole =
  | 'Vendeur'
  | 'Acheteur'
  | 'Propriétaire'
  | 'Acquéreur'
  | 'Locataire'
  | 'Bailleur'
  | 'Voyageur'

export interface Transaction {
  id: string
  reference: string
  clientName: string
  clientType: string
  clientId: string
  propertyTitle?: string
  propertyRef?: string
  propertyId?: string
  type: MandatType
  etape: TransactionEtape
  dateReservation?: string
  dateContracted: string
  dateExpiration?: string
  montant: string
  agentName: string
  role: TransactionRole
  notes?: string
}

export const MANDAT_TYPE_LABELS: Record<MandatType, string> = {
  vente_exclusif: 'Vente exclusif',
  vente_simple: 'Vente simple',
  recherche_achat: 'Recherche achat',
  recherche_location: 'Recherche location',
  location_gestion: 'Location gestion',
  location_saisonniere: 'Location saisonnière',
}

export const TRANSACTION_ETAPE_LABELS: Record<TransactionEtape, string> = {
  reservation: 'Réservation',
  signe: 'Signé',
  annule: 'Annulé',
  cloture: 'Clôturé',
  actif: 'Actif',
  expire: 'Expiré',
}

export const TRANSACTION_ETAPE_COLORS: Record<TransactionEtape, string> = {
  reservation: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  signe: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  annule: 'bg-red-500/10 text-red-500 border-red-500/20',
  cloture: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  actif: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  expire: 'bg-text-secondary/10 text-text-secondary border-text-secondary/20',
}

export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    reference: 'MVT-2026-001',
    clientName: 'Hassan El Fassi',
    clientType: 'Vendeur',
    clientId: '4',
    propertyTitle: 'Villa luxe avec piscine',
    propertyRef: 'RES-2026-001',
    propertyId: '1',
    type: 'vente_exclusif',
    etape: 'actif',
    dateContracted: '2026-03-01',
    dateExpiration: '2027-03-01',
    montant: '4 500 000 MAD',
    agentName: 'Karim Eloui',
    role: 'Vendeur',
  },
  {
    id: 't2',
    reference: 'MVT-2026-002',
    clientName: 'Pierre Martin',
    clientType: 'Acheteur',
    clientId: '1',
    propertyTitle: 'Villa luxe avec piscine',
    propertyRef: 'RES-2026-001',
    propertyId: '1',
    type: 'recherche_achat',
    etape: 'reservation',
    dateReservation: '2026-06-01',
    dateContracted: '2026-05-01',
    montant: '4 200 000 MAD',
    agentName: 'Karim Eloui',
    role: 'Acheteur',
  },
  {
    id: 't3',
    reference: 'MVT-2026-003',
    clientName: 'Fatima Zahra Bennani',
    clientType: 'Vendeur',
    clientId: '5',
    propertyTitle: 'Appartement front de mer avec piscine',
    propertyRef: 'VAC-2026-004',
    propertyId: '4',
    type: 'vente_simple',
    etape: 'signe',
    dateContracted: '2026-01-15',
    montant: '1 800 000 MAD',
    agentName: 'Myriam Ababou',
    role: 'Vendeur',
  },
  {
    id: 't4',
    reference: 'MVT-2026-004',
    clientName: 'Thomas & Emma Berger',
    clientType: 'Voyageur',
    clientId: '11',
    propertyTitle: 'Appartement front de mer avec piscine',
    propertyRef: 'VAC-2026-004',
    propertyId: '4',
    type: 'location_saisonniere',
    etape: 'reservation',
    dateReservation: '2026-06-08',
    dateContracted: '2026-06-01',
    montant: '1 200 €/nuit',
    agentName: 'Myriam Ababou',
    role: 'Voyageur',
  },
  {
    id: 't5',
    reference: 'MVT-2026-005',
    clientName: 'Karim Benali',
    clientType: 'Acheteur',
    clientId: '3',
    propertyTitle: 'Villa luxe avec piscine',
    propertyRef: 'RES-2026-001',
    propertyId: '1',
    type: 'recherche_achat',
    etape: 'signe',
    dateReservation: '2026-05-15',
    dateContracted: '2026-04-20',
    montant: '4 500 000 MAD',
    agentName: 'Karim Eloui',
    role: 'Acheteur',
  },
  {
    id: 't6',
    reference: 'MVT-2026-006',
    clientName: 'Sophie Laurent',
    clientType: 'Locataire',
    clientId: '9',
    type: 'recherche_location',
    etape: 'actif',
    dateContracted: '2026-04-10',
    montant: '8 000 - 12 000 MAD/mois',
    agentName: 'Dimitri Djedje',
    role: 'Locataire',
  },
  {
    id: 't7',
    reference: 'MVT-2026-007',
    clientName: 'Nadia El Fassi',
    clientType: 'Bailleur',
    clientId: '8',
    propertyTitle: 'Appartement 2 pièces - Casablanca',
    propertyRef: 'RES-2026-008',
    propertyId: '1',
    type: 'location_gestion',
    etape: 'actif',
    dateContracted: '2026-02-20',
    montant: '6 000 MAD/mois',
    agentName: 'Hayat Ouakrim',
    role: 'Bailleur',
  },
  {
    id: 't8',
    reference: 'MVT-2026-008',
    clientName: 'Omar Tazi',
    clientType: 'Vendeur',
    clientId: '6',
    propertyTitle: 'Terrain constructible',
    propertyRef: 'LND-2026-012',
    type: 'vente_exclusif',
    etape: 'cloture',
    dateContracted: '2025-12-01',
    dateExpiration: '2026-06-01',
    montant: '2 200 000 MAD',
    agentName: 'Yasmine Aatic',
    role: 'Vendeur',
  },
  {
    id: 't9',
    reference: 'MVT-2026-009',
    clientName: 'Sarah Klein',
    clientType: 'Voyageur',
    clientId: '12',
    propertyTitle: 'Appartement front de mer avec piscine',
    propertyRef: 'VAC-2026-004',
    propertyId: '4',
    type: 'location_saisonniere',
    etape: 'annule',
    dateReservation: '2026-05-20',
    dateContracted: '2026-05-10',
    montant: '800 €/nuit',
    agentName: 'Myriam Ababou',
    role: 'Voyageur',
  },
  {
    id: 't10',
    reference: 'MVT-2026-010',
    clientName: 'Marie Lambert',
    clientType: 'Acheteur',
    clientId: '2',
    type: 'recherche_achat',
    etape: 'expire',
    dateContracted: '2025-08-15',
    dateExpiration: '2026-02-15',
    montant: '3 000 000 - 3 500 000 MAD',
    agentName: 'Square Meter Agence',
    role: 'Acheteur',
  },
]

export const getClientTransactions = (clientId: string): Transaction[] => {
  return mockTransactions.filter(t => t.clientId === clientId)
}

export const getPropertyTransactions = (propertyId: string): Transaction[] => {
  return mockTransactions.filter(t => t.propertyId === propertyId)
}

export const transactionFilters = {
  types: (Object.keys(MANDAT_TYPE_LABELS) as MandatType[]).map(key => ({ value: key, label: MANDAT_TYPE_LABELS[key] })),
  etapes: (Object.keys(TRANSACTION_ETAPE_LABELS) as TransactionEtape[]).map(key => ({ value: key, label: TRANSACTION_ETAPE_LABELS[key] })),
  agents: Array.from(new Set(mockTransactions.map(t => t.agentName))).sort(),
}
