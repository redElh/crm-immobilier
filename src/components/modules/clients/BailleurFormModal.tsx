import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Save, Upload, Eye, ExternalLink, Home, Briefcase, MapPin } from 'react-feather';
import { useNavigate, useParams } from 'react-router-dom';
import { Client } from '../../../types/client';
import { AGENTS } from '../../../types/calendar';
import { DatePicker } from '../../ui/DatePicker';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Checkbox } from '../../ui/Checkbox';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
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

interface BailleurFormModalProps {
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
  { value: 'En attente de signature', label: 'En attente de signature' },
  { value: 'En mandat', label: 'En mandat' },
  { value: 'En negociation', label: 'En n\u00e9gociation' },
  { value: 'En location', label: 'En location' },
  { value: 'Loue', label: 'Lou\u00e9' },
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

const TYPE_LOYER_OPTIONS = [
  { value: 'Libre', label: 'Libre' },
  { value: 'Conventionne', label: 'Conventionné' },
  { value: 'Etudiant', label: 'Étudiant' },
  { value: 'Meuble', label: 'Meublé' },
];

const PERIODICITE_LOYER_OPTIONS = [
  { value: 'Mensuel', label: 'Mensuel' },
  { value: 'Trimestriel', label: 'Trimestriel' },
  { value: 'Semestriel', label: 'Semestriel' },
  { value: 'Annuel', label: 'Annuel' },
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

const SITUATION_ACTUELLE_OPTIONS = [
  { value: 'Proprietaire occupant', label: 'Propriétaire occupant' },
  { value: 'Proprietaire bailleur', label: 'Propriétaire bailleur' },
  { value: 'En indivision', label: 'En indivision' },
  { value: 'SCI', label: 'SCI' },
  { value: 'Autre', label: 'Autre' },
];

const RAISON_MISE_EN_LOCATION_OPTIONS = [
  { value: 'Mutation', label: 'Mutation' },
  { value: 'Demenagement', label: 'Déménagement' },
  { value: 'Investissement locatif', label: 'Investissement locatif' },
  { value: 'Succession', label: 'Succession' },
  { value: 'Autre', label: 'Autre' },
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
  { value: 'Gestion', label: 'Gestion (location)' },
  { value: 'Location', label: 'Location (recherche locataire)' },
  { value: 'Co-gestion', label: 'Co-gestion' },
];

const REMUNERATION_TYPE_OPTIONS = [
  { value: 'Frais de gestion mensuels', label: 'Frais de gestion mensuels' },
  { value: 'Commission sur loyer', label: 'Commission sur loyer' },
  { value: 'Forfait annuel', label: 'Forfait annuel' },
];

const CONDITION_PAIEMENT_OPTIONS = [
  { value: 'Preleve sur loyer', label: 'Prélevé sur loyer' },
  { value: 'Facture annuellement', label: 'Facturé annuellement' },
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

interface BailleurFormData {
  actif: boolean;
  classification: string;
  statutMetier: string;
  contactId: string;
  origine: string;
  plan: string;
  adresseComplete: string;
  complementAdresse: string;
  codePostalVille: string;
  pays: string;
  secteur: string;
  categorie: string;
  typeBien: string;
  referenceCadastrale: string;
  lotCopropriete: number | undefined;
  syndicPresent: boolean;
  nbLotsTotal: number | undefined;
  piecesOperator: string;
  pieces: number | undefined;
  chambresOperator: string;
  chambres: number | undefined;
  surfaceMin: number | undefined;
  surfaceMax: number | undefined;
  etageOperator: string;
  etage: number | undefined;
  vue: string;
  exposition: string;
  etat: string;
  standing: string;
  disponibilite: string;
  devise: string;
  loyerHC: number | undefined;
  charges: number | undefined;
  depotGarantie: number | undefined;
  typeLoyer: string;
  periodiciteLoyer: string;
  attributPrincipal: string;
  attributsPersonnalises: string[];
  criteres: string[];
  proximites: ProximiteCategorie;
  prestations: PrestationCategorie;
  situationActuelle: string;
  raisonMiseEnLocation: string;
  creditEnCours: boolean;
  creditMontantRestant: number | undefined;
  dateDisponibilite: string;
  notesComplementaires: string;
  conditionsParticulieres: string;
  numeroMandat: string;
  statutMandat: string;
  dateSignature: string;
  dateDebut: string;
  dateExpiration: string;
  typeMandat: string;
  dureeMandat: string;
  clauseProtection: boolean;
  clauseProtectionMois: number;
  conjoint: string;
  societe: string;
  agentDesigne: string;
  bienConcerneId: string;
  typeRemuneration: string;
  montantRemuneration: number | undefined;
  remunerationIsPercentage: boolean;
  conditionPaiement: string;
  fraisMiseEnLocation: number | undefined;
  fraisEtatDesLieux: number | undefined;
  fraisRenouvellementBail: number | undefined;
  signatureBailleur: string;
  signatureAgent: string;
  dateSignatureMandat: string;
  mandatSignePdfUrl: string;
  mandatSignePdfName: string;
  docIdentiteUrl: string;
  docIdentiteName: string;
  docTitreProprieteUrl: string;
  docTitreProprieteName: string;
  docDiagnosticUrl: string;
  docDiagnosticName: string;
  docCoproprieteUrl: string;
  docCoproprieteName: string;
  docAssuranceUrl: string;
  docAssuranceName: string;
  docEtatDesLieuxUrl: string;
  docEtatDesLieuxName: string;
  docAutreUrl: string;
  docAutreName: string;
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
  { id: 7, label: 'Situation & Notes' },
  { id: 8, label: 'Mandat' },
];

const generateMandatNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `MG-${year}-${random}`;
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
const inOneYear = formatDate(addMonths(new Date(), 12));

export function resetBailleurFormData(): BailleurFormData {
  const today = formatDate(new Date());
  const inOneYear = formatDate(addMonths(new Date(), 12));
  return {
    actif: true,
    classification: 'Actif',
    statutMetier: 'En attente de signature',
    contactId: '',
    origine: '',
    plan: '',
    adresseComplete: '',
    complementAdresse: '',
    codePostalVille: '',
    pays: 'Maroc',
    secteur: '',
    categorie: '',
    typeBien: '',
    referenceCadastrale: '',
    lotCopropriete: undefined,
    syndicPresent: false,
    nbLotsTotal: undefined,
    piecesOperator: 'ge',
    pieces: undefined,
    chambresOperator: 'ge',
    chambres: undefined,
    surfaceMin: undefined,
    surfaceMax: undefined,
    etageOperator: 'ge',
    etage: undefined,
    vue: '',
    exposition: '',
    etat: '',
    standing: '',
    disponibilite: '',
    devise: 'MAD',
    loyerHC: undefined,
    charges: undefined,
    depotGarantie: undefined,
    typeLoyer: 'Libre',
    periodiciteLoyer: 'Mensuel',
    attributPrincipal: '',
    attributsPersonnalises: [],
    criteres: [],
    proximites: { transports: [], commerces: [], education: [], sante: [], loisirs: [] },
    prestations: { exterieur: [], confort: [], electromenager: [], multimedia: [], sport: [] },
    situationActuelle: '',
    raisonMiseEnLocation: '',
    creditEnCours: false,
    creditMontantRestant: undefined,
    dateDisponibilite: '',
    notesComplementaires: '',
    conditionsParticulieres: '',
    numeroMandat: generateMandatNumber(),
    statutMandat: 'Non défini',
    dateSignature: today,
    dateDebut: today,
    dateExpiration: inOneYear,
    typeMandat: '',
    dureeMandat: '',
    clauseProtection: false,
    clauseProtectionMois: 3,
    conjoint: '',
    societe: '',
    agentDesigne: '',
    bienConcerneId: '',
    typeRemuneration: '',
    montantRemuneration: undefined,
    remunerationIsPercentage: false,
    conditionPaiement: '',
    fraisMiseEnLocation: undefined,
    fraisEtatDesLieux: undefined,
    fraisRenouvellementBail: undefined,
    signatureBailleur: '',
    signatureAgent: '',
    dateSignatureMandat: today,
    mandatSignePdfUrl: '',
    mandatSignePdfName: '',
    docIdentiteUrl: '',
    docIdentiteName: '',
    docTitreProprieteUrl: '',
    docTitreProprieteName: '',
    docDiagnosticUrl: '',
    docDiagnosticName: '',
    docCoproprieteUrl: '',
    docCoproprieteName: '',
    docAssuranceUrl: '',
    docAssuranceName: '',
    docEtatDesLieuxUrl: '',
    docEtatDesLieuxName: '',
    docAutreUrl: '',
    docAutreName: '',
    latitude: 0,
    longitude: 0,
  };
}

export const BailleurFormModal = ({ onClose, onSubmit, assignmentInfo, draftId: initialDraftId, userId, onDraftChange, client: editingClient, selectedContactId, isGerant = false }: BailleurFormModalProps) => {
  const [step, setStep] = useState(1);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactOptions, setContactOptions] = useState<{value: string; label: string}[]>([]);
  const [formData, setFormData] = useState<BailleurFormData>({
    actif: true,
    classification: 'Actif',
    statutMetier: 'En attente de signature',
    contactId: selectedContactId || '',
    origine: '',
    plan: '',
    adresseComplete: '',
    complementAdresse: '',
    codePostalVille: '',
    pays: 'Maroc',
    secteur: '',
    categorie: '',
    typeBien: '',
    referenceCadastrale: '',
    lotCopropriete: undefined,
    syndicPresent: false,
    nbLotsTotal: undefined,
    piecesOperator: 'ge',
    pieces: undefined,
    chambresOperator: 'ge',
    chambres: undefined,
    surfaceMin: undefined,
    surfaceMax: undefined,
    etageOperator: 'ge',
    etage: undefined,
    vue: '',
    exposition: '',
    etat: '',
    standing: '',
    disponibilite: '',
    devise: 'MAD',
    loyerHC: undefined,
    charges: undefined,
    depotGarantie: undefined,
    typeLoyer: 'Libre',
    periodiciteLoyer: 'Mensuel',
    attributPrincipal: '',
    attributsPersonnalises: [],
    criteres: [],
    proximites: { transports: [], commerces: [], education: [], sante: [], loisirs: [] },
    prestations: { exterieur: [], confort: [], electromenager: [], multimedia: [], sport: [] },
    situationActuelle: '',
    raisonMiseEnLocation: '',
    creditEnCours: false,
    creditMontantRestant: undefined,
    dateDisponibilite: '',
    notesComplementaires: '',
    conditionsParticulieres: '',
    numeroMandat: generateMandatNumber(),
    statutMandat: 'Non défini',
    dateSignature: today,
    dateDebut: today,
    dateExpiration: inOneYear,
    typeMandat: '',
    dureeMandat: '',
    clauseProtection: false,
    clauseProtectionMois: 3,
    conjoint: '',
    societe: '',
    agentDesigne: '',
    bienConcerneId: '',
    typeRemuneration: '',
    montantRemuneration: undefined,
    remunerationIsPercentage: false,
    conditionPaiement: '',
    fraisMiseEnLocation: undefined,
    fraisEtatDesLieux: undefined,
    fraisRenouvellementBail: undefined,
    signatureBailleur: '',
    signatureAgent: '',
    dateSignatureMandat: today,
    mandatSignePdfUrl: '',
    mandatSignePdfName: '',
    docIdentiteUrl: '',
    docIdentiteName: '',
    docTitreProprieteUrl: '',
    docTitreProprieteName: '',
    docDiagnosticUrl: '',
    docDiagnosticName: '',
    docCoproprieteUrl: '',
    docCoproprieteName: '',
    docAssuranceUrl: '',
    docAssuranceName: '',
    docEtatDesLieuxUrl: '',
    docEtatDesLieuxName: '',
    docAutreUrl: '',
    docAutreName: '',
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

  useEffect(() => {
    if (!editingClient) return;
    const c = editingClient as any;
    setFormData(prev => ({
      ...prev,
      actif: editingClient.status === 'Actif',
      classification: editingClient.classification || 'Actif',
      statutMetier: editingClient.statutMetier || 'En attente de signature',
      contactId: editingClient.contactId || '',
      origine: editingClient.source || '',
      secteur: editingClient.secteur || editingClient.area || '',
      typeBien: editingClient.propertyType || '',
      devise: editingClient.devise || 'MAD',
      piecesOperator: editingClient.piecesOperator || 'ge',
      pieces: editingClient.pieces,
      chambresOperator: editingClient.chambresOperator || 'ge',
      chambres: editingClient.chambres,
      surfaceMin: editingClient.minSurface,
      surfaceMax: editingClient.surfaceMax,
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
      raisonMiseEnLocation: editingClient.reasonForSelling || '',
      situationActuelle: editingClient.currentSituation || '',
      notesComplementaires: c.notesComplementaires || editingClient.notes || '',
      conditionsParticulieres: c.conditionsParticulieres || '',
      creditEnCours: c.creditEnCours || false,
      creditMontantRestant: c.creditMontantRestant,
      dateDisponibilite: c.dateDisponibilite || '',
      loyerHC: c.loyerHC,
      charges: c.charges,
      depotGarantie: c.depotGarantie,
      typeLoyer: c.typeLoyer || '',
      periodiciteLoyer: c.periodiciteLoyer || '',
      adresseComplete: c.adresseComplete || '',
      complementAdresse: c.complementAdresse || '',
      codePostalVille: c.codePostalVille || '',
      pays: c.pays || editingClient.localisation || prev.pays,
      referenceCadastrale: c.referenceCadastrale || '',
      lotCopropriete: c.lotCopropriete,
      syndicPresent: c.syndicPresent || false,
      nbLotsTotal: c.nbLotsTotal,
      societe: editingClient.societe || '',
      dureeMandat: c.dureeMandat || '',
      clauseProtection: !!editingClient.dureeProtection,
      clauseProtectionMois: editingClient.dureeProtection ? parseInt(editingClient.dureeProtection) || 0 : 0,
      typeRemuneration: editingClient.typeRemuneration || '',
      conditionPaiement: editingClient.conditionPaiement || '',
      fraisMiseEnLocation: c.fraisMiseEnLocation,
      fraisEtatDesLieux: c.fraisEtatDesLieux,
      fraisRenouvellementBail: c.fraisRenouvellementBail,
      mandatSignePdfUrl: c.mandatPdfUrl || '',
      mandatSignePdfName: c.mandatPdfName || '',
      docIdentiteUrl: c.docIdentiteUrl || '',
      docIdentiteName: c.docIdentiteName || '',
      docTitreProprieteUrl: c.docDomicileUrl || '',
      docTitreProprieteName: c.docDomicileName || '',
      docDiagnosticUrl: c.docDiagnosticUrl || '',
      docDiagnosticName: c.docDiagnosticName || '',
      docCoproprieteUrl: c.docRevenusUrl || '',
      docCoproprieteName: c.docRevenusName || '',
      docAssuranceUrl: c.docAssuranceUrl || '',
      docAssuranceName: c.docAssuranceName || '',
      docEtatDesLieuxUrl: c.docEtatDesLieuxUrl || '',
      docEtatDesLieuxName: c.docEtatDesLieuxName || '',
      docAutreUrl: c.docFinancementUrl || '',
      docAutreName: c.docFinancementName || '',
      numeroMandat: editingClient.numeroMandat || prev.numeroMandat,
      dateSignature: editingClient.dateSignature || prev.dateSignature,
      dateDebut: editingClient.dateDebut || prev.dateDebut,
      dateExpiration: editingClient.dateExpiration || prev.dateExpiration,
      statutMandat: editingClient.statutMandat || 'Non défini',
      typeMandat: editingClient.typeMandat || '',
      conjoint: editingClient.conjoint || '',
      agentDesigne: editingClient.agentDesigne || editingClient.agentId || '',
      bienConcerneId: c.bienConcerneId || '',
      montantRemuneration: editingClient.montantRemuneration,
      remunerationIsPercentage: editingClient.remunerationIsPercentage ?? false,
      latitude: c.latitude || 0,
      longitude: c.longitude || 0,
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

  const { adminId, agentId } = useParams<{ adminId?: string; agentId?: string }>();

  const [bailleurProperties, setBailleurProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false);

  useEffect(() => {
    setLoadingProperties(true);
    api.get<any[]>('/properties')
      .then((res) => setBailleurProperties(Array.isArray(res) ? res : []))
      .catch(() => setBailleurProperties([]))
      .finally(() => setLoadingProperties(false));
  }, []);

  const filteredBailleurProperties = useMemo(() => {
    const contact = contacts.find((c: any) => String(c.id) === formData.contactId);
    const contactFirstName = (contact?.firstName || '').toLowerCase().trim();
    const contactLastName = (contact?.lastName || '').toLowerCase().trim();
    const stripCivility = (s: string) => s
      .replace(/^(mme?|mlle?|dr|maitre|maitresse|me|maître)\s+/i, '')
      .replace(/\s+(mme?|mlle?|dr|maitre|maitresse|me|maître)$/i, '')
      .trim();
    const stripCivilityAndClean = (s: string) => stripCivility(s).toLowerCase().replace(/\s+/g, ' ').trim();
    return bailleurProperties.filter((p: any) => {
      if (p.status !== 'for_rent') return false;
      if (!contactFirstName && !contactLastName) return false;
      const ownerName = stripCivilityAndClean(p.owner?.name || '');
      const matchesFirst = !contactFirstName || ownerName.includes(contactFirstName);
      const matchesLast = !contactLastName || ownerName.includes(contactLastName);
      return matchesFirst && matchesLast;
    });
  }, [bailleurProperties, contacts, formData.contactId]);

  const propertyTypeRouteMap: Record<string, { route: string; transactionType: string }> = {
    'Résidentiel': { route: 'residential', transactionType: 'location_ld' },
    'Commercial': { route: 'commercial', transactionType: 'location_ld' },
  };

  const handlePropertyTypeSelect = (typeName: string) => {
    const config = propertyTypeRouteMap[typeName] || { route: 'residential', transactionType: 'location' };
    const basePath = adminId ? `/admin/${adminId}` : agentId ? `/${agentId}` : '';
    setShowPropertyTypeModal(false);
    window.open(`${basePath}/properties/type/${config.route}/add?transactionType=${config.transactionType}`, '_blank');
  };

  const [errors, setErrors] = useState<Partial<Record<keyof BailleurFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | undefined>(initialDraftId || undefined);
  const [loadingDraft, setLoadingDraft] = useState(!!initialDraftId);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const loyerCC = useMemo(() => {
    if (!formData.loyerHC) return 0;
    return formData.loyerHC + (formData.charges || 0);
  }, [formData.loyerHC, formData.charges]);

  useEffect(() => {
    if (editingClient) return;
    const section1 = formData.numeroMandat.trim() && formData.dateDebut.trim() && formData.dateExpiration.trim();
    const section2 = formData.typeMandat.trim() !== '';
    const section3 = !formData.clauseProtection || (formData.clauseProtection && (formData.clauseProtectionMois ?? 0) > 0);
    const section4 = formData.conjoint.trim() !== '' || formData.societe.trim() !== '' || (assignmentInfo?.assignedName?.trim() ?? '') !== '';
    const section5 = formData.typeRemuneration !== '' && formData.montantRemuneration !== undefined && formData.conditionPaiement !== '' && formData.fraisMiseEnLocation !== undefined && formData.fraisEtatDesLieux !== undefined && formData.fraisRenouvellementBail !== undefined;
    const allFilled = section1 && section2 && section3 && section4 && section5;
    const newStatus = allFilled ? 'En attente de signature' : 'Non défini';
    setFormData(prev => prev.statutMandat !== newStatus ? { ...prev, statutMandat: newStatus } : prev);
  }, [
    editingClient,
    formData.numeroMandat, formData.dateDebut, formData.dateExpiration,
    formData.typeMandat,
    formData.clauseProtection, formData.clauseProtectionMois,
    formData.conjoint, formData.societe, assignmentInfo?.assignedName,
    formData.typeRemuneration, formData.montantRemuneration, formData.conditionPaiement,
    formData.fraisMiseEnLocation, formData.fraisEtatDesLieux, formData.fraisRenouvellementBail,
  ]);

  useEffect(() => {
    if (formData.statutMandat === 'Actif') return;
    const mapping: Record<string, string> = {
      'Non défini': 'En attente de signature',
      'En attente de signature': 'En attente de signature',
      'Termine': 'Loue',
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

  const calcCompletion = (data: BailleurFormData): number => {
    const fields = [
      data.classification, data.statutMetier, data.origine,
      data.secteur, data.categorie, data.typeBien,
      data.pieces, data.chambres, data.surfaceMin, data.surfaceMax,
      data.vue, data.exposition, data.etat, data.standing, data.disponibilite,
      data.attributPrincipal, data.attributsPersonnalises, data.criteres,
      data.proximites, data.prestations,
      data.loyerHC, data.charges, data.depotGarantie, data.typeLoyer, data.periodiciteLoyer,
      data.raisonMiseEnLocation, data.situationActuelle,
      data.creditEnCours, data.creditMontantRestant, data.dateDisponibilite,
      data.conditionsParticulieres, data.notesComplementaires,
      data.fraisMiseEnLocation, data.fraisEtatDesLieux, data.fraisRenouvellementBail,
      data.statutMandat, data.dureeMandat, data.clauseProtection,
      data.typeRemuneration, data.montantRemuneration, data.conditionPaiement,
      data.agentDesigne, data.mandatSignePdfUrl, data.bienConcerneId,
      data.docIdentiteUrl, data.docTitreProprieteUrl, data.docDiagnosticUrl,
      data.docCoproprieteUrl, data.docAssuranceUrl, data.docEtatDesLieuxUrl, data.docAutreUrl,
      data.adresseComplete, data.complementAdresse, data.codePostalVille, data.pays,
    ];
    const filled = fields.filter(isFilled).length;
    return Math.min(100, Math.round((filled / fields.length) * 100));
  };

  const doSaveDraft = () => {
    if (!userId) return;
    const data = { ...formDataRef.current, _draftId: savedDraftId, _step: step };
    const draft = saveDraft(userId, 'Bailleur', data, calcCompletion(formDataRef.current));
    if (!savedDraftId) setSavedDraftId(draft.id);
    onDraftChange?.();
  };

  useEffect(() => {
    if (!savedDraftId) return;
    const timer = setTimeout(doSaveDraft, 2000);
    return () => clearTimeout(timer);
  }, [formData, savedDraftId, step]);

  const handleChange = (field: keyof BailleurFormData, value: any) => {
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

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BailleurFormData, string>> = {};
    if (!formData.contactId) newErrors.contactId = 'Veuillez sélectionner ou créer un contact';
    if (!formData.origine) newErrors.origine = "L'origine est requise";
    if (!formData.typeBien) newErrors.typeBien = 'Le type de bien est requis';
    if (!formData.categorie) newErrors.categorie = 'La catégorie est requise';
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
      type: 'Bailleur' as const,
      status: (formData.actif ? 'Actif' : 'Inactif') as 'Actif' | 'Inactif',
      phone: (formData.contactId ? (contacts.find(c => String(c.id) === formData.contactId)?.mobile || '') : '') || editingClient?.phone || '',
      email: (formData.contactId ? (contacts.find(c => String(c.id) === formData.contactId)?.emailPrincipal || '') : '') || editingClient?.email || '',
      completion: calcCompletion(formData),
      source: formData.origine,
      localisation: formData.pays,
      secteur: formData.secteur,
      categorie: formData.categorie,
      propertyType: formData.typeBien,
      classification: formData.classification,
      notes: formData.notesComplementaires,
      statutMetier: formData.statutMetier,
      statutMandat: formData.statutMandat,
      minSurface: formData.surfaceMin,
      currentSituation: formData.situationActuelle,
      reasonForSelling: formData.raisonMiseEnLocation,
      dureeProtection: formData.clauseProtection ? (formData.clauseProtectionMois?.toString() || '') : '',
      typeRemuneration: formData.typeRemuneration || undefined,
      montantRemuneration: formData.montantRemuneration,
      remunerationIsPercentage: formData.remunerationIsPercentage,
      conditionPaiement: formData.conditionPaiement || undefined,
      agentId: formData.agentDesigne || undefined,
      agentDesigne: formData.agentDesigne || undefined,
      bienConcerneId: formData.bienConcerneId || undefined,
      mandatPdfUrl: formData.mandatSignePdfUrl || undefined,
      mandatPdfName: formData.mandatSignePdfName || undefined,
      docIdentiteUrl: formData.docIdentiteUrl || undefined,
      docIdentiteName: formData.docIdentiteName || undefined,
      docDomicileUrl: formData.docTitreProprieteUrl || undefined,
      docDomicileName: formData.docTitreProprieteName || undefined,
      docDiagnosticUrl: formData.docDiagnosticUrl || undefined,
      docDiagnosticName: formData.docDiagnosticName || undefined,
      docRevenusUrl: formData.docCoproprieteUrl || undefined,
      docRevenusName: formData.docCoproprieteName || undefined,
      docAssuranceUrl: formData.docAssuranceUrl || undefined,
      docAssuranceName: formData.docAssuranceName || undefined,
      docEtatDesLieuxUrl: formData.docEtatDesLieuxUrl || undefined,
      docEtatDesLieuxName: formData.docEtatDesLieuxName || undefined,
      docFinancementUrl: formData.docAutreUrl || undefined,
      docFinancementName: formData.docAutreName || undefined,
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
    field: keyof BailleurFormData,
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
                    ? (isGerant ? 'bg-[#905D5D] text-white border-[#905D5D]' : 'bg-accent text-white border-accent')
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
            {renderSection('INFORMATIONS FONCIÈRES', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Référence cadastrale" value={formData.referenceCadastrale} onChange={(e) => handleChange('referenceCadastrale', e.target.value)} placeholder="Ex: 123/456" />
                <Input label="Lot de copropriété" type="number" min="0" value={formData.lotCopropriete?.toString() || ''} onChange={(e) => handleChange('lotCopropriete', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="5" />
                <div className="flex items-center pt-6">
                  <Checkbox label="Syndic présent" checked={formData.syndicPresent} onChange={(checked) => handleChange('syndicPresent', checked)} />
                </div>
                {formData.syndicPresent && (
                  <Input label="Nombre de lots total" type="number" min="0" value={formData.nbLotsTotal?.toString() || ''} onChange={(e) => handleChange('nbLotsTotal', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="20" />
                )}
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
                <div>
                  <p className="text-sm font-medium text-text mb-1.5">Surface</p>
                  <div className="flex gap-2 items-center max-w-sm">
                    <Input type="number" min="0" value={formData.surfaceMin?.toString() || ''} onChange={(e) => handleChange('surfaceMin', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="80" />
                    <span className="text-text-secondary text-sm">~</span>
                    <Input type="number" min="0" value={formData.surfaceMax?.toString() || ''} onChange={(e) => handleChange('surfaceMax', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="120" />
                    <span className="text-text-secondary text-sm font-medium w-8">m²</span>
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
            {renderSection('LOYER ET CHARGES', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Loyer mensuel (hors charges)" type="number" min="0" value={formData.loyerHC?.toString() || ''} onChange={(e) => handleChange('loyerHC', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`5 000 ${formData.devise}`} />
                  <Input label="Charges mensuelles" type="number" min="0" value={formData.charges?.toString() || ''} onChange={(e) => handleChange('charges', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`500 ${formData.devise}`} />
                  <Input label="Dépôt de garantie" type="number" min="0" value={formData.depotGarantie?.toString() || ''} onChange={(e) => handleChange('depotGarantie', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="5 000 (1 mois de loyer)" />
                  <Select label="Devise" options={[
                    { value: 'MAD', label: 'MAD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'USD', label: 'USD' },
                    { value: 'GBP', label: 'GBP' },
                    { value: 'CHF', label: 'CHF' },
                  ]} value={formData.devise} onValueChange={(v) => handleChange('devise', v)} />
                  <Select label="Type de loyer" options={TYPE_LOYER_OPTIONS} value={formData.typeLoyer} onValueChange={(v) => handleChange('typeLoyer', v)} />
                  <Select label="Périodicité du loyer" options={PERIODICITE_LOYER_OPTIONS} value={formData.periodiciteLoyer} onValueChange={(v) => handleChange('periodiciteLoyer', v)} />
                </div>
                <div className={`p-4 rounded-lg border ${isGerant ? 'border-[#905D5D]/20 bg-[#905D5D]/5' : 'border-accent/20 bg-accent/5'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text">Loyer mensuel (charges comprises)</span>
                    <span className={`text-lg font-bold ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>
                      {loyerCC > 0
                        ? `${loyerCC.toLocaleString('fr-FR')} ${formData.devise}`
                        : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">Calculé: Loyer HC + Charges</p>
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
            {renderSection('SITUATION DU BAILLEUR', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Situation actuelle" options={SITUATION_ACTUELLE_OPTIONS} value={formData.situationActuelle} onValueChange={(v) => handleChange('situationActuelle', v)} />
                  <Select label="Raison de la mise en location" options={RAISON_MISE_EN_LOCATION_OPTIONS} value={formData.raisonMiseEnLocation} onValueChange={(v) => handleChange('raisonMiseEnLocation', v)} />
                </div>
                <div className="flex items-center gap-4">
                  <Checkbox label="Crédit en cours sur le bien" checked={formData.creditEnCours} onChange={(checked) => handleChange('creditEnCours', checked)} />
                  {formData.creditEnCours && (
                    <Input label="Montant restant dû" type="number" min="0" value={formData.creditMontantRestant?.toString() || ''} onChange={(e) => handleChange('creditMontantRestant', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Montant restant dû" className="max-w-xs" />
                  )}
                </div>
                <DatePicker label="Date souhaitée de disponibilité" value={formData.dateDisponibilite} onChange={(e) => handleChange('dateDisponibilite', e.target.value)} />
                <Textarea label="Conditions particulières" value={formData.conditionsParticulieres} onChange={(e) => handleChange('conditionsParticulieres', e.target.value)} placeholder="Animaux acceptés, non-fumeur, meublé, etc." rows={2} />
              </div>
            ))}
            {renderSection('NOTES COMPLÉMENTAIRES', (
              <div>
                <Textarea label="Notes complémentaires" value={formData.notesComplementaires} onChange={(e) => handleChange('notesComplementaires', e.target.value)} placeholder="Informations sur les locataires précédents, etc." rows={3} />
              </div>
            ))}
          </>
        );

      case 8:
        return (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className={`w-1 h-6 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
              <h2 className="text-base font-semibold text-text">MANDAT DE GESTION LOCATIVE</h2>
            </div>

            {renderSection('1. INFORMATIONS GÉNÉRALES DU MANDAT', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Numéro de mandat" value={formData.numeroMandat} onChange={(e) => handleChange('numeroMandat', e.target.value)} placeholder="MG-2026-001" />
                <Select label="Statut du mandat" options={STATUT_MANDAT_OPTIONS} value={formData.statutMandat} onValueChange={(v) => handleChange('statutMandat', v)} />
                <DatePicker label="Date de début" value={formData.dateDebut} onChange={(e) => handleChange('dateDebut', e.target.value)} />
                <DatePicker label="Date d'expiration" value={formData.dateExpiration} onChange={(e) => handleChange('dateExpiration', e.target.value)} />
              </div>
            ))}
            {renderSection('2. TYPE DE MANDAT', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Type de mandat" options={TYPE_MANDAT_OPTIONS} value={formData.typeMandat} onValueChange={(v) => handleChange('typeMandat', v)} />
              </div>
            ))}
            {renderSection('3. CLAUSE DE PROTECTION', (
              <div className="space-y-3">
                <Checkbox label="Activer la clause de protection" checked={formData.clauseProtection} onChange={(checked) => handleChange('clauseProtection', checked)} />
                {formData.clauseProtection && (
                  <Input label="Nombre de mois de protection" type="number" min="1" max="24" value={formData.clauseProtectionMois?.toString() || ''} onChange={(e) => handleChange('clauseProtectionMois', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="3" className="max-w-xs" />
                )}
                <p className="text-xs text-text-secondary">Si le bailleur trouve un locataire par lui-même après expiration, l'agence n'a pas droit à commission.</p>
              </div>
            ))}
            {renderSection('4. PARTIES AU CONTRAT', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Bailleur(s)" value={selectedContactName} disabled />
                <Input label="Conjoint" value={formData.conjoint} onChange={(e) => handleChange('conjoint', e.target.value)} placeholder="Nom du conjoint" />
                <Input label="Société (si SCI)" value={formData.societe} onChange={(e) => handleChange('societe', e.target.value)} placeholder="Raison sociale" />
                <Input label="Agent désigné" value={(() => {
  const raw = formData.agentDesigne || assignmentInfo?.assignedName || '';
  if (!raw) return '';
  if (USER_CACHE[raw]) return USER_CACHE[raw];
  const agent = AGENTS.find(a => a.id === raw);
  if (agent) return agent.name;
  const byName = AGENTS.find(a => a.name.toLowerCase() === raw.toLowerCase());
  return byName ? byName.name : raw;
})()} disabled />
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Bien concerné</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        placeholder={editingClient?.id ? (loadingProperties ? 'Chargement...' : 'Sélectionner un bien') : 'Créez d\'abord le client'}
                        value={formData.bienConcerneId}
                        onValueChange={(v) => handleChange('bienConcerneId', v)}
                        options={filteredBailleurProperties.map((p: any) => ({
                          value: String(p.id),
                          label: `${p.title || p.reference || `Bien #${p.id}`}${p.city ? ` - ${p.city}` : ''}`,
                        }))}
                        disabled={!editingClient?.id || loadingProperties}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPropertyTypeModal(true)}
                      className={`mt-0.5 w-9 h-9 flex items-center justify-center rounded-lg border border-dashed ${isGerant ? 'border-[#905D5D]/40 text-[#905D5D] hover:bg-[#905D5D]/10' : 'border-accent/40 text-accent hover:bg-accent/10'} transition-all shrink-0`}
                      title="Ajouter une propriété"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {!editingClient?.id && (
                    <p className="text-[11px] text-text-secondary/60 mt-1">Enregistrez le client pour pouvoir associer un bien</p>
                  )}
                </div>
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
                  <Input type="number" min="0" max={formData.remunerationIsPercentage ? 100 : undefined} step={formData.remunerationIsPercentage ? '0.01' : '1'} value={formData.montantRemuneration?.toString() || ''} onChange={(e) => { const v = e.target.value ? parseFloat(e.target.value) : undefined; if (formData.remunerationIsPercentage && v !== undefined && v > 100) return; handleChange('montantRemuneration', v); }} placeholder={formData.remunerationIsPercentage ? 'Ex: 8' : `Ex: 500 ${formData.devise}/mois`} suffix={formData.remunerationIsPercentage ? '%' : formData.devise || 'MAD'} className="mt-2" />
                </div>
                <Select label="Condition de paiement" options={CONDITION_PAIEMENT_OPTIONS} value={formData.conditionPaiement} onValueChange={(v) => handleChange('conditionPaiement', v)} />
                <Input label="Frais de mise en location" type="number" min="0" value={formData.fraisMiseEnLocation?.toString() || ''} onChange={(e) => handleChange('fraisMiseEnLocation', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`500 ${formData.devise}`} />
                <Input label="Frais d'état des lieux" type="number" min="0" value={formData.fraisEtatDesLieux?.toString() || ''} onChange={(e) => handleChange('fraisEtatDesLieux', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`300 ${formData.devise}`} />
                <Input label="Frais de renouvellement de bail" type="number" min="0" value={formData.fraisRenouvellementBail?.toString() || ''} onChange={(e) => handleChange('fraisRenouvellementBail', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`200 ${formData.devise}`} />
              </div>
            ))}
            {renderSection('6. DOCUMENTS JUSTIFICATIFS', (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">Documents à fournir par le bailleur :</p>
                {[
                  { label: "Pièce d'identité du bailleur", required: true, inputId: 'bail-doc-identite', field: 'docIdentiteUrl' as const, nameField: 'docIdentiteName' as const, uploaded: formData.docIdentiteUrl, name: formData.docIdentiteName },
                  { label: 'Titre de propriété', required: true, inputId: 'bail-doc-titre', field: 'docTitreProprieteUrl' as const, nameField: 'docTitreProprieteName' as const, uploaded: formData.docTitreProprieteUrl, name: formData.docTitreProprieteName },
                  { label: 'Diagnostic technique (DPE)', required: true, inputId: 'bail-doc-diagnostic', field: 'docDiagnosticUrl' as const, nameField: 'docDiagnosticName' as const, uploaded: formData.docDiagnosticUrl, name: formData.docDiagnosticName },
                  { label: 'Règlement de copropriété', required: false, inputId: 'bail-doc-copropriete', field: 'docCoproprieteUrl' as const, nameField: 'docCoproprieteName' as const, uploaded: formData.docCoproprieteUrl, name: formData.docCoproprieteName },
                  { label: "Attestation d'assurance propriétaire non-occupant", required: false, inputId: 'bail-doc-assurance', field: 'docAssuranceUrl' as const, nameField: 'docAssuranceName' as const, uploaded: formData.docAssuranceUrl, name: formData.docAssuranceName },
                  { label: 'État des lieux (entrant)', required: false, inputId: 'bail-doc-etat-lieux', field: 'docEtatDesLieuxUrl' as const, nameField: 'docEtatDesLieuxName' as const, uploaded: formData.docEtatDesLieuxUrl, name: formData.docEtatDesLieuxName },
                  { label: 'Autre document', required: false, inputId: 'bail-doc-autre', field: 'docAutreUrl' as const, nameField: 'docAutreName' as const, uploaded: formData.docAutreUrl, name: formData.docAutreName },
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
            {renderSection('7. SIGNATURES', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-background/50">
                    <p className="text-sm font-medium text-text mb-2">✍️ Signature du bailleur</p>
                    <div className="h-16 rounded border border-dashed border-text-secondary/30 flex items-center justify-center text-text-secondary text-xs">Champ de signature électronique</div>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-background/50">
                    <p className="text-sm font-medium text-text mb-2">✍️ Signature de l'agent</p>
                    <div className="h-16 rounded border border-dashed border-text-secondary/30 flex items-center justify-center text-text-secondary text-xs">Champ de signature électronique</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DatePicker label="Date de signature" value={formData.dateSignatureMandat} onChange={(e) => handleChange('dateSignatureMandat', e.target.value)} />
                   <div>
                     <p className="block text-sm font-medium text-text mb-1.5">Fichier du mandat signé</p>
                     <div className="h-9 flex items-center gap-3 px-3 rounded-lg border border-border bg-background/50">
                       {formData.mandatSignePdfUrl ? (
                         <Eye size={14} className="text-emerald-500 shrink-0" />
                       ) : null}
                       <span className="text-sm text-text-secondary flex-1 truncate">{formData.mandatSignePdfName || (formData.mandatSignePdfUrl ? 'Fichier uploadé' : 'Aucun fichier')}</span>
                       <input id="bail-mandat-signe-upload" type="file" accept=".pdf" className="hidden" onChange={async (e) => {
                         const file = e.target.files?.[0];
                         if (!file) return;
                         try {
                           const urls = await uploadFiles([file]);
                           if (urls[0]) { handleChange('mandatSignePdfUrl', urls[0]); handleChange('mandatSignePdfName', file.name); }
                         } catch { /* upload failed silently */ }
                       }} />
                       <button type="button" onClick={() => document.getElementById('bail-mandat-signe-upload')?.click()} className={`text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-text-secondary ${isGerant ? 'hover:text-[#905D5D] hover:border-[#905D5D]' : 'hover:text-accent hover:border-accent'} transition-all`}>{formData.mandatSignePdfUrl ? 'Remplacer' : 'Parcourir...'}</button>
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

  return (
    <>
    <AnimatePresence>
      {loadingDraft ? null : (<div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-6">
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
            <h2 className="text-lg font-semibold">{editingClient ? 'Modifier le bailleur' : 'Nouveau bailleur'}</h2>
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
                    {isSubmitting ? 'Enregistrement...' : editingClient ? 'Mettre à jour le bailleur' : "Créer le bailleur"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </div>)}

      {/* Property Type Selection Modal */}
      <Dialog isOpen={showPropertyTypeModal} onClose={() => setShowPropertyTypeModal(false)} title="Propriété de bailleur est de type :" size="md">
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">Sélectionnez le type de bien à créer :</p>
          {[
            { label: 'Résidentiel', desc: 'Appartements, maisons, villas', icon: Home, type: 'Résidentiel' },
            { label: 'Commercial', desc: 'Bureaux, locaux, boutiques', icon: Briefcase, type: 'Commercial' },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => handlePropertyTypeSelect(item.type)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-background/50 ${isGerant ? 'hover:border-[#905D5D] hover:bg-[#905D5D]/5' : 'hover:border-accent hover:bg-accent/5'} transition-all text-left group`}
            >
              <div className={`w-10 h-10 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] group-hover:bg-[#905D5D] group-hover:text-white' : 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white'} transition-all`}>
                <item.icon size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">{item.label}</p>
                <p className="text-xs text-text-secondary">{item.desc}</p>
              </div>
              <ExternalLink size={14} className={`text-text-secondary/40 ${isGerant ? 'group-hover:text-[#905D5D]' : 'group-hover:text-accent'} transition-colors`} />
            </button>
          ))}
        </div>
      </Dialog>
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
