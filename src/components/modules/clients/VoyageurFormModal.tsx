import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Save, Search, Home } from 'react-feather';
import { Client } from '../../../types/client';
import { DatePicker } from '../../ui/DatePicker';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Checkbox } from '../../ui/Checkbox';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { LocationMap } from '../properties/AddPropertyForm/LocationMap';
import { saveDraft, getDraft, deleteDraft } from '../../../services/clientDraftStorage';
import { uploadFiles } from '../../../services/uploadService';
import { CompletionRing } from '../../ui/CompletionRing';
import { api } from '../../../services/api';
import { fetchContacts, createContact } from '../../../services/contactService';
import { ContactFormModal } from '../contacts/ContactFormModal';

const GERANT_BUTTON_CLASSES = 'bg-[#905D5D] hover:bg-[#7D5050] border-[#905D5D] hover:border-[#7D5050] text-white shadow-[0_10px_24px_rgba(144,93,93,0.35)]'

interface AssignmentInfo {
  assignedType: 'agent' | 'admin';
  assignedName: string;
}

interface VoyageurFormModalProps {
  onClose: () => void;
  onSubmit: (client: Omit<Client, 'id'>) => void;
  assignmentInfo?: AssignmentInfo;
  draftId?: string;
  userId?: string;
  onDraftChange?: () => void;
  client?: Client;
  selectedContactId?: string;
  isGerant?: boolean;
}

const STATUT_METIER_OPTIONS = [
  { value: 'En recherche', label: 'En recherche' },
  { value: 'Reservation en cours', label: 'R\u00e9servation en cours' },
  { value: 'Confirme', label: 'Confirm\u00e9' },
  { value: 'Paye', label: 'Pay\u00e9' },
  { value: 'En sejour', label: 'En s\u00e9jour' },
  { value: 'Termine', label: 'Termin\u00e9' },
  { value: 'Annule', label: 'Annul\u00e9' },
  { value: 'Inactif', label: 'Inactif' },
];

const CLASSIFICATION_OPTIONS = [
  { value: 'Tres actif', label: 'Très actif' },
  { value: 'Actif', label: 'Actif' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Peu actif', label: 'Peu actif' },
  { value: 'Tres peu actif', label: 'Très peu actif' },
];

const ORIGINE_OPTIONS = [
  { value: 'Site web', label: 'Site web' },
  { value: 'Portail', label: 'Portail' },
  { value: 'Reference', label: 'Référence' },
  { value: 'Appel telephonique', label: 'Appel téléphonique' },
  { value: 'Reseaux sociaux', label: 'Réseaux sociaux' },
  { value: 'Visite agence', label: 'Visite agence' },
  { value: 'Publicite', label: 'Publicité' },
  { value: 'Airbnb', label: 'Airbnb / Booking' },
  { value: 'Autre', label: 'Autre' },
];

const LOCALISATION_OPTIONS = [
  { value: 'Maroc', label: 'Maroc' },
  { value: 'France', label: 'France' },
  { value: 'Belgique', label: 'Belgique' },
  { value: 'Suisse', label: 'Suisse' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Espagne', label: 'Espagne' },
  { value: 'Italie', label: 'Italie' },
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Tunisie', label: 'Tunisie' },
  { value: 'Algerie', label: 'Algérie' },
  { value: 'Emirats Arabes Unis', label: 'Émirats Arabes Unis' },
  { value: 'Autre', label: 'Autre' },
];

const SECTEUR_OPTIONS = [
  { value: 'Argana', label: 'Argana' },
  { value: 'Azlef', label: 'Azlef' },
  { value: 'Douar Laraab', label: 'Douar Laraab' },
  { value: 'Erraounak', label: 'Erraounak' },
  { value: 'Ghazoua', label: 'Ghazoua' },
  { value: 'Medina', label: 'Medina' },
  { value: 'Sidi Magdoul', label: 'Sidi Magdoul' },
];

const TYPE_BIEN_OPTIONS = [
  { value: 'Appartement', label: 'Appartement' },
  { value: 'Maison', label: 'Maison' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Riad', label: 'Riad' },
  { value: 'Studio', label: 'Studio' },
  { value: 'Loft', label: 'Loft' },
];

const OPERATORS = [
  { value: 'le', label: '≤' },
  { value: 'ge', label: '≥' },
  { value: 'eq', label: '=' },
];

const CURRENCIES = [
  { value: 'MAD', label: 'MAD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CHF', label: 'CHF' },
];

const VUE_OPTIONS = [
  { value: 'Apercu', label: 'Aperçu' },
  { value: 'Degagee', label: 'Dégagée' },
  { value: 'Externe', label: 'Externe' },
  { value: 'Interne', label: 'Interne' },
  { value: 'Panoramique', label: 'Panoramique' },
  { value: 'Vis-a-vis', label: 'Vis-à-vis' },
  { value: 'Mer', label: 'Mer' },
  { value: 'Montagne', label: 'Montagne' },
  { value: 'Jardin', label: 'Jardin' },
  { value: 'Piscine', label: 'Piscine' },
];

const EXPOSITION_OPTIONS = [
  { value: 'Nord', label: 'Nord' },
  { value: 'Sud', label: 'Sud' },
  { value: 'Est', label: 'Est' },
  { value: 'Ouest', label: 'Ouest' },
  { value: 'Nord-Est', label: 'Nord-Est' },
  { value: 'Nord-Ouest', label: 'Nord-Ouest' },
  { value: 'Sud-Est', label: 'Sud-Est' },
  { value: 'Sud-Ouest', label: 'Sud-Ouest' },
];

const ETAT_OPTIONS = [
  { value: 'Neuf', label: 'Neuf' },
  { value: 'Tres bon', label: 'Très bon' },
  { value: 'Bon', label: 'Bon' },
  { value: 'A renover', label: 'À rénover' },
  { value: 'Ancien', label: 'Ancien' },
];

const STANDING_OPTIONS = [
  { value: 'Economique', label: 'Économique' },
  { value: 'Moyen', label: 'Moyen' },
  { value: 'Luxe', label: 'Luxe' },
  { value: 'Tres haut standing', label: 'Très haut standing' },
];

const FLEXIBILITE_OPTIONS = [
  { value: 'Pas flexible', label: 'Pas flexible' },
  { value: 'Flexible 1 jour', label: 'Flexible (+/- 1 jour)' },
  { value: 'Flexible 3 jours', label: 'Flexible (+/- 3 jours)' },
  { value: 'Flexible 7 jours', label: 'Flexible (+/- 1 semaine)' },
];

const ATTRIBUTS_PRINCIPAUX = [
  { value: 'Sejour romantique', label: 'Séjour romantique' },
  { value: 'Vacances en famille', label: 'Vacances en famille' },
  { value: 'Sejour entre amis', label: 'Séjour entre amis' },
  { value: 'Voyage d affaires', label: "Voyage d'affaires" },
  { value: 'Teletravail Workation', label: 'Télétravail / Workation' },
];

const ATTRIBUTS_PERSONNALISES = [
  { value: 'Piscine', label: 'Piscine' },
  { value: 'Climatisation', label: 'Climatisation' },
  { value: 'Wifi haut debit', label: 'Wifi haut débit' },
  { value: 'Parking', label: 'Parking' },
  { value: 'Jacuzzi Spa', label: 'Jacuzzi / Spa' },
  { value: 'Barbecue', label: 'Barbecue' },
  { value: 'Vue mer', label: 'Vue mer' },
  { value: 'Proche plage', label: 'Proche plage' },
  { value: 'Jardin', label: 'Jardin' },
  { value: 'Terrasse', label: 'Terrasse' },
  { value: 'Animaux acceptes', label: 'Animaux acceptés' },
  { value: 'Adapte enfants', label: 'Adapté enfants' },
  { value: 'Accessibilite PMR', label: 'Accessibilité PMR' },
  { value: 'Menage inclus', label: 'Ménage inclus' },
  { value: 'Linge fourni', label: 'Linge de maison fourni' },
  { value: 'Equipement bebe', label: 'Équipement bébé (lit, chaise haute)' },
];

const CRITERES_BASE = [
  { value: 'Garage', label: 'Garage / Parking' },
  { value: 'Balcon', label: 'Balcon / Terrasse' },
  { value: 'Jardin', label: 'Jardin' },
  { value: 'Piscine privee', label: 'Piscine privée' },
  { value: 'Piscine partagee', label: 'Piscine partagée' },
  { value: 'Air conditionne', label: 'Air conditionné' },
  { value: 'Chauffage', label: 'Chauffage' },
  { value: 'Cheminee', label: 'Cheminée' },
];

const PROXIMITES_TRANSPORTS = [
  { value: 'Aeroport', label: 'Aéroport' },
  { value: 'Gare', label: 'Gare' },
  { value: 'Autoroute', label: 'Autoroute' },
  { value: 'Bus', label: 'Bus' },
  { value: 'Taxi', label: 'Taxi' },
  { value: 'Port', label: 'Port' },
];

const PROXIMITES_COMMERCES = [
  { value: 'Restaurants', label: 'Restaurants' },
  { value: 'Supermarché', label: 'Supermarché' },
  { value: 'Commerces', label: 'Commerces' },
  { value: 'Centre ville', label: 'Centre ville' },
];

const PROXIMITES_EDUCATION = [
  { value: 'Creche', label: 'Crèche' },
  { value: 'Ecole primaire', label: 'Ecole primaire' },
  { value: 'Ecole secondaire', label: 'Ecole secondaire' },
];

const PROXIMITES_SANTE = [
  { value: 'Pharmacie', label: 'Pharmacie' },
  { value: 'Medecin', label: 'Médecin' },
  { value: 'Hopital / Clinique', label: 'Hôpital / Clinique' },
  { value: 'Salle de sport', label: 'Salle de sport' },
  { value: 'Golf', label: 'Golf' },
  { value: 'Tennis', label: 'Tennis' },
];

const PROXIMITES_LOISIRS = [
  { value: 'Mer', label: 'Mer' },
  { value: 'Plage', label: 'Plage' },
  { value: 'Parc', label: 'Parc' },
  { value: 'Golf', label: 'Golf' },
  { value: 'Cinema', label: 'Cinéma' },
  { value: 'Piscine publique', label: 'Piscine publique' },
];

const PRESTATIONS_EQUIPEMENTS_BASE = [
  { value: 'Wifi haut debit', label: 'Wifi haut débit' },
  { value: 'Television', label: 'Télévision' },
  { value: 'Climatisation', label: 'Climatisation' },
  { value: 'Chauffage', label: 'Chauffage' },
  { value: 'Lave-linge', label: 'Lave-linge' },
  { value: 'Seche-linge', label: 'Sèche-linge' },
  { value: 'Fer a repasser', label: 'Fer à repasser' },
  { value: 'Seche-cheveux', label: 'Sèche-cheveux' },
  { value: 'Cintres', label: 'Cintres' },
];

const PRESTATIONS_CUISINE = [
  { value: 'Refrigerateur', label: 'Réfrigérateur' },
  { value: 'Congelateur', label: 'Congélateur' },
  { value: 'Micro-ondes', label: 'Micro-ondes' },
  { value: 'Four', label: 'Four' },
  { value: 'Plaque cuisson', label: 'Plaque de cuisson' },
  { value: 'Cafetiere', label: 'Cafetière' },
  { value: 'Bouilloire', label: 'Bouilloire' },
  { value: 'Grille-pain', label: 'Grille-pain' },
  { value: 'Lave-vaisselle', label: 'Lave-vaisselle' },
  { value: 'Ustensiles cuisine', label: 'Ustensiles de cuisine' },
  { value: 'Produits entretien', label: "Produits d'entretien" },
];

const PRESTATIONS_CHAMBRES = [
  { value: 'Draps fournis', label: 'Draps et linge de lit fournis' },
  { value: 'Serviettes bain', label: 'Serviettes de bain fournies' },
  { value: 'Serviettes plage', label: 'Serviettes de plage' },
  { value: 'Equipement bebe', label: "Équipement bébé (lit, chaise)" },
  { value: 'Bureau teletravail', label: 'Bureau / Espace télétravail' },
  { value: 'Coffre-fort', label: 'Coffre-fort' },
];

const PRESTATIONS_DIVERTISSEMENT = [
  { value: 'Smart TV', label: 'Smart TV / Connectée' },
  { value: 'Netflix', label: 'Netflix / Streaming' },
  { value: 'Chaines internationales', label: 'Chaînes internationales' },
  { value: 'Enceinte Bluetooth', label: 'Enceinte Bluetooth' },
  { value: 'Livres magazines', label: 'Livres / Magazines' },
  { value: 'Jeux societe', label: 'Jeux de société' },
];

const PRESTATIONS_EXTERIEUR = [
  { value: 'Piscine privee', label: 'Piscine privée' },
  { value: 'Piscine partagee', label: 'Piscine partagée' },
  { value: 'Jardin', label: 'Jardin' },
  { value: 'Terrasse', label: 'Terrasse' },
  { value: 'Salon jardin', label: 'Salon de jardin' },
  { value: 'Transats', label: 'Transats' },
  { value: 'Barbecue', label: 'Barbecue' },
  { value: 'Parking prive', label: 'Parking privé' },
  { value: 'Parking gratuit', label: 'Parking gratuit' },
  { value: 'Local velos', label: 'Local à vélos' },
];

const PRESTATIONS_SERVICES = [
  { value: 'Menage inclus', label: 'Ménage inclus' },
  { value: 'Menage option', label: 'Option ménage en supplément' },
  { value: 'Petit-dejeuner inclus', label: 'Petit-déjeuner inclus' },
  { value: 'Petit-dejeuner option', label: 'Option petit-déjeuner' },
  { value: 'Conciergerie', label: 'Service de conciergerie' },
  { value: 'Transfert aeroport', label: 'Transfert aéroport' },
  { value: 'Location voiture', label: 'Location de voiture' },
  { value: 'Excursions', label: 'Excursions / Activités' },
  { value: 'Garde enfants', label: "Garde d'enfants" },
  { value: 'Acces plage privee', label: 'Accès piscine / plage privée' },
];

const PAIEMENT_MODE_OPTIONS = [
  { value: 'Carte bancaire', label: 'Carte bancaire' },
  { value: 'Virement', label: 'Virement' },
  { value: 'Especes', label: 'Espèces (à l\'arrivée)' },
];

const STATUT_RESERVATION_OPTIONS = [
  { value: 'Brouillon', label: 'Brouillon' },
  { value: 'En attente', label: 'En attente' },
  { value: 'Confirmee', label: 'Confirmée' },
  { value: 'Payee', label: 'Payée' },
  { value: 'Occupe', label: 'Occupé' },
  { value: 'Expire', label: 'Expiré' },
  { value: 'Termine', label: 'Terminé' },
  { value: 'Annulee', label: 'Annulée' },
];

const CONDITIONS_ANNULATION_OPTIONS = [
  { value: 'Flexible', label: 'Flexible' },
  { value: 'Moderee', label: 'Modérée' },
  { value: 'Strict', label: 'Strict' },
];

const LANGUES_OPTIONS = [
  { value: 'Francais', label: 'Français' },
  { value: 'Anglais', label: 'Anglais' },
  { value: 'Arabe', label: 'Arabe' },
  { value: 'Espagnol', label: 'Espagnol' },
  { value: 'Allemand', label: 'Allemand' },
  { value: 'Italien', label: 'Italien' },
  { value: 'Neerlandais', label: 'Néerlandais' },
  { value: 'Russe', label: 'Russe' },
  { value: 'Chinois', label: 'Chinois' },
];

const AGENTS = [
  { value: 'agent-1', label: 'Agent 1' },
  { value: 'agent-2', label: 'Agent 2' },
  { value: 'agent-3', label: 'Agent 3' },
];

interface ProximiteCategorie {
  transports: string[];
  commerces: string[];
  education: string[];
  sante: string[];
  loisirs: string[];
}

interface PrestationVoyageur {
  equipementsBase: string[];
  cuisine: string[];
  chambres: string[];
  divertissement: string[];
  exterieur: string[];
  services: string[];
}

interface VoyageurFormData {
  actif: boolean;
  croisementAutomatique: boolean;
  classification: string;
  statutMetier: string;
  contactId: string;
  origine: string;
  plan: string;
  localisation: string;
  secteur: string;
  adresseComplete: string;
  complementAdresse: string;
  codePostalVille: string;
  pays: string;
  typeBien: string;
  piecesOperator: string;
  pieces: number | undefined;
  chambresOperator: string;
  chambres: number | undefined;
  surfaceMin: number | undefined;
  surfaceMax: number | undefined;
  couchagesMax: number | undefined;
  devise: string;
  budgetNuitMin: number | undefined;
  budgetNuitMax: number | undefined;
  budgetTotal: number | undefined;
  dateArrivee: string;
  dateDepart: string;
  nbNuits: number;
  nbAdultes: number | undefined;
  nbEnfants: number | undefined;
  flexibilite: string;
  vue: string;
  exposition: string;
  etat: string;
  standing: string;
  attributPrincipal: string;
  attributsPersonnalises: string[];
  criteres: string[];
  proximites: ProximiteCategorie;
  prestations: PrestationVoyageur;
  nbVoyageurs: number | undefined;
  nbEnfantsSejour: number | undefined;
  animaux: boolean;
  animauxEspeces: string;
  regimeAlimentaire: string;
  languesParlees: string[];
  modePaiement: string;
  acompteMontant: number | undefined;
  acompteDate: string;
  soldeRestant: number | undefined;
  dateLimiteSolde: string;
  cautionMontant: number | undefined;
  cautionMode: string;
  demandesSpeciales: string;
  arriveeHeure: string;
  arriveeTransport: string;
  notesInternes: string;
  numeroReservation: string;
  statutReservation: string;
  dateReservation: string;
  bienReserve: string;
  tarifNuit: number | undefined;
  tarifNuitMin: number | undefined;
  tarifNuitMax: number | undefined;
  montantTotalHorsOptions: number | undefined;
  optionsSelectionnees: string[];
  montantTotalAvecOptions: number | undefined;
  reservationOptions?: { name: string; price: number; qty: number; total: number }[];
  conditionAnnulation: string;
  checkInHeure: string;
  checkOutHeure: string;
  animauxAcceptes: boolean;
  fumeur: boolean;
  contratPdfUrl: string;
  docIdentiteUrl: string;
  docIdentiteName: string;
  docDomicileUrl: string;
  docDomicileName: string;
  docPaiementUrl: string;
  docPaiementName: string;
  agentDesigne: string;
  latitude: number;
  longitude: number;
  assuranceAnnulation: boolean;
  assuranceAnnulationMontant: number | undefined;
  assuranceMultirisque: boolean;
  assuranceMultirisqueMontant: number | undefined;
  dateLimiteAnnulation: string;
  penaliteAnnulation: number | undefined;
  edlEntree: string;
  edlSortie: string;
  reglementInterieur: boolean;
  rgpdConsent: boolean;
  contratNotes: string;
  guideCheckin: { texte: string }[];
  checklistDepart: { texte: string; obligatoire: boolean }[];
  checklistDepartMessage: string;
  checklistDepartWhatsapp: string;
  cartePrivilegeActif: boolean;
  cartePrivilegePartenaires: { categorie: string; remise: string; nom: string; description: string; lien: string }[];
  conciergerieActif: boolean;
  conciergerieWhatsapp: string;
  conciergerieActivites: { titre: string; duree: string; prix: string; description: string; disponibilite: string; image: string }[];
  assistanceWhatsapp: string;
  assistanceTelephone: string;
  assistanceEmail: string;
  assistanceMessage: string;
}

const TABS = [
  { id: 1, label: 'Général' },
  { id: 2, label: 'Localisation & Type' },
  { id: 3, label: 'Caractéristiques' },
  { id: 4, label: 'Attributs & Critères' },
  { id: 5, label: 'Proximités' },
  { id: 6, label: 'Prestations' },
  { id: 7, label: 'Paiement & Séjour' },
  { id: 8, label: 'Contrat' },
];

const generateReservationNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `RES-${year}-${random}`;
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const formatDate = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

const today = formatDate(new Date());

export function resetVoyageurFormData(): VoyageurFormData {
  return {
    actif: true,
    croisementAutomatique: true,
    classification: 'Actif',
    statutMetier: 'En recherche',
    contactId: '',
    origine: '',
    plan: '',
    localisation: 'Maroc',
    secteur: '',
    adresseComplete: '',
    complementAdresse: '',
    codePostalVille: '',
    pays: 'Maroc',
    typeBien: '',
    piecesOperator: 'ge',
    pieces: undefined,
    chambresOperator: 'ge',
    chambres: undefined,
    surfaceMin: undefined,
    surfaceMax: undefined,
    couchagesMax: undefined,
    devise: 'MAD',
    budgetNuitMin: undefined,
    budgetNuitMax: undefined,
    budgetTotal: undefined,
    dateArrivee: '',
    dateDepart: '',
    nbNuits: 0,
    nbAdultes: undefined,
    nbEnfants: undefined,
    flexibilite: '',
    vue: '',
    exposition: '',
    etat: '',
    standing: '',
    attributPrincipal: '',
    attributsPersonnalises: [],
    criteres: [],
    proximites: { transports: [], commerces: [], education: [], sante: [], loisirs: [] },
    prestations: { equipementsBase: [], cuisine: [], chambres: [], divertissement: [], exterieur: [], services: [] },
    nbVoyageurs: undefined,
    nbEnfantsSejour: undefined,
    animaux: false,
    animauxEspeces: '',
    regimeAlimentaire: '',
    languesParlees: [],
    modePaiement: '',
    acompteMontant: undefined,
    acompteDate: '',
    soldeRestant: undefined,
    dateLimiteSolde: '',
    cautionMontant: undefined,
    cautionMode: '',
    demandesSpeciales: '',
    arriveeHeure: '',
    arriveeTransport: '',
    notesInternes: '',
    numeroReservation: generateReservationNumber(),
    statutReservation: 'Brouillon',
    dateReservation: formatDate(new Date()),
    bienReserve: '',
    tarifNuit: undefined,
    tarifNuitMin: undefined,
    tarifNuitMax: undefined,
    montantTotalHorsOptions: undefined,
    optionsSelectionnees: [],
    montantTotalAvecOptions: undefined,
    reservationOptions: undefined,
    conditionAnnulation: 'Moderee',
    checkInHeure: '15h00 - 20h00',
    checkOutHeure: '11h00',
    animauxAcceptes: false,
    fumeur: false,
    contratPdfUrl: '',
    docIdentiteUrl: '',
    docIdentiteName: '',
    docDomicileUrl: '',
    docDomicileName: '',
    docPaiementUrl: '',
    docPaiementName: '',
    agentDesigne: '',
    latitude: 0,
    longitude: 0,
    assuranceAnnulation: false,
    assuranceAnnulationMontant: undefined,
    assuranceMultirisque: false,
    assuranceMultirisqueMontant: undefined,
    dateLimiteAnnulation: '',
    penaliteAnnulation: undefined,
    edlEntree: '',
    edlSortie: '',
    reglementInterieur: false,
    rgpdConsent: false,
    contratNotes: '',
    guideCheckin: [],
    checklistDepart: [],
    checklistDepartMessage: '',
    checklistDepartWhatsapp: '',
    cartePrivilegeActif: false,
    cartePrivilegePartenaires: [],
    conciergerieActif: false,
    conciergerieWhatsapp: '',
    conciergerieActivites: [],
    assistanceWhatsapp: '',
    assistanceTelephone: '',
    assistanceEmail: '',
    assistanceMessage: '',
  };
}

export const VoyageurFormModal = ({ onClose, onSubmit, assignmentInfo, draftId: initialDraftId, userId, onDraftChange, client: editingClient, selectedContactId, isGerant = false }: VoyageurFormModalProps) => {
  const [step, setStep] = useState(1);
  const [contactOptions, setContactOptions] = useState<{value: string; label: string}[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [formData, setFormData] = useState<VoyageurFormData>({
    actif: true,
    croisementAutomatique: true,
    classification: 'Actif',
    statutMetier: 'En recherche',
    contactId: selectedContactId || '',
    origine: '',
    plan: '',
    localisation: 'Maroc',
    secteur: '',
    adresseComplete: '',
    complementAdresse: '',
    codePostalVille: '',
    pays: 'Maroc',
    typeBien: '',
    piecesOperator: 'ge',
    pieces: undefined,
    chambresOperator: 'ge',
    chambres: undefined,
    surfaceMin: undefined,
    surfaceMax: undefined,
    couchagesMax: undefined,
    devise: 'MAD',
    budgetNuitMin: undefined,
    budgetNuitMax: undefined,
    budgetTotal: undefined,
    dateArrivee: '',
    dateDepart: '',
    nbNuits: 0,
    nbAdultes: undefined,
    nbEnfants: undefined,
    flexibilite: '',
    vue: '',
    exposition: '',
    etat: '',
    standing: '',
    attributPrincipal: '',
    attributsPersonnalises: [],
    criteres: [],
    proximites: { transports: [], commerces: [], education: [], sante: [], loisirs: [] },
    prestations: { equipementsBase: [], cuisine: [], chambres: [], divertissement: [], exterieur: [], services: [] },
    nbVoyageurs: undefined,
    nbEnfantsSejour: undefined,
    animaux: false,
    animauxEspeces: '',
    regimeAlimentaire: '',
    languesParlees: [],
    modePaiement: '',
    acompteMontant: undefined,
    acompteDate: '',
    soldeRestant: undefined,
    dateLimiteSolde: '',
    cautionMontant: undefined,
    cautionMode: '',
    demandesSpeciales: '',
    arriveeHeure: '',
    arriveeTransport: '',
    notesInternes: '',
    numeroReservation: generateReservationNumber(),
    statutReservation: 'Brouillon',
    dateReservation: today,
    bienReserve: '',
    tarifNuit: undefined,
    tarifNuitMin: undefined,
    tarifNuitMax: undefined,
    montantTotalHorsOptions: undefined,
    optionsSelectionnees: [],
    montantTotalAvecOptions: undefined,
    reservationOptions: undefined,
    conditionAnnulation: 'Moderee',
    checkInHeure: '15h00 - 20h00',
    checkOutHeure: '11h00',
    animauxAcceptes: false,
    fumeur: false,
    contratPdfUrl: '',
    docIdentiteUrl: '',
    docIdentiteName: '',
    docDomicileUrl: '',
    docDomicileName: '',
    docPaiementUrl: '',
    docPaiementName: '',
    agentDesigne: '',
    latitude: 0,
    longitude: 0,
    assuranceAnnulation: false,
    assuranceAnnulationMontant: undefined,
    assuranceMultirisque: false,
    assuranceMultirisqueMontant: undefined,
    dateLimiteAnnulation: '',
    penaliteAnnulation: undefined,
    edlEntree: '',
    edlSortie: '',
    reglementInterieur: false,
    rgpdConsent: false,
    contratNotes: '',
    guideCheckin: [],
    checklistDepart: [],
    checklistDepartMessage: '',
    checklistDepartWhatsapp: '',
    cartePrivilegeActif: false,
    cartePrivilegePartenaires: [],
    conciergerieActif: false,
    conciergerieWhatsapp: '',
    conciergerieActivites: [],
    assistanceWhatsapp: '',
    assistanceTelephone: '',
    assistanceEmail: '',
    assistanceMessage: '',
  });

  useEffect(() => {
    fetchContacts().then(allContacts => {
      setContacts(allContacts);
      setContactOptions([
        { value: '', label: 'Sélectionner un contact...' },
        ...allContacts.map(c => ({ value: String(c.id), label: `${c.civility} ${c.firstName} ${c.lastName}` })),
      ]);
    }).catch(() => {});
  }, []);

  const refreshContacts = () => {
    fetchContacts().then(allContacts => {
      setContacts(allContacts);
      setContactOptions([
        { value: '', label: 'Sélectionner un contact...' },
        ...allContacts.map(c => ({ value: String(c.id), label: `${c.civility} ${c.firstName} ${c.lastName}` })),
      ]);
    }).catch(() => {});
  };

  const selectedContactName = formData.contactId ? (
    contactOptions.find(o => o.value === formData.contactId)?.label ||
    (() => { const c = contacts.find(ct => String(ct.id) === formData.contactId); return c ? `${c.civility || ''} ${c.firstName || ''} ${c.lastName || ''}`.trim() : ''; })()
  ) : '';

  const [propertySearchQuery, setPropertySearchQuery] = useState('');
  const [propertySearchResults, setPropertySearchResults] = useState<any[]>([]);
  const [propertySearching, setPropertySearching] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  useEffect(() => {
    if (propertySearchQuery.length < 2) {
      setPropertySearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setPropertySearching(true);
      try {
        const results = await api.get<any[]>('/properties', { type: 'vacation', search: propertySearchQuery });
        const filtered = Array.isArray(results) ? results.filter((p: any) => p.status === 'available') : [];
        setPropertySearchResults(filtered);
      } catch {
        setPropertySearchResults([]);
      } finally {
        setPropertySearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [propertySearchQuery]);

  useEffect(() => {
    if (!selectedProperty) return;
    if (editingClient) return;
    const pMin = selectedProperty.priceMin || selectedProperty.price || 0;
    const pMax = selectedProperty.priceMax || selectedProperty.price || 0;
    const nbN = formData.nbNuits || 0;
    const tarifMin = pMin;
    const tarifMax = pMax;
    const budgetTotalMin = nbN > 0 ? tarifMin * nbN : 0;
    setFormData(prev => ({
      ...prev,
      tarifNuit: tarifMin,
      tarifNuitMin: tarifMin,
      tarifNuitMax: tarifMax,
      montantTotalHorsOptions: nbN > 0 ? budgetTotalMin : undefined,
    }));
  }, [selectedProperty?.id]);

  useEffect(() => {
    if (serverDataLoadedRef.current) {
      serverDataLoadedRef.current = false;
      return;
    }
    const nbN = formData.nbNuits || 0;
    const tarif = formData.tarifNuit || 0;
    const tarifMin = formData.tarifNuitMin || tarif;
    if (!formData.bienReserve) return;
    const montantHors = tarifMin * nbN;
    let montantAvec: number;
    if (formData.reservationOptions && formData.reservationOptions.length > 0) {
      const optionsTotal = formData.reservationOptions.reduce((sum, o) => sum + (o.total || o.price * o.qty), 0);
      montantAvec = montantHors + optionsTotal;
    } else {
      const optionsTotal = formData.optionsSelectionnees.reduce((sum, opt) => {
        if (opt === 'Menage') return sum + 200;
        if (opt === 'Petit-dejeuner') return sum + 50 * (formData.nbAdultes || 2) * nbN;
        if (opt === 'Transfert') return sum + 300;
        if (opt === 'Location voiture') return sum + 400 * nbN;
        return sum;
      }, 0);
      montantAvec = montantHors + optionsTotal;
    }
    const solde = (formData.acompteMontant || 0) > 0 ? montantAvec - (formData.acompteMontant || 0) : undefined;
    setFormData(prev => ({
      ...prev,
      montantTotalHorsOptions: nbN > 0 ? montantHors : undefined,
      montantTotalAvecOptions: nbN > 0 ? montantAvec : undefined,
      soldeRestant: solde !== undefined && solde >= 0 ? solde : prev.soldeRestant,
    }));
  }, [formData.tarifNuit, formData.nbNuits, formData.optionsSelectionnees, formData.acompteMontant, formData.bienReserve, formData.reservationOptions]);

  useEffect(() => {
    if (!editingClient) return;
    const c = editingClient as any;
    setFormData(prev => ({
      ...prev,
      actif: editingClient.status === 'Actif',
      croisementAutomatique: editingClient.croisementAutomatique ?? true,
      classification: editingClient.classification || 'Actif',
      statutMetier: editingClient.statutMetier || 'En recherche',
      contactId: editingClient.contactId || '',
      origine: editingClient.source || '',
      secteur: editingClient.secteur || editingClient.area || '',
      typeBien: editingClient.propertyType || '',
      piecesOperator: editingClient.piecesOperator || 'ge',
      pieces: editingClient.pieces,
      chambresOperator: editingClient.chambresOperator || 'ge',
      chambres: editingClient.chambres,
      surfaceMin: editingClient.minSurface,
      surfaceMax: editingClient.surfaceMax,
      budgetNuitMin: (editingClient as any).budgetNuitMin || editingClient.budgetParNuitMin || editingClient.prixMin,
      budgetNuitMax: (editingClient as any).budgetNuitMax || editingClient.budgetParNuitMax || editingClient.prixMax,
      devise: editingClient.devise || 'MAD',
      dateArrivee: editingClient.dateArrivee || '',
      dateDepart: editingClient.dateDepart || '',
      nbNuits: editingClient.nbNuits || 0,
      nbAdultes: editingClient.nbAdultes,
      nbEnfants: editingClient.nbEnfants,
      flexibilite: editingClient.flexibiliteDates || '',
      vue: editingClient.vue || '',
      exposition: editingClient.exposition || '',
      etat: editingClient.etat || '',
      standing: editingClient.standing || '',
      attributPrincipal: editingClient.attributPrincipal || '',
      attributsPersonnalises: editingClient.attributsPersonnalises || [],
      criteres: editingClient.criteres || [],
      proximites: editingClient.proximites || { transports: [], commerces: [], education: [], sante: [], loisirs: [] },
      prestations: c.prestations ? {
        equipementsBase: c.prestations.equipementsBase || c.prestations.confort || [],
        cuisine: c.prestations.cuisine || c.prestations.electromenager || [],
        chambres: c.prestations.chambres || [],
        divertissement: c.prestations.divertissement || c.prestations.multimedia || [],
        exterieur: c.prestations.exterieur || [],
        services: c.prestations.services || [],
      } : prev.prestations,
      modePaiement: editingClient.modePaiement || '',
      acompteMontant: editingClient.acompteVersee,
      cautionMontant: editingClient.caution,
      conditionAnnulation: editingClient.conditionsAnnulation || 'Moderee',
      couchagesMax: editingClient.nbPersonnes,
      notesInternes: editingClient.notes || '',
      localisation: editingClient.localisation || '',
      adresseComplete: (editingClient as any).adresseComplete || '',
      complementAdresse: (editingClient as any).complementAdresse || '',
      codePostalVille: (editingClient as any).codePostalVille || '',
      pays: (editingClient as any).pays || 'Maroc',
      numeroReservation: editingClient.numeroMandat || prev.numeroReservation,
      dateReservation: editingClient.dateSignature || prev.dateReservation,
      latitude: c.latitude || 0,
      longitude: c.longitude || 0,
      nbVoyageurs: editingClient.nbVoyageurs,
      nbEnfantsSejour: editingClient.nbEnfantsSejour,
      animaux: editingClient.animaux || false,
      animauxEspeces: editingClient.animauxEspeces || '',
      regimeAlimentaire: editingClient.regimeAlimentaire || '',
      languesParlees: editingClient.languesParlees || [],
      acompteDate: editingClient.acompteDate || '',
      soldeRestant: editingClient.soldeRestant,
      dateLimiteSolde: editingClient.dateLimiteSolde || '',
      cautionMode: editingClient.cautionMode || '',
      demandesSpeciales: editingClient.demandesSpeciales || '',
      arriveeHeure: editingClient.arriveeHeure || '',
      arriveeTransport: editingClient.arriveeTransport || '',
      bienReserve: editingClient.bienReserve || '',
      tarifNuit: editingClient.tarifNuit,
      tarifNuitMin: (editingClient as any).tarifNuitMin,
      tarifNuitMax: (editingClient as any).tarifNuitMax,
      budgetTotal: editingClient.budgetTotal,
      montantTotalHorsOptions: editingClient.montantTotalHorsOptions,
      optionsSelectionnees: editingClient.optionsSelectionnees || [],
      montantTotalAvecOptions: editingClient.montantTotalAvecOptions,
      reservationOptions: (editingClient as any).reservationOptions || undefined,
      checkInHeure: editingClient.checkInHeure || '',
      checkOutHeure: editingClient.checkOutHeure || '',
      animauxAcceptes: editingClient.animauxAcceptes || false,
      fumeur: editingClient.fumeur || false,
      contratPdfUrl: editingClient.mandatPdfUrl || editingClient.contratPdfUrl || '',
      statutReservation: editingClient.statutReservation || editingClient.statutMandat || 'Brouillon',
      docIdentiteUrl: editingClient.docIdentiteUrl || '',
      docIdentiteName: editingClient.docIdentiteName || '',
      docDomicileUrl: editingClient.docDomicileUrl || '',
      docDomicileName: editingClient.docDomicileName || '',
      docPaiementUrl: editingClient.docRevenusUrl || '',
      docPaiementName: editingClient.docRevenusName || '',
      agentDesigne: editingClient.agentDesigne || '',
      assuranceAnnulation: (editingClient as any).assuranceAnnulation || false,
      assuranceAnnulationMontant: (editingClient as any).assuranceAnnulationMontant,
      assuranceMultirisque: (editingClient as any).assuranceMultirisque || false,
      assuranceMultirisqueMontant: (editingClient as any).assuranceMultirisqueMontant,
      dateLimiteAnnulation: (editingClient as any).dateLimiteAnnulation || '',
      penaliteAnnulation: (editingClient as any).penaliteAnnulation,
      edlEntree: (editingClient as any).edlEntree || '',
      edlSortie: (editingClient as any).edlSortie || '',
      reglementInterieur: (editingClient as any).reglementInterieur || false,
      rgpdConsent: (editingClient as any).rgpdConsent || false,
      contratNotes: (editingClient as any).contratNotes || '',
      guideCheckin: (editingClient as any).guideCheckin || [],
      checklistDepart: (editingClient as any).checklistDepart || [],
      checklistDepartMessage: (editingClient as any).checklistDepartMessage || '',
      checklistDepartWhatsapp: (editingClient as any).checklistDepartWhatsapp || '',
      cartePrivilegeActif: (editingClient as any).cartePrivilegeActif || false,
      cartePrivilegePartenaires: (editingClient as any).cartePrivilegePartenaires || [],
      conciergerieActif: (editingClient as any).conciergerieActif || false,
      conciergerieWhatsapp: (editingClient as any).conciergerieWhatsapp || '',
      conciergerieActivites: (editingClient as any).conciergerieActivites || [],
      assistanceWhatsapp: (editingClient as any).assistanceWhatsapp || '',
      assistanceTelephone: (editingClient as any).assistanceTelephone || '',
      assistanceEmail: (editingClient as any).assistanceEmail || '',
      assistanceMessage: (editingClient as any).assistanceMessage || '',
    }));
    serverDataLoadedRef.current = true;
  }, [editingClient]);

  useEffect(() => {
    if (editingClient?.bienReserve) {
      api.get<any>(`/properties/${editingClient.bienReserve}`).then((p) => {
        if (p) setSelectedProperty(p);
      }).catch(() => {});
    }
  }, [editingClient]);

  useEffect(() => {
    if (assignmentInfo?.assignedName && !editingClient) {
      setFormData(prev => ({ ...prev, agentDesigne: assignmentInfo.assignedName }));
    }
  }, [assignmentInfo, editingClient]);

  const [errors, setErrors] = useState<Partial<Record<keyof VoyageurFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | undefined>(initialDraftId || undefined);
  const [loadingDraft, setLoadingDraft] = useState(!!initialDraftId);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const serverDataLoadedRef = useRef(false);

  const handleChange = (field: keyof VoyageurFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Date → nbNuits
      if (field === 'dateArrivee' || field === 'dateDepart') {
        const arrivee = field === 'dateArrivee' ? value : prev.dateArrivee;
        const depart = field === 'dateDepart' ? value : prev.dateDepart;
        if (arrivee && depart) {
          const diff = Math.round((new Date(depart).getTime() - new Date(arrivee).getTime()) / (1000 * 60 * 60 * 24));
          updated.nbNuits = Math.max(0, diff);
        }
      }

      // Sync Caractéristiques → Paiement & Séjour
      if (field === 'nbAdultes') updated.nbVoyageurs = value;
      if (field === 'nbEnfants') updated.nbEnfantsSejour = value;
      if (field === 'animaux') updated.animauxAcceptes = value;

      // Sync Paiement & Séjour → Contrat
      if (field === 'arriveeHeure') updated.checkInHeure = value;

      // Budget total = tarifNuit × nbNuits (only when tarifNuit, nbNuits, or dates change)
      const isPricingField = field === 'tarifNuit' || field === 'nbNuits' || field === 'dateArrivee' || field === 'dateDepart';
      if (isPricingField) {
        const tarifNuitVal = field === 'tarifNuit' ? value : prev.tarifNuit;
        const nbNuitsVal = (field === 'nbNuits' || field === 'dateArrivee' || field === 'dateDepart') ? updated.nbNuits : prev.nbNuits;
        if ((tarifNuitVal || 0) > 0 && (nbNuitsVal || 0) > 0) {
          updated.budgetTotal = Math.round(tarifNuitVal * nbNuitsVal);
        } else {
          updated.budgetTotal = undefined;
        }
      }

      // montantTotalHorsOptions = tarifNuit × nbNuits (only when pricing fields change)
      if (isPricingField) {
        const tarifNuitVal = field === 'tarifNuit' ? value : prev.tarifNuit;
        const nbNuitsVal = (field === 'nbNuits' || field === 'dateArrivee' || field === 'dateDepart') ? updated.nbNuits : prev.nbNuits;
        if ((tarifNuitVal || 0) > 0 && (nbNuitsVal || 0) > 0) {
          updated.montantTotalHorsOptions = Math.round(tarifNuitVal * nbNuitsVal);
        } else {
          updated.montantTotalHorsOptions = undefined;
        }
      }

      // soldeRestant = montantTotalAvecOptions - acompteMontant
      const currentMontantAvec = updated.montantTotalAvecOptions ?? prev.montantTotalAvecOptions;
      if (currentMontantAvec !== undefined) {
        const acompte = field === 'acompteMontant' ? (value || 0) : (prev.acompteMontant || 0);
        updated.soldeRestant = Math.max(0, currentMontantAvec - acompte);
      } else {
        updated.soldeRestant = undefined;
      }

      // montantTotalAvecOptions = montantTotalHorsOptions + sum of reservation options
      if (isPricingField || field === 'optionsSelectionnees') {
        const horsOptions = updated.montantTotalHorsOptions ?? prev.montantTotalHorsOptions;
        if (horsOptions !== undefined) {
          const resOpts = prev.reservationOptions || [];
          const optionsSum = resOpts.reduce((sum, o) => sum + (o.total || o.price * o.qty), 0);
          updated.montantTotalAvecOptions = horsOptions + optionsSum;
        }
      }

      return updated;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleCheckboxGroup = (field: 'attributsPersonnalises' | 'criteres' | 'languesParlees' | 'optionsSelectionnees', value: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const addGuideCheckinStep = () => setFormData(prev => ({ ...prev, guideCheckin: [...prev.guideCheckin, { texte: '' }] }));
  const removeGuideCheckinStep = (i: number) => setFormData(prev => ({ ...prev, guideCheckin: prev.guideCheckin.filter((_, idx) => idx !== i) }));
  const updateGuideCheckinStep = (i: number, value: string) => setFormData(prev => ({ ...prev, guideCheckin: prev.guideCheckin.map((s, idx) => idx === i ? { ...s, texte: value } : s) }));

  const addChecklistDepartStep = () => setFormData(prev => ({ ...prev, checklistDepart: [...prev.checklistDepart, { texte: '', obligatoire: false }] }));
  const removeChecklistDepartStep = (i: number) => setFormData(prev => ({ ...prev, checklistDepart: prev.checklistDepart.filter((_, idx) => idx !== i) }));
  const updateChecklistDepartStep = (i: number, field: 'texte' | 'obligatoire', value: any) => setFormData(prev => ({ ...prev, checklistDepart: prev.checklistDepart.map((s, idx) => idx === i ? { ...s, [field]: value } : s) }));

  const addCartePrivilegePartenaire = () => setFormData(prev => ({ ...prev, cartePrivilegePartenaires: [...prev.cartePrivilegePartenaires, { categorie: '', remise: '', nom: '', description: '', lien: '' }] }));
  const removeCartePrivilegePartenaire = (i: number) => setFormData(prev => ({ ...prev, cartePrivilegePartenaires: prev.cartePrivilegePartenaires.filter((_, idx) => idx !== i) }));
  const updateCartePrivilegePartenaire = (i: number, field: string, value: any) => setFormData(prev => ({ ...prev, cartePrivilegePartenaires: prev.cartePrivilegePartenaires.map((p, idx) => idx === i ? { ...p, [field]: value } : p) }));

  const addConciergerieActivite = () => setFormData(prev => ({ ...prev, conciergerieActivites: [...prev.conciergerieActivites, { titre: '', duree: '', prix: '', description: '', disponibilite: 'disponible', image: '' }] }));
  const removeConciergerieActivite = (i: number) => setFormData(prev => ({ ...prev, conciergerieActivites: prev.conciergerieActivites.filter((_, idx) => idx !== i) }));
  const updateConciergerieActivite = (i: number, field: string, value: any) => setFormData(prev => ({ ...prev, conciergerieActivites: prev.conciergerieActivites.map((a, idx) => idx === i ? { ...a, [field]: value } : a) }));

  const handleProximiteCategory = (category: keyof ProximiteCategorie, value: string) => {
    setFormData(prev => {
      const current = prev.proximites[category];
      const updated = (current as string[]).includes(value)
        ? (current as string[]).filter(v => v !== value)
        : [...(current as string[]), value];
      return { ...prev, proximites: { ...prev.proximites, [category]: updated } };
    });
  };

  const handlePrestationGroup = (category: keyof PrestationVoyageur, value: string) => {
    setFormData(prev => {
      const current = prev.prestations[category];
      const updated = (current as string[]).includes(value)
        ? (current as string[]).filter(v => v !== value)
        : [...(current as string[]), value];
      return { ...prev, prestations: { ...prev.prestations, [category]: updated } };
    });
  };

  useEffect(() => {
    const allFieldsFilled = !!(
      formData.numeroReservation?.trim() &&
      formData.dateReservation?.trim() &&
      formData.dateArrivee?.trim() &&
      formData.dateDepart?.trim() &&
      formData.nbNuits !== undefined && formData.nbNuits > 0 &&
      formData.bienReserve?.trim() &&
      formData.tarifNuit !== undefined && formData.tarifNuit > 0 &&
      formData.montantTotalHorsOptions !== undefined &&
      formData.montantTotalAvecOptions !== undefined &&
      formData.acompteMontant !== undefined &&
      formData.soldeRestant !== undefined &&
      formData.cautionMontant !== undefined &&
      formData.conditionAnnulation?.trim() &&
      formData.checkInHeure?.trim() &&
      formData.checkOutHeure?.trim()
    );

    setFormData(prev => {
      if (prev.statutReservation !== 'Brouillon' && prev.statutReservation !== 'En attente') return prev;
      const newStatus = allFieldsFilled ? 'En attente' : 'Brouillon';
      return newStatus !== prev.statutReservation ? { ...prev, statutReservation: newStatus } : prev;
    });
  }, [
    formData.numeroReservation,
    formData.dateReservation,
    formData.dateArrivee,
    formData.dateDepart,
    formData.nbNuits,
    formData.bienReserve,
    formData.tarifNuit,
    formData.montantTotalHorsOptions,
    formData.montantTotalAvecOptions,
    formData.acompteMontant,
    formData.soldeRestant,
    formData.cautionMontant,
    formData.conditionAnnulation,
    formData.checkInHeure,
    formData.checkOutHeure,
  ]);

  useEffect(() => {
    const mapping: Record<string, string> = {
      'Brouillon': 'En recherche',
      'En attente': 'Reservation en cours',
      'Confirmee': 'Confirme',
      'Payee': 'Paye',
      'Occupe': 'En sejour',
      'Expire': 'Inactif',
      'Termine': 'Termine',
      'Annulee': 'Annule',
    };
    const target = mapping[formData.statutReservation];
    if (target && formData.statutMetier !== target) {
      setFormData(prev => ({ ...prev, statutMetier: target }));
    }
  }, [formData.statutReservation]);

  useEffect(() => {
    if (!initialDraftId || !userId) return;
    const draft = getDraft(userId, initialDraftId);
    if (draft) {
      const draftData = draft.data;
      setFormData(prev => ({ ...prev, ...draftData }));
      if (draftData._step) setStep(draftData._step);
    }
    setLoadingDraft(false);
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VoyageurFormData, string>> = {};
    if (!formData.contactId) newErrors.contactId = 'Veuillez sélectionner ou créer un contact';
    if (!formData.origine) newErrors.origine = "L'origine est requise";
    if (!formData.typeBien) newErrors.typeBien = 'Le type de bien est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFilled = (v: any): boolean => {
    if (v === undefined || v === null) return false;
    if (typeof v === 'string') return v.trim() !== '';
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') {
      if (v instanceof Date) return true;
      return Object.values(v).some((a: any) => Array.isArray(a) && a.length > 0);
    }
    return true;
  };

  const calcCompletion = (data: VoyageurFormData): number => {
    const fields = [
      data.classification, data.statutMetier, data.origine,
      data.localisation, data.secteur, data.adresseComplete, data.complementAdresse, data.codePostalVille, data.pays, data.typeBien,
      data.pieces, data.chambres, data.surfaceMin, data.surfaceMax,
      data.couchagesMax, data.vue, data.exposition, data.etat, data.standing,
      data.attributPrincipal, data.attributsPersonnalises, data.criteres,
      data.proximites, data.prestations,
      data.dateArrivee, data.dateDepart, data.nbAdultes,
      data.budgetNuitMin, data.budgetNuitMax,
      data.nbVoyageurs, data.modePaiement, data.acompteMontant, data.cautionMontant,
      data.demandesSpeciales, data.arriveeHeure,
      data.numeroReservation, data.statutReservation, data.dateReservation,
      data.bienReserve, data.tarifNuit, data.optionsSelectionnees,
      data.conditionAnnulation, data.checkInHeure, data.checkOutHeure,
      data.contratPdfUrl, data.docIdentiteUrl, data.docDomicileUrl,
      data.notesInternes,
    ];
    const filled = fields.filter(isFilled).length;
    return Math.min(100, Math.round((filled / fields.length) * 100));
  };

  const doSaveDraft = () => {
    if (!userId) return;
    const data = { ...formDataRef.current, _draftId: savedDraftId, _step: step };
    const draft = saveDraft(userId, 'Voyageur', data, calcCompletion(formDataRef.current));
    if (!savedDraftId) setSavedDraftId(draft.id);
    onDraftChange?.();
  };

  useEffect(() => {
    if (!savedDraftId) return;
    const timer = setTimeout(doSaveDraft, 2000);
    return () => clearTimeout(timer);
  }, [formData, savedDraftId, step]);

  const submitForm = async () => {
    if (isSubmitting) return;
    if (savedDraftId && userId) {
      deleteDraft(userId, savedDraftId);
      onDraftChange?.();
    }
    setIsSubmitting(true);

    try {
      const budgetNuitMin = formData.budgetNuitMin || 0;
      const budgetNuitMax = formData.budgetNuitMax || 0;

      await onSubmit({
        name: selectedContactName || (formData.contactId ? (() => { const c = contacts.find(ct => String(ct.id) === formData.contactId); return c ? `${c.civility || ''} ${c.firstName || ''} ${c.lastName || ''}`.trim() : ''; })() : '') || editingClient?.name || 'Nouveau client',
        type: 'Voyageur',
        status: formData.actif ? 'Actif' : 'Inactif',
        phone: (formData.contactId ? (contacts.find(c => String(c.id) === formData.contactId)?.mobile || '') : '') || editingClient?.phone || '',
        email: (formData.contactId ? (contacts.find(c => String(c.id) === formData.contactId)?.emailPrincipal || '') : '') || editingClient?.email || '',
        completion: calcCompletion(formData),
        source: formData.origine,
        notes: formData.notesInternes,
        propertyType: formData.typeBien,
        area: formData.secteur || formData.localisation,
        minSurface: formData.surfaceMin,
        surfaceMax: formData.surfaceMax,
        pieces: formData.pieces,
        chambres: formData.chambres,
        rooms: formData.pieces?.toString() || '',
        prixMin: budgetNuitMin,
        prixMax: budgetNuitMax,
        nbPersonnes: formData.couchagesMax,
        budgetParNuitMin: budgetNuitMin,
        budgetParNuitMax: budgetNuitMax,
        dateArrivee: formData.dateArrivee || undefined,
        dateDepart: formData.dateDepart || undefined,
        flexibiliteDates: formData.flexibilite || undefined,
        modePaiement: formData.modePaiement || undefined,
        acompteVersee: formData.acompteMontant,
        caution: formData.cautionMontant,
        conditionsAnnulation: formData.conditionAnnulation || undefined,
        devise: formData.devise,
        classification: formData.classification,
        statutMetier: formData.statutMetier,
        croisementAutomatique: formData.croisementAutomatique,
        contactId: formData.contactId,
        secteur: formData.secteur,
        adresseComplete: formData.adresseComplete,
        complementAdresse: formData.complementAdresse,
        codePostalVille: formData.codePostalVille,
        pays: formData.pays,
        categorie: 'Location saisonnière',
        piecesOperator: formData.piecesOperator,
        chambresOperator: formData.chambresOperator,
        vue: formData.vue,
        exposition: formData.exposition,
        etat: formData.etat,
        standing: formData.standing,
        disponibilite: formData.flexibilite,
        attributPrincipal: formData.attributPrincipal,
        attributsPersonnalises: (formData.attributsPersonnalises || []).length > 0 ? formData.attributsPersonnalises : undefined,
        criteres: (formData.criteres || []).length > 0 ? formData.criteres : undefined,
        proximites: formData.proximites && (formData.proximites.transports?.length > 0 || formData.proximites.commerces?.length > 0 || formData.proximites.education?.length > 0 || formData.proximites.sante?.length > 0 || formData.proximites.loisirs?.length > 0)
          ? formData.proximites : undefined,
        prestations: {
          exterieur: [...(formData.prestations?.exterieur || []), ...(formData.prestations?.services || [])],
          confort: [...(formData.prestations?.equipementsBase || []), ...(formData.prestations?.chambres || [])],
          electromenager: formData.prestations?.cuisine || [],
          multimedia: formData.prestations?.divertissement || [],
          sport: [],
        },
        numeroMandat: formData.numeroReservation,
        dateSignature: formData.dateReservation,
        dateDebut: formData.dateArrivee,
        dateExpiration: formData.dateDepart,
        statutMandat: ['Confirmee', 'Payee', 'Occupe'].includes(formData.statutReservation) ? 'Actif' : formData.statutReservation === 'Termine' ? 'Terminé' : formData.statutReservation === 'Annulee' ? 'Annulé' : formData.statutReservation === 'Expire' ? 'Inactif' : formData.statutReservation,
        typeMandat: formData.conditionAnnulation,
        agentDesigne: formData.agentDesigne || '',
        conjoint: (formData.languesParlees || []).join(', '),
        dureeProtection: formData.flexibilite,
        mandatPdfUrl: formData.contratPdfUrl || undefined,
        localisation: formData.localisation || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        budgetNuitMin,
        budgetNuitMax,
        nbNuits: formData.nbNuits,
        nbAdultes: formData.nbAdultes,
        nbEnfants: formData.nbEnfants,
        couchagesMax: formData.couchagesMax,
        tarifNuit: formData.tarifNuit,
        budgetTotal: formData.budgetTotal,
        bienReserve: formData.bienReserve || undefined,
        montantTotalHorsOptions: formData.montantTotalHorsOptions,
        montantTotalAvecOptions: formData.montantTotalAvecOptions,
        optionsSelectionnees: (formData.optionsSelectionnees || []).length > 0 ? formData.optionsSelectionnees : undefined,
        reservationOptions: formData.reservationOptions || undefined,
        soldeRestant: formData.soldeRestant,
        acompteMontant: formData.acompteMontant,
        acompteDate: formData.acompteDate || undefined,
        cautionMontant: formData.cautionMontant,
        cautionMode: formData.cautionMode || undefined,
        dateLimiteSolde: formData.dateLimiteSolde || undefined,
        checkInHeure: formData.checkInHeure || undefined,
        checkOutHeure: formData.checkOutHeure || undefined,
        animauxAcceptes: formData.animauxAcceptes,
        fumeur: formData.fumeur,
        nbVoyageurs: formData.nbVoyageurs,
        nbEnfantsSejour: formData.nbEnfantsSejour,
        animaux: formData.animaux,
        animauxEspeces: formData.animauxEspeces || undefined,
        regimeAlimentaire: formData.regimeAlimentaire || undefined,
        languesParlees: (formData.languesParlees || []).length > 0 ? formData.languesParlees : undefined,
        demandesSpeciales: formData.demandesSpeciales || undefined,
        arriveeHeure: formData.arriveeHeure || undefined,
        arriveeTransport: formData.arriveeTransport || undefined,
        numeroReservation: formData.numeroReservation || undefined,
        statutReservation: formData.statutReservation,
        dateReservation: formData.dateReservation || undefined,
        contratPdfUrl: formData.contratPdfUrl || undefined,
        docIdentiteUrl: formData.docIdentiteUrl || undefined,
        docIdentiteName: formData.docIdentiteName || undefined,
        docDomicileUrl: formData.docDomicileUrl || undefined,
        docDomicileName: formData.docDomicileName || undefined,
        docRevenusUrl: formData.docPaiementUrl || undefined,
        docRevenusName: formData.docPaiementName || undefined,
        assuranceAnnulation: formData.assuranceAnnulation,
        assuranceAnnulationMontant: formData.assuranceAnnulationMontant,
        assuranceMultirisque: formData.assuranceMultirisque,
        assuranceMultirisqueMontant: formData.assuranceMultirisqueMontant,
        dateLimiteAnnulation: formData.dateLimiteAnnulation || undefined,
        penaliteAnnulation: formData.penaliteAnnulation,
        edlEntree: formData.edlEntree || undefined,
        edlSortie: formData.edlSortie || undefined,
        reglementInterieur: formData.reglementInterieur,
        rgpdConsent: formData.rgpdConsent,
        contratNotes: formData.contratNotes || undefined,
        guideCheckin: (formData.guideCheckin || []).length > 0 ? formData.guideCheckin : undefined,
        checklistDepart: (formData.checklistDepart || []).length > 0 ? formData.checklistDepart : undefined,
        checklistDepartMessage: formData.checklistDepartMessage || undefined,
        checklistDepartWhatsapp: formData.checklistDepartWhatsapp || undefined,
        cartePrivilegeActif: formData.cartePrivilegeActif,
        cartePrivilegePartenaires: (formData.cartePrivilegePartenaires || []).length > 0 ? formData.cartePrivilegePartenaires : undefined,
        conciergerieActif: formData.conciergerieActif,
        conciergerieWhatsapp: formData.conciergerieWhatsapp || undefined,
        conciergerieActivites: (formData.conciergerieActivites || []).length > 0 ? formData.conciergerieActivites : undefined,
        assistanceWhatsapp: formData.assistanceWhatsapp || undefined,
        assistanceTelephone: formData.assistanceTelephone || undefined,
        assistanceEmail: formData.assistanceEmail || undefined,
        assistanceMessage: formData.assistanceMessage || undefined,
        createdAt: editingClient?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: editingClient?.createdBy || 'current-user-id',
      });
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
        <span className={`w-1 h-4 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
        {title}
      </h3>
      {children}
    </div>
  );

  const renderRadioGroup = (
    label: string,
    field: keyof VoyageurFormData,
    options: { value: string; label: string }[],
    error?: string,
  ) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const isSelected = formData[field] === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChange(field, opt.value)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                isSelected
                  ? (isGerant ? 'bg-[#905D5D] text-white border-[#905D5D] ring-2 ring-[#905D5D]/30' : 'bg-accent text-white border-accent ring-2 ring-accent/30')
                  : (isGerant ? 'bg-card text-text-secondary border-border hover:border-[#905D5D]/50' : 'bg-card text-text-secondary border-border hover:border-accent/50')
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );

  const renderCheckboxGroup = (
    label: string,
    options: { value: string; label: string }[],
    selectedValues: string[],
    onChange: (value: string) => void,
  ) => (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-text">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const isSelected = selectedValues.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                isSelected
                  ? (isGerant ? 'bg-[#905D5D] text-white border-[#905D5D]' : 'bg-accent text-white border-accent')
                  : (isGerant ? 'bg-card text-text-secondary border-border hover:border-[#905D5D]/50' : 'bg-card text-text-secondary border-border hover:border-accent/50')
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderProximiteGroup = (
    label: string,
    options: { value: string; label: string }[],
    category: keyof ProximiteCategorie,
  ) => {
    const selectedValues = formData.proximites[category];
    return (
      <div>
        <p className="text-sm font-medium text-text mb-2">{label}</p>
        <div className="flex flex-wrap gap-2">
          {options.map(opt => {
            const isSelected = (selectedValues as string[]).includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleProximiteCategory(category, opt.value)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  isSelected
                    ? (isGerant ? 'bg-[#905D5D] text-white border-[#905D5D]' : 'bg-accent text-white border-accent')
                    : (isGerant ? 'bg-card text-text-secondary border-border hover:border-[#905D5D]/50' : 'bg-card text-text-secondary border-border hover:border-accent/50')
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPrestationGroup = (
    label: string,
    options: { value: string; label: string }[],
    category: keyof PrestationVoyageur,
  ) => {
    const selectedValues = formData.prestations[category] || [];
    return (
      <div>
        <p className="text-sm font-medium text-text mb-2">{label}</p>
        <div className="flex flex-wrap gap-2">
          {options.map(opt => {
            const isSelected = (selectedValues as string[]).includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handlePrestationGroup(category, opt.value)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  isSelected
                    ? (isGerant ? 'bg-[#905D5D] text-white border-[#905D5D]' : 'bg-accent text-white border-accent')
                    : (isGerant ? 'bg-card text-text-secondary border-border hover:border-[#905D5D]/50' : 'bg-card text-text-secondary border-border hover:border-accent/50')
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            {renderSection('PARAMÈTRES', (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-6">
                  <Checkbox label="Actif" checked={formData.actif} onChange={(checked) => handleChange('actif', checked)} />
                  <Checkbox label="Croisement automatique" checked={formData.croisementAutomatique} onChange={(checked) => handleChange('croisementAutomatique', checked)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Statut métier" options={STATUT_METIER_OPTIONS} value={formData.statutMetier} onValueChange={(v) => handleChange('statutMetier', v)} />
                  <Select label="Classification" options={CLASSIFICATION_OPTIONS} value={formData.classification} onValueChange={(v) => handleChange('classification', v)} />
                </div>
              </div>
            ))}
            {renderSection('CONTACT', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-text mb-1.5">Contact *</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        options={contactOptions}
                        value={formData.contactId}
                        onValueChange={(v) => handleChange('contactId', v)}
                        error={errors.contactId}
                      />
                    </div>
                    <button type="button" className={`h-9 w-9 rounded-lg border border-border bg-card flex items-center justify-center text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all shrink-0`} title="Créer un nouveau contact" onClick={() => setShowContactForm(true)}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <Select label="Origine *" options={ORIGINE_OPTIONS} value={formData.origine} onValueChange={(v) => handleChange('origine', v)} error={errors.origine} />
              </div>
            ))}
          </>
        );

      case 2:
        return (
          <>
            {renderSection('LOCALISATION RECHERCHÉE', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-text mb-1.5">Plan (Carte interactive)</p>
                  <LocationMap
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onLatitudeChange={(v: number) => handleChange('latitude', v)}
                    onLongitudeChange={(v: number) => handleChange('longitude', v)}
                  />
                </div>
                <Input label="Adresse complète" value={formData.adresseComplete} onChange={(e) => handleChange('adresseComplete', e.target.value)} placeholder="12 Rue de la Liberté, Casablanca" />
                <Input label="Complément d'adresse" value={formData.complementAdresse} onChange={(e) => handleChange('complementAdresse', e.target.value)} placeholder="Résidence Les Palmiers, Appt 5" />
                <Input label="Code postal / Ville" value={formData.codePostalVille} onChange={(e) => handleChange('codePostalVille', e.target.value)} placeholder="20000 Casablanca" />
                <Select label="Pays" options={LOCALISATION_OPTIONS} value={formData.pays} onValueChange={(v) => handleChange('pays', v)} />
                <Select label="Secteur" options={SECTEUR_OPTIONS} value={formData.secteur} onValueChange={(v) => handleChange('secteur', v)} />
              </div>
            ))}
            {renderSection('GÉNÉRAL', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Catégorie" value="Location saisonnière" disabled />
                <div className="sm:col-span-2">
                  <Select label="Type de bien *" options={TYPE_BIEN_OPTIONS} value={formData.typeBien} onValueChange={(v) => handleChange('typeBien', v)} error={errors.typeBien} />
                </div>
              </div>
            ))}
          </>
        );

      case 3:
        return (
          <>
            {renderSection('CARACTÉRISTIQUES QUANTITATIVES', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex gap-2 items-end">
                    <div className="w-20 shrink-0">
                      <Select label="Pièces" options={OPERATORS} value={formData.piecesOperator} onValueChange={(v) => handleChange('piecesOperator', v)} />
                    </div>
                    <Input type="number" min="0" value={formData.pieces?.toString() || ''} onChange={(e) => handleChange('pieces', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="2" />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="w-20 shrink-0">
                      <Select label="Chambres" options={OPERATORS} value={formData.chambresOperator} onValueChange={(v) => handleChange('chambresOperator', v)} />
                    </div>
                    <Input type="number" min="0" value={formData.chambres?.toString() || ''} onChange={(e) => handleChange('chambres', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="1" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-text mb-1.5">Surface</p>
                    <div className="flex gap-2 items-center">
                      <Input type="number" min="0" value={formData.surfaceMin?.toString() || ''} onChange={(e) => handleChange('surfaceMin', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="60" />
                      <span className="text-text-secondary text-sm">~</span>
                      <Input type="number" min="0" value={formData.surfaceMax?.toString() || ''} onChange={(e) => handleChange('surfaceMax', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="90" />
                      <span className="text-text-secondary text-sm font-medium w-8">m²</span>
                    </div>
                  </div>
                  <Input type="number" min="0" label="Couchages max" value={formData.couchagesMax?.toString() || ''} onChange={(e) => handleChange('couchagesMax', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="6 personnes" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input type="number" min="0" label="Étage" value={formData.pieces?.toString() || ''} onChange={(e) => handleChange('pieces', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="2" className="max-w-[200px]" />
                  </div>
                </div>
              </div>
            ))}
            {renderSection('CARACTÉRISTIQUES QUALITATIVES', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Vue" options={VUE_OPTIONS} value={formData.vue} onValueChange={(v) => handleChange('vue', v)} />
                <Select label="Exposition" options={EXPOSITION_OPTIONS} value={formData.exposition} onValueChange={(v) => handleChange('exposition', v)} />
                <Select label="État" options={ETAT_OPTIONS} value={formData.etat} onValueChange={(v) => handleChange('etat', v)} />
                <Select label="Standing" options={STANDING_OPTIONS} value={formData.standing} onValueChange={(v) => handleChange('standing', v)} />
              </div>
            ))}
            {renderSection('BUDGET', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-text mb-1.5">Budget par nuit</p>
                    <div className="flex gap-2 items-center">
                      <Input type="number" min="0" value={formData.budgetNuitMin?.toString() || ''} onChange={(e) => handleChange('budgetNuitMin', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="500" disabled={!!formData.bienReserve} />
                      <span className="text-text-secondary text-sm">~</span>
                      <Input type="number" min="0" value={formData.budgetNuitMax?.toString() || ''} onChange={(e) => handleChange('budgetNuitMax', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="800" disabled={!!formData.bienReserve} />
                      <div className="w-20 shrink-0">
                        <Select options={CURRENCIES} value={formData.devise} onValueChange={(v) => handleChange('devise', v)} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Budget par semaine" value={formData.budgetNuitMin || formData.budgetNuitMax ? `${((formData.budgetNuitMin || 0) * 7).toLocaleString('fr-FR')} ~ ${((formData.budgetNuitMax || 0) * 7).toLocaleString('fr-FR')} ${formData.devise}` : formData.tarifNuit ? `${(formData.tarifNuit * 7).toLocaleString('fr-FR')} ${formData.devise}` : 'À définir'} disabled />
                  <Input label="Budget total pour le séjour" value={formData.budgetTotal ? `${formData.budgetTotal.toLocaleString('fr-FR')} ${formData.devise}` : formData.tarifNuitMin && formData.tarifNuitMax && formData.nbNuits > 0 ? `${(formData.tarifNuitMin * formData.nbNuits).toLocaleString('fr-FR')} ~ ${(formData.tarifNuitMax * formData.nbNuits).toLocaleString('fr-FR')} ${formData.devise}` : 'À définir'} disabled />
                </div>
                <div className="text-xs text-text-secondary italic">
                  Budget semaine = {formData.budgetNuitMin || formData.budgetNuitMax ? `${formData.budgetNuitMin || 0} × 7 ~ ${formData.budgetNuitMax || 0} × 7` : formData.tarifNuit ? `prix par nuit ${formData.tarifNuit} × 7` : 'min × 7 ~ max × 7'} | Budget total = prix par nuit × nombre de nuits + options et services
                </div>
              </div>
            ))}
            {renderSection('PÉRIODE RECHERCHÉE', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <DatePicker label="Date d'arrivée souhaitée" value={formData.dateArrivee} onChange={(e) => handleChange('dateArrivee', e.target.value)} />
                  <DatePicker label="Date de départ souhaitée" value={formData.dateDepart} onChange={(e) => handleChange('dateDepart', e.target.value)} />
                  <Input type="number" label="Nombre de nuits" value={formData.nbNuits?.toString() || '0'} disabled />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input type="number" min="0" label="Nombre d'adultes" value={formData.nbAdultes?.toString() || ''} onChange={(e) => handleChange('nbAdultes', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="2" />
                  <Input type="number" min="0" label="Nombre d'enfants" value={formData.nbEnfants?.toString() || ''} onChange={(e) => handleChange('nbEnfants', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" />
                  <Select label="Flexibilité sur les dates" options={[{ value: '', label: 'Non défini' }, ...FLEXIBILITE_OPTIONS]} value={formData.flexibilite} onValueChange={(v) => handleChange('flexibilite', v)} />
                </div>
              </div>
            ))}
          </>
        );

      case 4:
        return (
          <>
            {renderSection('ATTRIBUTS', (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-text mb-2">Attribut principal</p>
                  <div className="flex flex-wrap gap-2">
                    {ATTRIBUTS_PRINCIPAUX.map(opt => {
                      const isSelected = formData.attributPrincipal === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleChange('attributPrincipal', opt.value)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                            isSelected
                              ? (isGerant ? 'bg-[#905D5D] text-white border-[#905D5D] ring-2 ring-[#905D5D]/30' : 'bg-accent text-white border-accent ring-2 ring-accent/30')
                              : (isGerant ? 'bg-card text-text-secondary border-border hover:border-[#905D5D]/50' : 'bg-card text-text-secondary border-border hover:border-accent/50')
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {renderCheckboxGroup('Attributs personnalisés', ATTRIBUTS_PERSONNALISES, formData.attributsPersonnalises, (value) => handleCheckboxGroup('attributsPersonnalises', value))}
              </div>
            ))}
            {renderSection('CRITÈRES', (
              <div>
                <p className="text-sm font-medium text-text mb-2">Critères de base</p>
                <div className="flex flex-wrap gap-2">
                  {CRITERES_BASE.map(opt => {
                    const isSelected = formData.criteres.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleCheckboxGroup('criteres', opt.value)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                          isSelected
                            ? (isGerant ? 'bg-[#905D5D] text-white border-[#905D5D]' : 'bg-accent text-white border-accent')
                            : (isGerant ? 'bg-card text-text-secondary border-border hover:border-[#905D5D]/50' : 'bg-card text-text-secondary border-border hover:border-accent/50')
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        );

      case 5:
        return (
          <>
            {renderSection('PROXIMITÉS', (
              <div className="space-y-4">
                {renderProximiteGroup('Transports', PROXIMITES_TRANSPORTS, 'transports')}
                {renderProximiteGroup('Commerces & Services', PROXIMITES_COMMERCES, 'commerces')}
                {renderProximiteGroup('Éducation', PROXIMITES_EDUCATION, 'education')}
                {renderProximiteGroup('Santé & Sport', PROXIMITES_SANTE, 'sante')}
                {renderProximiteGroup('Loisirs & Nature', PROXIMITES_LOISIRS, 'loisirs')}
              </div>
            ))}
          </>
        );

      case 6:
        return (
          <>
            {renderSection('PRESTATIONS', (
              <div className="space-y-4">
                {renderPrestationGroup('Équipements de base', PRESTATIONS_EQUIPEMENTS_BASE, 'equipementsBase')}
                {renderPrestationGroup('Cuisine', PRESTATIONS_CUISINE, 'cuisine')}
                {renderPrestationGroup('Chambres (services inclus)', PRESTATIONS_CHAMBRES, 'chambres')}
                {renderPrestationGroup('Divertissement', PRESTATIONS_DIVERTISSEMENT, 'divertissement')}
                {renderPrestationGroup('Extérieur', PRESTATIONS_EXTERIEUR, 'exterieur')}
                {renderPrestationGroup('Services', PRESTATIONS_SERVICES, 'services')}
              </div>
            ))}
          </>
        );

      case 7:
        return (
          <>
            {renderSection('INFORMATIONS SUR LE SÉJOUR', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input type="number" min="0" label="Nombre de voyageurs" value={formData.nbVoyageurs?.toString() || ''} onChange={(e) => handleChange('nbVoyageurs', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="2 adultes" />
                  <Input type="number" min="0" label="Nombre d'enfants" value={formData.nbEnfantsSejour?.toString() || ''} onChange={(e) => handleChange('nbEnfantsSejour', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" />
                  <div className="flex items-end gap-2">
                    <Checkbox label="Animaux de compagnie" checked={formData.animaux} onChange={(checked) => handleChange('animaux', checked)} />
                  </div>
                </div>
                {formData.animaux && (
                  <Input value={formData.animauxEspeces} onChange={(e) => handleChange('animauxEspeces', e.target.value)} placeholder="Oui, 1 petit chien" />
                )}
                <Textarea label="Régime alimentaire particulier" value={formData.regimeAlimentaire} onChange={(e) => handleChange('regimeAlimentaire', e.target.value)} placeholder="Végétarien, Allergie aux arachides..." rows={2} />
                <div>
                  {renderCheckboxGroup('Langues parlées', LANGUES_OPTIONS, formData.languesParlees, (value) => handleCheckboxGroup('languesParlees', value))}
                </div>
              </div>
            ))}
            {renderSection('MODE DE PAIEMENT', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Mode de paiement" options={[{ value: '', label: 'Sélectionner...' }, ...PAIEMENT_MODE_OPTIONS]} value={formData.modePaiement} onValueChange={(v) => handleChange('modePaiement', v)} />
                  <Input type="number" min="0" label="Acompte versé" value={formData.acompteMontant?.toString() || ''} onChange={(e) => handleChange('acompteMontant', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`3 000 ${formData.devise}`} disabled={!formData.budgetTotal} />
                  <DatePicker label="Date de l'acompte" value={formData.acompteDate} onChange={(e) => handleChange('acompteDate', e.target.value)} />
                  <Input type="number" min="0" label="Solde restant" value={formData.soldeRestant?.toString() || ''} disabled />
                  <DatePicker label="Date limite de paiement du solde" value={formData.dateLimiteSolde} onChange={(e) => handleChange('dateLimiteSolde', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input type="number" min="0" label="Caution" value={formData.cautionMontant?.toString() || ''} onChange={(e) => handleChange('cautionMontant', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`2 000 ${formData.devise}`} disabled={!formData.budgetTotal} />
                  <Select label="Mode de prélèvement caution" options={[{ value: '', label: 'Sélectionner...' }, { value: 'Empreinte carte', label: 'Empreinte carte' }, { value: 'Chèque', label: 'Chèque' }, { value: 'Virement', label: 'Virement' }, { value: 'Especes', label: 'Espèces' }]} value={formData.cautionMode} onValueChange={(v) => handleChange('cautionMode', v)} />
                </div>
              </div>
            ))}
            {renderSection('NOTES COMPLÉMENTAIRES', (
              <div className="space-y-4">
                <Textarea label="Demandes spéciales" value={formData.demandesSpeciales} onChange={(e) => handleChange('demandesSpeciales', e.target.value)} placeholder="Lit bébé, ménage en option, etc." rows={2} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Heure d'arrivée prévue" value={formData.arriveeHeure} onChange={(e) => handleChange('arriveeHeure', e.target.value)} placeholder="15h00" />
                  <Input label="Moyen de transport" value={formData.arriveeTransport} onChange={(e) => handleChange('arriveeTransport', e.target.value)} placeholder="Voiture / Avion / Train" />
                </div>
                <Textarea label="Notes internes" value={formData.notesInternes} onChange={(e) => handleChange('notesInternes', e.target.value)} placeholder="Comportement, préférences..." rows={3} />
              </div>
            ))}
          </>
        );

      case 8:
        return (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className={`w-1 h-6 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
              <h2 className="text-base font-semibold text-text">CONTRAT DE LOCATION SAISONNIÈRE</h2>
            </div>

            {renderSection('1. INFORMATIONS GÉNÉRALES DE LA RÉSERVATION', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Numéro de réservation" value={formData.numeroReservation} onChange={(e) => handleChange('numeroReservation', e.target.value)} placeholder="RES-2026-001" />
                <Select label="Statut de la réservation" options={STATUT_RESERVATION_OPTIONS} value={formData.statutReservation} onValueChange={(v) => handleChange('statutReservation', v)} />
                <DatePicker label="Date de réservation" value={formData.dateReservation} onChange={(e) => handleChange('dateReservation', e.target.value)} />
                <DatePicker label="Date d'arrivée" value={formData.dateArrivee} onChange={(e) => handleChange('dateArrivee', e.target.value)} />
                <DatePicker label="Date de départ" value={formData.dateDepart} onChange={(e) => handleChange('dateDepart', e.target.value)} />
                <Input type="number" label="Nombre de nuits" value={formData.nbNuits?.toString() || '0'} disabled />
              </div>
            ))}
            {renderSection('2. DÉTAIL DU SÉJOUR', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Bien réservé</label>
                  {selectedProperty ? (
                    <div className={`p-3 rounded-lg ${isGerant ? 'border-[#905D5D]/20 bg-[#905D5D]/5' : 'border-accent/20 bg-accent/5'} flex items-center justify-between`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${isGerant ? 'bg-[#905D5D]/10' : 'bg-accent/10'} flex items-center justify-center shrink-0`}>
                          <Home size={14} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{selectedProperty.title || selectedProperty.reference || `Bien #${selectedProperty.id}`}</p>
                          <p className="text-[11px] text-text-secondary/60 truncate">
                            {selectedProperty.reference && <span className="font-mono">{selectedProperty.reference}</span>}
                            {selectedProperty.city && ` · ${selectedProperty.city}`}
                          </p>
                        </div>
                      </div>
                      <button type="button" onClick={() => { setSelectedProperty(null); handleChange('bienReserve', ''); }} className={`p-1 rounded-md ${isGerant ? 'hover:bg-[#905D5D]/10' : 'hover:bg-accent/10'} transition-colors shrink-0`}>
                        <X size={14} className="text-text-secondary" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                      <input
                        type="text"
                        placeholder="Rechercher un bien de vacances..."
                        className={`w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'} transition-all`}
                        value={propertySearchQuery}
                        onChange={(e) => {
                          setPropertySearchQuery(e.target.value);
                          if (selectedProperty) {
                            setSelectedProperty(null);
                            handleChange('bienReserve', '');
                          }
                        }}
                      />
                      {propertySearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className={`w-3.5 h-3.5 border-2 ${isGerant ? 'border-[#905D5D]' : 'border-accent'} border-t-transparent rounded-full animate-spin`} />
                        </div>
                      )}
                      {propertySearchResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border/50 rounded-xl shadow-dropdown z-10 max-h-60 overflow-y-auto">
                          {propertySearchResults.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-background/50 transition-colors"
                              onClick={() => {
                                setSelectedProperty(p);
                                handleChange('bienReserve', String(p.id));
                                setPropertySearchQuery('');
                                setPropertySearchResults([]);
                              }}
                            >
                              <div className={`w-8 h-8 rounded-lg ${isGerant ? 'bg-[#905D5D]/10' : 'bg-accent/10'} flex items-center justify-center shrink-0`}>
                                <Home size={14} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{p.title || p.reference || `Bien #${p.id}`}</p>
                                <p className="text-[11px] text-text-secondary/60 truncate">
                                  {p.reference && <span className="font-mono">{p.reference}</span>}
                                  {p.reference && p.city && ' · '}
                                  {p.city || p.location || ''}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Input label="Tarif par nuit" value={formData.tarifNuit ? `${formData.tarifNuit.toLocaleString('fr-FR')} ${formData.devise}` : ''} disabled />
                <Input type="number" min="0" label="Montant total (hors options)" value={formData.montantTotalHorsOptions?.toString() || ''} disabled />
                <div className="sm:col-span-2">
                  {formData.reservationOptions && formData.reservationOptions.length > 0 ? (
                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">Options sélectionnées</label>
                      <div className="flex flex-wrap gap-2">
                        {formData.reservationOptions.map((opt, i) => (
                          <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border-[#905D5D]/20' : 'bg-accent/10 text-accent border-accent/20'} text-sm font-medium border`}>
                            {opt.name}
                            <span className={`text-xs ${isGerant ? 'text-[#905D5D]/60' : 'text-accent/60'}`}>({opt.price.toLocaleString('fr-FR')} {formData.devise}/{opt.qty > 1 ? `${opt.qty}×` : opt.total > opt.price ? 'séjour' : 'unique'})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    renderCheckboxGroup('Options sélectionnées', [
                      { value: 'Menage', label: `Ménage (200 ${formData.devise})` },
                      { value: 'Petit-dejeuner', label: `Petit-déjeuner (50 ${formData.devise}/pers/jour)` },
                      { value: 'Transfert', label: `Transfert aéroport (300 ${formData.devise})` },
                      { value: 'Location voiture', label: `Location de voiture (400 ${formData.devise}/jour)` },
                    ], formData.optionsSelectionnees, (value) => handleCheckboxGroup('optionsSelectionnees', value))
                  )}
                </div>
                <Input type="number" min="0" label="Montant total (avec options)" value={formData.montantTotalAvecOptions?.toString() || ''} disabled />
                <Input type="number" min="0" label="Acompte versé" value={formData.acompteMontant?.toString() || ''} disabled />
                <Input type="number" min="0" label="Solde restant" value={formData.soldeRestant?.toString() || ''} disabled />
                <Input type="number" min="0" label="Caution" value={formData.cautionMontant?.toString() || ''} disabled />
              </div>
            ))}
            {renderSection('3. CONDITIONS GÉNÉRALES', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Conditions d'annulation" options={CONDITIONS_ANNULATION_OPTIONS} value={formData.conditionAnnulation} onValueChange={(v) => handleChange('conditionAnnulation', v)} />
                  <Input label="Heure d'arrivée (check-in)" value={formData.checkInHeure} disabled placeholder="15h00 - 20h00" />
                  <Input label="Heure de départ (check-out)" value={formData.checkOutHeure} onChange={(e) => handleChange('checkOutHeure', e.target.value)} placeholder="11h00" />
                  <div className="flex items-end gap-4">
                    <Checkbox label="Animaux acceptés" checked={formData.animauxAcceptes} onChange={(checked) => handleChange('animauxAcceptes', checked)} />
                    <Checkbox label="Non-fumeur" checked={formData.fumeur} onChange={(checked) => handleChange('fumeur', checked)} />
                  </div>
                </div>
              </div>
            ))}
            {renderSection('4. ASSURANCE', (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-background/50 border border-border/30 space-y-3">
                  <Checkbox label="Assurance annulation proposée" checked={formData.assuranceAnnulation} onChange={(checked) => handleChange('assuranceAnnulation', checked)} />
                  {formData.assuranceAnnulation && (
                    <div className="pl-7">
                      <Input label="Montant assurance annulation (MAD)" type="number" value={formData.assuranceAnnulationMontant?.toString() || ''} onChange={(e) => handleChange('assuranceAnnulationMontant', e.target.value ? Number(e.target.value) : undefined)} placeholder="150" />
                    </div>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border/30 space-y-3">
                  <Checkbox label="Assurance multirisque proposée" checked={formData.assuranceMultirisque} onChange={(checked) => handleChange('assuranceMultirisque', checked)} />
                  {formData.assuranceMultirisque && (
                    <div className="pl-7">
                      <Input label="Montant assurance multirisque (MAD)" type="number" value={formData.assuranceMultirisqueMontant?.toString() || ''} onChange={(e) => handleChange('assuranceMultirisqueMontant', e.target.value ? Number(e.target.value) : undefined)} placeholder="200" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {renderSection('5. CONDITIONS & ÉTAT DES LIEUX', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DatePicker label="Date limite d'annulation" value={formData.dateLimiteAnnulation} onChange={(e) => handleChange('dateLimiteAnnulation', e.target.value)} />
                  <Input label="Pénalité d'annulation (MAD)" type="number" value={formData.penaliteAnnulation?.toString() || ''} onChange={(e) => handleChange('penaliteAnnulation', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DatePicker label="Date état des lieux d'entrée" value={formData.edlEntree} onChange={(e) => handleChange('edlEntree', e.target.value)} />
                  <DatePicker label="Date état des lieux de sortie" value={formData.edlSortie} onChange={(e) => handleChange('edlSortie', e.target.value)} />
                </div>
                <div className="flex items-end gap-4">
                  <Checkbox label="Règlement intérieur accepté" checked={formData.reglementInterieur} onChange={(checked) => handleChange('reglementInterieur', checked)} />
                  <Checkbox label="Consentement RGPD" checked={formData.rgpdConsent} onChange={(checked) => handleChange('rgpdConsent', checked)} />
                </div>
                <Textarea label="Notes et conditions particulières" value={formData.contratNotes} onChange={(e) => handleChange('contratNotes', e.target.value)} rows={3} />
              </div>
            ))}
            {renderSection('6. GUIDE CHECK-IN', (
              <div className="space-y-3">
                {formData.guideCheckin.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-xs font-bold text-text-secondary shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <Input label={`Étape ${i + 1}`} value={step.texte} onChange={(e) => updateGuideCheckinStep(i, e.target.value)} />
                    </div>
                    <button type="button" className="h-8 w-8 rounded-lg border border-border/60 bg-card flex items-center justify-center text-text-secondary hover:text-red-500 hover:border-red-500/50 transition-all shrink-0" onClick={() => removeGuideCheckinStep(i)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-border bg-card text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all`} onClick={addGuideCheckinStep}>
                  <Plus size={14} /> Ajouter une étape
                </button>
              </div>
            ))}
            {renderSection('7. CHECKLIST DÉPART', (
              <div className="space-y-3">
                {formData.checklistDepart.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                    <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-xs font-bold text-text-secondary shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <Input label={`Étape ${i + 1}`} value={step.texte} onChange={(e) => updateChecklistDepartStep(i, 'texte', e.target.value)} />
                    </div>
                    <Checkbox label="Obligatoire" checked={step.obligatoire} onChange={(checked) => updateChecklistDepartStep(i, 'obligatoire', checked)} />
                    <button type="button" className="h-8 w-8 rounded-lg border border-border/60 bg-card flex items-center justify-center text-text-secondary hover:text-red-500 hover:border-red-500/50 transition-all shrink-0" onClick={() => removeChecklistDepartStep(i)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-border bg-card text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all`} onClick={addChecklistDepartStep}>
                  <Plus size={14} /> Ajouter une étape
                </button>
                <Textarea label="Message important" value={formData.checklistDepartMessage} onChange={(e) => handleChange('checklistDepartMessage', e.target.value)} rows={2} placeholder="Merci de confirmer votre départ via WhatsApp" />
                <Input label="Numéro WhatsApp départ" value={formData.checklistDepartWhatsapp} onChange={(e) => handleChange('checklistDepartWhatsapp', e.target.value)} placeholder="+212 6 00 00 00 00" />
              </div>
            ))}
            {renderSection('8. CARTE PRIVILÈGE - PARTENAIRES', (
              <div className="space-y-4">
                <Checkbox label="Activer la carte privilège" checked={formData.cartePrivilegeActif} onChange={(checked) => handleChange('cartePrivilegeActif', checked)} />
                {formData.cartePrivilegePartenaires.map((p, i) => (
                  <div key={i} className="p-4 rounded-lg bg-background/50 border border-border/30 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select label="Catégorie" options={[
                        { value: 'gastronomie', label: 'Gastronomie' },
                        { value: 'bien_etre', label: 'Bien-être' },
                        { value: 'loisirs', label: 'Loisirs' },
                        { value: 'transport', label: 'Transport' },
                        { value: 'culture', label: 'Culture' },
                      ]} value={p.categorie} onValueChange={(v) => updateCartePrivilegePartenaire(i, 'categorie', v)} />
                      <Input label="Remise (%)" type="number" value={p.remise} onChange={(e) => updateCartePrivilegePartenaire(i, 'remise', e.target.value)} placeholder="15" />
                    </div>
                    <Input label="Partenaire" value={p.nom} onChange={(e) => updateCartePrivilegePartenaire(i, 'nom', e.target.value)} placeholder="Restaurant Le Petit Nice" />
                    <Input label="Description" value={p.description} onChange={(e) => updateCartePrivilegePartenaire(i, 'description', e.target.value)} placeholder="Cuisine méditerranéenne étoilée" />
                    <Input label="Lien / Détails" value={p.lien} onChange={(e) => updateCartePrivilegePartenaire(i, 'lien', e.target.value)} placeholder="https://..." />
                    <button type="button" className="inline-flex items-center gap-2 text-xs font-medium text-red-500 hover:text-red-400 transition-colors" onClick={() => removeCartePrivilegePartenaire(i)}>
                      Supprimer
                    </button>
                  </div>
                ))}
                <button type="button" className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-border bg-card text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all`} onClick={addCartePrivilegePartenaire}>
                  <Plus size={14} /> Ajouter un partenaire
                </button>
              </div>
            ))}
            {renderSection('9. CONCIERGERIE D\'ACTIVITÉS', (
              <div className="space-y-4">
                <Checkbox label="Activer la conciergerie" checked={formData.conciergerieActif} onChange={(checked) => handleChange('conciergerieActif', checked)} />
                <Input label="Numéro WhatsApp réservations" value={formData.conciergerieWhatsapp} onChange={(e) => handleChange('conciergerieWhatsapp', e.target.value)} placeholder="+212 6 00 00 00 00" />
                {formData.conciergerieActivites.map((a, i) => (
                  <div key={i} className="p-4 rounded-lg bg-background/50 border border-border/30 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input label="Titre" value={a.titre} onChange={(e) => updateConciergerieActivite(i, 'titre', e.target.value)} placeholder="Excursion en mer" />
                      <Input label="Durée (heures)" type="number" value={a.duree} onChange={(e) => updateConciergerieActivite(i, 'duree', e.target.value)} placeholder="4" />
                      <Input label="Prix (MAD)" type="number" value={a.prix} onChange={(e) => updateConciergerieActivite(i, 'prix', e.target.value)} placeholder="450" />
                    </div>
                    <Input label="Description" value={a.description} onChange={(e) => updateConciergerieActivite(i, 'description', e.target.value)} placeholder="Profitez d'une expérience unique..." />
                    <Select label="Disponibilité" options={[
                      { value: 'disponible', label: 'Disponible' },
                      { value: 'sur_demande', label: 'Sur demande' },
                      { value: 'complet', label: 'Complet' },
                    ]} value={a.disponibilite} onValueChange={(v) => updateConciergerieActivite(i, 'disponibilite', v)} />
                    <div className="flex items-center gap-3">
                      <input type="file" id={`voy-activite-image-${i}`} accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) updateConciergerieActivite(i, 'image', file.name);
                      }} />
                      <label htmlFor={`voy-activite-image-${i}`} className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} cursor-pointer transition-all`}>
                        Télécharger image
                      </label>
                      <button type="button" className="inline-flex items-center gap-2 text-xs font-medium text-red-500 hover:text-red-400 transition-colors" onClick={() => removeConciergerieActivite(i)}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-border bg-card text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all`} onClick={addConciergerieActivite}>
                  <Plus size={14} /> Ajouter une activité
                </button>
              </div>
            ))}
            {renderSection('10. ASSISTANCE 24/7', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="WhatsApp urgence" value={formData.assistanceWhatsapp} onChange={(e) => handleChange('assistanceWhatsapp', e.target.value)} placeholder="+212 6 00 00 00 00" />
                <Input label="Téléphone direct" value={formData.assistanceTelephone} onChange={(e) => handleChange('assistanceTelephone', e.target.value)} placeholder="+212 6 00 00 00 00" />
                <Input label="Email urgence" type="email" value={formData.assistanceEmail} onChange={(e) => handleChange('assistanceEmail', e.target.value)} placeholder="urgence@squaremeter.com" />
                <div className="sm:col-span-2">
                  <Textarea label="Message personnalisé" value={formData.assistanceMessage} onChange={(e) => handleChange('assistanceMessage', e.target.value)} rows={3} placeholder="Notre équipe est disponible 24h/24 pour vous assister" />
                </div>
              </div>
            ))}
            {renderSection('11. DOCUMENTS JUSTIFICATIFS', (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">Documents obligatoires :</p>
                {[
                  { label: "Pièce d'identité (passeport ou CIN)", required: true, inputId: 'voy-doc-identite', field: 'docIdentiteUrl' as const, nameField: 'docIdentiteName' as const, uploaded: formData.docIdentiteUrl },
                  { label: 'Contrat de location signé', required: true, inputId: 'voy-doc-contrat', field: 'contratPdfUrl' as const, nameField: null, uploaded: formData.contratPdfUrl },
                  { label: 'Preuve de paiement (acompte)', required: true, inputId: 'voy-doc-paiement', field: 'docPaiementUrl' as const, nameField: 'docPaiementName' as const, uploaded: formData.docPaiementUrl },
                  { label: 'Justificatif de domicile', required: false, inputId: 'voy-doc-domicile', field: 'docDomicileUrl' as const, nameField: 'docDomicileName' as const, uploaded: formData.docDomicileUrl },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                    <span className="text-sm text-text flex-1">{doc.label}</span>
                    {doc.required ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-error/10 text-error font-medium">Obligatoire</span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'} font-medium`}>Recommandé</span>
                    )}
                    {doc.uploaded ? (
                      <span className="text-[10px] font-medium text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        Uploadé
                      </span>
                    ) : null}
                    <div className="relative">
                      <input id={doc.inputId} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const urls = await uploadFiles([file]);
                          if (urls[0]) {
                            handleChange(doc.field, urls[0]);
                            if (doc.nameField) handleChange(doc.nameField, file.name);
                          }
                        } catch { /* upload failed */ }
                      }} />
                      <button type="button" onClick={() => document.getElementById(doc.inputId)?.click()} className={`text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all`}>{doc.uploaded ? 'Remplacer' : 'Parcourir...'}</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {renderSection('12. SIGNATURES', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-background/50">
                    <p className="text-sm font-medium text-text mb-2">✍️ Signature du voyageur</p>
                    <div className="h-16 rounded border border-dashed border-text-secondary/30 flex items-center justify-center text-text-secondary text-xs">Champ de signature électronique</div>
                    <p className="text-xs text-text-secondary mt-1">ou document signé téléchargé</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-background/50">
                    <p className="text-sm font-medium text-text mb-2">✍️ Signature de l'agent</p>
                    <div className="h-16 rounded border border-dashed border-text-secondary/30 flex items-center justify-center text-text-secondary text-xs">Champ de signature électronique</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DatePicker label="Date de signature" value={formData.dateReservation} onChange={(e) => handleChange('dateReservation', e.target.value)} />
                  <div>
                    <p className="block text-sm font-medium text-text mb-1.5">Fichier du contrat signé</p>
                    <div className="h-9 flex items-center gap-3 px-3 rounded-lg border border-border bg-background/50">
                      <span className="text-sm text-text-secondary flex-1">{formData.contratPdfUrl || 'Upload PDF'}</span>
                      <button type="button" onClick={() => document.getElementById('contrat-upload')?.click()} className={`text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all`}>Parcourir...</button>
                    </div>
                    <input id="contrat-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const urls = await uploadFiles([file]); if (urls[0]) handleChange('contratPdfUrl', urls[0]); } catch { /* upload failed */ } }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
    <AnimatePresence>
      {loadingDraft && null}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl mx-4 bg-card rounded-xl border border-border/50 shadow-modal flex flex-col max-h-[calc(100vh-48px)]"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-card z-10 shrink-0">
            <h2 className="text-lg font-semibold">{editingClient ? 'Modifier le voyageur' : 'Nouveau voyageur'}</h2>
            <div className="flex items-center gap-3">
              {loadingDraft ? (
                <span className="text-xs text-text-secondary">Chargement du brouillon...</span>
              ) : savedDraftId ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-600 bg-emerald-50 rounded-lg">
                  Auto-sauvegardé
                </span>
              ) : !editingClient ? (
                <button
                  type="button"
                  onClick={doSaveDraft}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border/60 hover:bg-border/20 transition-colors flex items-center gap-1.5"
                >
                  Brouillon
                </button>
              ) : null}
              <CompletionRing percent={calcCompletion(formData)} size={32} strokeWidth={3} />
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 py-1 border-b border-border/30 flex gap-1 overflow-x-auto bg-card z-10 shrink-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setStep(t.id)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                  step === t.id ? (isGerant ? 'text-[#905D5D] border-[#905D5D]' : 'text-accent border-accent') : 'text-text-secondary border-transparent hover:text-text'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 p-6">
            <div className="flex-1 overflow-y-auto min-h-0">
              {renderTabContent()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 mt-6 border-t border-border/30 shrink-0">
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                    Précédent
                  </Button>
                )}
                {!savedDraftId && !editingClient && (
                  <Button type="button" variant="outline" onClick={doSaveDraft}>
                    <Save size={14} className="inline mr-1" />
                    Enregistrer comme brouillon
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                  Annuler
                </Button>
                {step < 8 ? (
                  <Button type="button" variant="default" className={isGerant ? GERANT_BUTTON_CLASSES : ''} onClick={() => {
                    if (step === 1 && !formData.contactId) {
                      setErrors(prev => ({ ...prev, contactId: 'Veuillez sélectionner ou créer un contact' }));
                      return;
                    }
                    setErrors(prev => ({ ...prev, contactId: undefined }));
                    setStep(step + 1);
                  }}>
                    Suivant
                  </Button>
                ) : (
                  <Button type="button" variant="default" className={isGerant ? GERANT_BUTTON_CLASSES : ''} onClick={submitForm} loading={isSubmitting}>
                    {isSubmitting ? 'Enregistrement...' : editingClient ? 'Mettre à jour le voyageur' : 'Créer le voyageur'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
    {showContactForm && (
      <ContactFormModal
        onClose={() => setShowContactForm(false)}
        onSubmit={async (data) => {
          try {
            const created = await createContact(data);
            refreshContacts();
            setFormData(prev => ({ ...prev, contactId: String(created.id) }));
            setShowContactForm(false);
          } catch {
          }
        }}
      />
    )}
    </>
  );
};