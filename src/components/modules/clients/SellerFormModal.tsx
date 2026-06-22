import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'react-feather';
import { Client } from '../../../types/client';
import { DatePicker } from '../../ui/DatePicker';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Checkbox } from '../../ui/Checkbox';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';

interface SellerFormModalProps {
  onClose: () => void;
  onSubmit: (client: Omit<Client, 'id'>) => void;
}

const STATUT_METIER_OPTIONS = [
  { value: 'En attente de signature', label: 'En attente de signature' },
  { value: 'En mandat', label: 'En mandat' },
  { value: 'En negociation', label: 'En négociation' },
  { value: 'En compromis', label: 'En compromis' },
  { value: 'Vendu', label: 'Vendu' },
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

const DPE_CLASSE_OPTIONS = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'G', label: 'G' },
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

const STATUT_MANDAT_OPTIONS = [
  { value: 'Actif', label: 'Actif' },
  { value: 'Expire', label: 'Expiré' },
  { value: 'Resilie', label: 'Résilié' },
  { value: 'Termine', label: 'Terminé' },
];

const TYPE_MANDAT_OPTIONS = [
  { value: 'Simple', label: 'Simple' },
  { value: 'Co-exclusif', label: 'Co-exclusif' },
  { value: 'Exclusif', label: 'Exclusif' },
  { value: 'Exclusif agence', label: 'Exclusif agence' },
  { value: 'Delegation', label: 'Délégation' },
  { value: 'Confrere', label: 'Confrère' },
];

const DUREE_MANDAT_OPTIONS = [
  { value: '1', label: '1 mois' },
  { value: '2', label: '2 mois' },
  { value: '3', label: '3 mois (Recommandé)' },
  { value: '6', label: '6 mois' },
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

interface SellerFormData {
  actif: boolean;
  croisementAutomatique: boolean;
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
  prixNetVendeur: number | undefined;
  typeHonoraires: string;
  modeCalculHonoraires: string;
  valeurHonoraires: number | undefined;
  prixVenteFAI: number | undefined;
  commissionCoAgencement: number | undefined;
  dpeDate: string;
  dpeClasse: string;
  constatsRisquesDate: string;
  diagnosticPlombDate: string;
  autresDiagnostics: string;
  attributPrincipal: string;
  attributsPersonnalises: string[];
  criteres: string[];
  proximites: ProximiteCategorie;
  prestations: PrestationCategorie;
  situationActuelle: string;
  raisonVente: string;
  creditRestantDu: number | undefined;
  dateSouhaiteeVente: string;
  notesComplementaires: string;
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
  agentDesigne: string;
  prixNetVendeurMandat: number | undefined;
  typeHonorairesMandat: string;
  montantHonoraires: number | undefined;
  commissionCoAgencementMandat: number | undefined;
  signatureVendeur: string;
  signatureAgent: string;
  dateSignatureMandat: string;
  mandatSignePdfUrl: string;
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
  return `MV-${year}-${random}`;
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
const inThreeMonths = formatDate(addMonths(new Date(), 3));

export const SellerFormModal = ({ onClose, onSubmit }: SellerFormModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SellerFormData>({
    actif: true,
    croisementAutomatique: true,
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
    prixNetVendeur: undefined,
    typeHonoraires: 'inclus',
    modeCalculHonoraires: 'pourcentage',
    valeurHonoraires: undefined,
    prixVenteFAI: undefined,
    commissionCoAgencement: 50,
    dpeDate: '',
    dpeClasse: '',
    constatsRisquesDate: '',
    diagnosticPlombDate: '',
    autresDiagnostics: '',
    attributPrincipal: '',
    attributsPersonnalises: [],
    criteres: [],
    proximites: { transports: [], commerces: [], education: [], sante: [], loisirs: [] },
    prestations: { exterieur: [], confort: [], electromenager: [], multimedia: [], sport: [] },
    situationActuelle: '',
    raisonVente: '',
    creditRestantDu: undefined,
    dateSouhaiteeVente: '',
    notesComplementaires: '',
    numeroMandat: generateMandatNumber(),
    statutMandat: 'Actif',
    dateSignature: today,
    dateDebut: today,
    dateExpiration: inThreeMonths,
    typeMandat: 'Simple',
    dureeMandat: '3',
    clauseProtection: false,
    clauseProtectionMois: 3,
    conjoint: '',
    agentDesigne: '',
    prixNetVendeurMandat: undefined,
    typeHonorairesMandat: 'inclus',
    montantHonoraires: undefined,
    commissionCoAgencementMandat: 50,
    signatureVendeur: '',
    signatureAgent: '',
    dateSignatureMandat: today,
    mandatSignePdfUrl: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SellerFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prixFAICalcule = useMemo(() => {
    if (!formData.prixNetVendeur) return 0;
    if (formData.typeHonoraires === 'inclus' && formData.modeCalculHonoraires === 'pourcentage' && formData.valeurHonoraires) {
      const taux = formData.valeurHonoraires / 100;
      return Math.round(formData.prixNetVendeur / (1 - taux));
    }
    if (formData.typeHonoraires === 'inclus' && formData.modeCalculHonoraires === 'montant_fixe' && formData.valeurHonoraires) {
      return formData.prixNetVendeur + formData.valeurHonoraires;
    }
    if (formData.typeHonoraires === 'en_sus') {
      return formData.prixNetVendeur + (formData.valeurHonoraires || 0);
    }
    return formData.prixNetVendeur;
  }, [formData.prixNetVendeur, formData.typeHonoraires, formData.modeCalculHonoraires, formData.valeurHonoraires]);

  const handleChange = (field: keyof SellerFormData, value: any) => {
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
    const newErrors: Partial<Record<keyof SellerFormData, string>> = {};
    if (!formData.contactId) newErrors.contactId = 'Le contact est requis';
    if (!formData.origine) newErrors.origine = "L'origine est requise";
    if (!formData.typeBien) newErrors.typeBien = 'Le type de bien est requis';
    if (!formData.categorie) newErrors.categorie = 'La catégorie est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setStep(1);
      return;
    }

    setIsSubmitting(true);

    onSubmit({
      name: '',
      type: 'Vendeur',
      status: formData.actif ? 'Actif' : 'Inactif',
      phone: '',
      email: '',
      source: formData.origine,
      notes: formData.notesComplementaires,
      propertyType: formData.typeBien,
      area: formData.secteur || formData.adresseComplete,
      minSurface: formData.surfaceMin,
      rooms: formData.pieces?.toString() || '',
      currentSituation: formData.situationActuelle,
      classification: formData.classification,
      statutMetier: formData.statutMetier,
      croisementAutomatique: formData.croisementAutomatique,
      contactId: formData.contactId,
      secteur: formData.secteur,
      categorie: formData.categorie,
      piecesOperator: formData.piecesOperator,
      pieces: formData.pieces,
      chambresOperator: formData.chambresOperator,
      chambres: formData.chambres,
      surfaceMax: formData.surfaceMax,
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
      devise: formData.devise,
      reasonForSelling: formData.raisonVente || undefined,
      numeroMandat: formData.numeroMandat,
      dateSignature: formData.dateSignature,
      dateDebut: formData.dateDebut,
      dateExpiration: formData.dateExpiration,
      statutMandat: formData.statutMandat,
      typeMandat: formData.typeMandat,
      conjoint: formData.conjoint || undefined,
      agentDesigne: formData.agentDesigne || undefined,
      mandatPdfUrl: formData.mandatSignePdfUrl || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user-id',
    });
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
        <span className="w-1 h-4 rounded-full bg-accent" />
        {title}
      </h3>
      {children}
    </div>
  );

  const renderRadioGroup = (
    label: string,
    field: keyof SellerFormData,
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
                  ? 'bg-accent text-white border-accent ring-2 ring-accent/30'
                  : 'bg-card text-text-secondary border-border hover:border-accent/50'
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
                  ? 'bg-accent text-white border-accent'
                  : 'bg-card text-text-secondary border-border hover:border-accent/50'
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
                    ? 'bg-accent text-white border-accent'
                    : 'bg-card text-text-secondary border-border hover:border-accent/50'
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
                    ? 'bg-accent text-white border-accent'
                    : 'bg-card text-text-secondary border-border hover:border-accent/50'
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
                        options={[
                          { value: '', label: 'Sélectionner un contact...' },
                          { value: 'contact-1', label: 'Jean Dupont' },
                          { value: 'contact-2', label: 'Marie Martin' },
                          { value: 'contact-3', label: 'Ahmed Benali' },
                        ]}
                        value={formData.contactId}
                        onValueChange={(v) => handleChange('contactId', v)}
                        error={errors.contactId}
                      />
                    </div>
                    <button type="button" className="h-9 w-9 rounded-lg border border-border bg-card flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent transition-all shrink-0" title="Créer un nouveau contact">
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
                  <div className="w-full h-48 rounded-lg border border-border bg-background flex items-center justify-center text-text-secondary text-sm">
                    🗺️ Carte interactive (cliquez pour sélectionner)
                  </div>
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
            {renderSection('PRIX ET HONORAIRES', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Prix net vendeur" type="number" min="0" value={formData.prixNetVendeur?.toString() || ''} onChange={(e) => handleChange('prixNetVendeur', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`1 000 000 ${formData.devise}`} />
                  <Select label="Devise" options={[
                    { value: 'MAD', label: 'MAD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'USD', label: 'USD' },
                    { value: 'GBP', label: 'GBP' },
                    { value: 'CHF', label: 'CHF' },
                  ]} value={formData.devise} onValueChange={(v) => handleChange('devise', v)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text mb-2">Type d'honoraires</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="typeHonoraires" className="sr-only" checked={formData.typeHonoraires === 'inclus'} onChange={() => handleChange('typeHonoraires', 'inclus')} />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.typeHonoraires === 'inclus' ? 'border-accent' : 'border-border'}`}>
                        {formData.typeHonoraires === 'inclus' && <div className="w-2 h-2 rounded-full bg-accent" />}
                      </div>
                      <span className="text-sm text-text">Inclus dans le prix</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="typeHonoraires" className="sr-only" checked={formData.typeHonoraires === 'en_sus'} onChange={() => handleChange('typeHonoraires', 'en_sus')} />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.typeHonoraires === 'en_sus' ? 'border-accent' : 'border-border'}`}>
                        {formData.typeHonoraires === 'en_sus' && <div className="w-2 h-2 rounded-full bg-accent" />}
                      </div>
                      <span className="text-sm text-text">En sus du prix</span>
                    </label>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-text mb-2">Mode de calcul des honoraires</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="modeCalculHonoraires" className="sr-only" checked={formData.modeCalculHonoraires === 'pourcentage'} onChange={() => handleChange('modeCalculHonoraires', 'pourcentage')} />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.modeCalculHonoraires === 'pourcentage' ? 'border-accent' : 'border-border'}`}>
                        {formData.modeCalculHonoraires === 'pourcentage' && <div className="w-2 h-2 rounded-full bg-accent" />}
                      </div>
                      <span className="text-sm text-text">Pourcentage</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="modeCalculHonoraires" className="sr-only" checked={formData.modeCalculHonoraires === 'montant_fixe'} onChange={() => handleChange('modeCalculHonoraires', 'montant_fixe')} />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.modeCalculHonoraires === 'montant_fixe' ? 'border-accent' : 'border-border'}`}>
                        {formData.modeCalculHonoraires === 'montant_fixe' && <div className="w-2 h-2 rounded-full bg-accent" />}
                      </div>
                      <span className="text-sm text-text">Montant fixe</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={formData.modeCalculHonoraires === 'pourcentage' ? 'Valeur des honoraires (%)' : `Valeur des honoraires (${formData.devise})`}
                    type="number"
                    min="0"
                    step={formData.modeCalculHonoraires === 'pourcentage' ? '0.1' : '1'}
                    value={formData.valeurHonoraires?.toString() || ''}
                    onChange={(e) => handleChange('valeurHonoraires', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder={formData.modeCalculHonoraires === 'pourcentage' ? '5' : '50 000'}
                  />
                  <Input
                    label="Commission de co-agencement"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commissionCoAgencement?.toString() || ''}
                    onChange={(e) => handleChange('commissionCoAgencement', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="50"
                  />
                </div>
                <div className="p-4 rounded-lg border border-accent/20 bg-accent/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text">Prix de vente FAI</span>
                    <span className="text-lg font-bold text-accent">
                      {prixFAICalcule > 0
                        ? `${prixFAICalcule.toLocaleString('fr-FR')} ${formData.devise}`
                        : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {formData.typeHonoraires === 'inclus'
                      ? `Calculé: Prix net vendeur / (1 - ${formData.modeCalculHonoraires === 'pourcentage' ? '% honoraires/100' : 'honoraires'})`
                      : 'Calculé: Prix net vendeur + honoraires'}
                  </p>
                </div>
              </div>
            ))}
            {renderSection('DIAGNOSTICS OBLIGATOIRES', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DatePicker label="DPE - Date de réalisation" value={formData.dpeDate} onChange={(e) => handleChange('dpeDate', e.target.value)} />
                  <Select label="DPE - Classe énergétique" options={[{ value: '', label: 'Non défini' }, ...DPE_CLASSE_OPTIONS]} value={formData.dpeClasse} onValueChange={(v) => handleChange('dpeClasse', v)} />
                  <DatePicker label="Constats risques - Date" value={formData.constatsRisquesDate} onChange={(e) => handleChange('constatsRisquesDate', e.target.value)} />
                  <DatePicker label="Diagnostic plomb - Date" value={formData.diagnosticPlombDate} onChange={(e) => handleChange('diagnosticPlombDate', e.target.value)} />
                </div>
                <div>
                  <Textarea label="Autres diagnostics" value={formData.autresDiagnostics} onChange={(e) => handleChange('autresDiagnostics', e.target.value)} placeholder="Précisez les autres diagnostics disponibles..." rows={2} />
                  <div className="mt-2 flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                    <span className="text-sm text-text-secondary flex-1">Documents de diagnostics (PDF)</span>
                    <button type="button" className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-text-secondary hover:text-accent hover:border-accent transition-all">Parcourir...</button>
                  </div>
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
                              ? 'bg-accent text-white border-accent ring-2 ring-accent/30'
                              : 'bg-card text-text-secondary border-border hover:border-accent/50'
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
                            ? 'bg-accent text-white border-accent'
                            : 'bg-card text-text-secondary border-border hover:border-accent/50'
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
            {renderSection('SITUATION DU VENDEUR', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Situation actuelle" options={SITUATION_ACTUELLE_OPTIONS} value={formData.situationActuelle} onValueChange={(v) => handleChange('situationActuelle', v)} />
                  <Input label="Informations sur le crédit existant - Montant restant dû" type="number" min="0" value={formData.creditRestantDu?.toString() || ''} onChange={(e) => handleChange('creditRestantDu', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Montant restant dû (optionnel)" />
                </div>
                <div className="sm:col-span-2">
                  <Textarea label="Raison de la vente" value={formData.raisonVente} onChange={(e) => handleChange('raisonVente', e.target.value)} placeholder="Mutation, divorce, succession, besoin de trésorerie..." rows={3} />
                </div>
                <DatePicker label="Date souhaitée de vente" value={formData.dateSouhaiteeVente} onChange={(e) => handleChange('dateSouhaiteeVente', e.target.value)} />
              </div>
            ))}
            {renderSection('NOTES COMPLÉMENTAIRES', (
              <div>
                <Textarea label="Notes complémentaires" value={formData.notesComplementaires} onChange={(e) => handleChange('notesComplementaires', e.target.value)} placeholder="Informations additionnelles..." rows={3} />
              </div>
            ))}
          </>
        );

      case 8:
        return (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1 h-6 rounded-full bg-accent" />
              <h2 className="text-base font-semibold text-text">MANDAT DE VENTE</h2>
            </div>

            {renderSection('1. INFORMATIONS GÉNÉRALES DU MANDAT', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Numéro de mandat" value={formData.numeroMandat} onChange={(e) => handleChange('numeroMandat', e.target.value)} placeholder="MV-2026-001" />
                <Select label="Statut du mandat" options={STATUT_MANDAT_OPTIONS} value={formData.statutMandat} onValueChange={(v) => handleChange('statutMandat', v)} />
                <DatePicker label="Date de signature" value={formData.dateSignature} onChange={(e) => handleChange('dateSignature', e.target.value)} />
                <DatePicker label="Date de début" value={formData.dateDebut} onChange={(e) => handleChange('dateDebut', e.target.value)} />
                <DatePicker label="Date d'expiration" value={formData.dateExpiration} onChange={(e) => handleChange('dateExpiration', e.target.value)} />
              </div>
            ))}
            {renderSection('2. TYPE DE MANDAT', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Type de mandat" options={TYPE_MANDAT_OPTIONS} value={formData.typeMandat} onValueChange={(v) => handleChange('typeMandat', v)} />
                <Select label="Durée du mandat" options={DUREE_MANDAT_OPTIONS} value={formData.dureeMandat} onValueChange={(v) => handleChange('dureeMandat', v)} />
              </div>
            ))}
            {renderSection('3. CLAUSE DE PROTECTION', (
              <div className="space-y-3">
                <Checkbox label="Activer la clause de protection" checked={formData.clauseProtection} onChange={(checked) => handleChange('clauseProtection', checked)} />
                {formData.clauseProtection && (
                  <Input label="Nombre de mois de protection" type="number" min="1" max="24" value={formData.clauseProtectionMois?.toString() || '3'} onChange={(e) => handleChange('clauseProtectionMois', e.target.value ? parseInt(e.target.value) : 3)} placeholder="3" className="max-w-xs" />
                )}
                <p className="text-xs text-text-secondary">Si l'acquéreur visitant pendant le mandat achète après expiration, l'agence conserve droit à commission.</p>
              </div>
            ))}
            {renderSection('4. PARTIES AU CONTRAT', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Vendeur(s)" value="" placeholder="Pré-rempli depuis le contact" disabled />
                <Input label="Conjoint" value={formData.conjoint} onChange={(e) => handleChange('conjoint', e.target.value)} placeholder="Nom du conjoint" />
                <Select label="Agent désigné" options={[{ value: '', label: 'Sélectionner un agent...' }, ...AGENTS]} value={formData.agentDesigne} onValueChange={(v) => handleChange('agentDesigne', v)} />
              </div>
            ))}
            {renderSection('5. INFORMATIONS FINANCIÈRES', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Prix net vendeur (repris de la section 3)" type="number" value={formData.prixNetVendeur?.toString() || ''} disabled placeholder="Défini dans la section Caractéristiques" />
                <Select label="Type d'honoraires" options={[{ value: 'inclus', label: 'Inclus dans le prix' }, { value: 'en_sus', label: 'En sus du prix' }]} value={formData.typeHonorairesMandat} onValueChange={(v) => handleChange('typeHonorairesMandat', v)} />
                <Input label="Montant des honoraires (% ou fixe)" type="number" min="0" step="0.1" value={formData.montantHonoraires?.toString() || ''} onChange={(e) => handleChange('montantHonoraires', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="5 ou 50000" />
                <Input label="Commission de co-agencement" type="number" min="0" max="100" value={formData.commissionCoAgencementMandat?.toString() || ''} onChange={(e) => handleChange('commissionCoAgencementMandat', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="50%" />
              </div>
            ))}
            {renderSection('6. DOCUMENTS JUSTIFICATIFS', (
              <div className="space-y-3">
                {[
                  { label: "Pièce d'identité du vendeur", required: true },
                  { label: 'Titre de propriété', required: true },
                  { label: 'Diagnostic technique (DPE)', required: true },
                  { label: 'Règlement de copropriété', required: false },
                  { label: 'Mandat signé (PDF)', required: true },
                  { label: 'Autre document', required: false },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                    <span className="text-sm text-text flex-1">{doc.label}</span>
                    {doc.required ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-error/10 text-error font-medium">Obligatoire</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-medium">Recommandé</span>
                    )}
                    <button type="button" className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-text-secondary hover:text-accent hover:border-accent transition-all">Parcourir...</button>
                  </div>
                ))}
              </div>
            ))}
            {renderSection('7. SIGNATURES', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-background/50">
                    <p className="text-sm font-medium text-text mb-2">✍️ Signature du vendeur</p>
                    <div className="h-16 rounded border border-dashed border-text-secondary/30 flex items-center justify-center text-text-secondary text-xs">Champ de signature électronique</div>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-background/50">
                    <p className="text-sm font-medium text-text mb-2">✍️ Signature de l'agent</p>
                    <div className="h-16 rounded border border-dashed border-text-secondary/30 flex items-center justify-center text-text-secondary text-xs">Champ de signature électronique</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DatePicker label="Date de signature" value={formData.dateSignatureMandat} onChange={(e) => handleChange('dateSignatureMandat', e.target.value)} />
                  <div className="flex items-end">
                    <div className="flex-1 space-y-1.5">
                      <p className="text-sm font-medium text-text">Fichier du mandat signé</p>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                        <span className="text-sm text-text-secondary flex-1">Upload PDF</span>
                        <button type="button" className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-text-secondary hover:text-accent hover:border-accent transition-all">Parcourir...</button>
                      </div>
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
          className="relative w-full max-w-5xl mx-4 bg-card rounded-xl border border-border/50 shadow-modal overflow-y-auto max-h-[calc(100vh-48px)]"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 sticky top-0 bg-card z-10">
            <h2 className="text-lg font-semibold">Nouveau vendeur</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all">
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 py-1 border-b border-border/30 flex gap-1 overflow-x-auto sticky top-[57px] bg-card z-10">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setStep(t.id)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                  step === t.id ? 'text-accent border-accent' : 'text-text-secondary border-transparent hover:text-text'
                }`}
              >
                {t.id === 8 ? 'Mandat' : t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {renderTabContent()}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border/30">
              <div>
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                    Précédent
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                  Annuler
                </Button>
                {step < 8 ? (
                  <Button type="button" variant="default" onClick={() => setStep(step + 1)}>
                    Suivant
                  </Button>
                ) : (
                  <Button type="submit" variant="default" loading={isSubmitting}>
                    {isSubmitting ? 'Enregistrement...' : "Créer le vendeur"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
