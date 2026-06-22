import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'react-feather';
import { Client } from '../../../types/client';
import { DatePicker } from '../../ui/DatePicker';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Checkbox } from '../../ui/Checkbox';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';

interface VoyageurFormModalProps {
  onClose: () => void;
  onSubmit: (client: Omit<Client, 'id'>) => void;
}

const STATUT_METIER_OPTIONS = [
  { value: 'En recherche', label: 'En recherche' },
  { value: 'Reservation en cours', label: 'Réservation en cours' },
  { value: 'Confirme', label: 'Confirmé' },
  { value: 'En sejour', label: 'En séjour' },
  { value: 'Termine', label: 'Terminé' },
  { value: 'Annule', label: 'Annulé' },
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
  { value: 'En attente', label: 'En attente' },
  { value: 'Confirmee', label: 'Confirmée' },
  { value: 'Payee', label: 'Payée' },
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
  montantTotalHorsOptions: number | undefined;
  optionsSelectionnees: string[];
  montantTotalAvecOptions: number | undefined;
  conditionAnnulation: string;
  checkInHeure: string;
  checkOutHeure: string;
  animauxAcceptes: boolean;
  fumeur: boolean;
  contratPdfUrl: string;
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

export const VoyageurFormModal = ({ onClose, onSubmit }: VoyageurFormModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<VoyageurFormData>({
    actif: true,
    croisementAutomatique: true,
    classification: 'Actif',
    statutMetier: 'En recherche',
    contactId: '',
    origine: '',
    plan: '',
    localisation: 'Maroc',
    secteur: '',
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
    statutReservation: 'En attente',
    dateReservation: today,
    bienReserve: '',
    tarifNuit: undefined,
    montantTotalHorsOptions: undefined,
    optionsSelectionnees: [],
    montantTotalAvecOptions: undefined,
    conditionAnnulation: 'Moderee',
    checkInHeure: '15h00 - 20h00',
    checkOutHeure: '11h00',
    animauxAcceptes: false,
    fumeur: false,
    contratPdfUrl: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof VoyageurFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof VoyageurFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'budgetNuitMin' || field === 'budgetNuitMax' || field === 'nbNuits') {
        const min = field === 'budgetNuitMin' ? value : prev.budgetNuitMin;
        const max = field === 'budgetNuitMax' ? value : prev.budgetNuitMax;
        const nuits = field === 'nbNuits' ? value : prev.nbNuits;
        const avgNuit = ((min || 0) + (max || 0)) / 2;
        if (avgNuit > 0 && nuits > 0) {
          updated.budgetTotal = Math.round(avgNuit * nuits);
        }
      }
      if (field === 'montantTotalAvecOptions' || field === 'acompteMontant') {
        const total = field === 'montantTotalAvecOptions' ? value : prev.montantTotalAvecOptions;
        const acompte = field === 'acompteMontant' ? value : prev.acompteMontant;
        if (total !== undefined && acompte !== undefined) {
          updated.soldeRestant = Math.max(0, (total || 0) - (acompte || 0));
        }
      }
      if (field === 'dateArrivee' || field === 'dateDepart') {
        const arrivee = field === 'dateArrivee' ? value : prev.dateArrivee;
        const depart = field === 'dateDepart' ? value : prev.dateDepart;
        if (arrivee && depart) {
          const diff = Math.round((new Date(depart).getTime() - new Date(arrivee).getTime()) / (1000 * 60 * 60 * 24));
          updated.nbNuits = Math.max(0, diff);
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

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VoyageurFormData, string>> = {};
    if (!formData.contactId) newErrors.contactId = 'Le contact est requis';
    if (!formData.origine) newErrors.origine = "L'origine est requise";
    if (!formData.typeBien) newErrors.typeBien = 'Le type de bien est requis';
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

    const budgetNuitMin = formData.budgetNuitMin || 0;
    const budgetNuitMax = formData.budgetNuitMax || 0;

    onSubmit({
      name: '',
      type: 'Voyageur',
      status: formData.actif ? 'Actif' : 'Inactif',
      phone: '',
      email: '',
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
      categorie: 'Location saisonnière',
      piecesOperator: formData.piecesOperator,
      chambresOperator: formData.chambresOperator,
      vue: formData.vue,
      exposition: formData.exposition,
      etat: formData.etat,
      standing: formData.standing,
      disponibilite: formData.flexibilite,
      attributPrincipal: formData.attributPrincipal,
      attributsPersonnalises: formData.attributsPersonnalises.length > 0 ? formData.attributsPersonnalises : undefined,
      criteres: formData.criteres.length > 0 ? formData.criteres : undefined,
      proximites: formData.proximites.transports.length > 0 || formData.proximites.commerces.length > 0 || formData.proximites.education.length > 0 || formData.proximites.sante.length > 0 || formData.proximites.loisirs.length > 0
        ? formData.proximites : undefined,
      prestations: {
        exterieur: [...formData.prestations.exterieur, ...formData.prestations.services],
        confort: [...formData.prestations.equipementsBase, ...formData.prestations.chambres],
        electromenager: formData.prestations.cuisine,
        multimedia: formData.prestations.divertissement,
        sport: [],
      },
      numeroMandat: formData.numeroReservation,
      dateSignature: formData.dateReservation,
      dateDebut: formData.dateArrivee,
      dateExpiration: formData.dateDepart,
      statutMandat: formData.statutReservation === 'Confirmee' ? 'Actif' : formData.statutReservation,
      typeMandat: formData.conditionAnnulation,
      agentDesigne: '',
      conjoint: formData.languesParlees.join(', '),
      dureeProtection: formData.flexibilite,
      mandatPdfUrl: formData.contratPdfUrl || undefined,
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
    category: keyof PrestationVoyageur,
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
                onClick={() => handlePrestationGroup(category, opt.value)}
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
            {renderSection('LOCALISATION RECHERCHÉE', (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-text mb-1.5">Plan (Carte interactive)</p>
                  <div className="w-full h-48 rounded-lg border border-border bg-background flex items-center justify-center text-text-secondary text-sm">
                    🗺️ Carte interactive (cliquez pour sélectionner)
                  </div>
                </div>
                <Select label="Localisation" options={LOCALISATION_OPTIONS} value={formData.localisation} onValueChange={(v) => handleChange('localisation', v)} />
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
                      <Input type="number" min="0" value={formData.budgetNuitMin?.toString() || ''} onChange={(e) => handleChange('budgetNuitMin', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="500" />
                      <span className="text-text-secondary text-sm">~</span>
                      <Input type="number" min="0" value={formData.budgetNuitMax?.toString() || ''} onChange={(e) => handleChange('budgetNuitMax', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="800" />
                      <div className="w-20 shrink-0">
                        <Select options={CURRENCIES} value={formData.devise} onValueChange={(v) => handleChange('devise', v)} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input type="number" label="Budget par semaine (auto)" value={formData.budgetNuitMin && formData.budgetNuitMax ? Math.round((formData.budgetNuitMin + formData.budgetNuitMax) / 2 * 7) : ''} disabled />
                  <Input type="number" label="Budget total pour le séjour (auto)" value={formData.budgetTotal?.toString() || ''} onChange={(e) => handleChange('budgetTotal', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="10 000" disabled />
                </div>
                <div className="text-xs text-text-secondary italic">
                  Budget semaine = (min + max) / 2 × 7 | Budget total = budget nuit moyen × nombre de nuits
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
                  <Input type="number" min="0" label="Acompte versé" value={formData.acompteMontant?.toString() || ''} onChange={(e) => handleChange('acompteMontant', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`3 000 ${formData.devise}`} />
                  <DatePicker label="Date de l'acompte" value={formData.acompteDate} onChange={(e) => handleChange('acompteDate', e.target.value)} />
                  <Input type="number" min="0" label="Solde restant" value={formData.soldeRestant?.toString() || ''} disabled />
                  <DatePicker label="Date limite de paiement du solde" value={formData.dateLimiteSolde} onChange={(e) => handleChange('dateLimiteSolde', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input type="number" min="0" label="Caution" value={formData.cautionMontant?.toString() || ''} onChange={(e) => handleChange('cautionMontant', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`2 000 ${formData.devise}`} />
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
              <span className="w-1 h-6 rounded-full bg-accent" />
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
                <Select label="Bien réservé" options={[
                  { value: '', label: 'Sélectionner un bien...' },
                  { value: 'prop-1', label: 'Riad 3 chambres - Médina' },
                  { value: 'prop-2', label: 'Appartement 2 pièces - Ghazoua' },
                  { value: 'prop-3', label: 'Villa 4 chambres - Piscine' },
                ]} value={formData.bienReserve} onValueChange={(v) => handleChange('bienReserve', v)} />
                <Input type="number" min="0" label="Tarif par nuit" value={formData.tarifNuit?.toString() || ''} onChange={(e) => handleChange('tarifNuit', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`600 ${formData.devise}`} />
                <Input type="number" min="0" label="Montant total (hors options)" value={formData.montantTotalHorsOptions?.toString() || ''} onChange={(e) => handleChange('montantTotalHorsOptions', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`4 200 ${formData.devise}`} />
                <div className="sm:col-span-2">
                  {renderCheckboxGroup('Options sélectionnées', [
                    { value: 'Menage', label: `Ménage (200 ${formData.devise})` },
                    { value: 'Petit-dejeuner', label: `Petit-déjeuner (50 ${formData.devise}/pers/jour)` },
                    { value: 'Transfert', label: `Transfert aéroport (300 ${formData.devise})` },
                    { value: 'Location voiture', label: `Location de voiture (400 ${formData.devise}/jour)` },
                  ], formData.optionsSelectionnees, (value) => handleCheckboxGroup('optionsSelectionnees', value))}
                </div>
                <Input type="number" min="0" label="Montant total (avec options)" value={formData.montantTotalAvecOptions?.toString() || ''} onChange={(e) => handleChange('montantTotalAvecOptions', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`4 700 ${formData.devise}`} />
                <Input type="number" min="0" label="Acompte versé" value={formData.acompteMontant?.toString() || ''} onChange={(e) => handleChange('acompteMontant', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`1 260 ${formData.devise}`} />
                <Input type="number" min="0" label="Solde restant" value={formData.soldeRestant?.toString() || ''} disabled />
                <Input type="number" min="0" label="Caution" value={formData.cautionMontant?.toString() || ''} onChange={(e) => handleChange('cautionMontant', e.target.value ? parseInt(e.target.value) : undefined)} placeholder={`2 000 ${formData.devise}`} />
              </div>
            ))}
            {renderSection('3. CONDITIONS GÉNÉRALES', (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Conditions d'annulation" options={CONDITIONS_ANNULATION_OPTIONS} value={formData.conditionAnnulation} onValueChange={(v) => handleChange('conditionAnnulation', v)} />
                  <Input label="Heure d'arrivée (check-in)" value={formData.checkInHeure} onChange={(e) => handleChange('checkInHeure', e.target.value)} placeholder="15h00 - 20h00" />
                  <Input label="Heure de départ (check-out)" value={formData.checkOutHeure} onChange={(e) => handleChange('checkOutHeure', e.target.value)} placeholder="11h00" />
                  <div className="flex items-end gap-4">
                    <Checkbox label="Animaux acceptés" checked={formData.animauxAcceptes} onChange={(checked) => handleChange('animauxAcceptes', checked)} />
                    <Checkbox label="Non-fumeur" checked={formData.fumeur} onChange={(checked) => handleChange('fumeur', checked)} />
                  </div>
                </div>
              </div>
            ))}
            {renderSection('4. DOCUMENTS JUSTIFICATIFS', (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">Documents obligatoires :</p>
                {[
                  { label: "Pièce d'identité (passeport ou CIN)", required: true },
                  { label: 'Contrat de location signé', required: true },
                  { label: 'Preuve de paiement (acompte)', required: true },
                  { label: 'Justificatif de domicile', required: false },
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
            {renderSection('5. SIGNATURES', (
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
                  <Input label="Lien vers le PDF du contrat signé" value={formData.contratPdfUrl} onChange={(e) => handleChange('contratPdfUrl', e.target.value)} placeholder="https://..." />
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
            <h2 className="text-lg font-semibold">Nouveau voyageur</h2>
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
                {t.label}
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
                    {isSubmitting ? 'Enregistrement...' : 'Créer le voyageur'}
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