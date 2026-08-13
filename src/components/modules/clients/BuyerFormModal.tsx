import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Save, Upload, Eye, Search } from 'react-feather';
import { Client } from '../../../types/client';
import { AGENTS } from '../../../types/calendar';
import { DatePicker } from '../../ui/DatePicker';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Checkbox } from '../../ui/Checkbox';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { LocationMap } from '../properties/AddPropertyForm/LocationMap';
import { saveDraft, getDraft, deleteDraft } from '../../../services/clientDraftStorage';
import { CompletionRing } from '../../ui/CompletionRing';
import { api } from '../../../services/api';
import { uploadFiles } from '../../../services/uploadService';
import { fetchContacts, createContact } from '../../../services/contactService';
import { ContactFormModal } from '../contacts/ContactFormModal';

const USER_CACHE: Record<string, string> = {};

const GERANT_BUTTON_CLASSES = 'bg-[#905D5D] hover:bg-[#7D5050] border-[#905D5D] hover:border-[#7D5050] text-white shadow-[0_10px_24px_rgba(144,93,93,0.35)]'

interface AssignmentInfo {
  assignedType: 'agent' | 'admin';
  assignedName: string;
}

interface BuyerFormModalProps {
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

export function resetBuyerFormData(): BuyerFormData {
  const today = new Date().toISOString().split('T')[0];
  const inSixMonths = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const generateMandatNumber = () => `MA-${new Date().getFullYear()}-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`;
  return {
    actif: true,
    croisementAutomatique: true,
    classification: 'Actif',
    statutMetier: 'En qualification',
    contactId: '',
    origine: '',
    plan: '',
    localisation: 'Maroc',
    secteur: '',
    adresseComplete: '',
    complementAdresse: '',
    codePostalVille: '',
    pays: 'Maroc',
    categorie: '',
    typeBien: '',
    piecesOperator: 'ge',
    pieces: undefined,
    chambresOperator: 'ge',
    chambres: undefined,
    surfaceMin: undefined,
    surfaceMax: undefined,
    prixMin: undefined,
    prixMax: undefined,
    devise: 'MAD',
    etageOperator: 'ge',
    etage: undefined,
    vue: '',
    exposition: '',
    etat: '',
    standing: '',
    disponibilite: '',
    attributPrincipal: '',
    attributsPersonnalises: [],
    criteres: [],
    proximites: { transports: [], commerces: [], education: [], sante: [], loisirs: [] },
    prestations: { exterieur: [], confort: [], electromenager: [], multimedia: [], sport: [] },
    typeFinancement: '',
    montantTotal: undefined,
    descriptionAutreFinancement: '',
    apport: undefined,
    dureePret: '',
    capaciteEmprunt: 0,
    situationActuelle: '',
    urgence: '',
    dateEmmenagement: '',
    notesComplementaires: '',
    numeroMandat: generateMandatNumber(),
    dateSignature: today,
    dateDebut: today,
    dateExpiration: inSixMonths,
    statutMandat: 'Non défini',
    typeMandat: '',
    conjoint: '',
    societe: '',
    agentDesigne: '',
    typeRemuneration: '',
    montantRemuneration: undefined,
    remunerationIsPercentage: false,
    conditionPaiement: '',
    dureeProtection: '',
    mandatPdfUrl: '',
    mandatPdfName: '',
    docIdentiteUrl: '',
    docIdentiteName: '',
    docDomicileUrl: '',
    docDomicileName: '',
    docRevenusUrl: '',
    docRevenusName: '',
    docFinancementUrl: '',
    docFinancementName: '',
    docBancaireUrl: '',
    docBancaireName: '',
    revenusMensuelsNets: undefined,
    revenusSupplementaires: undefined,
    chargesCredit: undefined,
    chargesFixes: undefined,
    montantPretSouhaite: undefined,
    taeg: undefined,
    assuranceEmprunteur: undefined,
    banqueSollicitee: '',
    tauxEnvisage: undefined,
    statutFinancement: '',
    dateObtentionPret: '',
    attestationPretUrl: '',
    latitude: 0,
    longitude: 0,
    bienConcerneId: '',
  };
}

const STATUT_METIER_OPTIONS = [
  { value: 'En qualification', label: 'En qualification' },
  { value: 'En recherche', label: 'En recherche' },
  { value: 'En negociation', label: 'En négociation' },
  { value: 'En compromis', label: 'En compromis' },
  { value: 'Vendu / Achete', label: 'Vendu / Acheté' },
  { value: 'Inactif', label: 'Inactif' },
  { value: 'Perdu', label: 'Perdu' },
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

const CATEGORIES = [
  { value: 'Vente', label: 'Vente' },
  { value: 'Location', label: 'Location' },
  { value: 'Location saisonniere', label: 'Location saisonnière' },
  { value: 'Programme', label: 'Programme' },
  { value: 'Viager', label: 'Viager' },
  { value: 'Enchere', label: 'Enchère' },
];

const TYPE_BIEN_OPTIONS = [
  { value: 'Appartement', label: 'Appartement' },
  { value: 'Maison', label: 'Maison' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Riad', label: 'Riad' },
  { value: 'Terrain', label: 'Terrain' },
  { value: 'Ferme', label: 'Ferme' },
  { value: 'Local commercial', label: 'Local commercial' },
  { value: 'Bureau', label: 'Bureau' },
  { value: 'Immeuble', label: 'Immeuble' },
  { value: 'Garage / Parking', label: 'Garage / Parking' },
  { value: 'Commerce', label: 'Commerce' },
  { value: 'Bateau', label: 'Bateau' },
  { value: 'Locaux activite', label: 'Locaux activité / Entrepos' },
  { value: 'Cave / Box', label: 'Cave / Box' },
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

const DISPONIBILITE_OPTIONS = [
  { value: 'Immediate', label: 'Immédiate' },
  { value: '1 mois', label: '1 mois' },
  { value: '3 mois', label: '3 mois' },
  { value: '6 mois', label: '6 mois' },
  { value: '1 an', label: '1 an' },
  { value: 'Flexible', label: 'Flexible' },
];

const ATTRIBUTS_PRINCIPAUX = [
  { value: 'Selection', label: 'Sélection / Coup de coeur' },
  { value: 'Investissement locatif', label: 'Investissement locatif' },
  { value: 'Premiere occupation', label: 'Première occupation' },
  { value: 'Profession liberale', label: 'Profession libérale' },
  { value: 'Residence de tourisme', label: 'Résidence de tourisme' },
  { value: 'Residence etudiants', label: 'Résidence étudiants' },
  { value: 'Residence secondaire', label: 'Résidence secondaire' },
  { value: 'Residence seniors', label: 'Résidence séniors' },
  { value: 'Villegiature', label: 'Villégiature' },
];

const ATTRIBUTS_PERSONNALISES = [
  { value: 'Avec VNA', label: 'Avec VNA' },
  { value: 'Cheminee', label: 'Cheminée' },
  { value: 'Piscine chauffee', label: 'Piscine chauffée' },
  { value: 'Pool house', label: 'Pool house' },
  { value: 'Puits', label: 'Puits' },
  { value: 'Studio Independant', label: 'Studio Indépendant' },
  { value: 'Suite parental', label: 'Suite parental' },
  { value: 'Vue ocean', label: 'Vue océan' },
  { value: 'Zone urbaine', label: 'Zone urbaine' },
];

const CRITERES_BASE = [
  { value: 'Garage', label: 'Garage' },
  { value: 'Parking', label: 'Parking' },
  { value: 'Cave', label: 'Cave' },
  { value: 'Terrasse', label: 'Terrasse' },
  { value: 'Balcon', label: 'Balcon' },
  { value: 'Jardin', label: 'Jardin' },
  { value: 'Terrain', label: 'Terrain' },
  { value: 'Acces PMR', label: 'Accès PMR' },
  { value: 'Air conditionne', label: 'Air conditionné' },
  { value: 'Ascenseur', label: 'Ascenseur' },
  { value: 'Piscine', label: 'Piscine' },
];

const PROXIMITES_TRANSPORTS = [
  { value: 'Aeroport', label: 'Aéroport' },
  { value: 'Autoroute', label: 'Autoroute' },
  { value: 'Bus', label: 'Bus' },
  { value: 'Gare', label: 'Gare' },
  { value: 'Gare routiere', label: 'Gare routière' },
  { value: 'Metro', label: 'Métro' },
  { value: 'Parking public', label: 'Parking public' },
  { value: 'Port', label: 'Port' },
  { value: 'Route principale', label: 'Route principale' },
  { value: 'Taxi', label: 'Taxi' },
  { value: 'Tram', label: 'Tram' },
];

const PROXIMITES_COMMERCES = [
  { value: 'Centre ville', label: 'Centre ville' },
  { value: 'Commerces', label: 'Commerces' },
  { value: 'Supermarché', label: 'Supermarché' },
];

const PROXIMITES_EDUCATION = [
  { value: 'Creche', label: 'Crèche' },
  { value: 'Ecole primaire', label: 'Ecole primaire' },
  { value: 'Ecole secondaire', label: 'Ecole secondaire' },
  { value: 'Garderie', label: 'Garderie' },
  { value: 'Universite', label: 'Université' },
];

const PROXIMITES_SANTE = [
  { value: 'Golf', label: 'Golf' },
  { value: 'Hopital / Clinique', label: 'Hôpital / Clinique' },
  { value: 'Medecin', label: 'Médecin' },
  { value: 'Piscine publique', label: 'Piscine publique' },
  { value: 'Salle de sport', label: 'Salle de sport' },
  { value: 'Tennis', label: 'Tennis' },
];

const PROXIMITES_LOISIRS = [
  { value: 'Cinema', label: 'Cinéma' },
  { value: 'Lac', label: 'Lac' },
  { value: 'Mer', label: 'Mer' },
  { value: 'Palais des congres', label: 'Palais des congrès' },
  { value: 'Parc', label: 'Parc' },
  { value: 'Pistes de ski', label: 'Pistes de ski' },
  { value: 'Plage', label: 'Plage' },
];

const PRESTATIONS_EXTERIEUR = [
  { value: 'Abri voiture', label: 'Abri voiture' },
  { value: 'Acces PMR', label: 'Accès PMR' },
  { value: 'Alarme', label: 'Alarme' },
  { value: 'Alarme incendie', label: 'Alarme incendie' },
  { value: 'Arrosage', label: 'Arrosage' },
  { value: 'Barbecue', label: 'Barbecue' },
  { value: 'Cloture', label: 'Clôture' },
  { value: 'Concierge', label: 'Concierge' },
  { value: 'Controle acces', label: 'Contrôle accès' },
  { value: 'Digicode', label: 'Digicode' },
  { value: 'Eclairage exterieur', label: 'Eclairage extérieur' },
  { value: 'Gardien', label: 'Gardien' },
  { value: 'Interphone', label: 'Interphone' },
  { value: 'Maison gardien', label: 'Maison gardien' },
  { value: 'Panneaux photovoltaiques', label: 'Panneaux photovoltaïques' },
  { value: 'Panneaux solaires', label: 'Panneaux solaires' },
  { value: 'Portail electrique', label: 'Portail électrique' },
  { value: 'Porte blindee', label: 'Porte blindée' },
  { value: 'Puits', label: 'Puits' },
  { value: 'Video surveillance', label: 'Vidéo surveillance' },
  { value: 'Videophone', label: 'Vidéophone' },
  { value: 'Volets roulants electriques', label: 'Volets roulants électriques' },
];

const PRESTATIONS_CONFORT = [
  { value: 'Adoucisseur eau', label: 'Adoucisseur eau' },
  { value: 'Air conditionne', label: 'Air conditionné' },
  { value: 'Ascenseur', label: 'Ascenseur' },
  { value: 'Aspiration centralisee', label: 'Aspiration centralisée' },
  { value: 'Baignoire balneo', label: 'Baignoire balnéo' },
  { value: 'Cave', label: 'Cave' },
  { value: 'Cheminee', label: 'Cheminée' },
  { value: 'Coffre-fort', label: 'Coffre-fort' },
  { value: 'Domotique', label: 'Domotique' },
  { value: 'Double vitrage', label: 'Double vitrage' },
  { value: 'Fibre optique', label: 'Fibre optique' },
  { value: 'Jacuzzi', label: 'Jacuzzi' },
  { value: 'Meuble', label: 'Meublé' },
  { value: 'Moustiquaire', label: 'Moustiquaire' },
  { value: 'Piscine', label: 'Piscine' },
  { value: 'Sauna', label: 'Sauna' },
  { value: 'Spa', label: 'Spa' },
  { value: 'Stores electriques', label: 'Stores électriques' },
  { value: 'Television', label: 'Télévision' },
  { value: 'Thermostat connecte', label: 'Thermostat connecté' },
  { value: 'Triple vitrage', label: 'Triple vitrage' },
  { value: 'Ventilation double flux', label: 'Ventilation double flux' },
];

const PRESTATIONS_ELECTROMENAGER = [
  { value: 'Cafetiere', label: 'Cafetière' },
  { value: 'Congelateur', label: 'Congélateur' },
  { value: 'Cuisiniere', label: 'Cuisinière' },
  { value: 'Fer a repasser', label: 'Fer à repasser' },
  { value: 'Four', label: 'Four' },
  { value: 'Four micro-ondes', label: 'Four micro-ondes' },
  { value: 'Lave-linge', label: 'Lave-linge' },
  { value: 'Lave-vaisselle', label: 'Lave-vaisselle' },
  { value: 'Refrigerateur', label: 'Réfrigirateur' },
  { value: 'Seche-cheveux', label: 'Sèche-cheveux' },
  { value: 'Seche-linge', label: 'Sèche-linge' },
  { value: 'Vaisselle', label: 'Vaisselle' },
  { value: 'Linge de maison', label: 'Linge de maison' },
];

const PRESTATIONS_MULTIMEDIA = [
  { value: 'Internet', label: 'Internet' },
  { value: 'Lecteur CD', label: 'Lecteur CD' },
  { value: 'Lecteur DVD', label: 'Lecteur DVD' },
  { value: 'Reseau informatique', label: 'Réseau informatique' },
  { value: 'Teledistribution', label: 'Télédistribution' },
  { value: 'Telephone', label: 'Téléphone' },
];

const PRESTATIONS_SPORT = [
  { value: 'Canoe', label: 'Canoé' },
  { value: 'Golf', label: 'Golf' },
  { value: 'Jet ski', label: 'Jet ski' },
  { value: 'Jeu de boules', label: 'Jeu de boules' },
  { value: 'Kite surf', label: 'Kite surf' },
  { value: 'Paddle', label: 'Paddle' },
  { value: 'Peche', label: 'Pêche' },
  { value: 'Plongee', label: 'Plongée' },
  { value: 'Scooter', label: 'Scooter' },
  { value: 'Seabob', label: 'Seabob' },
  { value: 'Segway', label: 'Segway' },
  { value: 'Tennis', label: 'Tennis' },
  { value: 'Toboggan', label: 'Toboggan' },
  { value: 'Velos', label: 'Vélos' },
  { value: 'Wakeboard', label: 'Wakeboard' },
];

const FINANCEMENT_OPTIONS = [
  { value: 'Apport personnel', label: 'Apport personnel' },
  { value: 'Pret bancaire', label: 'Prêt bancaire' },
  { value: 'Comptant', label: 'Comptant' },
  { value: 'Autre', label: 'Autre' },
];

const DUREE_PRET_OPTIONS = [
  { value: '5', label: '5 ans' },
  { value: '10', label: '10 ans' },
  { value: '15', label: '15 ans' },
  { value: '20', label: '20 ans' },
  { value: '25', label: '25 ans' },
];

const BANQUE_OPTIONS = [
  { value: 'Attijariwafa', label: 'Attijariwafa' },
  { value: 'BMCE', label: 'BMCE' },
  { value: 'Societe Generale', label: 'Société Générale' },
  { value: 'Credit Agricole', label: 'Crédit Agricole' },
  { value: 'CIH', label: 'CIH' },
  { value: 'CFG Bank', label: 'CFG Bank' },
  { value: 'Autre', label: 'Autre' },
];

const SITUATION_ACTUELLE_OPTIONS = [
  { value: 'Locataire', label: 'Locataire' },
  { value: 'Proprietaire', label: 'Propriétaire' },
  { value: 'Heberge', label: 'Hébergé' },
  { value: 'Autre', label: 'Autre' },
];

const FINANCEMENT_STATUT_OPTIONS = [
  { value: 'En cours', label: 'En cours' },
  { value: 'Accorde', label: 'Accordé' },
  { value: 'Refuse', label: 'Refusé' },
];

const URGENCE_OPTIONS = [
  { value: 'Immediate', label: 'Immédiate' },
  { value: '3 mois', label: '3 mois' },
  { value: '6 mois', label: '6 mois' },
  { value: 'Flexible', label: 'Flexible' },
];

const STATUT_MANDAT_OPTIONS = [
  { value: 'Non défini', label: 'Non défini' },
  { value: 'En attente de signature', label: 'En attente de signature' },
  { value: 'Actif', label: 'Actif' },
  { value: 'Expire', label: 'Expiré' },
  { value: 'Resilie', label: 'Résilié' },
  { value: 'Termine', label: 'Terminé' },
];

const TYPE_MANDAT_OPTIONS = [
  { value: 'Exclusif', label: 'Exclusif' },
  { value: 'Non-exclusif', label: 'Non-exclusif (simple)' },
];

const REMUNERATION_TYPE_OPTIONS = [
  { value: 'Commission sur prix achat', label: 'Commission sur prix d\'achat' },
  { value: 'Forfait', label: 'Forfait' },
  { value: 'Honoraires horaires', label: 'Honoraires horaires' },
];

const PAIEMENT_CONDITION_OPTIONS = [
  { value: 'Signature compromis', label: 'À la signature du compromis' },
  { value: 'Vente definitive', label: 'À la vente définitive' },
];

interface ProximiteCategorie {
  transports: string[];
  commerces: string[];
  education: string[];
  sante: string[];
  loisirs: string[];
}

interface PrestationCategorie {
  exterieur: string[];
  confort: string[];
  electromenager: string[];
  multimedia: string[];
  sport: string[];
}

interface BuyerFormData {
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
  categorie: string;
  typeBien: string;
  piecesOperator: string;
  pieces: number | undefined;
  chambresOperator: string;
  chambres: number | undefined;
  surfaceMin: number | undefined;
  surfaceMax: number | undefined;
  prixMin: number | undefined;
  prixMax: number | undefined;
  devise: string;
  etageOperator: string;
  etage: number | undefined;
  vue: string;
  exposition: string;
  etat: string;
  standing: string;
  disponibilite: string;
  attributPrincipal: string;
  attributsPersonnalises: string[];
  criteres: string[];
  proximites: ProximiteCategorie;
  prestations: PrestationCategorie;
  typeFinancement: string;
  montantTotal: number | undefined;
  descriptionAutreFinancement: string;
  apport: number | undefined;
  dureePret: string;
  capaciteEmprunt: number;
  situationActuelle: string;
  urgence: string;
  dateEmmenagement: string;
  notesComplementaires: string;
  numeroMandat: string;
  dateSignature: string;
  dateDebut: string;
  dateExpiration: string;
  statutMandat: string;
  typeMandat: string;
  conjoint: string;
  societe: string;
  agentDesigne: string;
  typeRemuneration: string;
  montantRemuneration: number | undefined;
  remunerationIsPercentage: boolean;
  conditionPaiement: string;
  dureeProtection: string;
  mandatPdfUrl: string;
  mandatPdfName: string;
  docIdentiteUrl: string;
  docIdentiteName: string;
  docDomicileUrl: string;
  docDomicileName: string;
  docRevenusUrl: string;
  docRevenusName: string;
  docFinancementUrl: string;
  docFinancementName: string;
  docBancaireUrl: string;
  docBancaireName: string;
  revenusMensuelsNets: number | undefined;
  revenusSupplementaires: number | undefined;
  chargesCredit: number | undefined;
  chargesFixes: number | undefined;
  montantPretSouhaite: number | undefined;
  taeg: number | undefined;
  assuranceEmprunteur: number | undefined;
  banqueSollicitee: string;
  tauxEnvisage: number | undefined;
  statutFinancement: string;
  dateObtentionPret: string;
  attestationPretUrl: string;
  latitude: number;
  longitude: number;
  bienConcerneId: string;
}

const TABS = [
  { id: 1, label: 'Général' },
  { id: 2, label: 'Localisation & Type' },
  { id: 3, label: 'Caractéristiques' },
  { id: 4, label: 'Attributs & Critères' },
  { id: 5, label: 'Proximités' },
  { id: 6, label: 'Prestations' },
  { id: 7, label: 'Financement & Notes' },
  { id: 8, label: 'Mandat' },
];

const generateMandatNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `MDR-${year}-${random}`;
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
const inSixMonths = formatDate(addMonths(new Date(), 6));

export const BuyerFormModal = ({ onClose, onSubmit, assignmentInfo, draftId: initialDraftId, userId, onDraftChange, client: editingClient, selectedContactId, isGerant = false }: BuyerFormModalProps) => {
  const [step, setStep] = useState(1);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactOptions, setContactOptions] = useState<{value: string; label: string}[]>([]);
  const [formData, setFormData] = useState<BuyerFormData>({
    actif: true,
    croisementAutomatique: true,
    classification: 'Actif',
    statutMetier: 'En qualification',
    contactId: selectedContactId || '',
    origine: '',
    plan: '',
    localisation: 'Maroc',
    secteur: '',
    adresseComplete: '',
    complementAdresse: '',
    codePostalVille: '',
    pays: 'Maroc',
    categorie: '',
    typeBien: '',
    piecesOperator: 'ge',
    pieces: undefined,
    chambresOperator: 'ge',
    chambres: undefined,
    surfaceMin: undefined,
    surfaceMax: undefined,
    prixMin: undefined,
    prixMax: undefined,
    devise: 'MAD',
    etageOperator: 'ge',
    etage: undefined,
    vue: '',
    exposition: '',
    etat: '',
    standing: '',
    disponibilite: '',
    attributPrincipal: '',
    attributsPersonnalises: [],
    criteres: [],
    proximites: { transports: [], commerces: [], education: [], sante: [], loisirs: [] },
    prestations: { exterieur: [], confort: [], electromenager: [], multimedia: [], sport: [] },
    typeFinancement: '',
    montantTotal: undefined,
    descriptionAutreFinancement: '',
    apport: undefined,
    dureePret: '',
    capaciteEmprunt: 0,
    situationActuelle: '',
    urgence: '',
    dateEmmenagement: '',
    notesComplementaires: '',
    numeroMandat: generateMandatNumber(),
    dateSignature: today,
    dateDebut: today,
    dateExpiration: inSixMonths,
    statutMandat: 'Non défini',
    typeMandat: '',
    conjoint: '',
    societe: '',
    agentDesigne: '',
    typeRemuneration: '',
    montantRemuneration: undefined,
    remunerationIsPercentage: false,
    conditionPaiement: '',
    dureeProtection: '',
    mandatPdfUrl: '',
    mandatPdfName: '',
    docIdentiteUrl: '',
    docIdentiteName: '',
    docDomicileUrl: '',
    docDomicileName: '',
    docRevenusUrl: '',
    docRevenusName: '',
    docFinancementUrl: '',
    docFinancementName: '',
    docBancaireUrl: '',
    docBancaireName: '',
    revenusMensuelsNets: undefined,
    revenusSupplementaires: undefined,
    chargesCredit: undefined,
    chargesFixes: undefined,
    montantPretSouhaite: undefined,
    taeg: undefined,
    assuranceEmprunteur: undefined,
    banqueSollicitee: '',
    tauxEnvisage: undefined,
    statutFinancement: '',
    dateObtentionPret: '',
    attestationPretUrl: '',
    latitude: 0,
    longitude: 0,
    bienConcerneId: '',
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

  const selectedContactName = formData.contactId ? (contactOptions.find(o => o.value === formData.contactId)?.label || '') : '';

  useEffect(() => {
    if (!editingClient) return;
    const c = editingClient as any;
    setFormData(prev => ({
      ...prev,
      actif: editingClient.status === 'Actif',
      croisementAutomatique: editingClient.croisementAutomatique ?? true,
      classification: editingClient.classification || 'Actif',
      statutMetier: editingClient.statutMetier || 'En qualification',
      contactId: editingClient.contactId || '',
      origine: editingClient.source || '',
      localisation: editingClient.localisation || '',
      secteur: editingClient.secteur || editingClient.area || '',
      adresseComplete: (editingClient as any).adresseComplete || '',
      complementAdresse: (editingClient as any).complementAdresse || '',
      codePostalVille: (editingClient as any).codePostalVille || '',
      pays: (editingClient as any).pays || 'Maroc',
      categorie: editingClient.categorie || '',
      typeBien: editingClient.propertyType || '',
      piecesOperator: editingClient.piecesOperator || 'ge',
      pieces: editingClient.pieces,
      chambresOperator: editingClient.chambresOperator || 'ge',
      chambres: editingClient.chambres,
      surfaceMin: c.surfaceMin,
      surfaceMax: editingClient.surfaceMax,
      prixMin: editingClient.prixMin,
      prixMax: editingClient.prixMax || editingClient.budget,
      devise: editingClient.devise || 'MAD',
      etageOperator: editingClient.etageOperator || 'ge',
      etage: editingClient.etage,
      vue: editingClient.vue || '',
      exposition: editingClient.exposition || '',
      etat: editingClient.etat || '',
      standing: editingClient.standing || '',
      disponibilite: editingClient.disponibilite || '',
      attributPrincipal: editingClient.attributPrincipal || '',
      attributsPersonnalises: editingClient.attributsPersonnalises || [],
      criteres: editingClient.criteres || [],
      proximites: editingClient.proximites || { transports: [], commerces: [], education: [], sante: [], loisirs: [] },
      prestations: editingClient.prestations || { exterieur: [], confort: [], electromenager: [], multimedia: [], sport: [] },
      typeFinancement: c.typeFinancement || '',
      montantTotal: c.montantTotal,
      descriptionAutreFinancement: c.descriptionAutreFinancement || '',
      apport: c.apport,
      dureePret: c.dureePret?.toString() || '',
      capaciteEmprunt: editingClient.capaciteEmprunt || 0,
      situationActuelle: c.situationActuelle || '',
      urgence: c.urgence || editingClient.urgency || '',
      dateEmmenagement: c.dateEmmenagement || '',
      notesComplementaires: editingClient.notes || '',
      numeroMandat: editingClient.numeroMandat || prev.numeroMandat,
      dateSignature: editingClient.dateSignature || prev.dateSignature,
      dateDebut: editingClient.dateDebut || prev.dateDebut,
      dateExpiration: editingClient.dateExpiration || prev.dateExpiration,
      statutMandat: editingClient.statutMandat || 'Non défini',
      typeMandat: editingClient.typeMandat || '',
      conjoint: editingClient.conjoint || '',
      societe: editingClient.societe || '',
      agentDesigne: editingClient.agentDesigne || editingClient.agentId || '',
      typeRemuneration: editingClient.typeRemuneration || '',
      montantRemuneration: editingClient.montantRemuneration,
      remunerationIsPercentage: editingClient.remunerationIsPercentage ?? false,
      conditionPaiement: editingClient.conditionPaiement || '',
      dureeProtection: editingClient.dureeProtection || '',
      mandatPdfUrl: editingClient.mandatPdfUrl || '',
      mandatPdfName: '',
      docIdentiteUrl: (editingClient as any).docIdentiteUrl || '',
      docIdentiteName: '',
      docDomicileUrl: (editingClient as any).docDomicileUrl || '',
      docDomicileName: '',
      docRevenusUrl: (editingClient as any).docRevenusUrl || '',
      docRevenusName: '',
      docFinancementUrl: (editingClient as any).docFinancementUrl || '',
      docFinancementName: '',
      docBancaireUrl: (editingClient as any).docBancaireUrl || '',
      docBancaireName: '',
      revenusMensuelsNets: c.revenusMensuelsNets,
      revenusSupplementaires: c.revenusSupplementaires,
      chargesCredit: c.chargesCredit,
      chargesFixes: c.chargesFixes,
      montantPretSouhaite: c.montantPretSouhaite,
      taeg: c.taeg,
      assuranceEmprunteur: c.assuranceEmprunteur,
      banqueSollicitee: editingClient.banqueSollicitee || '',
      tauxEnvisage: editingClient.tauxEnvisage,
      statutFinancement: editingClient.statutFinancement || '',
      dateObtentionPret: editingClient.dateObtentionPret || '',
      attestationPretUrl: editingClient.attestationPretUrl || '',
      latitude: c.latitude || 0,
      longitude: c.longitude || 0,
      bienConcerneId: c.bienConcerneId || '',
    }));
  }, [editingClient]);

  useEffect(() => {
    if (assignmentInfo?.assignedName && !editingClient) {
      setFormData(prev => ({ ...prev, agentDesigne: assignmentInfo.assignedName }));
    }
  }, [assignmentInfo, editingClient]);

  const [, setUsersFetched] = useState(false);
  useEffect(() => {
    api.get<any>('/auth/me').then((u: any) => {
      if (u) {
        const name = [u.first_name || '', u.last_name || ''].filter(Boolean).join(' ').trim() || u.email || 'Inconnu';
        USER_CACHE[String(u.id)] = name;
      }
    }).catch(() => {});
    api.get<any[]>('/admin/users').then((list: any[]) => {
      if (Array.isArray(list)) {
        for (const u of list) {
          const name = [u.first_name || '', u.last_name || ''].filter(Boolean).join(' ').trim() || u.email || 'Inconnu';
          USER_CACHE[String(u.id)] = name;
        }
      }
      setUsersFetched(true);
    }).catch(() => { setUsersFetched(true); });
  }, []);

  const [vendeurProperties, setVendeurProperties] = useState<any[]>([]);
  const [vendeurs, setVendeurs] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);

  useEffect(() => {
    setLoadingProperties(true);
    Promise.all([
      api.get<any[]>('/properties'),
      api.get<any[]>('/admin/users').catch(() => []),
    ]).then(([properties, users]) => {
      setVendeurProperties(Array.isArray(properties) ? properties : []);
      const vList = Array.isArray(users) ? users.filter((u: any) => u.role === 'vendeur') : [];
      setVendeurs(vList);
    }).catch(() => {}).finally(() => setLoadingProperties(false));
  }, []);

  const matchedProperties = useMemo(() => {
    if (!propertySearch.trim()) return [];
    const q = propertySearch.toLowerCase();
    return vendeurProperties.filter((p: any) => {
      if (p.transactionType !== 'vente' || p.status !== 'for_sale') return false;
      const title = (p.title || '').toLowerCase();
      const ref = (p.reference || '').toLowerCase();
      const city = (p.city || '').toLowerCase();
      const location = (p.location || '').toLowerCase();
      const vendeurId = String(p.client_id || '');
      const vendeur = vendeurs.find((v: any) => String(v.id) === vendeurId);
      const vendeurName = vendeur ? `${vendeur.first_name || ''} ${vendeur.last_name || ''}`.trim().toLowerCase() : '';
      return title.includes(q) || ref.includes(q) || city.includes(q) || location.includes(q) || vendeurName.includes(q);
    }).slice(0, 8);
  }, [propertySearch, vendeurProperties, vendeurs]);

  const selectedProperty = useMemo(() => {
    if (!formData.bienConcerneId) return null;
    return vendeurProperties.find((p: any) => String(p.id) === formData.bienConcerneId) || null;
  }, [formData.bienConcerneId, vendeurProperties]);

  const [errors, setErrors] = useState<Partial<Record<keyof BuyerFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  const [savedDraftId, setSavedDraftId] = useState<string | undefined>(initialDraftId || undefined);
  const [loadingDraft, setLoadingDraft] = useState(!!initialDraftId);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  useEffect(() => {
    const sectionsFilled = {
      infoGenerales: formData.numeroMandat && formData.dateDebut && formData.dateExpiration,
      typeMandat: formData.typeMandat,
      partiesContrat: formData.conjoint || formData.societe || formData.agentDesigne,
      description: formData.typeBien && (formData.prixMin || formData.prixMax) && formData.surfaceMin,
      remuneration: formData.typeRemuneration,
      clauseProtection: formData.dureeProtection,
    };
    const allFilled = Object.values(sectionsFilled).every(Boolean);
    if (allFilled) {
      setFormData(prev => prev.statutMandat !== 'En attente de signature' ? { ...prev, statutMandat: 'En attente de signature' } : prev);
    } else {
      setFormData(prev => prev.statutMandat !== 'Non défini' ? { ...prev, statutMandat: 'Non défini' } : prev);
    }
  }, [
    formData.numeroMandat, formData.dateDebut, formData.dateExpiration,
    formData.typeMandat,
    formData.conjoint, formData.societe, formData.agentDesigne,
    formData.typeBien, formData.prixMin, formData.prixMax, formData.surfaceMin,
    formData.typeRemuneration,
    formData.dureeProtection,
  ]);

  useEffect(() => {
    const mapping: Record<string, string> = {
      'Non défini': 'En qualification',
      'En attente de signature': undefined as any,
      'Actif': undefined as any,
      'Termine': 'Vendu / Acheté',
      'Expire': 'Inactif',
      'Resilie': 'Perdu',
    };
    const target = mapping[formData.statutMandat];
    if (target && formData.statutMetier !== target) {
      setFormData(prev => ({ ...prev, statutMetier: target }));
    }
  }, [formData.statutMandat]);

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

  const buildClientPayload = (data: BuyerFormData) => ({
    name: editingClient?.name || selectedContactName || 'Nouveau client',
    type: 'Acheteur' as const,
    status: (data.actif ? 'Actif' : 'Inactif') as 'Actif' | 'Inactif',
    phone: editingClient?.phone || (formData.contactId ? (contacts.find(c => String(c.id) === formData.contactId)?.mobile || '') : ''),
    email: editingClient?.email || (formData.contactId ? (contacts.find(c => String(c.id) === formData.contactId)?.emailPrincipal || '') : ''),
    source: data.origine,
    secteur: data.secteur,
    propertyType: data.typeBien,
    localisation: data.localisation,
    classification: data.classification,
    notes: data.notesComplementaires,
    statutMetier: data.statutMetier,
    statutMandat: data.statutMandat,
    agentId: data.agentDesigne || undefined,
    agentDesigne: data.agentDesigne || undefined,
    mandatPdfUrl: data.mandatPdfUrl || undefined,
    typeRemuneration: data.typeRemuneration || undefined,
    montantRemuneration: data.montantRemuneration,
    remunerationIsPercentage: data.remunerationIsPercentage,
    docIdentiteUrl: data.docIdentiteUrl || undefined,
    docDomicileUrl: data.docDomicileUrl || undefined,
    docRevenusUrl: data.docRevenusUrl || undefined,
    docFinancementUrl: data.docFinancementUrl || undefined,
    docBancaireUrl: data.docBancaireUrl || undefined,
  });

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

  const calcCompletion = (data: BuyerFormData): number => {
    const fields = [
      // Général
      data.classification, data.statutMetier, data.origine,
    // Localisation & Type
    data.localisation, data.secteur, data.adresseComplete, data.complementAdresse, data.codePostalVille, data.pays, data.categorie, data.typeBien,
      // Caractéristiques
      data.pieces, data.chambres, data.surfaceMin, data.surfaceMax,
      data.prixMin, data.prixMax, data.etage,
      data.vue, data.exposition, data.etat, data.standing, data.disponibilite,
      // Attributs & Critères
      data.attributPrincipal, data.attributsPersonnalises, data.criteres,
      // Proximités (each sub-category)
      data.proximites?.transports, data.proximites?.commerces,
      data.proximites?.education, data.proximites?.sante, data.proximites?.loisirs,
      // Prestations (each sub-category)
      data.prestations?.exterieur, data.prestations?.confort,
      data.prestations?.electromenager, data.prestations?.multimedia, data.prestations?.sport,
      // Financement
      data.typeFinancement, data.revenusMensuelsNets, data.revenusSupplementaires,
      data.chargesCredit, data.chargesFixes, data.montantPretSouhaite,
      data.tauxEnvisage, data.dureePret, data.taeg, data.assuranceEmprunteur,
      data.apport, data.banqueSollicitee, data.statutFinancement,
      data.dateObtentionPret, data.attestationPretUrl, data.montantTotal,
      data.descriptionAutreFinancement,
      // Notes
      data.situationActuelle, data.urgence, data.dateEmmenagement, data.notesComplementaires,
      // Mandat
      data.numeroMandat, data.statutMandat, data.typeMandat,
      data.dateSignature, data.dateDebut, data.dateExpiration,
      data.conjoint, data.societe, data.agentDesigne,
      data.bienConcerneId,
      data.typeRemuneration, data.montantRemuneration, data.conditionPaiement,
      data.dureeProtection,
      // Documents
      data.mandatPdfUrl, data.docIdentiteUrl, data.docDomicileUrl,
      data.docRevenusUrl, data.docFinancementUrl, data.docBancaireUrl,
    ];
    const filled = fields.filter(isFilled).length;
    return Math.min(100, Math.round((filled / fields.length) * 100));
  };

  const doSaveDraft = () => {
    if (!userId) return;
    const data = { ...formDataRef.current, _draftId: savedDraftId, _step: step };
    const draft = saveDraft(userId, 'Acheteur', data, calcCompletion(formDataRef.current));
    if (!savedDraftId) setSavedDraftId(draft.id);
    onDraftChange?.();
  };

  useEffect(() => {
    if (!savedDraftId) return;
    const timer = setTimeout(doSaveDraft, 2000);
    return () => clearTimeout(timer);
  }, [formData, savedDraftId, step]);

  useEffect(() => {
    let capacite = 0;
    if (formData.typeFinancement === 'Pret bancaire') {
      const revenusNets = formData.revenusMensuelsNets || 0;
      const chargesCredit = formData.chargesCredit || 0;
      const mensualiteMax = Math.max(0, (revenusNets * 0.35) - chargesCredit);
      const tauxInteret = formData.tauxEnvisage || 3.5;
      const dureeAnnees = parseInt(formData.dureePret) || 20;
      const apport = formData.apport || 0;
      if (mensualiteMax > 0 && dureeAnnees > 0) {
        const tauxMensuel = tauxInteret / 100 / 12;
        const nbMois = dureeAnnees * 12;
        const montantEmpruntable = mensualiteMax * (1 - Math.pow(1 + tauxMensuel, -nbMois)) / tauxMensuel;
        capacite = Math.round(montantEmpruntable + apport);
      }
    } else if (formData.typeFinancement === 'Apport personnel') {
      capacite = formData.apport || 0;
    } else if (formData.typeFinancement === 'Comptant') {
      capacite = 0;
    } else if (formData.typeFinancement === 'Autre') {
      capacite = formData.capaciteEmprunt;
    }
    if (formData.capaciteEmprunt !== capacite) {
      setFormData(prev => ({ ...prev, capaciteEmprunt: capacite }));
    }
  }, [formData.typeFinancement, formData.revenusMensuelsNets, formData.chargesCredit, formData.tauxEnvisage, formData.dureePret, formData.apport]);

  const handleChange = (field: keyof BuyerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));

    if (field === 'dateSignature' || field === 'dateDebut') {
      const startDate = field === 'dateSignature' ? value : formData.dateSignature;
      if (startDate) {
        setFormData(prev => ({ ...prev, dateExpiration: formatDate(addMonths(new Date(startDate), 6)) }));
      }
    }
  };

  const handleCheckboxGroup = (field: 'attributsPersonnalises' | 'criteres', value: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleProximiteCategory = (category: keyof ProximiteCategorie, value: string) => {
    setFormData(prev => {
      const current = prev.proximites[category];
      const updated = (current as string[]).includes(value)
        ? (current as string[]).filter(v => v !== value)
        : [...(current as string[]), value];
      return { ...prev, proximites: { ...prev.proximites, [category]: updated } };
    });
  };

  const handlePrestationCategory = (category: keyof PrestationCategorie, value: string) => {
    setFormData(prev => {
      const current = prev.prestations[category];
      const updated = (current as string[]).includes(value)
        ? (current as string[]).filter(v => v !== value)
        : [...(current as string[]), value];
      return { ...prev, prestations: { ...prev.prestations, [category]: updated } };
    });
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BuyerFormData, string>> = {};
    if (!formData.contactId) newErrors.contactId = 'Veuillez sélectionner ou créer un contact';
    if (!formData.origine) newErrors.origine = "L'origine est requise";
    if (!formData.typeBien) newErrors.typeBien = 'Le type de bien est requis';
    if (!formData.categorie) newErrors.categorie = 'La catégorie est requise';
    if (!formData.situationActuelle) newErrors.situationActuelle = 'Ce champ est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitForm = () => {
    if (isSubmitting) return;
    if (savedDraftId && userId) {
      deleteDraft(userId, savedDraftId);
      onDraftChange?.();
    }

    setIsSubmitting(true);

    onSubmit({
      ...formData,
      name: selectedContactName || editingClient?.name || 'Nouveau client',
      type: 'Acheteur' as const,
      status: (formData.actif ? 'Actif' : 'Inactif') as 'Actif' | 'Inactif',
      phone: (formData.contactId ? (contacts.find(c => String(c.id) === formData.contactId)?.mobile || '') : '') || editingClient?.phone || '',
      email: (formData.contactId ? (contacts.find(c => String(c.id) === formData.contactId)?.emailPrincipal || '') : '') || editingClient?.email || '',
      source: formData.origine,
      secteur: formData.secteur,
      adresseComplete: formData.adresseComplete,
      complementAdresse: formData.complementAdresse,
      codePostalVille: formData.codePostalVille,
      pays: formData.pays,
      propertyType: formData.typeBien,
      localisation: formData.localisation,
      classification: formData.classification,
      notes: formData.notesComplementaires,
      statutMetier: formData.statutMetier,
      statutMandat: formData.statutMandat,
      agentId: formData.agentDesigne || undefined,
      agentDesigne: formData.agentDesigne || undefined,
      mandatPdfUrl: formData.mandatPdfUrl || undefined,
      typeRemuneration: formData.typeRemuneration || undefined,
      montantRemuneration: formData.montantRemuneration,
      remunerationIsPercentage: formData.remunerationIsPercentage,
      completion: calcCompletion(formData),
      mandatPdfName: formData.mandatPdfName || undefined,
      docIdentiteUrl: formData.docIdentiteUrl || undefined,
      docIdentiteName: formData.docIdentiteName || undefined,
      docDomicileUrl: formData.docDomicileUrl || undefined,
      docDomicileName: formData.docDomicileName || undefined,
      docRevenusUrl: formData.docRevenusUrl || undefined,
      docRevenusName: formData.docRevenusName || undefined,
      docFinancementUrl: formData.docFinancementUrl || undefined,
      docFinancementName: formData.docFinancementName || undefined,
      docBancaireUrl: formData.docBancaireUrl || undefined,
      docBancaireName: formData.docBancaireName || undefined,
      bienConcerneId: formData.bienConcerneId || undefined,
      createdAt: editingClient?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: editingClient?.createdBy || 'current-user-id',
    });
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
    field: keyof BuyerFormData,
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
    gridCols?: string,
  ) => (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-text">{label}</p>}
      <div className={`flex flex-wrap gap-2${gridCols ? '' : ''}`}>
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
    category: keyof PrestationCategorie,
  ) => {
    const selectedValues = formData.prestations[category];
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
              onClick={() => handlePrestationCategory(category, opt.value)}
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
                  <Select
                    label="Statut métier"
                    options={STATUT_METIER_OPTIONS}
                    value={formData.statutMetier}
                    onValueChange={(v) => handleChange('statutMetier', v)}
                  />
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
                    <button type="button" onClick={() => setShowContactForm(true)} className={`h-9 w-9 rounded-lg border border-border bg-card flex items-center justify-center text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all shrink-0`} title="Créer un nouveau contact">
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
            {renderSection('LOCALISATION', (
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
                <div className="sm:col-span-2">
                  {renderRadioGroup('Catégorie', 'categorie', CATEGORIES, errors.categorie)}
                </div>
                <Select label="Type de bien *" options={TYPE_BIEN_OPTIONS} value={formData.typeBien} onValueChange={(v) => handleChange('typeBien', v)} error={errors.typeBien} />
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
                    <Input type="number" min="0" value={formData.pieces?.toString() || ''} onChange={(e) => handleChange('pieces', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="3" />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="w-20 shrink-0">
                      <Select label="Chambres" options={OPERATORS} value={formData.chambresOperator} onValueChange={(v) => handleChange('chambresOperator', v)} />
                    </div>
                    <Input type="number" min="0" value={formData.chambres?.toString() || ''} onChange={(e) => handleChange('chambres', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="2" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-text mb-1.5">Surface</p>
                    <div className="flex gap-2 items-center">
                      <Input type="number" min="0" value={formData.surfaceMin?.toString() || ''} onChange={(e) => handleChange('surfaceMin', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="80" />
                      <span className="text-text-secondary text-sm">~</span>
                      <Input type="number" min="0" value={formData.surfaceMax?.toString() || ''} onChange={(e) => handleChange('surfaceMax', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="120" />
                      <span className="text-text-secondary text-sm font-medium w-8">m²</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text mb-1.5">Prix</p>
                    <div className="flex gap-2 items-center">
                      <Input type="number" min="0" value={formData.prixMin?.toString() || ''} onChange={(e) => handleChange('prixMin', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="800000" />
                      <span className="text-text-secondary text-sm">~</span>
                      <Input type="number" min="0" value={formData.prixMax?.toString() || ''} onChange={(e) => handleChange('prixMax', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="1200000" />
                      <div className="w-24 shrink-0">
                        <Select options={CURRENCIES} value={formData.devise} onValueChange={(v) => handleChange('devise', v)} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-end max-w-xs">
                  <div className="w-20 shrink-0">
                    <Select label="Étage" options={OPERATORS} value={formData.etageOperator} onValueChange={(v) => handleChange('etageOperator', v)} />
                  </div>
                  <Input type="number" min="0" value={formData.etage?.toString() || ''} onChange={(e) => handleChange('etage', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="2" />
                </div>
              </div>
            ))}
            {renderSection('CARACTÉRISTIQUES QUALITATIVES', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Vue" options={VUE_OPTIONS} value={formData.vue} onValueChange={(v) => handleChange('vue', v)} />
                <Select label="Exposition" options={EXPOSITION_OPTIONS} value={formData.exposition} onValueChange={(v) => handleChange('exposition', v)} />
                <Select label="État" options={ETAT_OPTIONS} value={formData.etat} onValueChange={(v) => handleChange('etat', v)} />
                <Select label="Standing" options={STANDING_OPTIONS} value={formData.standing} onValueChange={(v) => handleChange('standing', v)} />
                <Select label="Disponibilité" options={DISPONIBILITE_OPTIONS} value={formData.disponibilite} onValueChange={(v) => handleChange('disponibilite', v)} />
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
                {renderPrestationGroup('Extérieur & Sécurité', PRESTATIONS_EXTERIEUR, 'exterieur')}
                {renderPrestationGroup('Confort & Équipement', PRESTATIONS_CONFORT, 'confort')}
                {renderPrestationGroup('Électroménager & Mobilier', PRESTATIONS_ELECTROMENAGER, 'electromenager')}
                {renderPrestationGroup('Multimédia & Communication', PRESTATIONS_MULTIMEDIA, 'multimedia')}
                {renderPrestationGroup('Sport & Loisirs', PRESTATIONS_SPORT, 'sport')}
              </div>
            ))}
          </>
        );

      case 7:
        return (
          <>
            {renderSection('FINANCEMENT', (
              <div className="space-y-4">
                <div className={`grid gap-4 ${formData.typeFinancement === 'Autre' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                  <Select label="Type de financement" options={FINANCEMENT_OPTIONS} value={formData.typeFinancement} onValueChange={(v) => handleChange('typeFinancement', v)} />
                  {formData.typeFinancement === 'Autre' && (
                    <Input label="Apport personnel" type="number" min="0" value={formData.apport?.toString() || ''} onChange={(e) => handleChange('apport', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" suffix={formData.devise} />
                  )}
                </div>

                {/* ===== Prêt bancaire ===== */}
                {formData.typeFinancement === 'Pret bancaire' && (
                  <>
                    <div className="border-t border-border/30 pt-4">
                      <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">Revenus & Charges</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Revenus mensuels nets *" type="number" min="0" value={formData.revenusMensuelsNets?.toString() || ''} onChange={(e) => handleChange('revenusMensuelsNets', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" suffix={formData.devise} />
                        <Input label="Revenus supplémentaires" type="number" min="0" value={formData.revenusSupplementaires?.toString() || ''} onChange={(e) => handleChange('revenusSupplementaires', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" suffix={formData.devise} />
                        <Input label="Charges de crédit en cours *" type="number" min="0" value={formData.chargesCredit?.toString() || ''} onChange={(e) => handleChange('chargesCredit', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" suffix={formData.devise} />
                        <Input label="Charges fixes" type="number" min="0" value={formData.chargesFixes?.toString() || ''} onChange={(e) => handleChange('chargesFixes', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" suffix={formData.devise} />
                      </div>
                    </div>

                    <div className="border-t border-border/30 pt-4">
                      <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">Prêt</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Montant du prêt souhaité *" type="number" min="0" value={formData.montantPretSouhaite?.toString() || ''} onChange={(e) => handleChange('montantPretSouhaite', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" suffix={formData.devise} />
                        <Input label="Taux envisagé (%) *" type="number" min="0" step="0.01" value={formData.tauxEnvisage?.toString() || '3.5'} onChange={(e) => handleChange('tauxEnvisage', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="3.5" />
                        <Select label="Durée du prêt *" options={DUREE_PRET_OPTIONS} value={formData.dureePret} onValueChange={(v) => handleChange('dureePret', v)} />
                        <Input label="TAEG (Taux Annuel Effectif Global) *" type="number" min="0" step="0.01" value={formData.taeg?.toString() || ''} onChange={(e) => handleChange('taeg', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="%" />
                        <Input label="Assurance emprunteur (%) *" type="number" min="0" step="0.01" value={formData.assuranceEmprunteur?.toString() || ''} onChange={(e) => handleChange('assuranceEmprunteur', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="%" />
                      </div>
                    </div>

                    <div className="border-t border-border/30 pt-4">
                      <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">Apport & Capacité</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Apport personnel *" type="number" min="0" value={formData.apport?.toString() || ''} onChange={(e) => handleChange('apport', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" suffix={formData.devise} />
                        <Input label="Capacité d'emprunt estimée" value={formData.capaciteEmprunt > 0 ? `${formData.capaciteEmprunt.toLocaleString('fr-FR')} ${formData.devise}` : ''} readOnly disabled placeholder="Calculée automatiquement" />
                      </div>
                    </div>

                    <div className="border-t border-border/30 pt-4">
                      <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">Détails du prêt</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select label="Banque sollicitée *" options={[{ value: '', label: 'Sélectionner...' }, ...BANQUE_OPTIONS]} value={formData.banqueSollicitee} onValueChange={(v) => handleChange('banqueSollicitee', v)} />
                        <Select label="Statut du financement *" options={[{ value: '', label: 'Non défini' }, ...FINANCEMENT_STATUT_OPTIONS]} value={formData.statutFinancement} onValueChange={(v) => handleChange('statutFinancement', v)} />
                        <DatePicker label="Date d'obtention du prêt" value={formData.dateObtentionPret} onChange={(e) => handleChange('dateObtentionPret', e.target.value)} />
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-text mb-1.5">Attestation de prêt</p>
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                          <span className="text-sm text-text-secondary flex-1">Document justifiant l'accord de prêt (PDF)</span>
                          <button type="button" className={`text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all`}>Parcourir...</button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ===== Apport personnel ===== */}
                {formData.typeFinancement === 'Apport personnel' && (
                  <div className="border-t border-border/30 pt-4">
                    <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">Apport & Capacité</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Apport personnel *" type="number" min="0" value={formData.apport?.toString() || ''} onChange={(e) => handleChange('apport', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" suffix={formData.devise} />
                      <Input label="Capacité d'emprunt estimée" value={formData.capaciteEmprunt > 0 ? `${formData.capaciteEmprunt.toLocaleString('fr-FR')} ${formData.devise}` : ''} readOnly disabled placeholder="Égale à l'apport personnel" />
                    </div>
                  </div>
                )}

                {/* ===== Comptant ===== */}
                {formData.typeFinancement === 'Comptant' && (
                  <div className="border-t border-border/30 pt-4">
                    <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">Paiement</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Montant total *" type="number" min="0" value={formData.montantTotal?.toString() || ''} onChange={(e) => handleChange('montantTotal', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" suffix={formData.devise} />
                    </div>
                  </div>
                )}

                {/* ===== Autre ===== */}
                {formData.typeFinancement === 'Autre' && (
                  <>
                    <div className="border-t border-border/30 pt-4">
                      <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">Détails du financement</p>
                      <div className="grid grid-cols-1 gap-4">
                        <Input label="Description du financement *" value={formData.descriptionAutreFinancement} onChange={(e) => handleChange('descriptionAutreFinancement', e.target.value)} placeholder="Ex: Prêt familial, aide employeur..." />
                        <Input label="Montant *" type="number" min="0" value={formData.montantTotal?.toString() || ''} onChange={(e) => handleChange('montantTotal', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="0" suffix={formData.devise} />
                        <Input label="Capacité d'emprunt estimée" type="number" min="0" value={formData.capaciteEmprunt > 0 ? formData.capaciteEmprunt.toString() : ''} onChange={(e) => handleChange('capaciteEmprunt', e.target.value ? parseInt(e.target.value) : 0)} placeholder="Saisie manuelle" suffix={formData.devise} />
                      </div>
                    </div>
                    <div className="border-t border-border/30 pt-4">
                      <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">Banque & Statut</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select label="Banque sollicitée" options={[{ value: '', label: 'Sélectionner...' }, ...BANQUE_OPTIONS]} value={formData.banqueSollicitee} onValueChange={(v) => handleChange('banqueSollicitee', v)} />
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-text mb-1.5">Attestation</p>
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                          <span className="text-sm text-text-secondary flex-1">Document justifiant le financement (PDF)</span>
                          <button type="button" className={`text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all`}>Parcourir...</button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
            {renderSection('NOTES & INFORMATIONS COMPLÉMENTAIRES', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Situation actuelle *" options={SITUATION_ACTUELLE_OPTIONS} value={formData.situationActuelle} onValueChange={(v) => handleChange('situationActuelle', v)} error={errors.situationActuelle} />
                <Select label="Urgence" options={URGENCE_OPTIONS} value={formData.urgence} onValueChange={(v) => handleChange('urgence', v)} />
                <DatePicker label="Date souhaitée d'emménagement" value={formData.dateEmmenagement} onChange={(e) => handleChange('dateEmmenagement', e.target.value)} />
                <div className="sm:col-span-2">
                  <Textarea label="Notes complémentaires" value={formData.notesComplementaires} onChange={(e) => handleChange('notesComplementaires', e.target.value)} placeholder="Informations additionnelles..." rows={3} />
                </div>
              </div>
            ))}
          </>
        );

      case 8:
        return (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className={`w-1 h-6 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
              <h2 className="text-base font-semibold text-text">MANDAT DE RECHERCHE</h2>
            </div>

            {renderSection('1. INFORMATIONS GÉNÉRALES DU MANDAT', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Numéro de mandat" value={formData.numeroMandat} onChange={(e) => handleChange('numeroMandat', e.target.value)} placeholder="MDR-2025-001" />
                <Select label="Statut du mandat" options={STATUT_MANDAT_OPTIONS} value={formData.statutMandat} onValueChange={(v) => handleChange('statutMandat', v)} />
                <DatePicker label="Date de début" value={formData.dateDebut} onChange={(e) => handleChange('dateDebut', e.target.value)} />
                <DatePicker label="Date d'expiration" value={formData.dateExpiration} onChange={(e) => handleChange('dateExpiration', e.target.value)} />
              </div>
            ))}
            {renderSection('2. TYPE DE MANDAT', (
              <div>{renderRadioGroup('Type de mandat', 'typeMandat', TYPE_MANDAT_OPTIONS)}</div>
            ))}
            {renderSection('3. PARTIES AU CONTRAT', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Acheteur(s)" value={selectedContactName} disabled />
                <Input label="Conjoint (le cas échéant)" value={formData.conjoint} onChange={(e) => handleChange('conjoint', e.target.value)} placeholder="Nom du conjoint" />
                <Input label="Société (si achat professionnel)" value={formData.societe} onChange={(e) => handleChange('societe', e.target.value)} placeholder="Raison sociale" />
                <div className="relative">
                  <label className="block text-sm font-medium text-text mb-1.5">Bien concerné</label>
                  {selectedProperty ? (
                    <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-background/50">
                      <span className="text-sm text-text flex-1 truncate">{selectedProperty.title || selectedProperty.reference || `Bien #${selectedProperty.id}`}{selectedProperty.city ? ` - ${selectedProperty.city}` : ''}</span>
                      <button type="button" onClick={() => handleChange('bienConcerneId', '')} className="text-text-secondary/50 hover:text-error transition-colors"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
                      <input
                        type="text"
                        placeholder={loadingProperties ? 'Chargement...' : 'Rechercher un bien ou vendeur...'}
                        className={`w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'} transition-all`}
                        value={propertySearch}
                        onChange={(e) => { setPropertySearch(e.target.value); setShowPropertyDropdown(true); }}
                        onFocus={() => setShowPropertyDropdown(true)}
                        onBlur={() => setTimeout(() => setShowPropertyDropdown(false), 200)}
                        disabled={loadingProperties}
                      />
                    </div>
                  )}
                  {showPropertyDropdown && !selectedProperty && matchedProperties.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {matchedProperties.map((p: any) => {
                        const vendeurId = String(p.client_id || '');
                        const vendeur = vendeurs.find((v: any) => String(v.id) === vendeurId);
                        const vendeurName = vendeur ? `${vendeur.first_name || ''} ${vendeur.last_name || ''}`.trim() : '';
                        return (
                          <button
                            key={p.id}
                            type="button"
                            className={`w-full text-left px-3 py-2.5 ${isGerant ? 'hover:bg-[#905D5D]/5' : 'hover:bg-accent/5'} border-b border-border/30 last:border-0 transition-colors`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleChange('bienConcerneId', String(p.id));
                              setPropertySearch('');
                              setShowPropertyDropdown(false);
                            }}
                          >
                            <p className="text-sm font-medium text-text truncate">{p.title || p.reference || `Bien #${p.id}`}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {p.city && <span className="text-[11px] text-text-secondary">{p.city}</span>}
                              {vendeurName && <span className={`text-[11px] ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>{vendeurName}</span>}
                              {p.price && <span className="text-[11px] text-text-secondary ml-auto">{Number(p.price).toLocaleString('fr-FR')} MAD</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <Input label="Agent désigné" value={(() => {
                  const raw = formData.agentDesigne || assignmentInfo?.assignedName || '';
                  if (!raw) return '';
                  if (USER_CACHE[raw]) return USER_CACHE[raw];
                  const agent = AGENTS.find(a => a.id === raw);
                  if (agent) return agent.name;
                  const byName = AGENTS.find(a => a.name.toLowerCase() === raw.toLowerCase());
                  return byName ? byName.name : raw;
                })()} disabled />
              </div>
            ))}
            {renderSection('4. DESCRIPTION DU BIEN RECHERCHÉ', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <p className="text-xs text-text-secondary mb-2">Pré-rempli automatiquement depuis les critères de recherche</p>
                </div>
                <Input label="Type de bien" value={formData.typeBien} disabled />
                <Input label="Localisation" value={`${formData.secteur || ''}${formData.secteur && formData.localisation ? ' - ' : ''}${formData.localisation || ''}`} disabled />
                <Input label="Prix minimum" type="number" value={formData.prixMin?.toString() || ''} disabled />
                <Input label="Prix maximum" type="number" value={formData.prixMax?.toString() || ''} disabled />
                <Input label="Surface minimum" type="number" value={formData.surfaceMin?.toString() || ''} disabled />
              </div>
            ))}
            {renderSection('5. RÉMUNÉRATION DE L\'AGENCE', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Type de rémunération" options={REMUNERATION_TYPE_OPTIONS} value={formData.typeRemuneration} onValueChange={(v) => handleChange('typeRemuneration', v)} />
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Montant / Pourcentage</label>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    <button type="button" onClick={() => handleChange('remunerationIsPercentage', false)} className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${!formData.remunerationIsPercentage ? (isGerant ? 'bg-[#905D5D] text-white' : 'bg-accent text-white') : 'bg-background text-text-secondary hover:text-text'}`}>
                      Montant ({formData.devise || 'MAD'})
                    </button>
                    <button type="button" onClick={() => handleChange('remunerationIsPercentage', true)} className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-border ${formData.remunerationIsPercentage ? (isGerant ? 'bg-[#905D5D] text-white' : 'bg-accent text-white') : 'bg-background text-text-secondary hover:text-text'}`}>
                      Pourcentage (%)
                    </button>
                  </div>
                  <Input type="number" min="0" max={formData.remunerationIsPercentage ? 100 : undefined} step={formData.remunerationIsPercentage ? '0.01' : '1'} value={formData.montantRemuneration?.toString() || ''} onChange={(e) => { const v = e.target.value ? parseFloat(e.target.value) : undefined; if (formData.remunerationIsPercentage && v !== undefined && v > 100) return; handleChange('montantRemuneration', v); }} placeholder={formData.remunerationIsPercentage ? 'Ex: 2.5' : 'Ex: 35000'} suffix={formData.remunerationIsPercentage ? '%' : formData.devise || 'MAD'} className="mt-2" />
                </div>
                <Select label="Condition de paiement" options={PAIEMENT_CONDITION_OPTIONS} value={formData.conditionPaiement} onValueChange={(v) => handleChange('conditionPaiement', v)} />
              </div>
            ))}
            {renderSection('6. CLAUSE DE PROTECTION', (
              <div>
                <div className="flex items-end gap-2 max-w-xs">
                  <Input label="Durée de protection" type="number" min="0" value={formData.dureeProtection} onChange={(e) => handleChange('dureeProtection', e.target.value)} placeholder="3" />
                  <span className="text-sm text-text-secondary pb-2">mois</span>
                </div>
                <p className="text-xs text-text-secondary mt-1">Si l'acheteur visite un bien pendant la durée du mandat mais l'achète après l'expiration, l'agence a droit à sa commission pendant cette période de protection.</p>
              </div>
            ))}
            {renderSection('7. DOCUMENTS JUSTIFICATIFS', (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">Documents obligatoires à fournir par l'acheteur :</p>
                {[
                  { label: "Pièce d'identité (passeport ou CIN)", required: true, inputId: 'doc-identite', field: 'docIdentiteUrl' as const, nameField: 'docIdentiteName' as const, uploaded: formData.docIdentiteUrl },
                  { label: 'Justificatif de domicile', required: true, inputId: 'doc-domicile', field: 'docDomicileUrl' as const, nameField: 'docDomicileName' as const, uploaded: formData.docDomicileUrl },
                  { label: 'Avis d\'imposition ou justificatif de revenus', required: true, inputId: 'doc-revenus', field: 'docRevenusUrl' as const, nameField: 'docRevenusName' as const, uploaded: formData.docRevenusUrl },
                  { label: 'Attestation de financement ou de prêt', required: true, inputId: 'doc-financement', field: 'docFinancementUrl' as const, nameField: 'docFinancementName' as const, uploaded: formData.docFinancementUrl },
                  { label: 'Relevés bancaires (3 derniers mois)', required: false, inputId: 'doc-bancaire', field: 'docBancaireUrl' as const, nameField: 'docBancaireName' as const, uploaded: formData.docBancaireUrl },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                    <span className="text-sm text-text flex-1">{doc.label}</span>
                    {doc.required ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-error/10 text-error font-medium">Obligatoire</span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>Recommandé</span>
                    )}
                    {doc.uploaded ? (
                      <span className="text-[10px] font-medium text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <Upload size={10} /> Uploadé
                      </span>
                    ) : null}
                    <div className="relative">
                      <input id={doc.inputId} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const urls = await uploadFiles([file]);
                          if (urls[0]) { handleChange(doc.field, urls[0]); handleChange(doc.nameField, file.name); }
                        } catch { /* upload failed silently */ }
                      }} />
                      <button type="button" onClick={() => document.getElementById(doc.inputId)?.click()} className={`text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all`}>{doc.uploaded ? 'Remplacer' : 'Parcourir...'}</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {renderSection('8. SIGNATURES', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-background/50">
                    <p className="text-sm font-medium text-text mb-2">Signature de l'acheteur</p>
                    <div className="h-16 rounded border border-dashed border-text-secondary/30 flex items-center justify-center text-text-secondary text-xs">Champ de signature électronique</div>
                    <p className="text-xs text-text-secondary mt-1">ou document signé téléchargé</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-background/50">
                    <p className="text-sm font-medium text-text mb-2">Signature de l'agent</p>
                    <div className="h-16 rounded border border-dashed border-text-secondary/30 flex items-center justify-center text-text-secondary text-xs">Champ de signature électronique</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DatePicker label="Date de signature" value={formData.dateSignature} onChange={(e) => handleChange('dateSignature', e.target.value)} />
                  <div>
                    <p className="block text-sm font-medium text-text mb-1.5">Fichier du mandat signé</p>
                    <div className="h-9 flex items-center gap-3 px-3 rounded-lg border border-border bg-background/50">
                      {formData.mandatPdfUrl ? (
                        <Eye size={14} className="text-emerald-500 shrink-0" />
                      ) : null}
                      <span className="text-sm text-text-secondary flex-1 truncate">{formData.mandatPdfName || (formData.mandatPdfUrl ? 'Fichier uploadé' : 'Aucun fichier')}</span>
                      <input id="mandat-upload" type="file" accept=".pdf" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const urls = await uploadFiles([file]);
                          if (urls[0]) { handleChange('mandatPdfUrl', urls[0]); handleChange('mandatPdfName', file.name); }
                        } catch { /* upload failed silently */ }
                      }} />
                      <button type="button" onClick={() => document.getElementById('mandat-upload')?.click()} className={`text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all`}>{formData.mandatPdfUrl ? 'Remplacer' : 'Parcourir...'}</button>
                    </div>
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

  if (loadingDraft) return null;

  return (
    <>
    <AnimatePresence>
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
            <h2 className="text-lg font-semibold">{editingClient ? "Modifier l'acheteur" : "Nouvel acheteur"}</h2>
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
                {t.id === 8 ? 'Mandat' : t.label}
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
                    {isSubmitting ? 'Enregistrement...' : editingClient ? "Mettre à jour l'acheteur" : "Créer l'acheteur"}
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
