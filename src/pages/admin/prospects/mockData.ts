import type { Prospect } from '../../../types/prospect';

export interface AdminProspect extends Omit<Prospect, 'status' | 'agentId'> {
  agentId: string;
  mandateStatus: 'actif' | 'expire' | 'en_attente' | 'termine';
  lastContactedAt?: string;
  status: 'Nouveau' | 'Contacté' | 'Qualifié' | 'En attente' | 'Perdu' | 'Converti';
  originalProspectId?: string | null;
}

export const AGENTS = [
  { id: 'agent-1', name: 'Myriam ABABOU', initials: 'MA', color: 'bg-violet-500' },
  { id: 'agent-2', name: 'Karim Eloui', initials: 'KE', color: 'bg-blue-500' },
  { id: 'agent-3', name: 'Yasmine AATIC', initials: 'YA', color: 'bg-emerald-500' },
  { id: 'agent-4', name: 'Dimitri DJEDJE', initials: 'DD', color: 'bg-amber-500' },
  { id: 'agent-5', name: 'Hayat OUAKRIM', initials: 'HO', color: 'bg-rose-500' },
];

export const ORIGINS = ['Site web', 'Mubawab', 'Properstar', 'Green-Acres', 'Reseaux sociaux', 'Recommandation', 'Telephone', 'Autre'];

const now = new Date();
const d = (daysOffset: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
};

export const allProspects: AdminProspect[] = [
  { id: 'ap1', civility: 'M.', firstName: 'Ahmed', lastName: 'Benali', email: 'ahmed.benali@email.com', phone: '+212 6 12 34 56 78', mobile: '+212 6 98 76 54 32', spokenLanguage: 'Francais', meansOfContact: ['email', 'phone'], type: 'Acheter', origin: 'Site web', categories: 'Vente', propertyTypes: ['Appartement'], location: 'Marrakech', rooms: 3, bedrooms: 2, minSurface: 80, maxPrice: 1200000, currency: 'MAD', message: 'Interesse par un appartement a Marrakech avec balcon et parking.', status: 'Nouveau', date: d(-14), createdAt: d(-14), updatedAt: d(-1), agentId: 'agent-1', mandateStatus: 'actif', lastContactedAt: d(-1) },
  { id: 'ap2', civility: 'Mme', firstName: 'Sophie', lastName: 'Martin', email: 'sophie.martin@email.com', phone: '+33 6 98 76 54 32', spokenLanguage: 'Francais', meansOfContact: ['email'], type: 'Louer', origin: 'Properstar', categories: 'Location', propertyTypes: ['Maison'], location: 'Casablanca', rooms: 4, bedrooms: 3, minSurface: 120, maxPrice: 15000, currency: 'MAD', status: 'Contacté', date: d(-12), createdAt: d(-12), updatedAt: d(-3), agentId: 'agent-2', mandateStatus: 'actif', lastContactedAt: d(-3) },
  { id: 'ap3', civility: 'M.', firstName: 'Youssef', lastName: 'Amrani', email: 'y.amrani@email.com', phone: '+212 6 54 32 10 98', spokenLanguage: 'Arabe', meansOfContact: ['phone', 'sms'], type: 'Acheter', origin: 'Reseaux sociaux', categories: 'Vente', propertyTypes: ['Garage / Parking'], location: 'Rabat', maxPrice: 250000, currency: 'MAD', status: 'Nouveau', date: d(-10), createdAt: d(-10), updatedAt: d(-10), agentId: '', mandateStatus: 'en_attente' },
  { id: 'ap4', civility: 'Mme', firstName: 'Leila', lastName: 'Benbrahim', email: 'leila@email.com', phone: '+212 6 11 22 33 44', spokenLanguage: 'Francais', meansOfContact: ['email', 'phone'], type: 'Acheter', origin: 'Mubawab', categories: 'Vente', propertyTypes: ['Appartement', 'Villa'], location: 'Marrakech', rooms: 5, bedrooms: 4, minSurface: 150, maxPrice: 3500000, currency: 'MAD', status: 'Qualifié', date: d(-25), createdAt: d(-25), updatedAt: d(-2), agentId: 'agent-3', mandateStatus: 'actif', lastContactedAt: d(-2) },
  { id: 'ap5', civility: 'M.', firstName: 'Karim', lastName: 'El Fassi', email: 'karim.elfassi@email.com', phone: '+212 6 33 44 55 66', spokenLanguage: 'Francais', meansOfContact: ['email'], type: 'Vendre', origin: 'Recommandation', categories: 'Vente', propertyTypes: ['Villa'], location: 'Tanger', rooms: 8, bedrooms: 5, minSurface: 300, maxPrice: 6000000, currency: 'MAD', message: 'Souhaite vendre sa villa a Tanger pour mutation.', status: 'Qualifié', date: d(-30), createdAt: d(-30), updatedAt: d(-4), agentId: 'agent-1', mandateStatus: 'actif', lastContactedAt: d(-4) },
  { id: 'ap6', civility: 'Mlle', firstName: 'Nadia', lastName: 'Tazi', email: 'nadia.tazi@email.com', phone: '+212 6 55 66 77 88', spokenLanguage: 'Francais', meansOfContact: ['phone'], type: 'Louer', origin: 'Green-Acres', categories: 'Location', propertyTypes: ['Appartement'], location: 'Rabat', rooms: 2, bedrooms: 1, minSurface: 50, maxPrice: 5000, currency: 'MAD', status: 'Contacté', date: d(-8), createdAt: d(-8), updatedAt: d(-1), agentId: 'agent-2', mandateStatus: 'actif', lastContactedAt: d(-1) },
  { id: 'ap7', civility: 'M.', firstName: 'Hassan', lastName: 'Ouazzani', email: 'hassan.ouazzani@email.com', phone: '+212 6 77 88 99 00', spokenLanguage: 'Arabe', meansOfContact: ['email', 'sms'], type: 'Acheter', origin: 'Site web', categories: 'Vente', propertyTypes: ['Terrain'], location: 'Essaouira', minSurface: 500, maxPrice: 1200000, currency: 'MAD', status: 'En attente', date: d(-20), createdAt: d(-20), updatedAt: d(-7), agentId: 'agent-4', mandateStatus: 'actif', lastContactedAt: d(-7) },
  { id: 'ap8', civility: 'Mme', firstName: 'Fatima', lastName: 'Zahra', email: 'f.zahra@email.com', phone: '+212 6 45 67 89 01', spokenLanguage: 'Francais', meansOfContact: ['email', 'phone'], type: 'Acheter', origin: 'Telephone', categories: 'Vente', propertyTypes: ['Riad'], location: 'Marrakech', rooms: 6, bedrooms: 4, minSurface: 200, maxPrice: 4500000, currency: 'MAD', status: 'Perdu', date: d(-45), createdAt: d(-45), updatedAt: d(-10), agentId: 'agent-3', mandateStatus: 'termine', lastContactedAt: d(-10) },
  { id: 'ap9', civility: 'M.', firstName: 'Mehdi', lastName: 'Alaoui', email: 'mehdi.alaoui@email.com', phone: '+212 6 22 33 44 55', spokenLanguage: 'Francais', meansOfContact: ['email'], type: 'Acheter', origin: 'Site web', categories: 'Vente', propertyTypes: ['Appartement'], location: 'Casablanca', rooms: 3, bedrooms: 2, minSurface: 90, maxPrice: 1500000, currency: 'MAD', status: 'Nouveau', date: d(-3), createdAt: d(-3), updatedAt: d(-3), agentId: '', mandateStatus: 'en_attente' },
  { id: 'ap10', civility: 'Mme', firstName: 'Amina', lastName: 'Bennis', email: 'amina.bennis@email.com', phone: '+212 6 66 77 88 99', spokenLanguage: 'Francais', meansOfContact: ['phone', 'whatsapp'], type: 'Faire estimer', origin: 'Recommandation', categories: 'Vente', propertyTypes: ['Villa'], location: 'Casablanca', rooms: 10, bedrooms: 6, minSurface: 400, maxPrice: 12000000, currency: 'MAD', status: 'Qualifié', date: d(-18), createdAt: d(-18), updatedAt: d(-1), agentId: 'agent-5', mandateStatus: 'actif', lastContactedAt: d(-1) },
  { id: 'ap11', civility: 'M.', firstName: 'Reda', lastName: 'Chraibi', email: 'reda.chraibi@email.com', phone: '+212 6 88 99 00 11', spokenLanguage: 'Francais', meansOfContact: ['email'], type: 'Louer', origin: 'Properstar', categories: 'Location', propertyTypes: ['Appartement'], location: 'Agadir', rooms: 2, bedrooms: 1, minSurface: 60, maxPrice: 4000, currency: 'MAD', status: 'Contacté', date: d(-6), createdAt: d(-6), updatedAt: d(-1), agentId: 'agent-2', mandateStatus: 'actif', lastContactedAt: d(-1) },
  { id: 'ap12', civility: 'Mme', firstName: 'Samira', lastName: 'El Ouafi', email: 'samira.elouafi@email.com', phone: '+212 6 99 00 11 22', spokenLanguage: 'Arabe', meansOfContact: ['phone'], type: 'Acheter', origin: 'Mubawab', categories: 'Vente', propertyTypes: ['Appartement', 'Maison'], location: 'Fes', rooms: 4, bedrooms: 3, minSurface: 100, maxPrice: 800000, currency: 'MAD', status: 'En attente', date: d(-15), createdAt: d(-15), updatedAt: d(-5), agentId: 'agent-4', mandateStatus: 'actif' },
  { id: 'ap13', civility: 'M.', firstName: 'Omar', lastName: 'Bennani', email: 'omar.bennani@email.com', phone: '+212 6 11 22 33 44', spokenLanguage: 'Francais', meansOfContact: ['email', 'phone'], type: 'Vendre', origin: 'Site web', categories: 'Vente', propertyTypes: ['Immeuble'], location: 'Casablanca', rooms: 12, bedrooms: 8, minSurface: 600, maxPrice: 8000000, currency: 'MAD', status: 'Converti', date: d(-60), createdAt: d(-60), updatedAt: d(-15), agentId: 'agent-1', mandateStatus: 'termine', lastContactedAt: d(-15) },
  { id: 'ap14', civility: 'Mme', firstName: 'Zineb', lastName: 'El Fassi', email: 'zineb.elfassi@email.com', phone: '+212 6 44 55 66 77', spokenLanguage: 'Francais', meansOfContact: ['email'], type: 'Acheter', origin: 'Reseaux sociaux', categories: 'Vente', propertyTypes: ['Villa'], location: 'Marrakech', rooms: 6, bedrooms: 4, minSurface: 250, maxPrice: 5000000, currency: 'MAD', status: 'Nouveau', date: d(-2), createdAt: d(-2), updatedAt: d(-2), agentId: '', mandateStatus: 'en_attente' },
  { id: 'ap15', civility: 'M.', firstName: 'Khalid', lastName: 'El Amrani', email: 'khalid.elamrani@email.com', phone: '+212 6 77 66 55 44', spokenLanguage: 'Arabe', meansOfContact: ['phone'], type: 'Acheter', origin: 'Autre', categories: 'Vente', propertyTypes: ['Commerce'], location: 'Tanger', minSurface: 100, maxPrice: 2000000, currency: 'MAD', status: 'Perdu', date: d(-50), createdAt: d(-50), updatedAt: d(-20), agentId: 'agent-5', mandateStatus: 'termine' },
  { id: 'ap16', civility: 'M.', firstName: 'Younes', lastName: 'Atik', email: 'younes.atik@email.com', phone: '+212 6 33 22 11 00', spokenLanguage: 'Francais', meansOfContact: ['email', 'phone'], type: 'Louer', origin: 'Green-Acres', categories: 'Location', propertyTypes: ['Maison'], location: 'Casablanca', rooms: 5, bedrooms: 4, minSurface: 180, maxPrice: 20000, currency: 'MAD', status: 'Qualifié', date: d(-22), createdAt: d(-22), updatedAt: d(-2), agentId: 'agent-1', mandateStatus: 'actif', lastContactedAt: d(-2) },
];

export function getProspectById(id: string): AdminProspect | undefined {
  return allProspects.find(p => p.id === id);
}
