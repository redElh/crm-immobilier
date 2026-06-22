export type PropertyType = 'residential' | 'commercial' | 'land' | 'vacation' | 'luxury';
export type TransactionType = 'vente' | 'location_ld' | 'location_saisonniere';
export type PropertyStatus = 'for_sale' | 'for_rent' | 'for_sale_or_rent' | 'mandate_pending' | 'negotiation' | 'under_compromise' | 'under_promise' | 'signing' | 'sold' | 'rented' | 'sold_or_rented' | 'available' | 'option' | 'reserved' | 'occupied' | 'unavailable' | 'confidential' | 'urbanism' | 'withdrawn';

export interface PropertyOwner {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface PropertyDocument {
  id: string;
  name: string;
  type: string;
  date: string;
  url?: string;
  category?: string;
  size?: string;
  version?: number;
}

export interface DPEInfo {
  class: string;
  consumption?: number;
  since?: string;
}

export interface SeasonalPrice {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
  minNights?: number;
}

export interface SeasonalCalendar {
  date: string;
  status: 'available' | 'reserved' | 'blocked';
  price?: number;
}

export interface Reservation {
  id: string;
  clientName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface SeasonalOption {
  id: string;
  name: string;
  price: number;
  type: 'service' | 'option';
}

export interface MatchedClient {
  id: string;
  name: string;
  matchScore: number;
  criteria: string;
  type?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: string;
  agent?: string;
  notes?: string;
}

export interface PortalStatus {
  portalName: string;
  status: 'published' | 'pending' | 'error' | 'not_sent';
  lastSync?: string;
}

export interface OwnerAccess {
  date: string;
  action: string;
  ip?: string;
}

export interface Apporteur {
  id: string;
  name: string;
  agency: string;
  commission: number;
  status: 'pending' | 'approved' | 'paid';
}

export interface Property {
  id: string;
  reference: string;
  title: string;
  propertyType: PropertyType;
  transactionType: TransactionType;
  status: PropertyStatus;

  price: number;
  priceMin?: number;
  priceMax?: number;
  priceEstimate?: number;
  prixNetVendeur?: number;
  honorairesType?: 'inclus' | 'en_sus';
  honorairesPct?: number;
  negociable?: boolean;
  prixSurDemande?: boolean;
  prixConfidentiel?: boolean;
  loyerHC?: number;
  charges?: number;
  depotGarantie?: number;
  rentalPrice?: number;
  seasonalPrices?: SeasonalPrice[];
  devise?: string;

  mandateType?: string;
  mandateStartDate?: string;
  mandateEndDate?: string;
  mandateRemuneration?: number;

  surface: number;
  surfaceCarrez?: number;
  landSize?: number;
  buildableSurface?: number;
  facadeWidth?: number;
  depth?: number;
  pondereSurface?: number;
  ceilingHeight?: number;
  chargesAnnuelles?: number;
  propertyState?: string;
  cadastralReference?: string;

  bedrooms: number;
  bathrooms: number;
  rooms: number;
  sleepingCapacity?: number;
  beds?: number;
  groundFloorBedrooms?: number;
  parentalSuite?: boolean;

  exteriorType?: string;
  exteriorLayout?: string;
  exteriorFeatures?: string[];
  views?: string[];
  parking?: string[];
  pool?: { hasPool?: boolean; measurement?: string; coating?: string; treatment?: string };

  location: string;
  address: string;
  city: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  hideExactAddress?: boolean;
  locationType?: string;
  exposition?: string;
  currentUse?: string;
  buildable?: boolean;

  owner: PropertyOwner;

  yearBuilt?: number;
  description: string;
  features: string[];

  images: string[];
  videos?: string[];
  brochure?: string;
  virtualTourUrl?: string;
  droneUrl?: string;

  dpe?: DPEInfo;
  diagnostics?: Record<string, { date?: string; classe?: string; surface?: number }>;

  documents: PropertyDocument[];

  isSeasonal?: boolean;
  calendar?: SeasonalCalendar[];
  reservations?: Reservation[];
  options?: SeasonalOption[];

  matchedClients: MatchedClient[];

  timeline: TimelineEvent[];

  likes?: number;
  shares?: number;

  portalStatus?: PortalStatus[];

  ownerAccess?: OwnerAccess[];
  apporteurs?: Apporteur[];

  keys?: {
    status?: 'available' | 'in_visit' | 'unavailable' | 'lost';
    storageLocation?: string;
    identifier?: string;
    contactType?: 'agent' | 'client' | 'tiers';
    contactPerson?: string;
    contactPhone?: string;
    preciseLocation?: string;
    code?: string;
    instructions?: string;
    history?: KeyMovement[];
  };

  createdAt: string;
  updatedAt: string;
}

export interface KeyMovement {
  id: string;
  date: string;
  action: string;
  person: string;
  reason: string;
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  residential: 'Résidentiel',
  commercial: 'Commercial',
  land: 'Terrain',
  vacation: 'Saisonnier',
  luxury: 'Luxe',
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  vente: 'Vente',
  location_ld: 'Location',
  location_saisonniere: 'Location saisonnière',
};

export const STATUS_LABELS: Record<string, string> = {
  for_sale: 'À vendre',
  for_rent: 'À louer',
  for_sale_or_rent: 'À vendre / À louer',
  mandate_pending: 'En attente de mandat',
  negotiation: 'En négociation',
  under_compromise: 'Sous compromis',
  under_promise: 'Sous promesse',
  signing: 'En cours de signature',
  sold: 'Vendu',
  rented: 'Loué',
  sold_or_rented: 'Vendu / Loué',
  available: 'Disponible',
  option: 'En option',
  reserved: 'Réservé',
  occupied: 'Occupé',
  unavailable: 'Indisponible',
  confidential: 'En confidentialité',
  urbanism: "En procédure d'urbanisme",
  withdrawn: 'Retiré',
};

export const STATUS_COLORS: Record<string, string> = {
  for_sale: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  for_rent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  for_sale_or_rent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  mandate_pending: 'bg-amber-50 text-amber-700 border-amber-200',
  negotiation: 'bg-amber-50 text-amber-700 border-amber-200',
  under_compromise: 'bg-orange-50 text-orange-700 border-orange-200',
  under_promise: 'bg-orange-50 text-orange-700 border-orange-200',
  signing: 'bg-amber-50 text-amber-700 border-amber-200',
  sold: 'bg-blue-50 text-blue-700 border-blue-200',
  rented: 'bg-purple-50 text-purple-700 border-purple-200',
  sold_or_rented: 'bg-blue-50 text-blue-700 border-blue-200',
  available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  option: 'bg-amber-50 text-amber-700 border-amber-200',
  reserved: 'bg-rose-50 text-rose-700 border-rose-200',
  occupied: 'bg-violet-50 text-violet-700 border-violet-200',
  unavailable: 'bg-gray-50 text-gray-700 border-gray-200',
  confidential: 'bg-slate-50 text-slate-700 border-slate-200',
  urbanism: 'bg-amber-50 text-amber-700 border-amber-200',
  withdrawn: 'bg-red-50 text-red-700 border-red-200',
};

export const DPE_COLORS: Record<string, string> = {
  A: 'bg-green-500',
  B: 'bg-lime-500',
  C: 'bg-yellow-400',
  D: 'bg-orange-400',
  E: 'bg-orange-600',
  F: 'bg-red-500',
  G: 'bg-red-700',
};
