import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Save, Upload, Eye, Search, Home } from 'react-feather';
import { Client } from '../../../types/client';
import { DatePicker } from '../../ui/DatePicker';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Checkbox } from '../../ui/Checkbox';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { LocationMap } from '../properties/AddPropertyForm/LocationMap';
import { saveDraft, getDraft, deleteDraft } from '../../../services/clientDraftStorage';
import { CompletionRing } from '../../ui/CompletionRing';
import { uploadFiles } from '../../../services/uploadService';
import { api } from '../../../services/api';
import { fetchContacts, createContact } from '../../../services/contactService';
import { ContactFormModal } from '../contacts/ContactFormModal';

const GERANT_BUTTON_CLASSES = 'bg-[#905D5D] hover:bg-[#7D5050] border-[#905D5D] hover:border-[#7D5050] text-white shadow-[0_10px_24px_rgba(144,93,93,0.35)]'

interface AssignmentInfo {
  assignedType: 'agent' | 'admin';
  assignedName: string;
}

interface LocataireFormModalProps {
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
  { value: 'En visite', label: 'En visite' },
  { value: 'En dossier', label: 'En dossier' },
  { value: 'Bail signe', label: 'Bail sign\u00e9' },
  { value: 'Installe', label: 'Install\u00e9' },
  { value: 'Loue', label: 'Lou\u00e9' },
  { value: 'Inactif', label: 'Inactif' },
  { value: 'Perdu', label: 'Perdu' },
];

const STATUT_OCCUPATION_OPTIONS = [
  { value: 'Immediate', label: 'Immédiate' },
  { value: '1 mois', label: '1 mois' },
  { value: '3 mois', label: '3 mois' },
  { value: '6 mois', label: '6 mois' },
  { value: '1 an', label: '1 an' },
  { value: 'Flexible', label: 'Flexible' },
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
  { value: 'Location', label: 'Location' },
  { value: 'Location saisonniere', label: 'Location saisonnière' },
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
  { value: 'Animaux acceptes', label: 'Animaux acceptés' },
  { value: 'Meuble', label: 'Meublé' },
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

const SITUATION_PRO_OPTIONS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Independant', label: 'Indépendant' },
  { value: 'Etudiant', label: 'Étudiant' },
  { value: 'Retraite', label: 'Retraité' },
  { value: 'Sans emploi', label: 'Sans emploi' },
];

const SITUATION_ACTUELLE_OPTIONS = [
  { value: 'Proprietaire', label: 'Propriétaire' },
  { value: 'Locataire', label: 'Locataire' },
  { value: 'Heberge', label: 'Hébergé à titre gratuit' },
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

const PAIEMENT_CONDITION_OPTIONS = [
  { value: 'Signature bail', label: 'À la signature du bail' },
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

interface PrestationCategorie {
  exterieur: string[];
  confort: string[];
  electromenager: string[];
  multimedia: string[];
  sport: string[];
}

interface LocataireFormData {
  actif: boolean;
  croisementAutomatique: boolean;
  classification: string;
  statutMetier: string;
  statutOccupation: string;
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
  loyerMax: number | undefined;
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
  situationPro: string;
  revenusMensuels: number | undefined;
  garant: boolean;
  garantNom: string;
  garantRevenus: number | undefined;
  anciennete: number | undefined;
  periodeEssai: boolean;
  nomEmployeur: string;
  dateFinContrat: string;
  chiffreAffaires: number | undefined;
  dernierBilanUrl: string;
  dernierBilanName: string;
  dernierAvisImpotUrl: string;
  dernierAvisImpotName: string;
  pensionMensuelle: number | undefined;
  dateRetraite: string;
  organismeRetraite: string;
  justificatifSituationUrl: string;
  justificatifSituationName: string;
  situationActuelle: string;
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
  honorairesLocation: number | undefined;
  honorairesLocationIsPercentage: boolean;
  conditionPaiement: string;
  dureeProtection: string;
  mandatPdfUrl: string;
  mandatPdfName: string;
  bienRechercheId: string;
  docIdentiteUrl: string;
  docIdentiteName: string;
  docDomicileUrl: string;
  docDomicileName: string;
  docFichesDePaieUrl: string;
  docFichesDePaieName: string;
  docContratTravailUrl: string;
  docContratTravailName: string;
  docRIBUrl: string;
  docRIBName: string;
  docGarantUrl: string;
  docGarantName: string;
  latitude: number;
  longitude: number;
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
  return `MLR-${year}-${random}`;
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

export function resetLocataireFormData(): LocataireFormData {
  return {
    actif: true,
    croisementAutomatique: true,
    classification: 'Actif',
    statutMetier: 'En recherche',
    statutOccupation: '',
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
    loyerMax: undefined,
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
    situationPro: '',
    revenusMensuels: undefined,
    garant: false,
    garantNom: '',
    garantRevenus: undefined,
    anciennete: undefined,
    periodeEssai: false,
    nomEmployeur: '',
    dateFinContrat: '',
    chiffreAffaires: undefined,
    dernierBilanUrl: '',
    dernierBilanName: '',
    dernierAvisImpotUrl: '',
    dernierAvisImpotName: '',
    pensionMensuelle: undefined,
    dateRetraite: '',
    organismeRetraite: '',
    justificatifSituationUrl: '',
    justificatifSituationName: '',
    situationActuelle: '',
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
    honorairesLocation: undefined,
    honorairesLocationIsPercentage: false,
    conditionPaiement: '',
    dureeProtection: '',
    mandatPdfUrl: '',
    mandatPdfName: '',
    bienRechercheId: '',
    docIdentiteUrl: '',
    docIdentiteName: '',
    docDomicileUrl: '',
    docDomicileName: '',
    docFichesDePaieUrl: '',
    docFichesDePaieName: '',
    docContratTravailUrl: '',
    docContratTravailName: '',
    docRIBUrl: '',
    docRIBName: '',
    docGarantUrl: '',
    docGarantName: '',
    latitude: 0,
    longitude: 0,
  };
}

export const LocataireFormModal = ({ onClose, onSubmit, assignmentInfo, draftId: initialDraftId, userId, onDraftChange, client: editingClient, selectedContactId, isGerant = false }: LocataireFormModalProps) => {
  const [step, setStep] = useState(1);
  const [contactOptions, setContactOptions] = useState<{value: string; label: string}[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [formData, setFormData] = useState<LocataireFormData>({
    actif: true,
    croisementAutomatique: true,
    classification: 'Actif',
    statutMetier: 'En recherche',
    statutOccupation: '',
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
    loyerMax: undefined,
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
    situationPro: '',
    revenusMensuels: undefined,
    garant: false,
    garantNom: '',
    garantRevenus: undefined,
    anciennete: undefined,
    periodeEssai: false,
    nomEmployeur: '',
    dateFinContrat: '',
    chiffreAffaires: undefined,
    dernierBilanUrl: '',
    dernierBilanName: '',
    dernierAvisImpotUrl: '',
    dernierAvisImpotName: '',
    pensionMensuelle: undefined,
    dateRetraite: '',
    organismeRetraite: '',
    justificatifSituationUrl: '',
    justificatifSituationName: '',
    situationActuelle: '',
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
    honorairesLocation: undefined,
    honorairesLocationIsPercentage: false,
    conditionPaiement: '',
    dureeProtection: '',
    mandatPdfUrl: '',
    mandatPdfName: '',
    docIdentiteUrl: '',
    docIdentiteName: '',
    docDomicileUrl: '',
    docDomicileName: '',
    docFichesDePaieUrl: '',
    docFichesDePaieName: '',
    docContratTravailUrl: '',
    docContratTravailName: '',
    docRIBUrl: '',
    docRIBName: '',
    docGarantUrl: '',
    docGarantName: '',
    bienRechercheId: '',
    latitude: 0,
    longitude: 0,
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
        const results = await api.get<any[]>('/properties', { search: propertySearchQuery });
        const filtered = Array.isArray(results) ? results.filter((p: any) =>
          p.transactionType === 'location_ld' && p.status === 'for_rent'
        ) : [];
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
      localisation: editingClient.localisation || '',
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
      surfaceMin: editingClient.minSurface,
      surfaceMax: editingClient.surfaceMax,
      loyerMax: editingClient.prixMax || editingClient.budget,
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
      situationPro: editingClient.employmentStatus || '',
      revenusMensuels: editingClient.contribution,
      garant: editingClient.guarantor || false,
      garantNom: (editingClient as any).guarantorName || '',
      garantRevenus: (editingClient as any).guarantorRevenus,
      anciennete: (editingClient as any).anciennete,
      periodeEssai: (editingClient as any).periodeEssai || false,
      nomEmployeur: (editingClient as any).nomEmployeur || '',
      dateFinContrat: (editingClient as any).dateFinContrat || '',
      chiffreAffaires: (editingClient as any).chiffreAffaires,
      dernierBilanUrl: (editingClient as any).dernierBilanUrl || '',
      dernierBilanName: (editingClient as any).dernierBilanName || '',
      dernierAvisImpotUrl: (editingClient as any).dernierAvisImpotUrl || '',
      dernierAvisImpotName: (editingClient as any).dernierAvisImpotName || '',
      pensionMensuelle: (editingClient as any).pensionMensuelle,
      dateRetraite: (editingClient as any).dateRetraite || '',
      organismeRetraite: (editingClient as any).organismeRetraite || '',
      justificatifSituationUrl: (editingClient as any).justificatifSituationUrl || '',
      justificatifSituationName: (editingClient as any).justificatifSituationName || '',
      statutOccupation: (editingClient as any).statutOccupation || '',
      situationActuelle: editingClient.currentSituation || '',
      dateEmmenagement: editingClient.moveInDate || '',
      notesComplementaires: editingClient.notes || '',
      numeroMandat: editingClient.numeroMandat || prev.numeroMandat,
      dateSignature: editingClient.dateSignature || prev.dateSignature,
      dateDebut: editingClient.dateDebut || prev.dateDebut,
      dateExpiration: editingClient.dateExpiration || prev.dateExpiration,
      statutMandat: editingClient.statutMandat || 'Non défini',
      typeMandat: editingClient.typeMandat || '',
      conjoint: editingClient.conjoint || '',
      societe: editingClient.societe || '',
      agentDesigne: editingClient.agentDesigne || '',
      honorairesLocation: editingClient.montantRemuneration,
      honorairesLocationIsPercentage: editingClient.remunerationIsPercentage ?? false,
      conditionPaiement: editingClient.conditionPaiement || '',
      dureeProtection: editingClient.dureeProtection || '',
      mandatPdfUrl: editingClient.mandatPdfUrl || '',
      mandatPdfName: editingClient.mandatPdfName || '',
      docIdentiteUrl: editingClient.docIdentiteUrl || '',
      docIdentiteName: editingClient.docIdentiteName || '',
      docDomicileUrl: editingClient.docDomicileUrl || '',
      docDomicileName: editingClient.docDomicileName || '',
      docFichesDePaieUrl: editingClient.docRevenusUrl || '',
      docFichesDePaieName: editingClient.docRevenusName || '',
      docContratTravailUrl: editingClient.docFinancementUrl || '',
      docContratTravailName: editingClient.docFinancementName || '',
      docRIBUrl: editingClient.docBancaireUrl || '',
      docRIBName: editingClient.docBancaireName || '',
      docGarantUrl: (editingClient as any).docGarantUrl || '',
      docGarantName: (editingClient as any).docGarantName || '',
      bienRechercheId: editingClient.bienRechercheId || '',
      latitude: c.latitude || 0,
      longitude: c.longitude || 0,
    }));
  }, [editingClient]);

  useEffect(() => {
    if (editingClient?.bienRechercheId) {
      api.get<any>(`/properties/${editingClient.bienRechercheId}`).then((p) => {
        if (p) setSelectedProperty(p);
      }).catch(() => {});
    }
  }, [editingClient]);

  useEffect(() => {
    if (assignmentInfo?.assignedName && !editingClient) {
      setFormData(prev => ({ ...prev, agentDesigne: assignmentInfo.assignedName }));
    }
  }, [assignmentInfo, editingClient]);

  const [errors, setErrors] = useState<Partial<Record<keyof LocataireFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | undefined>(initialDraftId || undefined);
  const [loadingDraft, setLoadingDraft] = useState(!!initialDraftId);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const handleChange = (field: keyof LocataireFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
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

  useEffect(() => {
    if (editingClient) return;
    const section1 = formData.numeroMandat.trim() && formData.dateDebut.trim() && formData.dateExpiration.trim();
    const section2 = formData.typeMandat.trim() !== '';
    const section3 = formData.typeBien.trim() !== '' && formData.loyerMax !== undefined && formData.surfaceMin !== undefined;
    const section4 = formData.honorairesLocation !== undefined && formData.conditionPaiement !== '';
    const allFilled = !!(section1 && section2 && section3 && section4);
    const newStatus = allFilled ? 'En attente de signature' : 'Non défini';
    setFormData(prev => prev.statutMandat !== newStatus ? { ...prev, statutMandat: newStatus } : prev);
  }, [
    editingClient,
    formData.numeroMandat, formData.dateDebut, formData.dateExpiration,
    formData.typeMandat,
    formData.typeBien, formData.loyerMax, formData.surfaceMin,
    formData.honorairesLocation, formData.conditionPaiement,
  ]);

  useEffect(() => {
    if (formData.statutMandat === 'Actif') return;
    const mapping: Record<string, string> = {
      'Non défini': 'En recherche',
      'En attente de signature': 'En recherche',
      'Actif': 'En visite',
      'Termine': 'Installe',
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

  const calcCompletion = (data: LocataireFormData): number => {
    const fields = [
      data.classification, data.statutMetier, data.statutOccupation, data.origine,
      data.localisation, data.secteur, data.adresseComplete, data.complementAdresse, data.codePostalVille, data.pays, data.categorie, data.typeBien,
      data.pieces, data.chambres, data.surfaceMin, data.surfaceMax, data.loyerMax,
      data.etage, data.vue, data.exposition, data.etat, data.standing, data.disponibilite,
      data.attributPrincipal, data.attributsPersonnalises, data.criteres,
      data.proximites, data.prestations,
      data.situationPro, data.revenusMensuels, data.garant, data.garantNom, data.garantRevenus,
      data.situationActuelle, data.dateEmmenagement, data.notesComplementaires,
      data.statutMandat, data.numeroMandat, data.typeMandat, data.bienRechercheId,
      data.dateSignature, data.dateDebut, data.dateExpiration,
      data.conjoint, data.societe, data.agentDesigne,
      data.honorairesLocation, data.conditionPaiement, data.dureeProtection,
      data.mandatPdfUrl,
      data.docIdentiteUrl, data.docDomicileUrl, data.docFichesDePaieUrl,
      data.docContratTravailUrl, data.docRIBUrl, data.docGarantUrl,
    ];
    const filled = fields.filter(isFilled).length;
    return Math.min(100, Math.round((filled / fields.length) * 100));
  };

  const doSaveDraft = () => {
    if (!userId) return;
    const data = { ...formDataRef.current, _draftId: savedDraftId, _step: step };
    const draft = saveDraft(userId, 'Locataire', data, calcCompletion(formDataRef.current));
    if (!savedDraftId) setSavedDraftId(draft.id);
    onDraftChange?.();
  };

  useEffect(() => {
    if (!savedDraftId) return;
    const timer = setTimeout(doSaveDraft, 2000);
    return () => clearTimeout(timer);
  }, [formData, savedDraftId, step]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LocataireFormData, string>> = {};
    if (!formData.contactId) newErrors.contactId = 'Veuillez sélectionner ou créer un contact';
    if (!formData.origine) newErrors.origine = "L'origine est requise";
    if (!formData.typeBien) newErrors.typeBien = 'Le type de bien est requis';
    if (!formData.categorie) newErrors.categorie = 'La catégorie est requise';
    if (!formData.situationActuelle) newErrors.situationActuelle = 'Ce champ est requis';
    if (formData.situationPro === 'Sans emploi' && !formData.garant) {
      newErrors.garant = 'Un garant est obligatoire pour les sans emploi';
    }
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
      name: selectedContactName || editingClient?.name || 'Nouveau client',
      type: 'Locataire',
      status: formData.actif ? 'Actif' : 'Inactif',
      phone: (formData.contactId ? (contacts.find(c => String(c.id) === formData.contactId)?.mobile || '') : '') || editingClient?.phone || '',
      email: (formData.contactId ? (contacts.find(c => String(c.id) === formData.contactId)?.emailPrincipal || '') : '') || editingClient?.email || '',
      completion: calcCompletion(formData),
      source: formData.origine,
      notes: formData.notesComplementaires,
      propertyType: formData.typeBien,
      area: formData.secteur || formData.localisation,
      minSurface: formData.surfaceMin,
      rooms: formData.pieces?.toString() || '',
      budget: formData.loyerMax,
      prixMax: formData.loyerMax,
      contribution: formData.revenusMensuels,
      currentSituation: formData.situationActuelle,
      moveInDate: formData.dateEmmenagement,
      classification: formData.classification,
      statutMetier: formData.statutMetier,
      croisementAutomatique: formData.croisementAutomatique,
      contactId: formData.contactId,
      secteur: formData.secteur,
      adresseComplete: formData.adresseComplete,
      complementAdresse: formData.complementAdresse,
      codePostalVille: formData.codePostalVille,
      pays: formData.pays,
      localisation: formData.localisation,
      categorie: formData.categorie,
      piecesOperator: formData.piecesOperator,
      pieces: formData.pieces,
      chambresOperator: formData.chambresOperator,
      chambres: formData.chambres,
      surfaceMax: formData.surfaceMax,
      prixMin: 0,
      devise: formData.devise,
      etageOperator: formData.etageOperator,
      etage: formData.etage,
      vue: formData.vue,
      exposition: formData.exposition,
      etat: formData.etat,
      standing: formData.standing,
      disponibilite: formData.disponibilite,
      attributPrincipal: formData.attributPrincipal,
      attributsPersonnalises: formData.attributsPersonnalises.length > 0 ? formData.attributsPersonnalises : undefined,
      criteres: formData.criteres.length > 0 ? formData.criteres : undefined,
      proximites: formData.proximites.transports.length > 0 || formData.proximites.commerces.length > 0 || formData.proximites.education.length > 0 || formData.proximites.sante.length > 0 || formData.proximites.loisirs.length > 0
        ? formData.proximites : undefined,
      prestations: formData.prestations.exterieur.length > 0 || formData.prestations.confort.length > 0 || formData.prestations.electromenager.length > 0 || formData.prestations.multimedia.length > 0 || formData.prestations.sport.length > 0
        ? formData.prestations : undefined,
      employmentStatus: formData.situationPro || undefined,
      furnished: formData.criteres.includes('Meuble'),
      guarantor: formData.garant || undefined,
      guarantorName: formData.garantNom || undefined,
      guarantorRevenus: formData.garantRevenus,
      anciennete: formData.anciennete,
      periodeEssai: formData.periodeEssai || undefined,
      nomEmployeur: formData.nomEmployeur || undefined,
      dateFinContrat: formData.dateFinContrat || undefined,
      chiffreAffaires: formData.chiffreAffaires,
      dernierBilanUrl: formData.dernierBilanUrl || undefined,
      dernierBilanName: formData.dernierBilanName || undefined,
      dernierAvisImpotUrl: formData.dernierAvisImpotUrl || undefined,
      dernierAvisImpotName: formData.dernierAvisImpotName || undefined,
      pensionMensuelle: formData.pensionMensuelle,
      dateRetraite: formData.dateRetraite || undefined,
      organismeRetraite: formData.organismeRetraite || undefined,
      justificatifSituationUrl: formData.justificatifSituationUrl || undefined,
      justificatifSituationName: formData.justificatifSituationName || undefined,
      statutOccupation: formData.statutOccupation || undefined,
      numeroMandat: formData.numeroMandat,
      dateSignature: formData.dateSignature,
      dateDebut: formData.dateDebut,
      dateExpiration: formData.dateExpiration,
      statutMandat: formData.statutMandat,
      typeMandat: formData.typeMandat,
      conjoint: formData.conjoint || undefined,
      societe: formData.societe || undefined,
      agentDesigne: formData.agentDesigne || undefined,
      typeRemuneration: 'Honoraires de location',
      montantRemuneration: formData.honorairesLocation,
      remunerationIsPercentage: formData.honorairesLocationIsPercentage,
      conditionPaiement: formData.conditionPaiement || undefined,
      dureeProtection: formData.dureeProtection,
      bienRechercheId: formData.bienRechercheId || undefined,
      mandatPdfUrl: formData.mandatPdfUrl || undefined,
      mandatPdfName: formData.mandatPdfName || undefined,
      docIdentiteUrl: formData.docIdentiteUrl || undefined,
      docIdentiteName: formData.docIdentiteName || undefined,
      docDomicileUrl: formData.docDomicileUrl || undefined,
      docDomicileName: formData.docDomicileName || undefined,
      docRevenusUrl: formData.docFichesDePaieUrl || undefined,
      docRevenusName: formData.docFichesDePaieName || undefined,
      docFinancementUrl: formData.docContratTravailUrl || undefined,
      docFinancementName: formData.docContratTravailName || undefined,
      docBancaireUrl: formData.docRIBUrl || undefined,
      docBancaireName: formData.docRIBName || undefined,
      latitude: formData.latitude || undefined,
      longitude: formData.longitude || undefined,
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
    field: keyof LocataireFormData,
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
                  <Select label="Statut métier" options={STATUT_METIER_OPTIONS} value={formData.statutMetier} onValueChange={(v) => handleChange('statutMetier', v)} />
                  <Select label="Classification" options={CLASSIFICATION_OPTIONS} value={formData.classification} onValueChange={(v) => handleChange('classification', v)} />
                </div>
                <Select label="Statut de l'occupation" options={[{ value: '', label: 'Non défini' }, ...STATUT_OCCUPATION_OPTIONS]} value={formData.statutOccupation} onValueChange={(v) => handleChange('statutOccupation', v)} />
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
                      <Input type="number" min="0" value={formData.surfaceMin?.toString() || ''} onChange={(e) => handleChange('surfaceMin', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="60" />
                      <span className="text-text-secondary text-sm">~</span>
                      <Input type="number" min="0" value={formData.surfaceMax?.toString() || ''} onChange={(e) => handleChange('surfaceMax', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="90" />
                      <span className="text-text-secondary text-sm font-medium w-8">m²</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text mb-1.5">Loyer (budget max)</p>
                    <div className="flex gap-2 items-center">
                      <Input type="number" min="0" value={formData.loyerMax?.toString() || ''} onChange={(e) => handleChange('loyerMax', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="5000" className="flex-1" />
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
            {renderSection('SOLVABILITÉ', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Situation professionnelle" options={[{ value: '', label: 'Sélectionner...' }, ...SITUATION_PRO_OPTIONS]} value={formData.situationPro} onValueChange={(v) => handleChange('situationPro', v)} />
                  <Input label="Revenus mensuels nets" type="number" min="0" value={formData.revenusMensuels?.toString() || ''} onChange={(e) => handleChange('revenusMensuels', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`15 000 ${formData.devise}`} />
                </div>

                {formData.situationPro === 'CDI' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label="Ancienneté (ans)" type="number" min="0" value={formData.anciennete?.toString() || ''} onChange={(e) => handleChange('anciennete', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="3" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-text">Période d'essai</p>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                          <input type="radio" name="periodeEssai" checked={formData.periodeEssai === true} onChange={() => handleChange('periodeEssai', true)} className={isGerant ? 'accent-[#905D5D]' : 'accent-accent'} /> Oui
                        </label>
                        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                          <input type="radio" name="periodeEssai" checked={formData.periodeEssai === false} onChange={() => handleChange('periodeEssai', false)} className={isGerant ? 'accent-[#905D5D]' : 'accent-accent'} /> Non
                        </label>
                      </div>
                    </div>
                    <Input label="Nom de l'employeur" value={formData.nomEmployeur} onChange={(e) => handleChange('nomEmployeur', e.target.value)} placeholder="Nom de l'entreprise" />
                  </div>
                )}

                {formData.situationPro === 'CDD' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <DatePicker label="Date de fin du contrat" value={formData.dateFinContrat} onChange={(e) => handleChange('dateFinContrat', e.target.value)} />
                    <Input label="Ancienneté (ans)" type="number" min="0" value={formData.anciennete?.toString() || ''} onChange={(e) => handleChange('anciennete', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="1" />
                    <Input label="Nom de l'employeur" value={formData.nomEmployeur} onChange={(e) => handleChange('nomEmployeur', e.target.value)} placeholder="Nom de l'entreprise" />
                  </div>
                )}

                {formData.situationPro === 'Independant' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label={`Chiffre d'affaires annuel`} type="number" min="0" value={formData.chiffreAffaires?.toString() || ''} onChange={(e) => handleChange('chiffreAffaires', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`200 000 ${formData.devise}`} suffix={formData.devise || 'MAD'} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "Dernier bilan / Kbis", inputId: 'loc-doc-bilan', field: 'dernierBilanUrl' as const, nameField: 'dernierBilanName' as const, uploaded: formData.dernierBilanUrl, name: formData.dernierBilanName },
                        { label: "Dernier avis d'imposition", inputId: 'loc-doc-impot', field: 'dernierAvisImpotUrl' as const, nameField: 'dernierAvisImpotName' as const, uploaded: formData.dernierAvisImpotUrl, name: formData.dernierAvisImpotName },
                      ].map((doc, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                          <span className="text-sm text-text flex-1">{doc.label}</span>
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
                  </div>
                )}

                {formData.situationPro === 'Retraite' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label="Pension mensuelle nette" type="number" min="0" value={formData.pensionMensuelle?.toString() || ''} onChange={(e) => handleChange('pensionMensuelle', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`8 000 ${formData.devise}`} suffix={formData.devise || 'MAD'} />
                    <DatePicker label="Date de retraite" value={formData.dateRetraite} onChange={(e) => handleChange('dateRetraite', e.target.value)} />
                    <Input label="Organisme de retraite" value={formData.organismeRetraite} onChange={(e) => handleChange('organismeRetraite', e.target.value)} placeholder="CNSS, CNRPS..." />
                  </div>
                )}

                {formData.situationPro === 'Etudiant' && (
                  <div className="border-t border-border/30 pt-4 space-y-4">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Garant (optionnel)</p>
                    <Checkbox label="Le locataire a un garant" checked={formData.garant} onChange={(checked) => handleChange('garant', checked)} />
                    {formData.garant && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Nom du garant" value={formData.garantNom} onChange={(e) => handleChange('garantNom', e.target.value)} placeholder="Nom complet" />
                        <Input label="Revenus du garant" type="number" min="0" value={formData.garantRevenus?.toString() || ''} onChange={(e) => handleChange('garantRevenus', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`20 000 ${formData.devise}`} />
                      </div>
                    )}
                  </div>
                )}

                {formData.situationPro === 'Sans emploi' && (
                  <div className="space-y-4">
                    <div className="border-t border-border/30 pt-4 space-y-4">
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Garant (obligatoire)</p>
                      <Checkbox label="Le locataire a un garant *" checked={formData.garant} onChange={(checked) => handleChange('garant', checked)} />
                      {errors.garant && <p className="text-xs text-error">{errors.garant}</p>}
                      {formData.garant && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input label="Nom du garant" value={formData.garantNom} onChange={(e) => handleChange('garantNom', e.target.value)} placeholder="Nom complet" />
                          <Input label="Revenus du garant" type="number" min="0" value={formData.garantRevenus?.toString() || ''} onChange={(e) => handleChange('garantRevenus', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`20 000 ${formData.devise}`} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                      <span className="text-sm text-text flex-1">Justificatif de situation</span>
                      {formData.justificatifSituationUrl ? (
                        <span className="text-[10px] font-medium text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <Upload size={10} /> Uploadé
                        </span>
                      ) : null}
                      <div className="relative">
                        <input id="loc-doc-situation" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const urls = await uploadFiles([file]);
                            if (urls[0]) { handleChange('justificatifSituationUrl', urls[0]); handleChange('justificatifSituationName', file.name); }
                          } catch { /* upload failed silently */ }
                        }} />
                        <button type="button" onClick={() => document.getElementById('loc-doc-situation')?.click()} className={`text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all`}>{formData.justificatifSituationUrl ? 'Remplacer' : 'Parcourir...'}</button>
                      </div>
                    </div>
                  </div>
                )}

                {!formData.situationPro && (
                  <div className="border-t border-border/30 pt-4 space-y-4">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Garant</p>
                    <Checkbox label="Le locataire a un garant" checked={formData.garant} onChange={(checked) => handleChange('garant', checked)} />
                    {formData.garant && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Nom du garant" value={formData.garantNom} onChange={(e) => handleChange('garantNom', e.target.value)} placeholder="Nom complet" />
                        <Input label="Revenus du garant" type="number" min="0" value={formData.garantRevenus?.toString() || ''} onChange={(e) => handleChange('garantRevenus', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`20 000 ${formData.devise}`} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {renderSection('NOTES & INFORMATIONS COMPLÉMENTAIRES', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Situation actuelle *" options={SITUATION_ACTUELLE_OPTIONS} value={formData.situationActuelle} onValueChange={(v) => handleChange('situationActuelle', v)} error={errors.situationActuelle} />
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
              <h2 className="text-base font-semibold text-text">MANDAT DE RECHERCHE DE LOCATION</h2>
            </div>

            {renderSection('1. INFORMATIONS GÉNÉRALES DU MANDAT', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Numéro de mandat" value={formData.numeroMandat} onChange={(e) => handleChange('numeroMandat', e.target.value)} placeholder="MLR-2026-001" />
                <Select label="Statut du mandat" options={STATUT_MANDAT_OPTIONS} value={formData.statutMandat} onValueChange={(v) => handleChange('statutMandat', v)} />
                <DatePicker label="Date de début" value={formData.dateDebut} onChange={(e) => handleChange('dateDebut', e.target.value)} />
                <DatePicker label="Date d'expiration" value={formData.dateExpiration} onChange={(e) => handleChange('dateExpiration', e.target.value)} />
              </div>
            ))}
            {renderSection('2. TYPE DE MANDAT', (
              <div>{renderRadioGroup('Type de mandat', 'typeMandat', TYPE_MANDAT_OPTIONS)}</div>
            ))}
            {renderSection('3. BIEN RECHERCHÉ', (
              <div className="space-y-4">
                <p className="text-xs text-text-secondary">Recherchez par nom de bien, référence, ville ou nom du bailleur</p>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Rechercher un bien..."
                    className={`w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'} transition-all`}
                    value={propertySearchQuery}
                    onChange={(e) => {
                      setPropertySearchQuery(e.target.value);
                      if (selectedProperty) {
                        setSelectedProperty(null);
                        handleChange('bienRechercheId', '');
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
                            handleChange('bienRechercheId', String(p.id));
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
                {selectedProperty && (
                  <div className={`p-3 rounded-lg ${isGerant ? 'bg-[#905D5D]/5 border-[#905D5D]/20' : 'bg-accent/5 border-accent/20'} border flex items-center justify-between`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg ${isGerant ? 'bg-[#905D5D]/10' : 'bg-accent/10'} flex items-center justify-center shrink-0`}>
                        <Home size={14} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{selectedProperty.title || selectedProperty.reference || `Bien #${selectedProperty.id}`}</p>
                        <p className="text-[11px] text-text-secondary/60 truncate">
                          {selectedProperty.reference && <span className="font-mono">{selectedProperty.reference}</span>}
                          {selectedProperty.city && ` · ${selectedProperty.city}`}
                          {selectedProperty.surface ? ` · ${selectedProperty.surface} m²` : ''}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setSelectedProperty(null); handleChange('bienRechercheId', ''); }} className={`p-1 rounded-md ${isGerant ? 'hover:bg-[#905D5D]/10' : 'hover:bg-accent/10'} transition-colors shrink-0`}>
                      <X size={14} className="text-text-secondary" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {renderSection('4. RÉMUNÉRATION DE L\'AGENCE', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Type de rémunération" value="Honoraires de location" disabled />
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Montant / Pourcentage</label>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    <button type="button" onClick={() => handleChange('honorairesLocationIsPercentage', false)} className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${!formData.honorairesLocationIsPercentage ? (isGerant ? 'bg-[#905D5D] text-white' : 'bg-accent text-white') : 'bg-background text-text-secondary hover:text-text'}`}>
                      Montant ({formData.devise || 'MAD'})
                    </button>
                    <button type="button" onClick={() => handleChange('honorairesLocationIsPercentage', true)} className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-border ${formData.honorairesLocationIsPercentage ? (isGerant ? 'bg-[#905D5D] text-white' : 'bg-accent text-white') : 'bg-background text-text-secondary hover:text-text'}`}>
                      Pourcentage (%)
                    </button>
                  </div>
                  <Input type="number" min="0" max={formData.honorairesLocationIsPercentage ? 100 : undefined} step={formData.honorairesLocationIsPercentage ? '0.01' : '1'} value={formData.honorairesLocation?.toString() || ''} onChange={(e) => { const v = e.target.value ? parseFloat(e.target.value) : undefined; if (formData.honorairesLocationIsPercentage && v !== undefined && v > 100) return; handleChange('honorairesLocation', v); }} placeholder={formData.honorairesLocationIsPercentage ? 'Ex: 5' : `Ex: 3 000 ${formData.devise}`} suffix={formData.honorairesLocationIsPercentage ? '%' : formData.devise || 'MAD'} className="mt-2" />
                </div>
                <Select label="Condition de paiement" options={[{ value: '', label: 'Sélectionner...' }, ...PAIEMENT_CONDITION_OPTIONS]} value={formData.conditionPaiement} onValueChange={(v) => handleChange('conditionPaiement', v)} />
              </div>
            ))}
            {renderSection('5. DOCUMENTS JUSTIFICATIFS', (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">Documents obligatoires à fournir par le locataire :</p>
                {[
                  { label: "Pièce d'identité (passeport ou CIN)", required: true, inputId: 'loc-doc-identite', field: 'docIdentiteUrl' as const, nameField: 'docIdentiteName' as const, uploaded: formData.docIdentiteUrl, name: formData.docIdentiteName },
                  { label: 'Justificatif de domicile actuel', required: true, inputId: 'loc-doc-domicile', field: 'docDomicileUrl' as const, nameField: 'docDomicileName' as const, uploaded: formData.docDomicileUrl, name: formData.docDomicileName },
                  { label: '3 dernières fiches de paie', required: true, inputId: 'loc-doc-fiches-paie', field: 'docFichesDePaieUrl' as const, nameField: 'docFichesDePaieName' as const, uploaded: formData.docFichesDePaieUrl, name: formData.docFichesDePaieName },
                  { label: 'Contrat de travail', required: true, inputId: 'loc-doc-contrat', field: 'docContratTravailUrl' as const, nameField: 'docContratTravailName' as const, uploaded: formData.docContratTravailUrl, name: formData.docContratTravailName },
                  { label: "Relevé d'identité bancaire (RIB)", required: true, inputId: 'loc-doc-rib', field: 'docRIBUrl' as const, nameField: 'docRIBName' as const, uploaded: formData.docRIBUrl, name: formData.docRIBName },
                  { label: "Dossier garant (pièce d'identité + justificatif de revenus)", required: false, inputId: 'loc-doc-garant', field: 'docGarantUrl' as const, nameField: 'docGarantName' as const, uploaded: formData.docGarantUrl, name: formData.docGarantName },
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
            {renderSection('6. SIGNATURES', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-background/50">
                    <p className="text-sm font-medium text-text mb-2">✍️ Signature du locataire</p>
                    <div className="h-16 rounded border border-dashed border-text-secondary/30 flex items-center justify-center text-text-secondary text-xs">Champ de signature électronique</div>
                    <p className="text-xs text-text-secondary mt-1">ou document signé téléchargé</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-background/50">
                    <p className="text-sm font-medium text-text mb-2">✍️ Signature de l'agent</p>
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
                       <input id="loc-mandat-upload" type="file" accept=".pdf" className="hidden" onChange={async (e) => {
                         const file = e.target.files?.[0];
                         if (!file) return;
                         try {
                           const urls = await uploadFiles([file]);
                           if (urls[0]) { handleChange('mandatPdfUrl', urls[0]); handleChange('mandatPdfName', file.name); }
                         } catch { /* upload failed silently */ }
                       }} />
                       <button type="button" onClick={() => document.getElementById('loc-mandat-upload')?.click()} className={`text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all`}>{formData.mandatPdfUrl ? 'Remplacer' : 'Parcourir...'}</button>
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
            <h2 className="text-lg font-semibold">{editingClient ? 'Modifier le locataire' : 'Nouveau locataire'}</h2>
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
                    {isSubmitting ? 'Enregistrement...' : editingClient ? 'Mettre à jour le locataire' : "Créer le locataire"}
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
