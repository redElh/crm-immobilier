import type { Contact } from '../../../types/contact';

export interface AdminContact extends Contact {
  agentId: string;
}

export const AGENTS = [
  { id: 'agent-1', name: 'Myriam ABABOU', initials: 'MA', color: 'bg-violet-500' },
  { id: 'agent-2', name: 'Karim Eloui', initials: 'KE', color: 'bg-blue-500' },
  { id: 'agent-3', name: 'Yasmine AATIC', initials: 'YA', color: 'bg-emerald-500' },
  { id: 'agent-4', name: 'Dimitri DJEDJE', initials: 'DD', color: 'bg-amber-500' },
  { id: 'agent-5', name: 'Hayat OUAKRIM', initials: 'HO', color: 'bg-rose-500' },
];

const now = new Date();
const d = (daysOffset: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
};

export const allContacts: AdminContact[] = [
  {
    id: 'ac1', type: 'Particulier', civility: 'M.', firstName: 'Ahmed', lastName: 'Benali',
    emailPrincipal: 'ahmed.benali@email.com', emailSecondaire: 'a.benali@protonmail.com',
    mobile: '+212 6 12 34 56 78', telephoneFixe: '+212 5 22 33 44 55',
    profession: 'Ingenieur en genie civil', lieuNaissance: 'Marrakech', dateNaissance: '1985-03-15',
    nationalite: 'Marocaine', numeroFiscal: 'FR12345678901',
    adresse: '12 Avenue Mohammed V', adresse2: 'Residence Al Ward, Appt 5',
    codePostal: '40000', ville: 'Marrakech', pays: 'Maroc',
    moyenContactPrefere: 'Email', langueParlee: ['Francais', 'Arabe', 'Anglais'],
    devisePreferee: 'MAD', situationFamiliale: 'Marié', nombreEnfants: 2,
    prescripteur: 'Mustapha El Fassi (client referent)', regimeMatrimonial: 'Communaute universelle',
    siteInternet: 'www.ahmedbenali.ma', commentairePrive: 'Client tres exigeant.',
    originalProspectId: 'p1',
    mandats: [{ id: 'am1', clientType: 'Acheteur', status: 'Actif', startDate: '2025-06-10', propertyType: 'Appartement', area: 'Marrakech', notes: 'Recherche 3 pieces avec balcon' }],
    createdAt: d(-30), updatedAt: d(-1), agentId: 'agent-1',
  },
  {
    id: 'ac2', type: 'Particulier', civility: 'Mme', firstName: 'Sophie', lastName: 'Martin',
    emailPrincipal: 'sophie.martin@email.com', mobile: '+33 6 98 76 54 32',
    profession: 'Avocate', nationalite: 'Francaise',
    adresse: '45 Rue des Orangers', ville: 'Casablanca', pays: 'Maroc',
    moyenContactPrefere: 'Email', langueParlee: ['Francais'], devisePreferee: 'EUR',
    situationFamiliale: 'Célibataire',
    mandats: [
      { id: 'am2', clientType: 'Vendeur', status: 'Actif', startDate: '2025-05-01', propertyType: 'Maison', area: 'Casablanca', notes: 'Villa 4 pieces, jardin 200m2' },
      { id: 'am3', clientType: 'Acheteur', status: 'Actif', startDate: '2025-06-01', propertyType: 'Appartement', area: 'Rabat' },
    ],
    createdAt: d(-45), updatedAt: d(-5), agentId: 'agent-2',
  },
  {
    id: 'ac3', type: 'Professionnel', civility: 'M.', firstName: 'Youssef', lastName: 'Amrani',
    emailPrincipal: 'y.amrani@email.com', mobile: '+212 6 54 32 10 98',
    telephoneFixe: '+212 5 37 68 90 12', profession: 'Promoteur immobilier',
    nationalite: 'Marocaine', adresse: 'Immeuble Al Majd, Bat B', codePostal: '10000',
    ville: 'Rabat', pays: 'Maroc', moyenContactPrefere: 'Telephone',
    langueParlee: ['Arabe', 'Francais'], devisePreferee: 'MAD',
    situationFamiliale: 'Marié', nombreEnfants: 3,
    commentairePrive: 'Client recurrent. A deja vendu 2 biens via nous.',
    originalProspectId: 'p3',
    mandats: [{ id: 'am4', clientType: 'Bailleur', status: 'Actif', startDate: '2025-04-15', propertyType: 'Appartement', area: 'Rabat', notes: 'Appartement meuble, 2 chambres' }],
    createdAt: d(-60), updatedAt: d(-3), agentId: 'agent-3',
  },
  {
    id: 'ac4', type: 'Indivision / Succession', civility: 'Mlle', firstName: 'Fatima', lastName: 'Zahra',
    emailPrincipal: 'f.zahra@email.com', emailSecondaire: 'fatima.zahra@family.ma',
    mobile: '+212 6 45 67 89 01', telephoneFixe: '+212 5 22 99 88 77',
    lieuNaissance: 'Fes', dateNaissance: '1990-11-22', nationalite: 'Marocaine',
    adresse: '17 Rue de la Liberte', ville: 'Casablanca', pays: 'Maroc',
    moyenContactPrefere: 'WhatsApp', langueParlee: ['Francais', 'Anglais', 'Espagnol'],
    devisePreferee: 'MAD', situationFamiliale: 'Divorcé', nombreEnfants: 1,
    prescripteur: 'Me Bennani (notaire)', regimeMatrimonial: 'Separation de biens',
    commentairePrive: 'Dossier succession en cours.',
    mandats: [
      { id: 'am5', clientType: 'Locataire', status: 'Expiré', startDate: '2024-01-01', endDate: '2024-12-31', propertyType: 'Appartement', area: 'Casablanca' },
      { id: 'am6', clientType: 'Voyageur', status: 'Actif', startDate: '2025-07-01', endDate: '2025-07-15', area: 'Marrakech', notes: 'Sejour familial, 4 personnes' },
    ],
    createdAt: d(-90), updatedAt: d(-2), agentId: 'agent-1',
  },
  {
    id: 'ac5', type: 'Particulier', civility: 'M.', firstName: 'Karim', lastName: 'El Fassi',
    emailPrincipal: 'karim.elfassi@email.com', mobile: '+212 6 33 44 55 66',
    profession: 'Medecin', nationalite: 'Marocaine', ville: 'Tanger', pays: 'Maroc',
    moyenContactPrefere: 'Email', langueParlee: ['Francais', 'Arabe'],
    mandats: [{ id: 'am7', clientType: 'Vendeur', status: 'Actif', startDate: '2025-03-01', propertyType: 'Villa', area: 'Tanger', notes: 'Villa de luxe, piscine, 5 chambres' }],
    createdAt: d(-80), updatedAt: d(-4), agentId: 'agent-4',
  },
  {
    id: 'ac6', type: 'Particulier', civility: 'Mme', firstName: 'Leila', lastName: 'Benbrahim',
    emailPrincipal: 'leila@email.com', mobile: '+212 6 11 22 33 44',
    profession: 'Architecte', nationalite: 'Marocaine', ville: 'Marrakech', pays: 'Maroc',
    moyenContactPrefere: 'Phone', langueParlee: ['Francais', 'Anglais'],
    situationFamiliale: 'Marié', nombreEnfants: 2,
    mandats: [{ id: 'am8', clientType: 'Acheteur', status: 'Actif', startDate: '2025-06-15', propertyType: 'Villa', area: 'Marrakech', notes: 'Recherche villa avec jardin, 4+ chambres' }],
    createdAt: d(-35), updatedAt: d(-1), agentId: 'agent-3',
  },
  {
    id: 'ac7', type: 'Professionnel', civility: 'M.', firstName: 'Hassan', lastName: 'Ouazzani',
    emailPrincipal: 'hassan.ouazzani@email.com', mobile: '+212 6 77 88 99 00',
    profession: 'Agent immobilier', nationalite: 'Marocaine', ville: 'Essaouira', pays: 'Maroc',
    moyenContactPrefere: 'Email', langueParlee: ['Arabe', 'Francais'],
    mandats: [{ id: 'am9', clientType: 'Vendeur', status: 'Actif', startDate: '2025-02-01', propertyType: 'Terrain', area: 'Essaouira', notes: 'Terrain constructible 500m2' }],
    createdAt: d(-120), updatedAt: d(-10), agentId: 'agent-5',
  },
  {
    id: 'ac8', type: 'Particulier', civility: 'M.', firstName: 'Mehdi', lastName: 'Alaoui',
    emailPrincipal: 'mehdi.alaoui@email.com', mobile: '+212 6 22 33 44 55',
    profession: 'Commercial', nationalite: 'Marocaine', ville: 'Casablanca', pays: 'Maroc',
    moyenContactPrefere: 'WhatsApp', langueParlee: ['Francais'],
    mandats: [],
    createdAt: d(-20), updatedAt: d(-20), agentId: 'agent-2',
  },
  {
    id: 'ac9', type: 'Particulier', civility: 'Mme', firstName: 'Amina', lastName: 'Bennis',
    emailPrincipal: 'amina.bennis@email.com', mobile: '+212 6 66 77 88 99',
    profession: 'Avocate d\'affaires', nationalite: 'Marocaine',
    adresse: 'Tour Casa Nearshore', ville: 'Casablanca', pays: 'Maroc',
    moyenContactPrefere: 'Email', langueParlee: ['Francais', 'Anglais'],
    situationFamiliale: 'Célibataire',
    mandats: [
      { id: 'am10', clientType: 'Bailleur', status: 'Actif', startDate: '2025-04-01', propertyType: 'Appartement', area: 'Casablanca', notes: 'Appartement de standing, 3 chambres' },
      { id: 'am11', clientType: 'Locataire', status: 'Actif', startDate: '2025-07-01', propertyType: 'Bureau', area: 'Casablanca' },
    ],
    createdAt: d(-50), updatedAt: d(-2), agentId: 'agent-5',
  },
  {
    id: 'ac10', type: 'Indivision / Succession', civility: 'M.', firstName: 'Reda', lastName: 'Chraibi',
    emailPrincipal: 'reda.chraibi@email.com', mobile: '+212 6 88 99 00 11',
    nationalite: 'Marocaine', ville: 'Agadir', pays: 'Maroc',
    moyenContactPrefere: 'Phone', langueParlee: ['Francais'],
    mandats: [{ id: 'am12', clientType: 'Vendeur', status: 'Expiré', startDate: '2024-06-01', endDate: '2024-12-01', propertyType: 'Maison', area: 'Agadir' }],
    createdAt: d(-200), updatedAt: d(-60), agentId: '',
  },
  {
    id: 'ac11', type: 'Particulier', civility: 'Mme', firstName: 'Samira', lastName: 'El Ouafi',
    emailPrincipal: 'samira.elouafi@email.com', mobile: '+212 6 99 00 11 22',
    profession: 'Enseignante', nationalite: 'Marocaine', ville: 'Fes', pays: 'Maroc',
    moyenContactPrefere: 'Email', langueParlee: ['Arabe', 'Francais'],
    situationFamiliale: 'Marié', nombreEnfants: 3,
    mandats: [{ id: 'am13', clientType: 'Acheteur', status: 'Actif', startDate: '2025-06-20', propertyType: 'Appartement', area: 'Fes', notes: 'Budget max 800K MAD, 3 chambres' }],
    createdAt: d(-15), updatedAt: d(-1), agentId: 'agent-4',
  },
  {
    id: 'ac12', type: 'Professionnel', civility: 'M.', firstName: 'Omar', lastName: 'Bennani',
    emailPrincipal: 'omar.bennani@email.com', mobile: '+212 6 11 22 33 44',
    profession: 'Promoteur immobilier', nationalite: 'Marocaine',
    ville: 'Casablanca', pays: 'Maroc', moyenContactPrefere: 'Email',
    langueParlee: ['Francais', 'Arabe'],
    mandats: [{ id: 'am14', clientType: 'Vendeur', status: 'Actif', startDate: '2025-01-01', propertyType: 'Immeuble', area: 'Casablanca', notes: 'Immeuble de rapport, 12 appartements' }],
    createdAt: d(-150), updatedAt: d(-7), agentId: 'agent-1',
  },
  {
    id: 'ac13', type: 'Particulier', civility: 'M.', firstName: 'Khalid', lastName: 'El Amrani',
    emailPrincipal: 'khalid.elamrani@email.com', mobile: '+212 6 77 66 55 44',
    profession: 'Chef d\'entreprise', nationalite: 'Marocaine',
    ville: 'Tanger', pays: 'Maroc', moyenContactPrefere: 'Phone',
    langueParlee: ['Arabe', 'Francais', 'Anglais'],
    mandats: [{ id: 'am15', clientType: 'Acheteur', status: 'Actif', startDate: '2025-05-15', propertyType: 'Commerce', area: 'Tanger', notes: 'Local commercial, zone touristique' }],
    createdAt: d(-40), updatedAt: d(-3), agentId: 'agent-5',
  },
  {
    id: 'ac14', type: 'Particulier', civility: 'M.', firstName: 'Younes', lastName: 'Atik',
    emailPrincipal: 'younes.atik@email.com', mobile: '+212 6 33 22 11 00',
    profession: 'Consultant', nationalite: 'Marocaine',
    ville: 'Casablanca', pays: 'Maroc', moyenContactPrefere: 'Email',
    langueParlee: ['Francais', 'Anglais'],
    situationFamiliale: 'Marié', nombreEnfants: 1,
    mandats: [{ id: 'am16', clientType: 'Voyageur', status: 'Actif', startDate: '2025-08-01', endDate: '2025-08-10', area: 'Marrakech', notes: 'Vacances en famille, maison avec piscine' }],
    createdAt: d(-10), updatedAt: d(-1), agentId: 'agent-2',
  },
  {
    id: 'ac15', type: 'Particulier', civility: 'Mme', firstName: 'Nadia', lastName: 'Tazi',
    emailPrincipal: 'nadia.tazi@email.com', mobile: '+212 6 55 66 77 88',
    nationalite: 'Marocaine', ville: 'Rabat', pays: 'Maroc',
    moyenContactPrefere: 'Phone', langueParlee: ['Francais'],
    mandats: [],
    createdAt: d(-5), updatedAt: d(-5), agentId: '',
  },
];

export function getContactById(id: string): AdminContact | undefined {
  return allContacts.find(c => c.id === id);
}
