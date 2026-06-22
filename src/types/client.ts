export interface Client {
  id: string;
  name: string;
  type: 'Acheteur' | 'Locataire' | 'Bailleur' | 'Vendeur' | 'Voyageur';
  status: 'Actif' | 'En négociation' | 'Contrat signé' | 'Inactif' | 'Archivé';
  phone: string;
  email?: string;
  source?: string;
  notes?: string;

  // Common Property Criteria
  propertyType?: string;
  area?: string;
  minSurface?: number;
  rooms?: string;
  specificCriteria?: string[];
  comments?: string;

  // Financial Info
  budget?: number;
  contribution?: number;
  financingType?: string;
  loanDuration?: number;

  // Buyer Specific (Acheteur)
  currentSituation?: string;
  moveInDate?: string;
  mustHaveFeatures?: string;
  urgency?: string;
  classification?: string;
  statutMetier?: string;
  croisementAutomatique?: boolean;
  contactId?: string;
  secteur?: string;
  categorie?: string;
  piecesOperator?: string;
  pieces?: number;
  chambresOperator?: string;
  chambres?: number;
  surfaceMax?: number;
  prixMin?: number;
  prixMax?: number;
  devise?: string;
  etageOperator?: string;
  etage?: number;
  vue?: string;
  exposition?: string;
  etat?: string;
  standing?: string;
  disponibilite?: string;
  attributPrincipal?: string;
  attributsPersonnalises?: string[];
  criteres?: string[];
  proximites?: {
    transports: string[];
    commerces: string[];
    education: string[];
    sante: string[];
    loisirs: string[];
  };
  prestations?: {
    exterieur: string[];
    confort: string[];
    electromenager: string[];
    multimedia: string[];
    sport: string[];
  };
  capaciteEmprunt?: number;
  numeroMandat?: string;
  dateSignature?: string;
  dateDebut?: string;
  dateExpiration?: string;
  statutMandat?: string;
  typeMandat?: string;
  conjoint?: string;
  societe?: string;
  agentDesigne?: string;
  typeRemuneration?: string;
  montantRemuneration?: number;
  conditionPaiement?: string;
  dureeProtection?: string;
  mandatPdfUrl?: string;
  banqueSollicitee?: string;
  tauxEnvisage?: number;
  statutFinancement?: string;
  dateObtentionPret?: string;
  attestationPretUrl?: string;

  // Renter Specific (Locataire)
  furnished?: boolean;
  guarantor?: boolean;
  employmentStatus?: string;
  currentAddress?: string;
  minRentalDuration?: number;

  // Landlord Specific (Bailleur)
  propertyCondition?: string;
  preferredTenant?: string;
  includedUtilities?: string;

  // Owner Specific (Propriétaire)
  reasonForSelling?: string;

  // Traveler Specific (Voyageur)
  travelDates?: string;
  accommodationType?: string;
  specialRequirements?: string;
  nbPersonnes?: number;
  budgetParNuitMin?: number;
  budgetParNuitMax?: number;
  dateArrivee?: string;
  dateDepart?: string;
  flexibiliteDates?: string;
  modePaiement?: string;
  acompteVersee?: number;
  caution?: number;
  conditionsAnnulation?: string;

  // Documents
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
    category?: string;
    size?: string;
    version?: number;
  }>;

  // Timeline & Activity
  lastContact?: string;
  events?: Array<{
    id: string;
    type: 'appel' | 'email' | 'visite' | 'contrat' | 'autre';
    date: string;
    summary: string;
    agent: string;
    notes?: string;
  }>;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}