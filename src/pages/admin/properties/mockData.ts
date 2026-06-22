import type { Property } from '../../../types/property';

export type MandatStatus = 'actif' | 'expire' | 'en_attente' | 'termine';

export interface AdminProperty extends Property {
  agentId: string;
  mandateStatus: MandatStatus;
  mandateStartDate: string;
  mandateEndDate: string;
}

export const AGENTS = [
  { id: 'agent-1', name: 'Myriam ABABOU', initials: 'MA', color: 'bg-violet-500' },
  { id: 'agent-2', name: 'Karim Eloui', initials: 'KE', color: 'bg-blue-500' },
  { id: 'agent-3', name: 'Yasmine AATIC', initials: 'YA', color: 'bg-emerald-500' },
  { id: 'agent-4', name: 'Dimitri DJEDJE', initials: 'DD', color: 'bg-amber-500' },
  { id: 'agent-5', name: 'Hayat OUAKRIM', initials: 'HO', color: 'bg-rose-500' },
];

export const CITIES = ['Marrakech', 'Rabat', 'Casablanca', 'Tanger', 'Agadir', 'Essaouira', 'Fes', 'Oujda'];

export const allProperties: AdminProperty[] = [
  {
    id: '1', reference: 'RES-2026-001', title: 'Villa luxe avec piscine', propertyType: 'residential',
    transactionType: 'vente', status: 'for_sale', price: 4500000, surface: 320, landSize: 500,
    bedrooms: 5, bathrooms: 4, rooms: 8, location: 'Marrakech, Palmeraie', address: '123 Rue de la Palmeraie',
    city: 'Marrakech', district: 'Palmeraie', owner: { id: 'o1', name: 'Ahmed Benali', phone: '+212 6 12 34 56 78', email: 'ahmed@email.com' },
    yearBuilt: 2018, description: 'Superbe villa avec piscine et jardin.', features: ['Piscine', 'Jardin', 'Parking'],
    images: ['/images/properties/prop1.jpg'], documents: [], matchedClients: [], timeline: [],
    dpe: { class: 'B', consumption: 85, since: '15/03/2026' },
    mandateType: 'exclusif', propertyState: 'neuf',
    createdAt: '2026-01-15', updatedAt: '2026-06-01',
    agentId: 'agent-1', mandateStatus: 'actif', mandateStartDate: '2026-01-15', mandateEndDate: '2027-01-15',
  },
  {
    id: '2', reference: 'RES-2026-002', title: 'Appartement moderne 2 chambres', propertyType: 'residential',
    transactionType: 'vente', status: 'sold', price: 850000, surface: 75,
    bedrooms: 2, bathrooms: 1, rooms: 4, location: 'Rabat, Agdal', address: '8 Rue Al Farabi',
    city: 'Rabat', district: 'Agdal', owner: { id: 'o2', name: 'Nadia Othmani', phone: '+212 6 44 55 66 77', email: 'nadia@email.com' },
    yearBuilt: 2022, description: 'Appartement recent avec terrasse.', features: ['Terrasse', 'Cuisine equipee', 'Parking'],
    images: [], documents: [], matchedClients: [], timeline: [],
    dpe: { class: 'C', consumption: 120, since: '15/04/2026' },
    mandateType: 'simple', propertyState: 'bon',
    createdAt: '2026-05-01', updatedAt: '2026-06-09',
    agentId: 'agent-2', mandateStatus: 'termine', mandateStartDate: '2026-02-01', mandateEndDate: '2026-05-30',
  },
  {
    id: '3', reference: 'RES-2026-003', title: 'Maison 3 chambres avec jardin', propertyType: 'residential',
    transactionType: 'location_ld', status: 'for_rent', price: 5000, surface: 120,
    bedrooms: 3, bathrooms: 2, rooms: 6, location: 'Casablanca, Maarif', address: '22 Rue des Orangers',
    city: 'Casablanca', district: 'Maarif', owner: { id: 'o3', name: 'Hassan El Fassi', phone: '+212 6 33 44 55 66', email: 'hassan@email.com' },
    yearBuilt: 2010, description: 'Maison familiale avec grand jardin.', features: ['Jardin', 'Garage', 'Cheminee'],
    images: [], documents: [], matchedClients: [], timeline: [],
    dpe: { class: 'D', consumption: 200, since: '10/02/2026' },
    mandateType: 'co_exclusif',
    createdAt: '2026-03-20', updatedAt: '2026-06-05',
    agentId: '', mandateStatus: 'actif', mandateStartDate: '2026-03-20', mandateEndDate: '2027-03-20',
  },
  {
    id: '4', reference: 'RES-2026-004', title: 'Duplex 4 chambres vue mer', propertyType: 'residential',
    transactionType: 'vente', status: 'sold', price: 720000, surface: 150,
    bedrooms: 4, bathrooms: 2, rooms: 7, location: 'Tanger, Malabata', address: '5 Avenue des Falaises',
    city: 'Tanger', district: 'Malabata', owner: { id: 'o4', name: 'Fatima Zahra', phone: '+212 6 77 88 99 00', email: 'fatima@email.com' },
    yearBuilt: 2015, description: 'Superbe duplex avec vue panoramique.', features: ['Vue mer', 'Terrasse', 'Parking'],
    images: [], documents: [], matchedClients: [], timeline: [],
    dpe: { class: 'B', consumption: 90, since: '20/01/2026' },
    mandateType: 'exclusif',
    createdAt: '2026-04-10', updatedAt: '2026-06-08',
    agentId: 'agent-3', mandateStatus: 'termine', mandateStartDate: '2026-02-10', mandateEndDate: '2026-05-30',
  },
  {
    id: '5', reference: 'RES-2026-005', title: 'Studio centre ville', propertyType: 'residential',
    transactionType: 'location_ld', status: 'for_rent', price: 2500, surface: 35,
    bedrooms: 1, bathrooms: 1, rooms: 2, location: 'Marrakech, Gueliz', address: '12 Rue Mohammed V',
    city: 'Marrakech', district: 'Gueliz', owner: { id: 'o5', name: 'Karim Bennani', phone: '+212 6 55 44 33 22', email: 'karim@email.com' },
    yearBuilt: 2020, description: 'Studio meuble ideal investissement.', features: ['Meuble', 'Climatisation', 'Securite'],
    images: [], documents: [], matchedClients: [], timeline: [],
    dpe: { class: 'A', consumption: 40, since: '05/03/2026' },
    mandateType: 'simple',
    createdAt: '2026-06-01', updatedAt: '2026-06-10',
    agentId: 'agent-1', mandateStatus: 'actif', mandateStartDate: '2026-06-01', mandateEndDate: '2027-06-01',
  },
  {
    id: '6', reference: 'RES-2026-006', title: 'Riad traditionnel 5 chambres', propertyType: 'residential',
    transactionType: 'vente', status: 'negotiation', price: 3200000, surface: 280,
    bedrooms: 5, bathrooms: 3, rooms: 10, location: 'Marrakech, Medina', address: '3 Derb Sidi Ben Slimane',
    city: 'Marrakech', district: 'Medina', owner: { id: 'o6', name: 'Mohamed Alaoui', phone: '+212 6 11 22 33 44', email: 'mohamed@email.com' },
    yearBuilt: 1850, description: 'Riad authentique entierement renove.', features: ['Patio', 'Fontaine', 'Terrasse panoramique'],
    images: [], documents: [], matchedClients: [], timeline: [],
    dpe: { class: 'E', consumption: 280, since: '01/12/2025' },
    mandateType: 'exclusif',
    createdAt: '2026-02-15', updatedAt: '2026-06-10',
    agentId: 'agent-4', mandateStatus: 'actif', mandateStartDate: '2026-02-15', mandateEndDate: '2027-02-15',
  },
  {
    id: '7', reference: 'RES-2026-007', title: 'Appartement neuf 3 pieces', propertyType: 'residential',
    transactionType: 'vente', status: 'for_sale', price: 1200000, surface: 90,
    bedrooms: 2, bathrooms: 1, rooms: 4, location: 'Casablanca, Californie', address: '45 Rue des Lilas',
    city: 'Casablanca', district: 'Californie', owner: { id: 'o7', name: 'Amina Tazi', phone: '+212 6 88 77 66 55', email: 'amina@email.com' },
    yearBuilt: 2024, description: 'Appartement neuf livraison 2024.', features: ['Cuisine equipee', 'Balcon', 'Parking souterrain'],
    images: [], documents: [], matchedClients: [], timeline: [],
    dpe: { class: 'A', consumption: 35, since: '15/06/2026' },
    mandateType: 'exclusif', propertyState: 'neuf',
    createdAt: '2026-06-05', updatedAt: '2026-06-10',
    agentId: 'agent-2', mandateStatus: 'actif', mandateStartDate: '2026-06-05', mandateEndDate: '2027-06-05',
  },
  {
    id: '8', reference: 'RES-2026-008', title: 'Villa contemporaine 6 chambres', propertyType: 'residential',
    transactionType: 'vente', status: 'under_compromise', price: 5500000, surface: 400,
    bedrooms: 6, bathrooms: 5, rooms: 12, location: 'Rabat, Souissi', address: '17 Rue des Ambassadeurs',
    city: 'Rabat', district: 'Souissi', owner: { id: 'o8', name: 'Driss El Fassi', phone: '+212 6 99 88 77 66', email: 'driss@email.com' },
    yearBuilt: 2019, description: 'Villa contemporaine haut standing.', features: ['Piscine', 'Jardin paysager', 'Home cinema'],
    images: [], documents: [], matchedClients: [], timeline: [],
    dpe: { class: 'C', consumption: 150, since: '10/04/2026' },
    mandateType: 'exclusif', propertyState: 'excellent',
    createdAt: '2026-01-20', updatedAt: '2026-06-10',
    agentId: 'agent-1', mandateStatus: 'actif', mandateStartDate: '2026-01-20', mandateEndDate: '2027-01-20',
  },
  {
    id: 'c1', reference: 'COM-2026-001', title: 'Bureau moderne centre ville', propertyType: 'commercial',
    transactionType: 'location_ld', status: 'for_sale_or_rent', price: 15000, surface: 180,
    bedrooms: 0, bathrooms: 2, rooms: 5, location: 'Casablanca, Centre', address: '45 Avenue Hassan II',
    city: 'Casablanca', district: 'Centre', owner: { id: 'oc1', name: 'Fatima Zahra', phone: '+212 6 98 76 54 32', email: 'fatima@email.com' },
    yearBuilt: 2020, description: 'Bureau lumineux en plein centre.', features: ['Climatisation', 'Securite', 'Parking'],
    images: [], documents: [], matchedClients: [], timeline: [],
    mandateType: 'exclusif', propertyState: 'excellent',
    createdAt: '2026-02-20', updatedAt: '2026-05-15',
    agentId: 'agent-1', mandateStatus: 'actif', mandateStartDate: '2026-02-20', mandateEndDate: '2027-02-20',
  },
  {
    id: 'c2', reference: 'COM-2026-002', title: 'Local commercial 200m2', propertyType: 'commercial',
    transactionType: 'vente', status: 'for_sale_or_rent', price: 3500000, surface: 200,
    bedrooms: 0, bathrooms: 1, rooms: 3, location: 'Marrakech, Gueliz', address: '88 Avenue Mohammed VI',
    city: 'Marrakech', district: 'Gueliz', owner: { id: 'oc2', name: 'Omar Benjelloun', phone: '+212 6 44 33 22 11', email: 'omar@email.com' },
    description: 'Local commercial tres bien situe.', features: ['Vitrine', 'Climatisation', 'Alarme'],
    images: [], documents: [], matchedClients: [], timeline: [],
    mandateType: 'simple',
    createdAt: '2026-03-15', updatedAt: '2026-06-01',
    agentId: 'agent-3', mandateStatus: 'en_attente', mandateStartDate: '2026-03-15', mandateEndDate: '2026-06-15',
  },
  {
    id: 'l1', reference: 'TER-2026-001', title: 'Terrain constructible 2000m2', propertyType: 'land',
    transactionType: 'vente', status: 'for_sale', price: 1200000, surface: 2000,
    bedrooms: 0, bathrooms: 0, rooms: 0, location: 'Tanger, Malabata', address: 'Route de Malabata',
    city: 'Tanger', district: 'Malabata', owner: { id: 'ol1', name: 'Karim El Fassi', phone: '+212 6 55 44 33 22', email: 'karim@email.com' },
    description: 'Terrain constructible avec vue mer.', features: ['Vue mer', 'Viabilise'],
    images: [], documents: [], matchedClients: [], timeline: [],
    mandateType: 'simple',
    createdAt: '2026-03-10', updatedAt: '2026-06-05',
    agentId: 'agent-3', mandateStatus: 'actif', mandateStartDate: '2026-03-10', mandateEndDate: '2027-03-10',
  },
  {
    id: 'l2', reference: 'TER-2026-002', title: 'Terrain agricole 5 hectares', propertyType: 'land',
    transactionType: 'vente', status: 'for_sale', price: 800000, surface: 50000,
    bedrooms: 0, bathrooms: 0, rooms: 0, location: 'Essaouira', address: 'Domaine Agricole',
    city: 'Essaouira', owner: { id: 'ol2', name: 'Mariam Benali', phone: '+212 6 22 33 44 55', email: 'mariam@email.com' },
    description: 'Terrain agricole avec droit deau.', features: ['Puits', 'Oliveraie'],
    images: [], documents: [], matchedClients: [], timeline: [],
    createdAt: '2026-04-01', updatedAt: '2026-06-08',
    agentId: '', mandateStatus: 'expire', mandateStartDate: '2025-04-01', mandateEndDate: '2026-04-01',
  },
  {
    id: 'v1', reference: 'VAC-2026-001', title: 'Appartement front de mer', propertyType: 'vacation',
    transactionType: 'location_saisonniere', status: 'available', price: 1200, priceMin: 600, priceMax: 2500,
    surface: 90, bedrooms: 3, bathrooms: 2, rooms: 5, sleepingCapacity: 8,
    location: 'Agadir, Plage', address: '12 Boulevard du Front de Mer', city: 'Agadir', district: 'Plage',
    owner: { id: 'ov1', name: 'Leila Bennani', phone: '+212 6 11 22 33 44', email: 'leila@email.com' },
    description: 'Bel appartement avec vue imprenable sur la mer.', features: ['Vue mer', 'Climatisation', 'Wifi'],
    images: [], documents: [], matchedClients: [], timeline: [], isSeasonal: true,
    dpe: { class: 'A', consumption: 45, since: '10/01/2026' },
    createdAt: '2026-04-05', updatedAt: '2026-06-08',
    agentId: 'agent-4', mandateStatus: 'actif', mandateStartDate: '2026-04-05', mandateEndDate: '2027-04-05',
  },
  {
    id: 'v2', reference: 'VAC-2026-002', title: 'Villa avec piscine', propertyType: 'vacation',
    transactionType: 'location_saisonniere', status: 'reserved', price: 3500, priceMin: 2000, priceMax: 5000,
    surface: 200, bedrooms: 5, bathrooms: 3, rooms: 10, sleepingCapacity: 12,
    location: 'Marrakech, Palmeraie', address: 'Route de la Palmeraie', city: 'Marrakech', district: 'Palmeraie',
    owner: { id: 'ov2', name: 'Reda Chraibi', phone: '+212 6 77 66 55 44', email: 'reda@email.com' },
    description: 'Magnifique villa avec grande piscine.', features: ['Piscine', 'Jardin', 'Barbecue'],
    images: [], documents: [], matchedClients: [], timeline: [], isSeasonal: true,
    createdAt: '2026-05-01', updatedAt: '2026-06-10',
    agentId: 'agent-1', mandateStatus: 'actif', mandateStartDate: '2026-05-01', mandateEndDate: '2027-05-01',
  },
  {
    id: 'x1', reference: 'LUX-2026-001', title: 'Palais avec jardin andalou', propertyType: 'luxury',
    transactionType: 'vente', status: 'confidential', price: 25000000, surface: 1200, landSize: 3000,
    bedrooms: 10, bathrooms: 8, rooms: 20, location: 'Marrakech, Hivernage', address: '1 Rue des Jardins',
    city: 'Marrakech', district: 'Hivernage', owner: { id: 'ox1', name: 'Moulay Youssef', phone: '+212 6 77 88 99 00', email: 'youssef@email.com' },
    yearBuilt: 1920, description: 'Palais historique entierement renove.', features: ['Jardin andalou', 'Piscine', 'Hammam', 'Fontaine'],
    images: [], documents: [], matchedClients: [], timeline: [],
    dpe: { class: 'D', consumption: 210, since: '01/01/2026' },
    mandateType: 'exclusif',
    createdAt: '2026-01-01', updatedAt: '2026-06-10',
    agentId: 'agent-5', mandateStatus: 'actif', mandateStartDate: '2026-01-01', mandateEndDate: '2027-01-01',
  },
  {
    id: 'x2', reference: 'LUX-2026-002', title: 'Penthouse vue panoramique', propertyType: 'luxury',
    transactionType: 'location_ld', status: 'for_sale_or_rent', price: 45000, surface: 350,
    bedrooms: 4, bathrooms: 3, rooms: 8, location: 'Casablanca, Anfa', address: 'Residence Anfa Place',
    city: 'Casablanca', district: 'Anfa', owner: { id: 'ox2', name: 'Sofia El Alami', phone: '+212 6 99 88 77 66', email: 'sofia@email.com' },
    yearBuilt: 2023, description: 'Penthouse exceptionnel avec vue a 360 degres.', features: ['Vue panoramique', 'Terrasse', 'Piscine privee'],
    images: [], documents: [], matchedClients: [], timeline: [],
    mandateType: 'exclusif',
    createdAt: '2026-05-15', updatedAt: '2026-06-10',
    agentId: 'agent-2', mandateStatus: 'actif', mandateStartDate: '2026-05-15', mandateEndDate: '2027-05-15',
  },
];

export const propertiesById: Record<string, AdminProperty> = {};
allProperties.forEach(p => { propertiesById[p.id] = p; });

export function getPropertiesByType(type: string): AdminProperty[] {
  return allProperties.filter(p => p.propertyType === type);
}

export function getPropertyById(id: string): AdminProperty | undefined {
  return propertiesById[id];
}
