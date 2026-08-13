import type { Client } from '../../../types/client';

export type MandatStatus = 'actif' | 'expire' | 'resilie' | 'termine';

export interface AdminClient extends Client {
  agentId: string;
  mandateStatus?: MandatStatus;
  mandateStartDate?: string;
  mandateEndDate?: string;
}

export const AGENTS = [
  { id: 'agent-1', name: 'Myriam ABABOU', initials: 'MA', color: 'bg-violet-500' },
  { id: 'agent-2', name: 'Karim Eloui', initials: 'KE', color: 'bg-blue-500' },
  { id: 'agent-3', name: 'Yasmine AATIC', initials: 'YA', color: 'bg-emerald-500' },
  { id: 'agent-4', name: 'Dimitri DJEDJE', initials: 'DD', color: 'bg-amber-500' },
  { id: 'agent-5', name: 'Hayat OUAKRIM', initials: 'HO', color: 'bg-rose-500' },
];

export const CITIES = ['Marrakech', 'Rabat', 'Casablanca', 'Tanger', 'Agadir', 'Essaouira', 'Fes', 'Oujda'];

export const allClients: AdminClient[] = [
  {
    id: 'admin-c1', name: 'Pierre Martin', type: 'Acheteur', status: 'Actif', agentId: 'agent-1',
    phone: '+212 6 12 34 56 78', email: 'pierre.martin@email.com', propertyType: 'Appartement',
    area: 'Maroc', secteur: 'Medina', minSurface: 80, surfaceMax: 120, rooms: '3',
    budget: 1200000, contribution: 300000, financingType: 'Pret bancaire', loanDuration: 20,
    classification: 'Tres actif', statutMetier: 'En recherche', categorie: 'Vente',
    pieces: 3, chambres: 2, etat: 'Bon', standing: 'Moyen', disponibilite: 'Immediate',
    criteres: ['Balcon', 'Parking', 'Terrasse'], vue: 'Mer', exposition: 'Sud',
    lastContact: '2026-06-15', createdAt: '2026-01-10', updatedAt: '2026-06-15', createdBy: 'agent-1',
    mandateStatus: 'actif', mandateStartDate: '2026-01-10', mandateEndDate: '2027-01-10',
  },
  {
    id: 'admin-c2', name: 'Marie Lambert', type: 'Acheteur', status: 'Actif', agentId: 'agent-2',
    phone: '+212 6 98 76 54 32', email: 'marie.lambert@email.com', propertyType: 'Maison',
    area: 'Maroc', secteur: 'Ghazoua', minSurface: 100, surfaceMax: 150, rooms: '5',
    budget: 2200000, contribution: 500000, financingType: 'Pret bancaire', loanDuration: 25,
    classification: 'Actif', statutMetier: 'En negociation', categorie: 'Vente',
    pieces: 5, chambres: 3, etat: 'Neuf', standing: 'Luxe', vue: 'Jardin', exposition: 'Sud-Est',
    criteres: ['Jardin', 'Garage', 'Piscine', 'Ascenseur'],
    lastContact: '2026-06-10', createdAt: '2026-02-15', updatedAt: '2026-06-10', createdBy: 'agent-2',
    mandateStatus: 'actif', mandateStartDate: '2026-02-15', mandateEndDate: '2027-02-15',
  },
  {
    id: 'admin-c3', name: 'Karim Benali', type: 'Acheteur', status: 'En négociation', agentId: 'agent-3',
    phone: '+212 6 11 22 33 44', email: 'karim.benali@email.com', propertyType: 'Appartement',
    area: 'Maroc', secteur: 'Sidi Magdoul', minSurface: 60, surfaceMax: 90, rooms: '2',
    budget: 600000, contribution: 80000, financingType: 'Pret bancaire', loanDuration: 20,
    classification: 'Normal', statutMetier: 'En qualification', categorie: 'Programme',
    pieces: 2, chambres: 1, etat: 'Neuf', standing: 'Economique', disponibilite: 'Immediate',
    criteres: ['Parking', 'Ascenseur', 'Balcon'],
    lastContact: '2026-06-12', createdAt: '2026-03-01', updatedAt: '2026-06-12', createdBy: 'agent-3',
    mandateStatus: 'actif', mandateStartDate: '2026-03-01', mandateEndDate: '2027-03-01',
  },
  {
    id: 'admin-c4', name: 'Sophie Moreau', type: 'Acheteur', status: 'Inactif', agentId: '',
    phone: '+212 6 44 55 66 77', email: 'sophie.moreau@email.com', propertyType: 'Villa',
    area: 'Maroc', secteur: 'Palmeraie', minSurface: 200, surfaceMax: 300, rooms: '6',
    budget: 5000000, classification: 'Peu actif', statutMetier: 'Inactif', categorie: 'Vente',
    pieces: 6, chambres: 4, etat: 'Excellent', standing: 'Luxe',
    lastContact: '2026-04-20', createdAt: '2026-01-20', updatedAt: '2026-04-20', createdBy: 'agent-1',
    mandateStatus: 'expire', mandateStartDate: '2026-01-20', mandateEndDate: '2026-04-20',
  },
  {
    id: 'admin-c5', name: 'Hassan El Fassi', type: 'Vendeur', status: 'Actif', agentId: 'agent-1',
    phone: '+212 6 98 76 54 32', email: 'hassan.elfassi@email.com', propertyType: 'Villa',
    area: 'Maroc', secteur: 'Argana', minSurface: 200, surfaceMax: 300,
    budget: 3500000, classification: 'Actif', statutMetier: 'En mandat', categorie: 'Vente',
    pieces: 6, chambres: 4, vue: 'Panoramique', exposition: 'Sud', etat: 'Tres bon', standing: 'Luxe',
    currentSituation: 'Proprietaire occupant', reasonForSelling: 'Mutation professionnelle',
    lastContact: '2026-06-05', createdAt: '2026-04-01', updatedAt: '2026-06-05', createdBy: 'agent-1',
    mandateStatus: 'actif', mandateStartDate: '2026-04-01', mandateEndDate: '2027-04-01',
  },
  {
    id: 'admin-c6', name: 'Fatima Zahra Bennani', type: 'Vendeur', status: 'Actif', agentId: 'agent-2',
    phone: '+212 6 12 34 56 79', email: 'fatima.bennani@email.com', propertyType: 'Appartement',
    area: 'Maroc', secteur: 'Sidi Magdoul', minSurface: 85, surfaceMax: 85,
    budget: 650000, classification: 'Normal', statutMetier: 'En attente de signature', categorie: 'Vente',
    pieces: 3, chambres: 2, etat: 'Bon', standing: 'Moyen', disponibilite: 'Immediate',
    currentSituation: 'Proprietaire bailleur', reasonForSelling: 'Investissement',
    lastContact: '2026-06-03', createdAt: '2026-04-15', updatedAt: '2026-06-03', createdBy: 'agent-2',
    mandateStatus: 'actif', mandateStartDate: '2026-04-15', mandateEndDate: '2027-04-15',
  },
  {
    id: 'admin-c7', name: 'Omar Tazi', type: 'Vendeur', status: 'Inactif', agentId: 'agent-3',
    phone: '+212 6 45 67 89 01', email: 'omar.tazi@email.com', propertyType: 'Terrain',
    area: 'Maroc', secteur: 'Azlef', minSurface: 500,
    budget: 1800000, classification: 'Peu actif', statutMetier: 'Perdu', categorie: 'Vente',
    currentSituation: 'SCI', reasonForSelling: 'Vente ailleurs',
    lastContact: '2026-05-10', createdAt: '2026-03-20', updatedAt: '2026-05-10', createdBy: 'agent-3',
    mandateStatus: 'termine', mandateStartDate: '2026-03-20', mandateEndDate: '2026-05-10',
  },
  {
    id: 'admin-c8', name: 'Leila Benjelloun', type: 'Vendeur', status: 'Actif', agentId: 'agent-4',
    phone: '+212 6 77 88 99 00', email: 'leila.benjelloun@email.com', propertyType: 'Riad',
    area: 'Maroc', secteur: 'Medina', minSurface: 150, surfaceMax: 250,
    budget: 4200000, classification: 'Actif', statutMetier: 'En negociation', categorie: 'Vente',
    pieces: 8, chambres: 5, etat: 'Renove', standing: 'Luxe',
    currentSituation: 'Proprietaire occupant', reasonForSelling: 'Projet immobilier',
    lastContact: '2026-06-08', createdAt: '2026-05-01', updatedAt: '2026-06-08', createdBy: 'agent-4',
    mandateStatus: 'actif', mandateStartDate: '2026-05-01', mandateEndDate: '2027-05-01',
  },
  {
    id: 'admin-c9', name: 'Ahmed Benali', type: 'Bailleur', status: 'Actif', agentId: 'agent-1',
    phone: '+212 6 11 22 33 44', email: 'ahmed.benali@email.com', propertyType: 'Appartement',
    area: 'Maroc', secteur: 'Erraounak', minSurface: 70, surfaceMax: 70,
    classification: 'Actif', statutMetier: 'En mandat', categorie: 'Location',
    pieces: 2, chambres: 1, etat: 'Bon', standing: 'Moyen', disponibilite: 'Immediate',
    currentSituation: 'Proprietaire bailleur',
    propertyCondition: 'Bon etat', preferredTenant: 'Locataire seule', includedUtilities: 'Charges comprises',
    lastContact: '2026-06-05', createdAt: '2026-05-01', updatedAt: '2026-06-05', createdBy: 'agent-1',
    mandateStatus: 'actif', mandateStartDate: '2026-05-01', mandateEndDate: '2027-05-01',
  },
  {
    id: 'admin-c10', name: 'Nadia El Fassi', type: 'Bailleur', status: 'Actif', agentId: 'agent-2',
    phone: '+212 6 55 66 77 88', email: 'nadia.elfassi@email.com', propertyType: 'Villa',
    area: 'Maroc', secteur: 'Ghazoua', minSurface: 150,
    classification: 'Normal', statutMetier: 'En attente de signature', categorie: 'Location',
    pieces: 4, chambres: 3, etat: 'Neuf', standing: 'Luxe', disponibilite: '3 mois',
    currentSituation: 'Proprietaire occupant',
    propertyCondition: 'Neuf', preferredTenant: 'Famille', includedUtilities: 'Eau et electricite',
    lastContact: '2026-06-03', createdAt: '2026-05-15', updatedAt: '2026-06-03', createdBy: 'agent-2',
    mandateStatus: 'actif', mandateStartDate: '2026-05-15', mandateEndDate: '2026-08-15',
  },
  {
    id: 'admin-c11', name: 'Rachid El Amrani', type: 'Bailleur', status: 'Inactif', agentId: 'agent-5',
    phone: '+212 6 33 44 55 66', email: 'rachid.elamrani@email.com', propertyType: 'Immeuble',
    area: 'Maroc', secteur: 'Centre', minSurface: 400,
    classification: 'Peu actif', statutMetier: 'Inactif', categorie: 'Location',
    currentSituation: 'Investisseur',
    propertyCondition: 'Tres bon', includedUtilities: 'Non',
    lastContact: '2026-03-15', createdAt: '2026-02-01', updatedAt: '2026-03-15', createdBy: 'agent-5',
    mandateStatus: 'expire', mandateStartDate: '2026-02-01', mandateEndDate: '2026-03-01',
  },
  {
    id: 'admin-c12', name: 'Sophie Laurent', type: 'Locataire', status: 'Actif', agentId: 'agent-2',
    phone: '+33 6 23 45 67 89', email: 'sophie.laurent@email.com', propertyType: 'Appartement',
    area: 'Maroc', secteur: 'Medina', minSurface: 50, surfaceMax: 80,
    budget: 4000, classification: 'Tres actif', statutMetier: 'En recherche', categorie: 'Location',
    pieces: 2, chambres: 1, etat: 'Bon', standing: 'Moyen', disponibilite: 'Immediate',
    employmentStatus: 'Etudiant', guarantor: true, minRentalDuration: 12,
    lastContact: '2026-06-08', createdAt: '2026-05-20', updatedAt: '2026-06-08', createdBy: 'agent-2',
    mandateStatus: 'actif', mandateStartDate: '2026-05-20', mandateEndDate: '2027-05-20',
  },
  {
    id: 'admin-c13', name: 'Marc Dubois', type: 'Locataire', status: 'Actif', agentId: 'agent-1',
    phone: '+33 6 34 56 78 90', email: 'marc.dubois@email.com', propertyType: 'Maison',
    area: 'Maroc', secteur: 'Ghazoua', minSurface: 100, surfaceMax: 150,
    budget: 8000, classification: 'Actif', statutMetier: 'En visite', categorie: 'Location',
    pieces: 4, chambres: 3, etat: 'Tres bon', standing: 'Luxe', disponibilite: '1 mois',
    employmentStatus: 'CDI', guarantor: false, minRentalDuration: 24,
    lastContact: '2026-06-09', createdAt: '2026-06-05', updatedAt: '2026-06-09', createdBy: 'agent-1',
    mandateStatus: 'actif', mandateStartDate: '2026-06-05', mandateEndDate: '2027-06-05',
  },
  {
    id: 'admin-c14', name: 'Claire Fontaine', type: 'Locataire', status: 'Actif', agentId: 'agent-4',
    phone: '+212 6 66 77 88 99', email: 'claire.fontaine@email.com', propertyType: 'Studio',
    area: 'Maroc', secteur: 'Gueliz', minSurface: 30, surfaceMax: 50,
    budget: 2500, classification: 'Actif', statutMetier: 'En dossier', categorie: 'Location',
    pieces: 1, chambres: 1, etat: 'Bon', standing: 'Moyen', disponibilite: 'Immediate',
    employmentStatus: 'Freelance', guarantor: true, minRentalDuration: 6,
    lastContact: '2026-06-10', createdAt: '2026-06-01', updatedAt: '2026-06-10', createdBy: 'agent-4',
    mandateStatus: 'actif', mandateStartDate: '2026-06-01', mandateEndDate: '2027-06-01',
  },
  {
    id: 'admin-c15', name: 'Thomas Berger', type: 'Voyageur', status: 'Actif', agentId: 'agent-1',
    phone: '+33 6 45 67 89 01', email: 'thomas.berger@email.com', propertyType: 'Riad',
    area: 'Maroc', secteur: 'Essaouira', minSurface: 80, surfaceMax: 120,
    budget: 500, nbPersonnes: 4, classification: 'Actif', statutMetier: 'Confirme', categorie: 'Location saisonnière',
    pieces: 2, chambres: 2, etat: 'Tres bon', standing: 'Luxe',
    budgetParNuitMin: 300, budgetParNuitMax: 500, dateArrivee: '2026-07-15', dateDepart: '2026-07-22',
    flexibiliteDates: 'Pas flexible', modePaiement: 'Carte bancaire',
    accommodationType: 'Riad', specialRequirements: 'Lit bebe',
    lastContact: '2026-06-10', createdAt: '2026-06-01', updatedAt: '2026-06-10', createdBy: 'agent-1',
  },
  {
    id: 'admin-c16', name: 'Sarah Klein', type: 'Voyageur', status: 'Actif', agentId: 'agent-3',
    phone: '+33 6 56 78 90 12', email: 'sarah.klein@email.com', propertyType: 'Studio',
    area: 'Maroc', secteur: 'Medina', minSurface: 30, surfaceMax: 50,
    budget: 250, nbPersonnes: 2, classification: 'Actif', statutMetier: 'En recherche', categorie: 'Location saisonnière',
    pieces: 1, chambres: 1,
    budgetParNuitMin: 150, budgetParNuitMax: 250,
    accommodationType: 'Studio meuble', specialRequirements: 'Bon wifi',
    lastContact: '2026-06-09', createdAt: '2026-06-08', updatedAt: '2026-06-09', createdBy: 'agent-3',
  },
  {
    id: 'admin-c17', name: 'Yannick Leroy', type: 'Voyageur', status: 'Inactif', agentId: '',
    phone: '+33 6 67 89 01 23', email: 'yannick.leroy@email.com', propertyType: 'Appartement',
    area: 'Maroc', secteur: 'Agadir', minSurface: 40, surfaceMax: 70,
    budget: 300, nbPersonnes: 3, classification: 'Peu actif', statutMetier: 'Annule', categorie: 'Location saisonnière',
    pieces: 2, chambres: 2,
    budgetParNuitMin: 200, budgetParNuitMax: 300,
    accommodationType: 'Appartement',
    lastContact: '2026-05-20', createdAt: '2026-05-01', updatedAt: '2026-05-20', createdBy: 'agent-4',
  },
];

export const clientsById: Record<string, AdminClient> = {};
allClients.forEach(c => { clientsById[c.id] = c; });

export function getClientsByType(type: string): AdminClient[] {
  const typeMap: Record<string, 'Acheteur' | 'Locataire' | 'Bailleur' | 'Vendeur' | 'Voyageur'> = {
    acheteur: 'Acheteur', locataire: 'Locataire', bailleur: 'Bailleur', vendeur: 'Vendeur', voyageur: 'Voyageur',
  };
  return allClients.filter(c => c.type === typeMap[type]);
}

export function getClientById(id: string): AdminClient | undefined {
  return clientsById[id];
}
